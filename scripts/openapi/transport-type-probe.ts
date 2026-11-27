import { createContractRequest } from '../../apps/web/src/lib/api-contract-client.js';
import type { RequestInput } from '../../apps/web/src/lib/api-contract-client.js';
import type { operations, paths } from '@rielia/contracts/openapi';
import type {
  ProjectPlanning,
  Sprint,
  SprintPage,
  SprintPlanningCommand,
  isProjectPlanning,
  isSprint,
  isSprintPage,
} from '@rielia/contracts';
type ReadonlyWire<T> = T extends object ? { readonly [K in keyof T]: ReadonlyWire<T[K]> } : T;
type ModeledSuccess<M extends 'get' | 'post', P extends keyof paths> =
  NonNullable<paths[P][M]> extends { responses: infer R }
    ? {
        [K in keyof R]: `${K & (string | number)}` extends `2${string}` ? JsonOf<R[K]> : never;
      }[keyof R]
    : never;
const planning = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/planning';
const collection = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints';
const detail = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}';
const request = createContractRequest();
declare const signal: AbortSignal;
const path = { workspaceId: 'w', projectId: 'p' };
const itemPath = { ...path, sprintId: 's' };
const settings = { mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 2] } as const;
const fields = { name: 'S', goal: 'G', startDate: '2026-11-19', endDateExclusive: '2026-12-03' };
void request('get', planning, { path, signal });
void request('post', planning, {
  path,
  body: { expectedVersion: 1, ...settings },
  key: 'key',
  signal,
});
void request('get', collection, { path, query: { cursor: 'cursor' }, signal });
void request('get', detail, { path: itemPath, signal });
void request('post', collection, {
  path,
  body: { expectedProjectVersion: 1, ...fields },
  key: 'key',
  signal,
});
void request('post', detail, {
  path: itemPath,
  body: { expectedVersion: 1, ...fields },
  key: 'key',
  signal,
});
type Check<T extends true> = T;
type JsonOf<T> = T extends { content: { 'application/json': infer J } } ? J : never;
export type Input31 = Check<
  RequestInput<'post', typeof planning>['body'] extends ReadonlyWire<
    JsonOf<operations['H31']['requestBody']>
  >
    ? true
    : false
>;
export type Input34 = Check<
  RequestInput<'post', typeof collection>['body'] extends ReadonlyWire<
    JsonOf<operations['H34']['requestBody']>
  >
    ? true
    : false
>;
export type Input35 = Check<
  RequestInput<'post', typeof detail>['body'] extends ReadonlyWire<
    JsonOf<operations['H35']['requestBody']>
  >
    ? true
    : false
>;
export type Success30 = Check<
  ModeledSuccess<'get', typeof planning> extends ProjectPlanning ? true : false
>;
export type Success31 = Check<
  ModeledSuccess<'post', typeof planning> extends ProjectPlanning ? true : false
>;
export type Success32 = Check<
  ModeledSuccess<'get', typeof collection> extends SprintPage ? true : false
>;
export type Success33 = Check<ModeledSuccess<'get', typeof detail> extends Sprint ? true : false>;
export type Success34 = Check<
  ModeledSuccess<'post', typeof collection> extends Sprint ? true : false
>;
export type Success35 = Check<ModeledSuccess<'post', typeof detail> extends Sprint ? true : false>;
type GuardValue<G> = G extends (value: unknown) => value is infer D ? D : never;
type PlanningGuard = GuardValue<typeof isProjectPlanning>;
type SprintGuard = GuardValue<typeof isSprint>;
type PageGuard = GuardValue<typeof isSprintPage>;
export type Predicate30 = Check<PlanningGuard extends ProjectPlanning ? true : false>;
export type Predicate33 = Check<SprintGuard extends Sprint ? true : false>;
export type Predicate32 = Check<PageGuard extends SprintPage ? true : false>;
// No claim that broad existing provenance types become the narrower generated union.
export type ReadonlyPlanning = Check<
  ReadonlyWire<ModeledSuccess<'get', typeof planning>> extends ReadonlyWire<PlanningGuard>
    ? true
    : false
>;
export type ReadonlySprint = Check<
  ReadonlyWire<ModeledSuccess<'get', typeof detail>> extends ReadonlyWire<SprintGuard>
    ? true
    : false
>;
export type ReadonlyPage = Check<
  ReadonlyWire<ModeledSuccess<'get', typeof collection>> extends ReadonlyWire<PageGuard>
    ? true
    : false
>;
declare const immutableSprint: ReadonlyWire<SprintGuard>;
// @ts-expect-error response consumer views cannot mutate existing domain data
immutableSprint.version = 2;

// Each consumed negative is one rejected call; the stripped control retains all calls.
// @ts-expect-error N01 unknown endpoint
void request('get', '/invented', { path, signal });
// @ts-expect-error N02 generated but outside this tranche
void request('get', '/api/v1/health', { path, signal });
// @ts-expect-error N03 unsupported method
void request('patch', planning, { path, signal });
// @ts-expect-error N04 GET body
void request('get', planning, { path, body: { expectedVersion: 1, ...settings }, signal });
const getWithBody = { path, body: { expectedVersion: 1, ...settings }, signal };
// @ts-expect-error N05 predeclared GET body
void request('get', planning, getWithBody);
// @ts-expect-error N06 missing POST body
void request('post', planning, { path, key: 'key', signal });
// @ts-expect-error N07 missing POST key
void request('post', planning, { path, body: { expectedVersion: 1, ...settings }, signal });
// @ts-expect-error N08 missing project path selector
void request('get', planning, { path: { workspaceId: 'w' }, signal });
// @ts-expect-error N09 missing sprint selector
void request('get', detail, { path, signal });
// @ts-expect-error N10 extra path selector
void request('get', planning, { path: { ...path, extra: 'x' }, signal });
const extraPath = { ...path, extra: 'x' };
// @ts-expect-error N11 predeclared extra path selector
void request('get', planning, { path: extraPath, signal });
// @ts-expect-error N12 query not supported by planning
void request('get', planning, { path, query: { cursor: 'x' }, signal });
// @ts-expect-error N13 unsupported collection query
void request('get', collection, { path, query: { cursor: 'x', view: 'active' }, signal });
const extraQuery = { cursor: 'x', view: 'active' };
// @ts-expect-error N14 predeclared unsupported query
void request('get', collection, { path, query: extraQuery, signal });
// @ts-expect-error N15 cursor scalar
void request('get', collection, { path, query: { cursor: 1 }, signal });
// @ts-expect-error N16 null is not an omitted cursor
void request('get', collection, { path, query: { cursor: null }, signal });
// @ts-expect-error N17 exact optional cursor property
void request('get', collection, { path, query: { cursor: undefined }, signal });
// @ts-expect-error N18 GET does not accept a command key
void request('get', planning, { path, key: 'key', signal });
// @ts-expect-error N19 empty required body
void request('post', planning, { path, body: {}, key: 'key', signal });
void request('post', planning, {
  path,
  // @ts-expect-error N20 unsupported body field
  body: { expectedVersion: 1, ...settings, actor: 'h' },
  key: 'key',
  signal,
});
const extraBody = { expectedVersion: 1, ...settings, actor: 'h' };
// @ts-expect-error N21 predeclared unsupported body field
void request('post', planning, { path, body: extraBody, key: 'key', signal });
void request('post', planning, {
  path,
  // @ts-expect-error N22 version scalar
  body: { expectedVersion: '1', ...settings },
  key: 'key',
  signal,
});
void request('post', collection, {
  path,
  // @ts-expect-error N23 wrong version family
  body: { expectedVersion: 1, ...fields },
  key: 'key',
  signal,
});
void request('post', detail, {
  path: itemPath,
  // @ts-expect-error N24 Date object is not a wire date
  body: { expectedVersion: 1, ...fields, startDate: new Date() },
  key: 'key',
  signal,
});
void request('post', planning, {
  path,
  // @ts-expect-error N25 array item scalar
  body: { expectedVersion: 1, ...settings, pointScale: ['1'] },
  key: 'key',
  signal,
});
void request('post', planning, {
  path,
  body: { expectedVersion: 1, ...settings },
  key: 'key',
  signal,
  // @ts-expect-error N26 manual browser header map
  headers: { Origin: 'https://evil.test' },
});
const manualHeaders = {
  path,
  body: { expectedVersion: 1, ...settings },
  key: 'key',
  signal,
  headers: { Cookie: 'secret', 'Sec-Fetch-Site': 'same-origin' },
};
// @ts-expect-error N27 predeclared manual browser headers
void request('post', planning, manualHeaders);
// @ts-expect-error N28 manual Origin field
void request('get', planning, { path, signal, Origin: 'https://evil.test' });
const extraOptions = { path, signal, credentials: 'include', redirect: 'follow' };
// @ts-expect-error N29 predeclared fetch-policy override
void request('get', planning, extraOptions);
declare const uncertainMethod: 'get' | 'post';
// @ts-expect-error N30 no uncorrelated method union inference
void request(uncertainMethod, planning, { path, signal });
declare const uncertainPath: typeof collection | typeof detail;
// @ts-expect-error N31 no uncorrelated path union inference
void request('get', uncertainPath, { path, signal });
// @ts-expect-error N32 explicit generic union cannot escape the relation
void request<'get' | 'post', typeof planning, RequestInput<'get', typeof planning>>(
  'get',
  planning,
  { path, signal },
);
// @ts-expect-error N33 signal is mandatory
void request('get', planning, { path });
void request('post', collection, {
  path,
  body: { expectedProjectVersion: 1, ...fields },
  key: 'key',
  signal,
  // @ts-expect-error N34 write query not supported
  query: { cursor: 'x' },
});
const createInput = {
  path,
  body: { expectedProjectVersion: 1, ...fields },
  key: 'key',
  signal,
};
// @ts-expect-error N35 method cannot widen from GET plus write input
void request('get', collection, createInput);
const writeInput = { path, body: { expectedVersion: 1, ...settings }, key: 'key', signal };
void request<'get' | 'post', typeof planning, RequestInput<'post', typeof planning>>(
  // @ts-expect-error N36 explicit method union rejected even with a compatible write body
  'get',
  planning,
  writeInput,
);
void request<'get', typeof collection | typeof detail, RequestInput<'get', typeof detail>>(
  'get',
  // @ts-expect-error N37 explicit path union rejected even with a compatible exact item input
  detail,
  { path: itemPath, signal },
);
declare const readonlyInput: RequestInput<'post', typeof planning>;
// @ts-expect-error N38 readonly body arrays cannot be mutated by the adapter
readonlyInput.body.pointScale.push(3);
export function explicitlyCorrelatedSelection(
  selected: typeof collection | typeof detail,
): Promise<Response> {
  if (selected === collection) return request('get', selected, { path, signal });
  return request('get', selected, { path: itemPath, signal });
}

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type ExactH30 = Check<
  Equal<ModeledSuccess<'get', typeof planning>, JsonOf<operations['H30']['responses'][200]>>
>;
export type ExactH31 = Check<
  Equal<ModeledSuccess<'post', typeof planning>, JsonOf<operations['H31']['responses'][201]>>
>;
export type ExactH32 = Check<
  Equal<ModeledSuccess<'get', typeof collection>, JsonOf<operations['H32']['responses'][200]>>
>;
export type ExactH33 = Check<
  Equal<ModeledSuccess<'get', typeof detail>, JsonOf<operations['H33']['responses'][200]>>
>;
export type ExactH34 = Check<
  Equal<ModeledSuccess<'post', typeof collection>, JsonOf<operations['H34']['responses'][201]>>
>;
export type ExactH35 = Check<
  Equal<ModeledSuccess<'post', typeof detail>, JsonOf<operations['H35']['responses'][201]>>
>;
export type ExactPlanningPredicate = Check<Equal<PlanningGuard, ProjectPlanning>>;
export type ExactSprintPredicate = Check<Equal<SprintGuard, Sprint>>;
export type ExactPagePredicate = Check<Equal<PageGuard, SprintPage>>;
export function currentCommandInput(
  command: SprintPlanningCommand,
  key: string,
  commandSignal: AbortSignal,
): Promise<Response> {
  const selectedPath = { workspaceId: command.workspaceId, projectId: command.projectId };
  if (command.type === 'configure-planning')
    return request('post', planning, {
      path: selectedPath,
      body: { expectedVersion: command.expectedVersion, ...command.settings },
      key,
      signal: commandSignal,
    });
  if (command.type === 'create-sprint')
    return request('post', collection, {
      path: selectedPath,
      body: { expectedProjectVersion: command.expectedProjectVersion, ...command.fields },
      key,
      signal: commandSignal,
    });
  return request('post', detail, {
    path: { ...selectedPath, sprintId: command.sprintId },
    body: { expectedVersion: command.expectedVersion, ...command.fields },
    key,
    signal: commandSignal,
  });
}
