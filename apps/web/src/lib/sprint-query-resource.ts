import { CancelledError, type QueryClient, QueryObserver } from '@tanstack/react-query';
import { SprintPlanningFailure } from './sprint-client.ts';
import { TaskPlanningFailure } from './task-planning-client.ts';
import {
  emptySprintResource,
  freezeSprintValue,
  type SprintClientFailure,
  type SprintResource,
} from './sprint-client-state.ts';

type Metadata = Omit<SprintResource<never>, 'data'>;
type Page<T> = {
  cursor: (value: T) => string | null;
  binding: (value: T) => string;
  identities: (value: T) => string[];
  size: (value: T) => number;
  total: (value: T) => number;
  compose: (values: T[]) => T;
};
type Binding<T> = {
  key: readonly unknown[];
  load: (signal: AbortSignal, cursor?: string) => Promise<T>;
  page?: Page<T>;
  admit?: (value: T) => void;
};
type Entry<T> = {
  observer: QueryObserver<T, unknown>;
  cursor: string | null;
  unsubscribe: () => void;
};
const emptyMetadata = (): Metadata => {
  const { status, stale, loadingMore, failure } = emptySprintResource();
  return { status, stale, loadingMore, failure };
};
const problem = (error: unknown): SprintClientFailure =>
  error instanceof SprintPlanningFailure || error instanceof TaskPlanningFailure
    ? { status: error.status, code: error.code, requestId: error.requestId }
    : { status: 0, code: null, requestId: null };

/** Selected DTOs and admitted page chains live only in this lifetime's Query cache. */
export function createSprintQueryResource<T>(options: {
  client: QueryClient;
  changed: () => void;
  authorized: () => boolean;
  denied: (reason: 'signed-out' | 'forbidden') => void;
}) {
  let binding: Binding<T> | null = null;
  let metadata = emptyMetadata();
  let admitted: Entry<T>[] = [];
  let pending: Entry<T> | null = null;
  let operation = 0;
  let chain = 0;

  function data(): T | null {
    if (!binding) return null;
    const values = admitted.flatMap((entry) => {
      const value = entry.observer.getCurrentResult().data;
      return value === undefined ? [] : [value];
    });
    if (!values.length) return null;
    return binding.page && values.length > 1 ? binding.page.compose(values) : values[0]!;
  }
  function resource(): SprintResource<T> {
    return { ...metadata, data: data() };
  }
  function retire(entries: Entry<T>[]) {
    const queries = new Set<object>(entries.map((entry) => entry.observer.getCurrentQuery()));
    entries.forEach((entry) => entry.unsubscribe());
    // Filter by actual retired records, so reentrant replacement cannot remove a new record.
    void options.client.cancelQueries({ predicate: (query) => queries.has(query) });
    entries.forEach((entry) => entry.observer.destroy());
    options.client.removeQueries({ predicate: (query) => queries.has(query) });
  }
  function cancel() {
    operation++;
    const obsolete = pending;
    pending = null;
    metadata = {
      ...metadata,
      status: data() ? 'ready' : 'idle',
      loadingMore: false,
    };
    if (obsolete) retire([obsolete]);
  }
  function clear() {
    operation++;
    const obsolete = [...admitted, ...(pending ? [pending] : [])];
    binding = null;
    admitted = [];
    pending = null;
    metadata = emptyMetadata();
    retire(obsolete);
  }
  function bind(value: Binding<T> | null) {
    if (JSON.stringify(binding?.key) === JSON.stringify(value?.key)) return;
    clear();
    binding = value;
  }
  function invalidate() {
    cancel();
    metadata = { ...metadata, stale: true };
  }
  async function read(more = false) {
    const captured = binding;
    if (!captured) return;
    const before = data();
    const cursor = more && before && captured.page ? captured.page.cursor(before) : null;
    if (
      more &&
      (!cursor || !captured.page || metadata.stale || metadata.status !== 'ready' || pending)
    )
      return;
    if (more && admitted.some((entry) => entry.cursor === cursor)) {
      metadata = {
        ...metadata,
        status: 'changed',
        stale: true,
        failure: { status: 409, code: 'page-changed', requestId: null },
      };
      options.changed();
      return;
    }
    cancel();
    const request = operation;
    const previous = metadata;
    const active = () => binding === captured && operation === request;
    if (!more) chain++;
    metadata = {
      ...previous,
      status: more ? 'ready' : 'loading',
      stale: more ? false : !!before,
      loadingMore: more,
      failure: null,
    };
    options.changed();
    if (!active()) return;
    const observer = new QueryObserver<T, unknown>(options.client, {
      queryKey: [...captured.key, { chain, cursor }],
      enabled: false,
      retry: false,
      gcTime: 0,
      staleTime: 0,
      networkMode: 'always',
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchInterval: false,
      structuralSharing: false,
      queryFn: async ({ signal }) => {
        if (!active() || signal.aborted || !options.authorized()) throw new CancelledError();
        const value = await captured.load(signal, cursor ?? undefined);
        if (!active() || signal.aborted || !options.authorized()) throw new CancelledError();
        captured.admit?.(value);
        if (more && before && captured.page) {
          const page = captured.page;
          const ids = new Set(page.identities(before));
          if (
            page.binding(before) !== page.binding(value) ||
            (page.cursor(value) !== null &&
              (page.cursor(value) === cursor ||
                admitted.some((entry) => entry.cursor === page.cursor(value)))) ||
            page.identities(value).some((id) => ids.has(id)) ||
            page.size(before) + page.size(value) > page.total(value)
          )
            throw new TaskPlanningFailure(409, 'page-changed');
        }
        return freezeSprintValue(value);
      },
    });
    const entry: Entry<T> = { observer, cursor, unsubscribe: () => {} };
    if (!active()) {
      retire([entry]);
      return;
    }
    pending = entry;
    entry.unsubscribe = observer.subscribe(options.changed);
    if (!active()) {
      retire([entry]);
      return;
    }
    try {
      await observer.refetch({ throwOnError: true, cancelRefetch: false });
      if (!active()) return;
      const value = observer.getCurrentResult().data!;
      // Another canonical resource can change reentrantly during Query success notification.
      captured.admit?.(value);
      const obsolete = more ? [] : admitted;
      admitted = more ? [...admitted, entry] : [entry];
      pending = null;
      metadata = { status: 'ready', stale: false, loadingMore: false, failure: null };
      retire(obsolete);
    } catch (error) {
      if (!active()) return;
      const failure = problem(error);
      if (failure.status === 401 || failure.status === 403) {
        options.denied(failure.status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      pending = null;
      metadata = {
        ...previous,
        status: failure.status === 409 ? 'changed' : 'error',
        stale: true,
        loadingMore: false,
        failure,
      };
      retire([entry]);
    }
    options.changed();
  }
  return { resource, bind, clear, cancel, invalidate, read };
}
