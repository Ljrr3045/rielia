import type { components, operations, paths } from '../../packages/contracts/generated/openapi.js';
type Schemas = components['schemas'];
const quickTask: Schemas['createTaskInputSchema'] = { title: 'Capture' };
const zeroEstimate: Schemas['estimateTaskInputSchema'] = { expectedVersion: 1, estimatePoints: 0 };
const clearedEstimate: Schemas['estimateTaskInputSchema'] = {
  expectedVersion: 1,
  estimatePoints: null,
};
const participation: Schemas['setTaskSprintInputSchema'] = {
  expectedTaskVersion: 1,
  expectedCurrentParticipationId: null,
  expectedSourceVersion: null,
  targetSprintId: 'target',
  expectedTargetVersion: 1,
};
const closeBase = {
  expectedVersion: 1,
  expectedProjectVersion: 1,
  expectedTaskRevision: 1,
  expectedSprintRevision: 1,
  previewSchema: 1 as const,
  previewHash: '0'.repeat(64),
};
const unselected: Schemas['closeSprintInputSchema'] = {
  ...closeBase,
  destination: null,
  expectedTargetVersion: null,
};
const backlog: Schemas['closeSprintInputSchema'] = {
  ...closeBase,
  destination: 'backlog',
  expectedTargetVersion: null,
};
const carry: Schemas['closeSprintInputSchema'] = {
  ...closeBase,
  destination: 'target',
  expectedTargetVersion: 1,
};
// TS cannot express string except literal backlog; JSON Schema/runtime still reject this.
const knownStaticLimit: Schemas['closeSprintInputSchema'] = {
  ...closeBase,
  destination: 'backlog',
  expectedTargetVersion: 1,
};
// Omitted schema means UNMODELED BODY, never proof of an empty HTTP body.
const unmodeledContent: operations['H03']['responses']['503']['content'] = undefined;
// @ts-expect-error no invented endpoint
export type AbsentRoute = paths['/api/v1/exports'];
const wrongEstimate: Schemas['estimateTaskInputSchema'] = {
  expectedVersion: 1,
  // @ts-expect-error estimate is a number/null on the wire
  estimatePoints: '1',
};
// @ts-expect-error paired null/version binding is represented structurally
const wrongParticipation: Schemas['setTaskSprintInputSchema'] = {
  expectedTaskVersion: 1,
  expectedCurrentParticipationId: null,
  expectedSourceVersion: 1,
  targetSprintId: null,
  expectedTargetVersion: null,
};
// @ts-expect-error dates are strings, not internal Date objects
const wrongDate: Schemas['createTaskInputSchema'] = { title: 'Capture', dueDate: new Date() };
// @ts-expect-error unselected destination cannot carry a target version
const wrongUnselected: Schemas['closeSprintInputSchema'] = {
  ...closeBase,
  destination: null,
  expectedTargetVersion: 1,
};
void [
  quickTask,
  zeroEstimate,
  clearedEstimate,
  participation,
  unselected,
  backlog,
  carry,
  knownStaticLimit,
  unmodeledContent,
  wrongEstimate,
  wrongParticipation,
  wrongDate,
  wrongUnselected,
];
