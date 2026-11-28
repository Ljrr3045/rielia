import type { TaskInvalidation } from '@rielia/contracts';
import { createSprintQueryOwner } from './sprint-query-owner.ts';
import { SprintPlanningFailure, type createSprintPlanningTransport } from './sprint-client.ts';
import { TaskPlanningFailure, type createTaskPlanningTransport } from './task-planning-client.ts';
import {
  changeSprintCommand,
  normalizeSprintCommand,
  prepareSprintCommand,
  sprintCommandIntent,
  type SprintIntentResult,
} from './sprint-commands.ts';
import {
  emptySprintState,
  emptySprintControllerState,
  type SprintControllerState,
  freezeSprintValue,
  type SprintClientCommand,
  type SprintClientContext,
  type SprintClientFailure,
  type SprintClientResult,
  type SprintClientState,
  type SprintCollection,
  type SprintIntent,
  type SprintResourceName,
} from './sprint-client-state.ts';

const failure = (error: unknown): SprintClientFailure =>
  error instanceof SprintPlanningFailure || error instanceof TaskPlanningFailure
    ? { status: error.status, code: error.code, requestId: error.requestId }
    : { status: 0, code: null, requestId: null };
const sameContext = (a: SprintClientContext | null, b: SprintClientContext | null) =>
  a?.userId === b?.userId &&
  a?.sessionId === b?.sessionId &&
  a?.workspaceId === b?.workspaceId &&
  a?.projectId === b?.projectId;

/** Compose canonical Query resources with captured intent and exact-command recovery. */
export function createSprintController(options: {
  planning: ReturnType<typeof createSprintPlanningTransport>;
  tasks: ReturnType<typeof createTaskPlanningTransport>;
  key?: () => string;
  now?: () => number;
  confirmed?: () => Promise<void>;
}) {
  let state = freezeSprintValue(emptySprintControllerState());
  let snapshot: SprintClientState | null = null;
  const listeners = new Set<() => void>();
  let epoch = 0;
  let readCycle = 0;
  let previewWanted = false;
  let write: AbortController | null = null;
  let confirmingEpoch: number | null = null;
  const queries = createSprintQueryOwner({
    transport: options.planning,
    tasks: options.tasks,
    changed: notify,
    authorized,
    denied: deny,
  });
  function getState(): SprintClientState {
    return (snapshot ??= freezeSprintValue({
      ...state,
      resources: queries.resources(),
    }));
  }
  function notify() {
    snapshot = null;
    listeners.forEach((listener) => listener());
  }
  function publish(patch: Partial<SprintControllerState>) {
    state = freezeSprintValue({ ...state, ...patch });
    notify();
  }
  function abortReads() {
    readCycle++;
    queries.cancel();
  }
  function bindQueries(context: SprintClientContext) {
    if (!queries.bind(context)) return;
    queries.select(state.selection.sprintId, state.selection.taskId);
    queries.selectTarget(state.selection.targetId);
    if (previewWanted) queries.preview(state.destination);
  }
  function clear(status: SprintClientState['status'], keepContext = false) {
    epoch++;
    confirmingEpoch = null;
    const context = keepContext ? state.context : null;
    // Retire the visible controller before Query cancellation can revert cached data.
    state = freezeSprintValue({ ...emptySprintControllerState(), context, status });
    snapshot = null;
    queries.clear();
    abortReads();
    write?.abort();
    write = null;
    previewWanted = false;
    notify();
  }

  function deny(reason: 'signed-out' | 'forbidden') {
    clear(reason, reason === 'forbidden');
  }
  function authorized() {
    if (!state.context || state.status !== 'ready') return false;
    if (Date.parse(state.context.expiresAt) <= (options.now?.() ?? Date.now())) {
      deny('signed-out');
      return false;
    }
    return true;
  }
  function invalidate() {
    abortReads();
    queries.invalidate();
    publish({ needsReview: !!state.draft });
  }
  function available(name: SprintResourceName) {
    if (name === 'planning' || name === 'sprints') return true;
    if (name === 'target') return state.selection.targetId !== null;
    if (name === 'preview')
      return previewWanted && !!getState().resources.sprint.data?.capabilities.canClose;
    if (name === 'task' || name === 'taskHistory') return state.selection.taskId !== null;
    if (name === 'closure' || name === 'outcomes')
      return getState().resources.sprint.data?.state === 'closed';
    return state.selection.sprintId !== null;
  }
  async function read(name: SprintResourceName, more = false): Promise<void> {
    if (!authorized() || !available(name)) return;
    await queries.read(name, more);
    if (
      name === 'preview' &&
      state.draft?.type === 'close-sprint' &&
      getState().resources.preview.stale
    )
      publish({ needsReview: true });
  }
  async function refreshReads() {
    if (!authorized() || confirmingEpoch === epoch) return;
    const cycle = ++readCycle;
    await Promise.all([
      read('planning'),
      read('sprints'),
      read('sprint'),
      read('target'),
      read('task'),
    ]);
    if (cycle !== readCycle || !authorized()) return;
    await Promise.all([read('scope'), read('sprintHistory'), read('taskHistory')]);
    if (cycle !== readCycle || !authorized()) return;
    // Immutable closure content is readable without the write-only close-preview capability.
    await read('closure');
    if (cycle !== readCycle || !authorized()) return;
    await read('outcomes');
  }
  async function setContext(context: SprintClientContext | null) {
    if (
      context &&
      (!Number.isFinite(Date.parse(context.expiresAt)) ||
        Date.parse(context.expiresAt) <= (options.now?.() ?? Date.now()))
    ) {
      deny('signed-out');
      return;
    }
    if (
      sameContext(state.context, context) &&
      (state.status === 'ready' || state.status === 'verifying')
    ) {
      const resume = state.status === 'verifying';
      if (context) bindQueries(context);
      publish({ context: context ? structuredClone(context) : null, status: 'ready' });
      if (resume) await refreshReads();
      return;
    }
    clear('inactive');
    if (!context) return;
    bindQueries(context);
    publish({ context: structuredClone(context), status: 'ready' });
    await refreshReads();
  }
  const busy = () => state.mutation.status === 'pending' || !!state.recovery;
  async function select(sprintId: string | null, taskId: string | null): Promise<boolean> {
    if (state.selection.sprintId === sprintId && state.selection.taskId === taskId) return true;
    if (!authorized() || busy() || state.draft) return false;
    epoch++;
    previewWanted = false;
    abortReads();
    queries.select(sprintId, taskId);
    publish({
      selection: { ...state.selection, sprintId, taskId },
      destination: null,
      mutation: emptySprintState().mutation,
    });
    await refreshReads();
    return true;
  }
  async function selectTarget(targetId: string | null) {
    if (!authorized() || busy()) return false;
    queries.selectTarget(targetId);
    publish({
      selection: { ...state.selection, targetId },
    });
    if (targetId) await read('target');
    return true;
  }
  async function preview(destination: string | null): Promise<boolean> {
    if (
      !authorized() ||
      busy() ||
      state.draft ||
      !getState().resources.sprint.data?.capabilities.canClose
    )
      return false;
    queries.preview(destination);
    previewWanted = true;
    publish({ destination });
    await read('preview');
    return (
      state.destination === destination &&
      getState().resources.preview.data?.destination === destination &&
      getState().resources.preview.status === 'ready' &&
      !getState().resources.preview.stale
    );
  }
  function stage(intent: SprintIntent): SprintIntentResult {
    if (!authorized()) return 'unavailable';
    if (busy() || state.draft) return 'busy';
    const command = prepareSprintCommand(getState(), intent);
    if (typeof command === 'string') return command;
    publish({
      draft: structuredClone(command),
      needsReview: false,
      mutation: emptySprintState().mutation,
    });
    return 'ready';
  }
  function changeDraft(intent: SprintIntent): SprintIntentResult {
    if (!authorized() || !state.draft) return 'unavailable';
    if (busy()) return 'busy';
    const command = changeSprintCommand(state.draft, intent, getState());
    if (!command) return 'unavailable';
    publish({ draft: structuredClone(command) });
    return 'ready';
  }
  function rebaseDraft(): SprintIntentResult {
    if (!authorized() || !state.draft) return 'unavailable';
    if (busy()) return 'busy';
    // Closing always requires a newly reviewed preview and a new explicit stage action.
    if (state.draft.type === 'close-sprint') return 'preview-required';
    const command = prepareSprintCommand(getState(), sprintCommandIntent(state.draft));
    if (typeof command === 'string') return command;
    publish({
      draft: structuredClone(command),
      needsReview: false,
      mutation: emptySprintState().mutation,
    });
    return 'ready';
  }
  async function mutate(
    command: SprintClientCommand,
    key: string,
    signal: AbortSignal,
  ): Promise<SprintClientResult> {
    const { workspaceId: w, projectId: p } = command;
    switch (command.type) {
      case 'create-sprint':
        return queries.create(command, key, signal);
      case 'configure-planning':
      case 'edit-sprint':
        return options.planning.mutate(command, key, signal);
      case 'estimate-task':
        return options.tasks.estimate(w, p, command.taskId, command.input, key, signal);
      case 'set-task-sprint':
        return options.tasks.setSprint(w, p, command.taskId, command.input, key, signal);
      case 'start-sprint':
        return options.tasks.start(w, p, command.sprintId, command.input, key, signal);
      case 'close-sprint':
        return options.tasks.close(w, p, command.sprintId, command.input, key, signal);
    }
  }
  async function save(retry: NonNullable<SprintClientState['recovery']>) {
    const request = new AbortController();
    const capturedEpoch = epoch;
    write = request;
    publish({
      recovery: retry,
      mutation: { status: 'pending', failure: null, current: null, result: null },
    });
    const current = () => epoch === capturedEpoch && write === request && !request.signal.aborted;
    try {
      const result = await mutate(retry.command, retry.key, request.signal);
      if (!current()) return;
      write = null;
      publish({
        draft: null,
        recovery: null,
        needsReview: false,
        mutation: { status: 'confirmed', result, current: null, failure: null },
      });
      invalidate();
    } catch (error) {
      if (!current()) return;
      write = null;
      const problem = failure(error);
      if (problem.status === 401 || problem.status === 403) {
        deny(problem.status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      const ambiguous = problem.status === 0 || problem.status >= 500 || problem.status === 408;
      const conflict = problem.status === 409;
      const value =
        error instanceof SprintPlanningFailure || error instanceof TaskPlanningFailure
          ? error.current
          : null;
      publish({
        recovery: ambiguous ? retry : null,
        needsReview: state.needsReview || conflict,
        mutation: {
          status: ambiguous ? 'unknown' : conflict ? 'conflict' : 'failed',
          failure: problem,
          current: conflict ? value : null,
          result: null,
        },
      });
      if (conflict) invalidate();
    }
    if (epoch !== capturedEpoch || state.mutation.status !== 'confirmed') return;
    confirmingEpoch = capturedEpoch;
    try {
      await options.confirmed?.();
    } catch {
      // Parent read/verification failure cannot turn an accepted write into ambiguity.
    } finally {
      if (confirmingEpoch === capturedEpoch) confirmingEpoch = null;
    }
    if (epoch === capturedEpoch) await refreshReads();
  }
  async function submit(): Promise<SprintIntentResult> {
    if (!authorized() || !state.draft) return 'unavailable';
    if (busy()) return 'busy';
    if (state.needsReview) return 'review-required';
    const eligibility = prepareSprintCommand(getState(), sprintCommandIntent(state.draft));
    if (typeof eligibility === 'string') return eligibility;
    const command = normalizeSprintCommand(state.draft);
    if (!command) return 'invalid';
    const snapshot = freezeSprintValue(structuredClone(command));
    const key = (options.key ?? (() => crypto.randomUUID()))();
    await save(freezeSprintValue({ command: snapshot, key }));
    return 'ready';
  }
  async function retrySave(): Promise<SprintIntentResult> {
    if (!authorized() || !state.recovery) return 'unavailable';
    if (state.mutation.status === 'pending') return 'busy';
    await save(state.recovery);
    return 'ready';
  }
  function cancelPending() {
    if (!write) return;
    write.abort();
    write = null;
    publish({
      mutation: {
        ...state.mutation,
        status: 'unknown',
        failure: { status: 0, code: 'aborted', requestId: null },
      },
    });
  }
  function suspend() {
    if (!state.context || state.status !== 'ready') return;
    cancelPending();
    invalidate();
    publish({ status: 'verifying' });
    queries.clear();
  }
  async function refresh() {
    if (!state.context || state.status !== 'ready') return;
    invalidate();
    if (!write) await refreshReads();
  }
  async function handleEvent(event: TaskInvalidation) {
    if (event.type === 'denied') {
      deny(event.reason);
      return;
    }
    if (event.type === 'heartbeat' || !state.context) return;
    if (event.type === 'invalidate' && event.projectId !== state.context.projectId) return;
    await refresh();
  }
  async function reload(name: SprintResourceName) {
    if (name === 'preview' && (state.draft || busy())) return;
    if (name !== 'preview' && name !== 'closure' && name !== 'outcomes') {
      queries.invalidatePreview();
      if (state.draft) publish({ needsReview: true });
    }
    await read(name);
  }
  return {
    getState,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setContext,
    select,
    selectTarget,
    preview,
    stage,
    changeDraft,
    rebaseDraft,
    submit,
    retrySave,
    refresh,
    handleEvent,
    deny,
    cancelPending,
    suspend,
    reload,
    loadMore: (name: SprintCollection) => read(name, true),
    discardDraft() {
      if (state.mutation.status === 'pending') return false;
      // Explicit discard can abandon local recovery, but cannot undo a possibly committed write.
      publish({
        draft: null,
        recovery: null,
        needsReview: false,
        mutation: emptySprintState().mutation,
      });
      return true;
    },
    dismissResult() {
      if (state.mutation.status === 'confirmed') publish({ mutation: emptySprintState().mutation });
    },
    dispose() {
      clear('inactive');
    },
  };
}
