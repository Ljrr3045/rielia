import {
  CancelledError,
  MutationObserver,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';
import type {
  ProjectPlanning,
  Sprint,
  SprintPage,
  SprintPlanningResult,
  TaskPlanning,
  SprintScopePage,
  PlanningHistoryPage,
  SprintClosure,
  SprintClosingOutcomePage,
} from '@rielia/contracts';
import { SprintPlanningFailure, type createSprintPlanningTransport } from './sprint-client.ts';
import { createTaskPlanningTransport, TaskPlanningFailure } from './task-planning-client.ts';
import { createClientQueryResource } from './client-query-resource.ts';
import {
  emptySprintResource,
  emptySprintState,
  freezeSprintValue,
  sprintPageBinding,
  type SprintClientCommand,
  type SprintClientContext,
  type SprintClientFailure,
  type SprintResource,
  type SprintResourceName,
  type SprintResources,
} from './sprint-client-state.ts';

type Metadata = Omit<SprintResource<never>, 'data'>;
type Create = {
  command: Extract<SprintClientCommand, { type: 'create-sprint' }>;
  key: string;
  signal: AbortSignal;
};
const defaults = {
  retry: false,
  gcTime: 0,
  networkMode: 'always',
} as const;
const reads = {
  ...defaults,
  staleTime: 0,
  enabled: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  refetchInterval: false,
  structuralSharing: false,
} as const;
const emptyMetadata = (): Metadata => {
  const { status, stale, loadingMore, failure } = emptySprintResource();
  return { status, stale, loadingMore, failure };
};
const problem = (error: unknown): SprintClientFailure =>
  error instanceof SprintPlanningFailure
    ? { status: error.status, code: error.code, requestId: error.requestId }
    : { status: 0, code: null, requestId: null };

/** Query owns admitted DTOs; the controller owns intent, scheduling and recovery. */
export function createSprintQueryOwner(options: {
  transport: ReturnType<typeof createSprintPlanningTransport>;
  tasks?: ReturnType<typeof createTaskPlanningTransport>;
  changed: () => void;
  authorized: () => boolean;
  completionCurrent?: (request: Create & { context: SprintClientContext }) => boolean;
  denied: (reason: 'signed-out' | 'forbidden') => void;
  client?: QueryClient;
}) {
  const client = options.client ?? new QueryClient();
  let context: SprintClientContext | null = null;
  let identity = '';
  let lifetime = 0;
  let generation = 0;
  let planningRequest = 0;
  let sprintsRequest = 0;
  let planning: QueryObserver<ProjectPlanning, unknown> | null = null;
  const pages = new Map<string | null, QueryObserver<SprintPage, unknown>>();
  const subscriptions = new Map<object, () => void>();
  let cursors: (string | null)[] = [];
  let planningMeta = emptyMetadata();
  let sprintsMeta = emptyMetadata();
  let mutation: MutationObserver<SprintPlanningResult, unknown, Create> | null = null;
  const tasks = options.tasks ?? createTaskPlanningTransport();
  const slotOptions = {
    client,
    freeze: freezeSprintValue,
    failure: (error: unknown): SprintClientFailure =>
      error instanceof SprintPlanningFailure || error instanceof TaskPlanningFailure
        ? { status: error.status, code: error.code, requestId: error.requestId }
        : { status: 0, code: null, requestId: null },
    pageChanged: () => new TaskPlanningFailure(409, 'page-changed'),
    changed: options.changed,
    authorized: options.authorized,
    denied: options.denied,
  };
  const slots = {
    sprint: createClientQueryResource<Sprint>(slotOptions),
    target: createClientQueryResource<Sprint>(slotOptions),
    task: createClientQueryResource<TaskPlanning>(slotOptions),
    scope: createClientQueryResource<SprintScopePage>(slotOptions),
    sprintHistory: createClientQueryResource<PlanningHistoryPage>(slotOptions),
    taskHistory: createClientQueryResource<PlanningHistoryPage>(slotOptions),
    preview:
      createClientQueryResource<NonNullable<SprintResources['preview']['data']>>(slotOptions),
    closure: createClientQueryResource<SprintClosure>(slotOptions),
    outcomes: createClientQueryResource<SprintClosingOutcomePage>(slotOptions),
  };
  let selected = { sprintId: null as string | null, taskId: null as string | null };

  function planningData() {
    return context ? (planning?.getCurrentResult().data ?? null) : null;
  }
  function sprintsData(): SprintPage | null {
    if (!context) return null;
    const admitted = cursors.map((cursor) => pages.get(cursor)?.getCurrentResult().data);
    const first = admitted[0];
    if (!first) return null;
    if (admitted.some((page) => !page || sprintPageBinding(page) !== sprintPageBinding(first)))
      return first;
    const last = admitted.at(-1)!;
    return admitted.length === 1
      ? first
      : {
          ...first,
          items: admitted.flatMap((page) => page!.items),
          nextCursor: last.nextCursor,
        };
  }
  function resources(): SprintResources {
    if (!context) return emptySprintState().resources;
    const closure = slots.closure.resource();
    const outcomes = slots.outcomes.resource();
    const matches =
      !outcomes.data ||
      (closure.data?.id === outcomes.data.closureId && closure.data.total === outcomes.data.total);
    return {
      planning: { ...planningMeta, data: planningData() },
      sprints: { ...sprintsMeta, data: sprintsData() },
      sprint: slots.sprint.resource(),
      target: slots.target.resource(),
      task: slots.task.resource(),
      scope: slots.scope.resource(),
      sprintHistory: slots.sprintHistory.resource(),
      taskHistory: slots.taskHistory.resource(),
      preview: slots.preview.resource(),
      closure,
      outcomes: matches
        ? outcomes
        : {
            ...outcomes,
            data: null,
            stale: true,
            status: 'changed',
            failure: { status: 409, code: 'page-changed', requestId: null },
          },
    };
  }
  function cancel() {
    generation++;
    Object.values(slots).forEach((slot) => slot.cancel());
    void client.cancelQueries();
  }
  function clear() {
    // Mask and retire first: Query cancellation may revert to an earlier DTO.
    context = null;
    selected = { sprintId: null, taskId: null };
    lifetime++;
    planningMeta = emptyMetadata();
    sprintsMeta = emptyMetadata();
    cancel();
    Object.values(slots).forEach((slot) => slot.clear());
    subscriptions.forEach((unsubscribe) => unsubscribe());
    subscriptions.clear();
    planning?.destroy();
    pages.forEach((observer) => observer.destroy());
    planning = null;
    pages.clear();
    cursors = [];
    mutation?.reset();
    mutation = null;
    client.clear();
    options.changed();
  }
  function bind(value: SprintClientContext) {
    if (context) return false;
    context = value;
    identity = crypto.randomUUID();
    const { workspaceId, projectId } = value;
    const key = ['sprint', identity, workspaceId, projectId];
    planning = new QueryObserver<ProjectPlanning, unknown>(client, {
      ...reads,
      queryKey: [...key, 'planning'],
      queryFn: async ({ signal }) => {
        const captured = generation;
        const result = await options.transport.planning(workspaceId, projectId, signal);
        if (captured !== generation || signal.aborted || !context || !options.authorized())
          throw new CancelledError();
        return freezeSprintValue(result);
      },
    });
    subscriptions.set(planning, planning.subscribe(options.changed));
    mutation = new MutationObserver(client, {
      ...defaults,
      mutationKey: [...key, 'create-sprint'],
      mutationFn: async ({ command, key, signal }) => {
        const captured = lifetime;
        const capturedContext = context;
        if (!context || signal.aborted || !options.authorized()) throw new CancelledError();
        const result = await options.transport.mutate(command, key, signal);
        if (
          captured !== lifetime ||
          signal.aborted ||
          !context ||
          context !== capturedContext ||
          !(options.completionCurrent
            ? options.completionCurrent({ command, key, signal, context })
            : options.authorized())
        )
          throw new CancelledError();
        return result;
      },
    });
    return true;
  }
  function selectedKey(name: SprintResourceName, selector: object) {
    return ['sprint', identity, context!.workspaceId, context!.projectId, name, selector];
  }
  function select(sprintId: string | null, taskId: string | null) {
    if (!context || (selected.sprintId === sprintId && selected.taskId === taskId)) return;
    selected = { sprintId, taskId };
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
      slots[name].clear();
    const { workspaceId: w, projectId: p } = context;
    if (sprintId) {
      const s = sprintId;
      slots.sprint.bind({
        key: selectedKey('sprint', { sprintId: s }),
        load: (signal) => options.transport.sprint(w, p, s, signal),
      });
      slots.scope.bind({
        key: selectedKey('scope', { sprintId: s }),
        load: (signal, cursor) => tasks.scope(w, p, s, signal, cursor),
        page: {
          cursor: (v) => v.nextCursor,
          binding: sprintPageBinding,
          identities: (v) => v.items.map((item) => item.id),
          size: (v) => v.items.length,
          total: (v) => v.total,
          compose: (pages) => ({
            ...pages[0]!,
            items: pages.flatMap((v) => v.items),
            nextCursor: pages.at(-1)!.nextCursor,
          }),
        },
      });
      slots.sprintHistory.bind({
        key: selectedKey('sprintHistory', { sprintId: s }),
        load: (signal, cursor) => tasks.sprintHistory(w, p, s, signal, cursor),
        page: historyPages(),
      });
      slots.closure.bind({
        key: selectedKey('closure', { sprintId: s }),
        load: (signal) => tasks.closure(w, p, s, signal),
      });
      slots.outcomes.bind({
        key: selectedKey('outcomes', { sprintId: s }),
        load: (signal, cursor) => tasks.outcomes(w, p, s, signal, cursor),
        admit(value) {
          const closure = slots.closure.resource().data;
          if (!closure || value.closureId !== closure.id || value.total !== closure.total)
            throw new TaskPlanningFailure(409, 'page-changed');
        },
        page: {
          cursor: (v) => v.nextCursor,
          binding: sprintPageBinding,
          identities: (v) =>
            v.items.flatMap((item) => [`id:${item.id}`, `visit:${item.participationId}`]),
          size: (v) => v.items.length,
          total: (v) => v.total,
          compose: (pages) => ({
            ...pages[0]!,
            items: pages.flatMap((v) => v.items),
            nextCursor: pages.at(-1)!.nextCursor,
          }),
        },
      });
    }
    if (taskId) {
      const t = taskId;
      slots.task.bind({
        key: selectedKey('task', { taskId: t }),
        load: (signal) => tasks.planning(w, p, t, signal),
      });
      slots.taskHistory.bind({
        key: selectedKey('taskHistory', { taskId: t }),
        load: (signal, cursor) => tasks.taskHistory(w, p, t, signal, cursor),
        page: historyPages(),
      });
    }
  }
  function historyPages() {
    return {
      cursor: (v: PlanningHistoryPage) => v.nextCursor,
      binding: sprintPageBinding,
      identities: (v: PlanningHistoryPage) => v.items.map((item) => item.id),
      size: (v: PlanningHistoryPage) => v.items.length,
      total: (v: PlanningHistoryPage) => v.total,
      compose: (pages: PlanningHistoryPage[]): PlanningHistoryPage => ({
        ...pages[0]!,
        items: pages.flatMap((v) => v.items),
        nextCursor: pages.at(-1)!.nextCursor,
      }),
    };
  }
  function selectTarget(targetId: string | null) {
    if (!context) return;
    const { workspaceId: w, projectId: p } = context;
    slots.target.bind(
      targetId === null
        ? null
        : {
            key: selectedKey('target', { targetId }),
            load: (signal) => options.transport.sprint(w, p, targetId, signal),
          },
    );
  }
  function preview(destination: string | null) {
    slots.preview.clear();
    if (!context || !selected.sprintId) return;
    const { workspaceId: w, projectId: p } = context;
    const s = selected.sprintId;
    slots.preview.bind({
      key: selectedKey('preview', { sprintId: s, destination }),
      load: (signal, cursor) => tasks.closePreview(w, p, s, destination, signal, cursor),
      page: {
        cursor: (v) => v.nextCursor,
        binding: sprintPageBinding,
        identities: (v) => v.items.map((item) => item.participationId),
        size: (v) => v.items.length,
        total: (v) => v.total,
        compose: (pages) => ({
          ...pages[0]!,
          items: pages.flatMap((v) => v.items),
          nextCursor: pages.at(-1)!.nextCursor,
        }),
      },
    });
  }
  function pageObserver(cursor: string | null) {
    const existing = pages.get(cursor);
    if (existing) return existing;
    const { workspaceId, projectId } = context!;
    const observer = new QueryObserver<SprintPage, unknown>(client, {
      ...reads,
      queryKey: [
        'sprint',
        identity,
        workspaceId,
        projectId,
        'sprints',
        { selector: 'all-states', cursor },
      ],
      queryFn: async ({ signal }) => {
        const captured = generation;
        const before = cursor === null ? null : sprintsData();
        const result = await options.transport.sprints(
          workspaceId,
          projectId,
          signal,
          cursor ?? undefined,
        );
        if (captured !== generation || signal.aborted || !context || !options.authorized())
          throw new CancelledError();
        if (before) {
          const ids = new Set(before.items.map((item) => item.id));
          if (
            sprintPageBinding(before) !== sprintPageBinding(result) ||
            result.nextCursor === cursor ||
            result.items.some((item) => ids.has(item.id)) ||
            before.items.length + result.items.length > result.total
          )
            throw new SprintPlanningFailure(409, 'page-changed');
        }
        return freezeSprintValue(result);
      },
    });
    pages.set(cursor, observer);
    subscriptions.set(observer, observer.subscribe(options.changed));
    return observer;
  }
  function invalidate() {
    cancel();
    Object.values(slots).forEach((slot) => slot.invalidate());
    planningMeta = {
      ...planningMeta,
      status: planningData() ? 'ready' : 'idle',
      stale: true,
      loadingMore: false,
    };
    sprintsMeta = {
      ...sprintsMeta,
      status: sprintsData() ? 'ready' : 'idle',
      stale: true,
      loadingMore: false,
    };
    void client.invalidateQueries({ refetchType: 'none' });
    options.changed();
  }
  async function read(name: SprintResourceName, more = false) {
    if (!context) return;
    if (name !== 'planning' && name !== 'sprints') return slots[name].read(more);
    const previous = name === 'planning' ? planningMeta : sprintsMeta;
    const page = sprintsData();
    const cursor = more ? page?.nextCursor : null;
    if (more && (!cursor || previous.stale || previous.status !== 'ready' || previous.loadingMore))
      return;
    if (more && cursor && cursors.includes(cursor)) {
      sprintsMeta = {
        ...previous,
        status: 'changed',
        stale: true,
        loadingMore: false,
        failure: { status: 409, code: 'page-changed', requestId: null },
      };
      options.changed();
      return;
    }
    const captured = generation;
    const request = name === 'planning' ? ++planningRequest : ++sprintsRequest;
    const active = () =>
      context !== null &&
      captured === generation &&
      request === (name === 'planning' ? planningRequest : sprintsRequest);
    // A replacement read cancels only this resource, retaining its prior admitted data.
    if (!more)
      await client.cancelQueries({
        queryKey: ['sprint', identity, context.workspaceId, context.projectId, name],
      });
    if (!active()) return;
    const meta: Metadata = {
      ...previous,
      status: more ? 'ready' : 'loading',
      stale: more ? false : name === 'planning' ? !!planningData() : !!page,
      loadingMore: more,
      failure: null,
    };
    if (name === 'planning') planningMeta = meta;
    else sprintsMeta = meta;
    options.changed();
    const observer = name === 'planning' ? planning! : pageObserver(cursor ?? null);
    try {
      await observer.refetch({ throwOnError: true, cancelRefetch: false });
      if (!active()) return;
      if (name === 'sprints') {
        if (more) cursors = [...cursors, cursor!];
        else {
          cursors = [null];
          for (const [cursor, observer] of pages) {
            if (cursor === null) continue;
            subscriptions.get(observer)!();
            subscriptions.delete(observer);
            observer.destroy();
            pages.delete(cursor);
            client.removeQueries({ queryKey: observer.options.queryKey, exact: true });
          }
        }
      }
      const ready: Metadata = { status: 'ready', stale: false, loadingMore: false, failure: null };
      if (name === 'planning') planningMeta = ready;
      else sprintsMeta = ready;
    } catch (error) {
      if (!active()) return;
      const failure = problem(error);
      if (failure.status === 401 || failure.status === 403) {
        options.denied(failure.status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      const meta: Metadata = {
        ...previous,
        status: failure.status === 409 ? 'changed' : 'error',
        stale: true,
        loadingMore: false,
        failure,
      };
      if (name === 'planning') planningMeta = meta;
      else sprintsMeta = meta;
    }
    options.changed();
  }
  return {
    resources,
    bind,
    cancel,
    clear,
    invalidate,
    select,
    selectTarget,
    preview,
    invalidatePreview() {
      slots.preview.invalidate();
      options.changed();
    },
    clearPreview() {
      slots.preview.clear();
    },
    read,
    async create(command: Create['command'], key: string, signal: AbortSignal) {
      const observer = mutation;
      if (!observer) throw new CancelledError();
      try {
        return await observer.mutate({ command, key, signal });
      } finally {
        observer.reset();
        if (observer === mutation) client.getMutationCache().clear();
      }
    },
  };
}
