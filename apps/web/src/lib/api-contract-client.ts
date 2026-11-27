import type { paths } from '@rielia/contracts/openapi';

type Root = '/api/v1/workspaces/{workspaceId}/projects/{projectId}';
type BrowserPath = Exclude<
  keyof paths,
  | '/api/v1/health'
  | '/api/v1/readiness'
  | '/api/v1/workspaces/{workspaceId}/execution-context'
  | '/api/v1/workspaces/{workspaceId}/events'
  | `${Root}/sprints/{sprintId}/close`
  | `${Root}/tasks/{taskId}/sprint`
>;
type IdentityPath = Extract<BrowserPath, `/api/v1/identity/${string}`>;
type Method = 'get' | 'post';
type Operation<M extends Method, P extends BrowserPath> = NonNullable<paths[P][M]>;
type MethodFor<P extends BrowserPath> = {
  [M in Method]: [Operation<M, P>] extends [never] ? never : M;
}[Method];
type ReadonlyWire<T> = T extends object ? { readonly [K in keyof T]: ReadonlyWire<T[K]> } : T;
type JsonOf<T> = T extends { content: { 'application/json': infer J } } ? J : never;
type QueryOf<O> = O extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;
type PathOf<O> = O extends { parameters: { path: infer P } } ? P : never;
type BodyOf<O> = O extends { requestBody: infer B } ? JsonOf<B> : never;
type BrowserHeaders<O> = O extends { parameters: { header: infer H } }
  ? Omit<H, 'Origin' | 'Sec-Fetch-Site'>
  : never;
type KeyOf<O> = [BrowserHeaders<O>] extends [never]
  ? never
  : BrowserHeaders<O> extends { 'Idempotency-Key': infer K extends string }
    ? K
    : never;
type Parameters<K extends string, T> = [T] extends [never]
  ? { readonly [N in K]?: never }
  : Record<never, never> extends T
    ? { readonly [N in K]?: ReadonlyWire<T> }
    : { readonly [N in K]: ReadonlyWire<T> };
export type RequestInput<M extends Method, P extends BrowserPath> = [Operation<M, P>] extends [
  never,
]
  ? never
  : Parameters<'path', PathOf<Operation<M, P>>> &
      Parameters<'query', QueryOf<Operation<M, P>>> &
      (P extends IdentityPath ? { readonly signal?: never } : { readonly signal: AbortSignal }) &
      ([BodyOf<Operation<M, P>>] extends [never]
        ? { readonly body?: never; readonly key?: never }
        : {
            readonly body: ReadonlyWire<BodyOf<Operation<M, P>>>;
            readonly key: KeyOf<Operation<M, P>>;
          });
type IsUnion<T, Whole = T> = T extends Whole ? ([Whole] extends [T] ? false : true) : never;
type Single<T> = true extends IsUnion<T> ? never : T;
type Exact<A, E> = A extends E
  ? A extends AbortSignal | readonly unknown[]
    ? A
    : A extends object
      ? { [K in keyof A]: K extends keyof NonNullable<E> ? Exact<A[K], NonNullable<E>[K]> : never }
      : A
  : never;
type WireInput = {
  [P in BrowserPath]: { [M in MethodFor<P>]: RequestInput<M, P> }[MethodFor<P>];
}[BrowserPath];

/** HTTP only: the caller owns unknown JSON, schema/scope admission and feature failures. */
export function createContractRequest(
  options: { baseURL?: string; timeout?: number; fetch?: typeof globalThis.fetch } = {},
) {
  function request<const M extends Method, const P extends BrowserPath, const A>(
    method: M & Single<M>,
    template: P & Single<P>,
    input: A &
      RequestInput<NoInfer<M>, NoInfer<P>> &
      Exact<A, RequestInput<NoInfer<M>, NoInfer<P>>>,
  ): Promise<Response>;
  async function request(
    method: Method,
    template: BrowserPath,
    input: WireInput,
  ): Promise<Response> {
    let path: string = template;
    for (const [name, value] of Object.entries(input.path ?? {}))
      path = path.replace(`{${name}}`, encodeURIComponent(value));
    const query: [string, string][] = [];
    for (const [name, value] of Object.entries(input.query ?? {})) {
      if (value !== undefined) query.push([name, value]);
    }
    if (query.length) {
      const form =
        template === '/api/v1/workspaces/{workspaceId}/projects' ||
        template === '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks' ||
        template ===
          '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/close-preview' ||
        template === '/api/v1/workspaces/{workspaceId}/task-discovery';
      path += `?${form ? new URLSearchParams(query).toString() : query.map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&')}`;
    }
    const identity =
      template === '/api/v1/identity/config' || template === '/api/v1/identity/session';
    const deadline = AbortSignal.timeout(options.timeout ?? 15000);
    const init: RequestInit = {
      ...(identity ? {} : { method: method.toUpperCase(), redirect: 'error' }),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: input.signal === undefined ? deadline : AbortSignal.any([input.signal, deadline]),
    };
    if (input.body !== undefined) {
      const key = input.key;
      if (key === undefined) throw new TypeError('A write requires its captured idempotency key.');
      init.headers = { 'Content-Type': 'application/json', 'Idempotency-Key': key };
      init.body = JSON.stringify(input.body);
    }
    return (options.fetch ?? globalThis.fetch)(
      options.baseURL
        ? identity
          ? new URL(path, options.baseURL).href
          : new URL(path, options.baseURL)
        : path,
      init,
    );
  }
  return request;
}
