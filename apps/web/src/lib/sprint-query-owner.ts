import {
  CancelledError,
  MutationObserver,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';
import type { ProjectPlanning, SprintPage, SprintPlanningResult } from '@rielia/contracts';
import { SprintPlanningFailure, type createSprintPlanningTransport } from './sprint-client.ts';
import {
  emptySprintResource,
  freezeSprintValue,
  sprintPageBinding,
  type SprintClientCommand,
  type SprintClientContext,
  type SprintClientFailure,
  type SprintResource,
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
  changed: () => void;
  authorized: () => boolean;
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
  function resources() {
    return {
      planning: { ...planningMeta, data: planningData() },
      sprints: { ...sprintsMeta, data: sprintsData() },
    };
  }
  function cancel() {
    generation++;
    void client.cancelQueries();
  }
  function clear() {
    // Mask and retire first: Query cancellation may revert to an earlier DTO.
    context = null;
    lifetime++;
    planningMeta = emptyMetadata();
    sprintsMeta = emptyMetadata();
    cancel();
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
    if (context) return;
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
        if (!context || signal.aborted || !options.authorized()) throw new CancelledError();
        const result = await options.transport.mutate(command, key, signal);
        if (captured !== lifetime || signal.aborted || !context || !options.authorized())
          throw new CancelledError();
        return result;
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
  async function read(name: 'planning' | 'sprints', more = false) {
    if (!context) return;
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
