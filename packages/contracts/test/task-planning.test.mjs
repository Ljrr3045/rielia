import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isSprint,
  isPlannedSprint,
  isSprintPage,
  isPlanningSnapshot,
  isTaskPlanning,
  isSprintScopePage,
  isPlanningHistoryPage,
  isSprintTransitionResult,
} from '../dist/index.js';
const at = '2026-11-19T00:00:00.000Z',
  person = { principalId: 'h', name: 'Human', kind: 'human', active: true },
  provenance = { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null };
const sprint = {
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  name: 'Sprint',
  goal: 'Goal',
  startDate: '2026-11-19',
  endDateExclusive: '2026-11-20',
  state: 'active',
  startedAt: at,
  version: 3,
  timeZone: 'UTC',
  startsAt: at,
  endsAt: '2026-11-20T00:00:00.000Z',
  createdAt: at,
  updatedAt: at,
  creator: person,
  provenance,
  capabilities: { canEdit: true, canStart: false, canChangeScope: true },
  url: '/sprints/s',
};
const snap = {
  version: 2,
  status: 'todo',
  estimatePoints: 0,
  parentTaskId: null,
  archivedAt: null,
};
const planning = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  taskRevision: 5,
  sprintRevision: 8,
  snapshot: snap,
  currentParticipation: { id: 'visit', sprint },
  capabilities: { canEstimate: true, canChangeScope: true },
};
const totals = {
  done: 0,
  canceled: 0,
  pending: 1,
  donePoints: 0,
  canceledPoints: 0,
  pendingPoints: 0,
  unestimated: 0,
  children: 0,
  archived: 0,
};
const visit = {
  id: 'visit',
  taskId: 't',
  enteredAt: at,
  enteredOrdinal: 2,
  entry: snap,
  exitedAt: null,
  exitedOrdinal: null,
  exitReason: null,
  exit: null,
  current: snap,
  start: snap,
};
const page = {
  workspaceId: 'w',
  projectId: 'p',
  taskRevision: 5,
  sprintRevision: 8,
  total: 1,
  nextCursor: null,
};
test('active Sprint is a genuine discriminant and survives list validation without becoming planned', () => {
  assert.ok(isSprint(sprint));
  assert.equal(isPlannedSprint(sprint), false);
  assert.ok(
    isSprintPage({
      ...page,
      revision: 8,
      projectVersion: 2,
      items: [sprint],
      capabilities: { canCreate: true },
    }),
  );
  for (const patch of [
    { startedAt: null },
    { startedAt: '2026-02-30T00:00:00.000Z' },
    { state: 'closed' },
    { state: 'planned' },
    { capabilities: { canEdit: true, canStart: 'yes' } },
  ])
    assert.equal(isSprint({ ...sprint, ...patch }), false);
});
test('snapshots preserve zero/null and reject unsafe, unknown or absent semantic fields', () => {
  assert.ok(isPlanningSnapshot(snap));
  assert.ok(isPlanningSnapshot({ ...snap, estimatePoints: null }));
  for (const value of [
    null,
    {},
    { ...snap, estimatePoints: 1001 },
    { ...snap, estimatePoints: -1 },
    { ...snap, estimatePoints: 1.5 },
    { ...snap, version: 0 },
    { ...snap, status: 'closed' },
    { ...snap, parentTaskId: '../x' },
    { ...snap, archivedAt: 'yesterday' },
    { ...snap, extra: 'text' },
  ])
    assert.equal(isPlanningSnapshot(value), false);
});
test('Task planning validates tenant linkage, capabilities and explicit absent participation', () => {
  assert.equal(isTaskPlanning(null), false);
  assert.ok(isTaskPlanning(planning));
  assert.ok(isTaskPlanning({ ...planning, currentParticipation: null }));
  for (const patch of [
    { taskId: '../bad' },
    { taskRevision: 0 },
    { sprintRevision: 0 },
    { snapshot: {} },
    { currentParticipation: {} },
    { currentParticipation: { id: 'visit', sprint: { ...sprint, projectId: 'foreign' } } },
    { capabilities: { canEstimate: true } },
  ])
    assert.equal(isTaskPlanning({ ...planning, ...patch }), false);
});
test('scope visits require complete one-time exit snapshots and bounded unique rows', () => {
  const value = {
    ...page,
    sprintId: 's',
    sprintVersion: 3,
    items: [visit],
    currentTotals: totals,
    startTotals: totals,
    removed: 0,
  };
  assert.ok(isSprintScopePage(value));
  assert.ok(
    isSprintScopePage({
      ...value,
      items: [{ ...visit, exitedAt: at, exitedOrdinal: 4, exitReason: 'transferred', exit: snap }],
    }),
  );
  for (const patch of [
    { items: [visit, visit], total: 2 },
    { items: Array.from({ length: 101 }, () => visit), total: 101 },
    { items: [{ ...visit, exitedAt: at }] },
    { items: [{ ...visit, exitedAt: at, exitedOrdinal: 1, exitReason: 'removed', exit: snap }] },
    { currentTotals: { ...totals, children: -1 } },
    { nextCursor: '../bad' },
    { total: 0 },
  ])
    assert.equal(isSprintScopePage({ ...value, ...patch }), false);
});
test('history validates safe snapshots and server provenance for each row', () => {
  const event = {
    id: 'e',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: 4,
    kind: 'task-change',
    action: 'edit-task',
    occurredAt: at,
    before: snap,
    after: { ...snap, status: 'done' },
    actor: person,
    provenance,
  };
  const value = { ...page, sprintId: 's', taskId: null, items: [event] };
  assert.ok(isPlanningHistoryPage(value));
  assert.ok(isPlanningHistoryPage({ ...value, sprintId: null, taskId: 't' }));
  for (const patch of [
    { sprintId: null },
    { taskId: 't' },
    { items: [{ ...event, actor: null }] },
    { items: [{ ...event, provenance: { ...provenance, actorPrincipalId: 'foreign' } }] },
    { items: [{ ...event, kind: 'raw' }] },
    { items: [event, event], total: 2 },
  ])
    assert.equal(isPlanningHistoryPage({ ...value, ...patch }), false);
  assert.ok(
    isPlanningHistoryPage({
      ...value,
      items: [
        {
          ...event,
          provenance: {
            actorPrincipalId: 'h',
            executionMode: 'delegated',
            source: 'mcp',
            grantId: 'grant',
          },
        },
      ],
    }),
  );
});
test('successful transition identity remains independent of freshly authorized current state', () => {
  const op = {
    activityId: 'a',
    type: 'set-task-sprint',
    sprintId: 's',
    enteredVisitId: 'visit',
    exitedVisitId: null,
  };
  assert.ok(
    isSprintTransitionResult({
      operation: op,
      current: { ...planning, currentParticipation: null },
    }),
  );
  assert.equal(
    isSprintTransitionResult({
      operation: { ...op, type: 'start-sprint', sprintId: null, enteredVisitId: null },
      current: sprint,
    }),
    false,
  );
  assert.ok(
    isSprintTransitionResult({
      operation: { ...op, enteredVisitId: null, exitedVisitId: 'old' },
      current: planning,
    }),
  );
  assert.ok(
    isSprintTransitionResult({
      operation: { ...op, type: 'start-sprint', enteredVisitId: null },
      current: sprint,
    }),
  );
  for (const value of [
    null,
    { operation: op, current: {} },
    { operation: { ...op, activityId: null }, current: planning },
    { operation: { ...op, type: 'close-sprint' }, current: sprint },
    { operation: { ...op, enteredVisitId: undefined }, current: planning },
  ])
    assert.equal(isSprintTransitionResult(value), false);
});
