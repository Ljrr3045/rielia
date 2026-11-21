import type { TaskInvalidation } from '@rielia/contracts';
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
  emptySprintResource,
  emptySprintState,
  freezeSprintValue,
  sprintPageBinding,
  type SprintClientCommand,
  type SprintClientContext,
  type SprintClientFailure,
  type SprintClientResult,
  type SprintClientState,
  type SprintCollection,
  type SprintIntent,
  type SprintResourceName,
  type SprintResources,
} from './sprint-client-state.ts';

const collections = new Set<SprintResourceName>([
  'sprints',
  'scope',
  'sprintHistory',
  'taskHistory',
  'preview',
  'outcomes',
]);
const failure = (error: unknown): SprintClientFailure =>
  error instanceof SprintPlanningFailure || error instanceof TaskPlanningFailure
    ? { status: error.status, code: error.code, requestId: error.requestId }
    : { status: 0, code: null, requestId: null };
const sameContext = (a: SprintClientContext | null, b: SprintClientContext | null) =>
  a?.userId === b?.userId &&
  a?.sessionId === b?.sessionId &&
  a?.workspaceId === b?.workspaceId &&
  a?.projectId === b?.projectId;

/** One memory-only owner for sprint reads, captured drafts and exact-command recovery. */
export function createSprintController(options: {
  planning: ReturnType<typeof createSprintPlanningTransport>;
  tasks: ReturnType<typeof createTaskPlanningTransport>;
  key?: () => string;
  now?: () => number;
}) {
  let state = freezeSprintValue(emptySprintState());
  const listeners = new Set<() => void>();
  const reads = new Map<SprintResourceName, AbortController>();
  let epoch = 0;
  let readCycle = 0;
  let previewWanted = false;
  let write: AbortController | null = null;
  function publish(patch: Partial<SprintClientState>) {
    state = freezeSprintValue({ ...state, ...patch });
    listeners.forEach((listener) => listener());
  }
  function resource<K extends SprintResourceName>(name: K, value: SprintResources[K]) {
    publish({ resources: { ...state.resources, [name]: value } });
  }
  function abortReads() {
    readCycle++;
    reads.forEach((request) => request.abort());
    reads.clear();
  }
  function clear(status: SprintClientState['status'], keepContext = false) {
    epoch++;
    abortReads();
    write?.abort();
    write = null;
    previewWanted = false;
    const context = keepContext ? state.context : null;
    publish({ ...emptySprintState(), context, status });
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
    const resources = { ...state.resources };
    for (const name of Object.keys(resources) as SprintResourceName[]) {
      const value = resources[name];
      // Retained data is explicitly stale/read-only until a fresh authorized read.
      Object.assign(resources, {
        [name]: {
          ...value,
          status: value.data ? 'ready' : 'idle',
          stale: true,
          loadingMore: false,
        },
      });
    }
    publish({ resources, needsReview: !!state.draft });
  }
  async function fetchResource(name: SprintResourceName, signal: AbortSignal, cursor?: string) {
    const { workspaceId: w, projectId: p } = state.context!;
    const { sprintId: s, taskId: t, targetId } = state.selection;
    switch (name) {
      case 'planning':
        return options.planning.planning(w, p, signal);
      case 'sprints':
        return options.planning.sprints(w, p, signal, cursor);
      case 'sprint':
        return options.planning.sprint(w, p, s!, signal);
      case 'target':
        return options.planning.sprint(w, p, targetId!, signal);
      case 'task':
        return options.tasks.planning(w, p, t!, signal);
      case 'scope':
        return options.tasks.scope(w, p, s!, signal, cursor);
      case 'sprintHistory':
        return options.tasks.sprintHistory(w, p, s!, signal, cursor);
      case 'taskHistory':
        return options.tasks.taskHistory(w, p, t!, signal, cursor);
      case 'preview':
        return options.tasks.closePreview(w, p, s!, state.destination, signal, cursor);
      case 'closure':
        return options.tasks.closure(w, p, s!, signal);
      case 'outcomes':
        return options.tasks.outcomes(w, p, s!, signal, cursor);
    }
  }
  function available(name: SprintResourceName) {
    if (name === 'planning' || name === 'sprints') return true;
    if (name === 'target') return state.selection.targetId !== null;
    if (name === 'preview')
      return previewWanted && !!state.resources.sprint.data?.capabilities.canClose;
    if (name === 'task' || name === 'taskHistory') return state.selection.taskId !== null;
    if (name === 'closure' || name === 'outcomes')
      return state.resources.sprint.data?.state === 'closed';
    return state.selection.sprintId !== null;
  }
  async function read(name: SprintResourceName, more = false): Promise<void> {
    if (!authorized() || !available(name) || (more && reads.has(name))) return;
    const previous = state.resources[name];
    const page = previous.data;
    const cursor = more && page && 'nextCursor' in page ? page.nextCursor : null;
    if (
      more &&
      (!collections.has(name) || !cursor || previous.stale || previous.status !== 'ready')
    )
      return;
    reads.get(name)?.abort();
    const request = new AbortController();
    const capturedEpoch = epoch;
    reads.set(name, request);
    resource(name, {
      ...previous,
      status: more ? 'ready' : 'loading',
      stale: more ? false : !!page,
      loadingMore: more,
      failure: null,
    });
    const current = () =>
      epoch === capturedEpoch && reads.get(name) === request && !request.signal.aborted;
    try {
      let data = await fetchResource(name, request.signal, cursor ?? undefined);
      if (!current() || !authorized()) return;
      if (more && page && 'items' in page && 'items' in data) {
        const before = page as NonNullable<SprintResources[SprintCollection]['data']>;
        const next = data as typeof before;
        const identity = (item: (typeof before.items)[number]) =>
          'id' in item ? item.id : item.participationId;
        const ids = new Set(before.items.map(identity));
        if (
          sprintPageBinding(before) !== sprintPageBinding(next) ||
          next.nextCursor === cursor ||
          next.items.some((item) => ids.has(identity(item))) ||
          before.items.length + next.items.length > next.total
        )
          throw new TaskPlanningFailure(409, 'page-changed');
        data = { ...data, items: [...before.items, ...next.items] } as typeof data;
      }
      if (name === 'outcomes' && 'closureId' in data) {
        const closure = state.resources.closure.data;
        if (closure && (data.closureId !== closure.id || data.total !== closure.total))
          throw new TaskPlanningFailure(409, 'page-changed');
      }
      resource(name, {
        status: 'ready',
        data,
        stale: false,
        loadingMore: false,
        failure: null,
      } as SprintResources[typeof name]);
    } catch (error) {
      if (!current()) return;
      const problem = failure(error);
      if (problem.status === 401 || problem.status === 403) {
        deny(problem.status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      const changed = problem.code === 'page-changed' || problem.status === 409;
      resource(name, {
        ...previous,
        status: changed ? 'changed' : 'error',
        stale: true,
        loadingMore: false,
        failure: problem,
      });
      if (name === 'preview' && state.draft?.type === 'close-sprint')
        publish({ needsReview: true });
    } finally {
      if (reads.get(name) === request) reads.delete(name);
    }
  }
  async function refreshReads() {
    if (!authorized()) return;
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
      publish({ context: context ? structuredClone(context) : null, status: 'ready' });
      if (resume) await refreshReads();
      return;
    }
    clear('inactive');
    if (!context) return;
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
    const resources = { ...state.resources };
    for (const name of [
      'sprint',
      'task',
      'scope',
      'sprintHistory',
      'taskHistory',
      'preview',
      'closure',
      'outcomes',
    ] as const)
      Object.assign(resources, { [name]: emptySprintResource() });
    publish({
      selection: { ...state.selection, sprintId, taskId },
      destination: null,
      resources,
      mutation: emptySprintState().mutation,
    });
    await refreshReads();
    return true;
  }
  async function selectTarget(targetId: string | null) {
    if (!authorized() || busy()) return false;
    reads.get('target')?.abort();
    reads.delete('target');
    publish({
      selection: { ...state.selection, targetId },
      resources: { ...state.resources, target: emptySprintResource() },
    });
    if (targetId) await read('target');
    return true;
  }
  async function preview(destination: string | null): Promise<boolean> {
    if (
      !authorized() ||
      busy() ||
      state.draft ||
      !state.resources.sprint.data?.capabilities.canClose
    )
      return false;
    reads.get('preview')?.abort();
    reads.delete('preview');
    previewWanted = true;
    publish({ destination, resources: { ...state.resources, preview: emptySprintResource() } });
    await read('preview');
    return (
      state.destination === destination &&
      state.resources.preview.data?.destination === destination &&
      state.resources.preview.status === 'ready' &&
      !state.resources.preview.stale
    );
  }
  function stage(intent: SprintIntent): SprintIntentResult {
    if (!authorized()) return 'unavailable';
    if (busy() || state.draft) return 'busy';
    const command = prepareSprintCommand(state, intent);
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
    const command = changeSprintCommand(state.draft, intent, state);
    if (!command) return 'unavailable';
    publish({ draft: structuredClone(command) });
    return 'ready';
  }
  function rebaseDraft(): SprintIntentResult {
    if (!authorized() || !state.draft) return 'unavailable';
    if (busy()) return 'busy';
    // Closing always requires a newly reviewed preview and a new explicit stage action.
    if (state.draft.type === 'close-sprint') return 'preview-required';
    const command = prepareSprintCommand(state, sprintCommandIntent(state.draft));
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
      case 'configure-planning':
      case 'create-sprint':
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
      await refreshReads();
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
  }
  async function submit(): Promise<SprintIntentResult> {
    if (!authorized() || !state.draft) return 'unavailable';
    if (busy()) return 'busy';
    if (state.needsReview) return 'review-required';
    const eligibility = prepareSprintCommand(state, sprintCommandIntent(state.draft));
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
  }
  async function refresh() {
    if (!state.context || state.status === 'signed-out') return;
    if (state.status === 'forbidden') publish({ status: 'ready' });
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
      reads.get('preview')?.abort();
      reads.delete('preview');
      resource('preview', {
        ...state.resources.preview,
        status: state.resources.preview.data ? 'ready' : 'idle',
        stale: true,
        loadingMore: false,
      });
      if (state.draft) publish({ needsReview: true });
    }
    await read(name);
  }
  return {
    getState: () => state,
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
