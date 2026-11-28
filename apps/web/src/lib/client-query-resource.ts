import { CancelledError, type QueryClient, QueryObserver } from '@tanstack/react-query';
export interface ClientQueryFailure {
  status: number;
  code: string | null;
  requestId: string | null;
}
export interface ClientQueryResource<T> {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'changed';
  data: T | null;
  stale: boolean;
  loadingMore: boolean;
  failure: ClientQueryFailure | null;
}
type Metadata = Omit<ClientQueryResource<never>, 'data'>;
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
  retainRoot?: (previousRoot: T, nextRoot: T) => boolean;
};
type Entry<T> = {
  observer: QueryObserver<T, unknown>;
  cursor: string | null;
  unsubscribe: () => void;
};
const emptyMetadata = (): Metadata => ({
  status: 'idle',
  stale: false,
  loadingMore: false,
  failure: null,
});

/** Selected DTOs and admitted page chains live only in this lifetime's Query cache. */
export function createClientQueryResource<T>(options: {
  client: QueryClient;
  changed: () => void;
  authorized: () => boolean;
  denied: (reason: 'signed-out' | 'forbidden') => void;
  freeze: <Value>(value: Value) => Value;
  failure: (error: unknown) => ClientQueryFailure;
  pageChanged: () => Error;
  explicitAppendRetry?: (failure: ClientQueryFailure) => boolean;
}) {
  let binding: Binding<T> | null = null;
  let metadata = emptyMetadata();
  let admitted: Entry<T>[] = [];
  let pending: Entry<T> | null = null;
  let operation = 0;
  let chain = 0;
  let failedRoot = false;
  let failedAppend: {
    binding: Binding<T>;
    chain: number;
    cursor: string;
    entries: Entry<T>[];
  } | null = null;

  function data(): T | null {
    if (!binding) return null;
    const values = admitted.flatMap((entry) => {
      const value = entry.observer.getCurrentResult().data;
      return value === undefined ? [] : [value];
    });
    if (!values.length) return null;
    return binding.page && values.length > 1 ? binding.page.compose(values) : values[0]!;
  }
  function resource(): ClientQueryResource<T> {
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
    failedRoot = false;
    failedAppend = null;
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
    failedRoot = false;
    failedAppend = null;
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
  async function read(more = false, revalidate = false) {
    const captured = binding;
    if (!captured) return;
    const before = data();
    const cursor = more && before && captured.page ? captured.page.cursor(before) : null;
    const retryAppend =
      failedAppend !== null &&
      failedAppend.binding === captured &&
      failedAppend.chain === chain &&
      failedAppend.cursor === cursor &&
      failedAppend.entries.length === admitted.length &&
      failedAppend.entries.every((entry, index) => entry === admitted[index]);
    if (
      more &&
      (!cursor ||
        !captured.page ||
        ((metadata.stale || metadata.status !== 'ready') && !retryAppend) ||
        pending)
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
      stale: more ? previous.stale : !!before,
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
        if (captured.page) {
          const page = captured.page;
          const identities = page.identities(value);
          if (new Set(identities).size !== identities.length) throw options.pageChanged();
        }
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
            throw options.pageChanged();
        }
        return options.freeze(value);
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
      if (!options.authorized()) throw new CancelledError();
      const value = observer.getCurrentResult().data!;
      // Another canonical resource can change reentrantly during Query success notification.
      captured.admit?.(value);
      const first = admitted[0]?.observer.getCurrentResult().data;
      if (!more && revalidate && first !== undefined && captured.retainRoot?.(first, value)) {
        pending = null;
        metadata = { status: 'ready', stale: false, loadingMore: false, failure: null };
        retire([entry]);
        options.changed();
        return;
      }
      const obsolete = more ? [] : admitted;
      admitted = more ? [...admitted, entry] : [entry];
      pending = null;
      metadata = { status: 'ready', stale: false, loadingMore: false, failure: null };
      retire(obsolete);
    } catch (error) {
      if (!active()) return;
      const failure = options.failure(error);
      if (failure.status === 401 || failure.status === 403) {
        options.denied(failure.status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      pending = null;
      failedRoot = !more;
      metadata = {
        ...previous,
        status: failure.status === 409 ? 'changed' : 'error',
        stale: true,
        loadingMore: false,
        failure,
      };
      if (more && cursor && options.authorized() && options.explicitAppendRetry?.(failure)) {
        failedAppend = { binding: captured, chain, cursor, entries: [...admitted] };
      }
      retire([entry]);
    }
    options.changed();
  }
  async function readNext() {
    if (pending || metadata.status === 'changed') return;
    await read(data() !== null && !failedRoot);
  }
  return { resource, bind, clear, cancel, invalidate, read, readNext };
}
