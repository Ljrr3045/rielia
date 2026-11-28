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
  let readDebt = false;
  let originalExpiry = 0;
  let executionGeneration = 0;
  type Execution = {
    epoch: number;
    generation: number;
    context: SprintClientContext;
    command: SprintClientCommand;
    key: string;
    signal: AbortSignal;
    expiresAt: number;
  };
  let execution: Execution | null = null;
  let confirmationOwed: number | null = null;
  const now = () => options.now?.() ?? Date.now();
  function currentExecution(value: Execution) {
    if (
      execution !== value ||
      value.epoch !== epoch ||
      value.generation !== executionGeneration ||
      !sameContext(value.context, state.context) ||
      value.signal.aborted
    )
      return false;
    if (value.expiresAt <= now()) {
      deny('signed-out');
      return false;
    }
    return state.status === 'ready' || state.status === 'verifying';
  }

  const queries = createSprintQueryOwner({
    transport: options.planning,
    tasks: options.tasks,
    changed: notify,
    authorized,
    completionCurrent: ({ context, command, key, signal }) =>
      execution !== null &&
      sameContext(execution.context, context) &&
      execution.command === command &&
      execution.key === key &&
      execution.signal === signal &&
      currentExecution(execution),
    denied: deny,
  });
  function getState(): SprintClientState {
    return (snapshot ??= freezeSprintValue({
      ...state,
      resources: state.status === 'verifying' ? emptySprintState().resources : queries.resources(),
      ...(state.status === 'verifying'
        ? { mutation: { ...state.mutation, current: null, result: null } }
        : {}),
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
    executionGeneration++;
    execution = null;
    originalExpiry = 0;
    readDebt = false;
    confirmationOwed = null;
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
    readDebt = true;
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
    if (!authorized() || confirmingEpoch === epoch || busy()) {
      readDebt = true;
      return;
    }
    readDebt = false;
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
  async function reviewAuthority() {
    const draft = state.draft;
    if (!draft || !authorized() || busy()) return;
    const names: SprintResourceName[] =
      draft.type === 'configure-planning' || draft.type === 'create-sprint'
        ? ['planning']
        : draft.type === 'edit-sprint'
          ? ['sprint']
          : draft.type === 'estimate-task' || draft.type === 'set-task-sprint'
            ? ['planning', 'task', 'target']
            : draft.type === 'start-sprint'
              ? ['planning', 'sprint', 'scope']
              : ['sprint', 'target'];
    // Only the captured review's authority is probed. The remaining invalidated
    // graph stays stale until discard or a confirmed command releases its debt.
    await Promise.all(names.map((name) => read(name)));
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
    if (state.context && originalExpiry <= now()) clear('signed-out');
    if (
      sameContext(state.context, context) &&
      (state.status === 'ready' || state.status === 'verifying')
    ) {
      const resume = state.status === 'verifying';
      const verifiedContext = context
        ? {
            ...context,
            expiresAt: new Date(
              Math.min(originalExpiry, Date.parse(context.expiresAt)),
            ).toISOString(),
          }
        : null;
      originalExpiry = verifiedContext ? Date.parse(verifiedContext.expiresAt) : 0;
      if (verifiedContext) bindQueries(verifiedContext);
      publish({ context: verifiedContext, status: 'ready' });
      if (confirmationOwed !== null) {
        await drainConfirmation();
        return;
      }
      if (resume) {
        if (busy()) readDebt = true;
        else if (state.draft || state.needsReview) {
          readDebt = true;
          await reviewAuthority();
        } else await refreshReads();
      }
      return;
    }
    clear('inactive');
    if (!context) return;
    originalExpiry = Date.parse(context.expiresAt);
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
    if (!authorized() || !state.context) return;
    const request = new AbortController();
    const capturedEpoch = epoch;
    const lease: Execution = {
      epoch,
      generation: ++executionGeneration,
      context: state.context,
      command: retry.command,
      key: retry.key,
      signal: request.signal,
      expiresAt: Math.min(originalExpiry, Date.parse(state.context.expiresAt)),
    };
    execution = lease;
    write = request;
    publish({
      recovery: retry,
      mutation: { status: 'pending', failure: null, current: null, result: null },
    });
    const current = () => epoch === capturedEpoch && write === request && currentExecution(lease);
    if (!current()) return;
    try {
      const result = await mutate(retry.command, retry.key, request.signal);
      if (!current()) return;
      invalidate();
      if (!current()) return;
      write = null;
      confirmationOwed = lease.generation;
      publish({
        draft: null,
        recovery: null,
        needsReview: false,
        mutation: { status: 'confirmed', result, current: null, failure: null },
      });
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
    if (
      epoch !== capturedEpoch ||
      state.mutation.status !== 'confirmed' ||
      !currentExecution(lease)
    )
      return;
    await drainConfirmation();
  }
  async function drainConfirmation() {
    const lease = execution;
    if (
      !lease ||
      confirmationOwed !== lease.generation ||
      !currentExecution(lease) ||
      !authorized() ||
      confirmingEpoch === epoch
    )
      return;
    const capturedEpoch = epoch;
    confirmationOwed = null;
    confirmingEpoch = capturedEpoch;
    try {
      await options.confirmed?.();
    } catch {
      /* Confirmation remains a receipt even when parent verification fails. */
    } finally {
      if (confirmingEpoch === capturedEpoch) confirmingEpoch = null;
    }
    if (currentExecution(lease) && authorized() && state.mutation.status === 'confirmed')
      await refreshReads();
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
    publish({ status: 'verifying' });
    previewWanted = false;
    queries.clearPreview();
    invalidate();
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
      executionGeneration++;
      execution = null;
      confirmationOwed = null;
      publish({
        draft: null,
        recovery: null,
        needsReview: false,
        mutation: emptySprintState().mutation,
      });
      if (readDebt && authorized()) void refreshReads();
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
