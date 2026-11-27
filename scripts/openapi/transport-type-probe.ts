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
// @ts-expect-error N22 version scalar
void request('post', planning, {
  path,
  body: { expectedVersion: '1', ...settings },
  key: 'key',
  signal,
});
// @ts-expect-error N23 wrong version family
void request('post', collection, {
  path,
  body: { expectedVersion: 1, ...fields },
  key: 'key',
  signal,
});
// @ts-expect-error N24 Date object is not a wire date
void request('post', detail, {
  path: itemPath,
  body: { expectedVersion: 1, ...fields, startDate: new Date() },
  key: 'key',
  signal,
});
// @ts-expect-error N25 array item scalar
void request('post', planning, {
  path,
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
void request<'get' | 'post', typeof planning, RequestInput<'get', typeof planning>>(
  // @ts-expect-error N32 explicit generic union cannot escape the relation
  'get',
  planning,
  { path, signal },
);
// @ts-expect-error N33 signal is mandatory
void request('get', planning, { path });
// @ts-expect-error N34 write query not supported
void request('post', collection, {
  path,
  body: { expectedProjectVersion: 1, ...fields },
  key: 'key',
  signal,
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

// T38.3c: every released operation has a generated input witness.
// H02
void request('get', '/api/v1/identity/config', {});
// H03
void request('get', '/api/v1/identity/session', {});
// H05
void request('get', '/api/v1/workspaces/{workspaceId}/projects', {
  path: { workspaceId: 'workspaceId' },
  signal,
  query: { cursor: 'cursor' },
});
// H06
void request('post', '/api/v1/workspaces/{workspaceId}/projects', {
  path: { workspaceId: 'workspaceId' },
  body: { name: 'P', key: 'P' },
  key: 'key',
  signal,
});
// H07
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  signal,
});
// H08
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  body: { expectedVersion: 1, name: 'P', description: '' },
  key: 'key',
  signal,
});
// H09
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/archive', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  body: { expectedVersion: 1 },
  key: 'key',
  signal,
});
// H10
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/restore', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  body: { expectedVersion: 1 },
  key: 'key',
  signal,
});
// H11
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/visibility', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  body: { expectedVersion: 1, visibility: 'private' },
  key: 'key',
  signal,
});
// H12
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/access', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  signal,
  query: { cursor: 'cursor' },
});
// H13
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/access/{principalId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId', principalId: 'principalId' },
  body: { expectedVersion: 1, state: 'active' },
  key: 'key',
  signal,
});
// H14
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/access/{principalId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId', principalId: 'principalId' },
  signal,
});
// H15
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/assignees', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  signal,
  query: { cursor: 'cursor' },
});
// H16
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  signal,
  query: { cursor: 'cursor' },
});
// H17
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId' },
  body: { title: 'T' },
  key: 'key',
  signal,
});
// H18
void request('get', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
  signal,
});
// H19
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
  body: { expectedVersion: 1, title: 'T' },
  key: 'key',
  signal,
});
// H20
void request('post', '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/move', {
  path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
  body: { expectedVersion: 1, expectedOrderVersion: 1, status: 'todo', beforeTaskId: null },
  key: 'key',
  signal,
});
// H21
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/archive',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1 },
    key: 'key',
    signal,
  },
);
// H22
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/restore',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1 },
    key: 'key',
    signal,
  },
);
// H23
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/close-preview',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H25
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/closure',
  { path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' }, signal },
);
// H26
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/closure/outcomes',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H27
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/start',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' },
    body: { expectedVersion: 1, expectedProjectVersion: 1, expectedTaskRevision: 1 },
    key: 'key',
    signal,
  },
);
// H28
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/scope',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H29
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/history',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', sprintId: 'sprintId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H36
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/relations',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H37
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/parent-candidates',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H38
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H39
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H40
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/history',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H41
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments/{commentId}',
  {
    path: {
      workspaceId: 'workspaceId',
      projectId: 'projectId',
      taskId: 'taskId',
      commentId: 'commentId',
    },
    signal,
  },
);
// H42
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/parent',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1, parentTaskId: null },
    key: 'key',
    signal,
  },
);
// H43
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1, text: 'Item', beforeItemId: null },
    key: 'key',
    signal,
  },
);
// H44
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}',
  {
    path: {
      workspaceId: 'workspaceId',
      projectId: 'projectId',
      taskId: 'taskId',
      itemId: 'itemId',
    },
    body: { expectedVersion: 1, completed: false },
    key: 'key',
    signal,
  },
);
// H45
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}/move',
  {
    path: {
      workspaceId: 'workspaceId',
      projectId: 'projectId',
      taskId: 'taskId',
      itemId: 'itemId',
    },
    body: { expectedVersion: 1, beforeItemId: null },
    key: 'key',
    signal,
  },
);
// H46
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}/remove',
  {
    path: {
      workspaceId: 'workspaceId',
      projectId: 'projectId',
      taskId: 'taskId',
      itemId: 'itemId',
    },
    body: { expectedVersion: 1 },
    key: 'key',
    signal,
  },
);
// H47
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1, body: 'Comment' },
    key: 'key',
    signal,
  },
);
// H48
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments/{commentId}',
  {
    path: {
      workspaceId: 'workspaceId',
      projectId: 'projectId',
      taskId: 'taskId',
      commentId: 'commentId',
    },
    body: { expectedVersion: 1, expectedCommentVersion: 1, body: 'Comment' },
    key: 'key',
    signal,
  },
);
// H49
void request('get', '/api/v1/workspaces/{workspaceId}/task-discovery', {
  path: { workspaceId: 'workspaceId' },
  signal,
  query: { scope: 'search', q: 'x', view: 'active', project: 'p' },
});
// H51
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/planning',
  { path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' }, signal },
);
// H52
void request(
  'get',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/sprint-history',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    signal,
    query: { cursor: 'cursor' },
  },
);
// H53
void request(
  'post',
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/planning',
  {
    path: { workspaceId: 'workspaceId', projectId: 'projectId', taskId: 'taskId' },
    body: { expectedVersion: 1, estimatePoints: null },
    key: 'key',
    signal,
  },
);
// H56
void request('get', '/api/v1/workspaces', { signal, query: { cursor: 'cursor' } });
// H57
void request('post', '/api/v1/workspaces', { body: { name: 'W' }, key: 'key', signal });
// H58
void request('get', '/api/v1/workspaces/{workspaceId}', {
  path: { workspaceId: 'workspaceId' },
  signal,
});
// H59
void request('get', '/api/v1/workspaces/{workspaceId}/members', {
  path: { workspaceId: 'workspaceId' },
  signal,
  query: { cursor: 'cursor' },
});
// H60
void request('post', '/api/v1/workspaces/{workspaceId}/members/{principalId}', {
  path: { workspaceId: 'workspaceId', principalId: 'principalId' },
  body: { version: 1, role: 'viewer' },
  key: 'key',
  signal,
});
// H61
void request('get', '/api/v1/workspaces/{workspaceId}/invitations', {
  path: { workspaceId: 'workspaceId' },
  signal,
  query: { cursor: 'cursor' },
});
// H62
void request('post', '/api/v1/workspaces/{workspaceId}/invitations', {
  path: { workspaceId: 'workspaceId' },
  body: { recipientEmail: 'a@b.test', role: 'member' },
  key: 'key',
  signal,
});
// H63
void request('post', '/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke', {
  path: { workspaceId: 'workspaceId', invitationId: 'invitationId' },
  body: {},
  key: 'key',
  signal,
});
// H64
void request('post', '/api/v1/workspace-invitations/accept', {
  body: { token: 'token' },
  key: 'key',
  signal,
});
// H65
void request('post', '/api/v1/workspaces/{workspaceId}/agents', {
  path: { workspaceId: 'workspaceId' },
  body: { name: 'Agent', role: 'viewer', custodianPrincipalId: 'h' },
  key: 'key',
  signal,
});
// H66
void request('post', '/api/v1/workspaces/{workspaceId}/agents/{principalId}', {
  path: { workspaceId: 'workspaceId', principalId: 'principalId' },
  body: { version: 1, state: 'suspended' },
  key: 'key',
  signal,
});

const identityPath = '/api/v1/identity/config';
const membersPath = '/api/v1/workspaces/{workspaceId}/members';
const revokePath = '/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke';
const parentPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/parent';
const noPathExtra = { path: { workspaceId: 'w' }, signal };
// @ts-expect-error N40 no generated path on a no-path operation, including variables
void request('get', '/api/v1/workspaces', noPathExtra);
// @ts-expect-error N41 no invented empty path object
void request('get', identityPath, { path: {} });
const identitySignal = { signal };
// @ts-expect-error N42 identity retains its timeout-only profile
void request('get', identityPath, identitySignal);
const missingSignal = { path: { workspaceId: 'w' } };
// @ts-expect-error N43 domain reads still require caller cancellation
void request('get', membersPath, missingSignal);
// @ts-expect-error N44 GET-only route cannot accept POST with a read-shaped input
void request('post', membersPath, { path: { workspaceId: 'w' }, signal });
const revoke = { path: { workspaceId: 'w', invitationId: 'i' }, body: {}, key: 'key', signal };
void request('post', revokePath, revoke);
// @ts-expect-error N45 POST-only route cannot accept GET with a write-shaped variable
void request('get', revokePath, revoke);
const revokeExtra = { ...revoke, body: { actor: 'h' } };
// @ts-expect-error N46 even predeclared strict empty bodies reject fields
void request('post', revokePath, revokeExtra);
const revokeMissing = { path: revoke.path, key: 'key', signal };
// @ts-expect-error N47 strict empty body is required, not omitted
void request('post', revokePath, revokeMissing);
const emptyPathExtra = { ...revoke, path: { ...revoke.path, projectId: 'p' } };
// @ts-expect-error N48 exact variable selectors
void request('post', revokePath, emptyPathExtra);
const badQuery = { path: { workspaceId: 'w' }, query: { cursor: 'c', q: 'extra' }, signal };
// @ts-expect-error N49 exact variable query keys
void request('get', membersPath, badQuery);
const nullQuery = { path: { workspaceId: 'w' }, query: { cursor: null }, signal };
// @ts-expect-error N50 null is not an omitted cursor
void request('get', membersPath, nullQuery);
const acceptExtra = { body: { token: 'token', authorPrincipalId: 'h' }, key: 'key', signal };
// @ts-expect-error N51 exact variable no-path write bodies
void request('post', '/api/v1/workspace-invitations/accept', acceptExtra);
const taskSelectors = { workspaceId: 'w', projectId: 'p', taskId: 't' };
declare const parentBody:
  | { expectedVersion: number; parentTaskId: null }
  | { expectedVersion: number; parentTaskId: string; expectedParentVersion: number };
void request('post', parentPath, { path: taskSelectors, body: parentBody, key: 'key', signal });
const wrongParent = {
  path: taskSelectors,
  body: { expectedVersion: 1, parentTaskId: 3 },
  key: 'key',
  signal,
};
// @ts-expect-error N52 scalar admission inside generated body alternatives
void request('post', parentPath, wrongParent);
const extraParent = {
  path: taskSelectors,
  body: { expectedVersion: 1, parentTaskId: null, actor: 'h' },
  key: 'key',
  signal,
};
// @ts-expect-error N53 extra fields in a predeclared union body alternative
void request('post', parentPath, extraParent);
// Generated TS does not encode expectedParentVersion absence here; runtime still rejects this combination.
void request('post', parentPath, {
  path: taskSelectors,
  body: { expectedVersion: 1, parentTaskId: null, expectedParentVersion: 1 },
  key: 'key',
  signal,
});
const unknownWire = { ...revoke, headers: { Origin: 'https://evil.test' } };
// @ts-expect-error N54 no variable header-map escape on expanded paths
void request('post', revokePath, unknownWire);
// @ts-expect-error N55 H04 has no production browser consumer
void request('get', '/api/v1/workspaces/{workspaceId}/execution-context', {
  path: { workspaceId: 'w' },
  signal,
});
// @ts-expect-error N56 H50 retains its distinct stream adapter
void request('get', '/api/v1/workspaces/{workspaceId}/events', {
  path: { workspaceId: 'w' },
  signal,
});
// @ts-expect-error N57 H55 is infrastructure-only
void request('get', '/api/v1/readiness', { signal });
// T38.3d: request unions retain both captured command pairs.
const closePath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/close';
const participationPath =
  '/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/sprint';
type CloseBody = RequestInput<'post', typeof closePath>['body'];
type ParticipationBody = RequestInput<'post', typeof participationPath>['body'];
const binding = {
  expectedVersion: 1,
  expectedProjectVersion: 2,
  expectedTaskRevision: 3,
  expectedSprintRevision: 4,
  previewSchema: 1,
  previewHash: 'a'.repeat(64),
} satisfies Omit<CloseBody, 'destination' | 'expectedTargetVersion'>;
void request('post', closePath, {
  path: itemPath,
  body: { ...binding, destination: null, expectedTargetVersion: null },
  key: 'key',
  signal,
});
void request('post', closePath, {
  path: itemPath,
  body: { ...binding, destination: 'backlog', expectedTargetVersion: null },
  key: 'key',
  signal,
});
void request('post', closePath, {
  path: itemPath,
  body: { ...binding, destination: 'target', expectedTargetVersion: 2 },
  key: 'key',
  signal,
});
const invalidClose = {
  path: itemPath,
  body: { ...binding, destination: 'target', expectedTargetVersion: null },
  key: 'key',
  signal,
};
// @ts-expect-error N58 target identifier with null target version
void request('post', closePath, invalidClose);
const invalidSource = {
  path: taskSelectors,
  body: {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: null,
    targetSprintId: null,
    expectedTargetVersion: null,
  },
  key: 'key',
  signal,
};
// @ts-expect-error N59 participation identifier with null source version
void request('post', participationPath, invalidSource);
for (const body of [
  {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: null,
    expectedSourceVersion: null,
    targetSprintId: null,
    expectedTargetVersion: null,
  },
  {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: null,
    expectedSourceVersion: null,
    targetSprintId: 'target',
    expectedTargetVersion: 2,
  },
  {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: 2,
    targetSprintId: null,
    expectedTargetVersion: null,
  },
  {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: 2,
    targetSprintId: 'target',
    expectedTargetVersion: 3,
  },
] satisfies ParticipationBody[]) {
  void request('post', participationPath, { path: taskSelectors, body, key: 'key', signal });
}
import type { CloseSprintInput, SetTaskSprintInput } from '@rielia/contracts';
import {
  closeInput,
  type SprintClientCommand,
  type SprintClientState,
} from '../../apps/web/src/lib/sprint-client-state.js';
declare const broadClose: CloseSprintInput;
// @ts-expect-error N60 independent nullable close fields are not a correlated command
void request('post', closePath, { path: itemPath, body: broadClose, key: 'key', signal });
declare const broadParticipation: SetTaskSprintInput;
// @ts-expect-error N61 independent nullable source/target fields are not a correlated command
void request('post', participationPath, {
  path: taskSelectors,
  body: broadParticipation,
  key: 'key',
  signal,
});
const nullSourceVersion = {
  ...invalidSource,
  body: { ...invalidSource.body, expectedCurrentParticipationId: null, expectedSourceVersion: 2 },
};
// @ts-expect-error N62 null participation with a source version
void request('post', participationPath, nullSourceVersion);
const nullTargetVersion = {
  ...invalidSource,
  body: { ...invalidSource.body, expectedSourceVersion: 1, targetSprintId: 'target' },
};
// @ts-expect-error N63 target identifier with null target version
void request('post', participationPath, nullTargetVersion);
const orphanTargetVersion = {
  ...nullTargetVersion,
  body: { ...nullTargetVersion.body, targetSprintId: null, expectedTargetVersion: 1 },
};
// @ts-expect-error N64 null target with a target version
void request('post', participationPath, orphanTargetVersion);
const extraClose = {
  ...invalidClose,
  body: { ...binding, destination: null, expectedTargetVersion: null, actor: 'forged' },
};
// @ts-expect-error N65 exact predeclared correlated close body
void request('post', closePath, extraClose);
const extraParticipation = {
  ...invalidSource,
  body: { ...invalidSource.body, expectedSourceVersion: 1, actor: 'forged' },
};
// @ts-expect-error N66 exact predeclared correlated participation body
void request('post', participationPath, extraParticipation);
const orphanClose = {
  ...invalidClose,
  body: { ...binding, destination: null, expectedTargetVersion: 1 },
};
// @ts-expect-error N67 null close destination with target version
void request('post', closePath, orphanClose);
declare const immutableClose: CloseBody;
declare const immutableParticipation: ParticipationBody;
// @ts-expect-error N68 command binding remains readonly
immutableClose.previewHash = 'changed';
// @ts-expect-error N69 captured source concurrency remains readonly
immutableParticipation.expectedSourceVersion = 10;
// Static limitation: generated string cannot exclude reserved backlog. Runtime G07 rejects this pair.
void request('post', closePath, {
  path: itemPath,
  body: { ...binding, destination: 'backlog', expectedTargetVersion: 1 },
  key: 'key',
  signal,
});
export type ExactCloseInput = Check<
  Equal<Extract<SprintClientCommand, { type: 'close-sprint' }>['input'], CloseBody>
>;
export type ExactParticipationInput = Check<
  Equal<Extract<SprintClientCommand, { type: 'set-task-sprint' }>['input'], ParticipationBody>
>;
export function sendCorrelatedCommand(command: SprintClientCommand): Promise<Response> | null {
  const selectors = { workspaceId: command.workspaceId, projectId: command.projectId };
  if (command.type === 'close-sprint')
    return request('post', closePath, {
      path: { ...selectors, sprintId: command.sprintId },
      body: command.input,
      key: 'key',
      signal,
    });
  if (command.type === 'set-task-sprint')
    return request('post', participationPath, {
      path: { ...selectors, taskId: command.taskId },
      body: command.input,
      key: 'key',
      signal,
    });
  return null;
}
export function admittedPreviewProjection(state: SprintClientState) {
  const preview = state.resources.preview.data;
  if (preview)
    void request('post', closePath, {
      path: itemPath,
      body: closeInput(preview),
      key: 'key',
      signal,
    });
}
