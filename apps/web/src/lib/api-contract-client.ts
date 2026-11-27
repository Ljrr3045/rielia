import type { paths } from '@rielia/contracts/openapi';

type Root = '/api/v1/workspaces/{workspaceId}/projects/{projectId}';
type TranchePath = Extract<
  keyof paths,
  `${Root}/planning` | `${Root}/sprints` | `${Root}/sprints/{sprintId}`
>;
type Method = 'get' | 'post';
type Operation<M extends Method, P extends TranchePath> = NonNullable<paths[P][M]>;
type ReadonlyWire<T> = T extends object ? { readonly [K in keyof T]: ReadonlyWire<T[K]> } : T;
type JsonOf<T> = T extends { content: { 'application/json': infer J } } ? J : never;
type QueryOf<O> = O extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;
type BodyOf<O> = O extends { requestBody: infer B } ? JsonOf<B> : never;
type BrowserHeaders<O> = O extends { parameters: { header: infer H } }
  ? Omit<H, 'Origin' | 'Sec-Fetch-Site'>
  : never;
type KeyOf<O> = [BrowserHeaders<O>] extends [never]
  ? never
  : BrowserHeaders<O> extends { 'Idempotency-Key': infer K extends string }
    ? K
    : never;
export type RequestInput<M extends Method, P extends TranchePath> = {
  readonly path: ReadonlyWire<Operation<M, P>['parameters']['path']>;
  readonly query?: ReadonlyWire<QueryOf<Operation<M, P>>>;
  readonly signal: AbortSignal;
} & ([BodyOf<Operation<M, P>>] extends [never]
  ? { readonly body?: never; readonly key?: never }
  : { readonly body: ReadonlyWire<BodyOf<Operation<M, P>>>; readonly key: KeyOf<Operation<M, P>> });
type IsUnion<T, Whole = T> = T extends Whole ? ([Whole] extends [T] ? false : true) : never;
type Single<T> = true extends IsUnion<T> ? never : T;
type Exact<A, E> = A extends E
  ? A extends readonly unknown[]
    ? A
    : A extends object
      ? { [K in keyof A]: K extends keyof NonNullable<E> ? Exact<A[K], NonNullable<E>[K]> : never }
      : A
  : never;

/** HTTP only: the caller owns unknown JSON, schema/scope admission and feature failures. */
export function createContractRequest(
  options: { baseURL?: string; timeout?: number; fetch?: typeof globalThis.fetch } = {},
) {
  return async function request<
    const M extends Method,
    const P extends TranchePath,
    const A extends RequestInput<NoInfer<M>, NoInfer<P>>,
  >(
    method: M & Single<M>,
    template: P & Single<P>,
    input: A & Exact<A, RequestInput<NoInfer<M>, NoInfer<P>>>,
  ): Promise<Response> {
    let path: string = template;
    for (const [name, value] of Object.entries(input.path))
      path = path.replace(`{${name}}`, encodeURIComponent(value));
    const query: string[] = [];
    for (const [name, value] of Object.entries(input.query ?? {})) {
      if (value !== undefined) query.push(`${name}=${encodeURIComponent(value)}`);
    }
    if (query.length) path += `?${query.join('&')}`;
    const init: RequestInit = {
      method: method.toUpperCase(),
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([input.signal, AbortSignal.timeout(options.timeout ?? 15000)]),
    };
    if (input.body !== undefined) {
      const key = input.key;
      if (key === undefined) throw new TypeError('A write requires its captured idempotency key.');
      init.headers = { 'Content-Type': 'application/json', 'Idempotency-Key': key };
      init.body = JSON.stringify(input.body);
    }
    return (options.fetch ?? globalThis.fetch)(
      options.baseURL ? new URL(path, options.baseURL) : path,
      init,
    );
  };
}
