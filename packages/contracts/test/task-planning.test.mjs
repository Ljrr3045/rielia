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
  planningSnapshotSchema,
  planningHistoryItemSchema,
  sprintScopePageSchema,
  estimateTaskInputSchema,
  startSprintInputSchema,
  setTaskSprintInputSchema,
  planningEmptyHttpQuerySchema,
  planningPageHttpQuerySchema,
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
  after: snap,
  actor: person,
  provenance,
};
const scopePage = () => ({
  ...page,
  sprintId: 's',
  sprintVersion: 3,
  items: [{ ...visit }],
  currentTotals: { ...totals },
  startTotals: { ...totals },
  removed: 0,
});
const historyPage = (item = event) => ({ ...page, sprintId: 's', taskId: null, items: [item] });

test('planning schemas retain snapshot key cardinality and ignore extra getters on original response objects', () => {
  let reads = 0;
  for (const hidden of [false, true]) {
    const value = hidden
      ? { ...snap }
      : Object.assign(Object.create({ version: snap.version }), snap);
    if (hidden) Object.defineProperty(value, 'version', { enumerable: false });
    else delete value.version;
    Object.defineProperty(value, 'ignored', {
      enumerable: true,
      get() {
        reads++;
        throw new Error('ignored snapshot getter');
      },
    });
    assert.ok(isPlanningSnapshot(value));
    assert.deepEqual(planningSnapshotSchema.parse(value), snap);
    assert.equal(reads, 0);
    assert.ok('ignored' in value);
  }
  const value = Object.assign(Object.create(null), snap);
  value[Symbol('ignored')] = 1;
  Object.defineProperty(value, 'hiddenExtra', {
    get() {
      reads++;
      throw new Error('hidden');
    },
  });
  assert.ok(isPlanningSnapshot(value));
  const response = scopePage();
  for (const object of [response, response.currentTotals, response.items[0]])
    Object.defineProperty(object, 'ignored', {
      enumerable: true,
      get() {
        reads++;
        throw new Error('ignored');
      },
    });
  assert.ok(isSprintScopePage(response));
  assert.equal(reads, 0);
});

test('non-outcome compatibility slots remain unread and optional undefined remains admitted without changing parse data', () => {
  const original = {
    ...event,
    disposition: [],
    targetSprintId: 7,
    targetParticipationId: undefined,
  };
  Object.defineProperty(original, 'closureId', {
    enumerable: true,
    get() {
      throw new Error('ignored outcome slot');
    },
  });
  assert.ok(isPlanningHistoryPage(historyPage(original)));
  const parsed = planningHistoryItemSchema.parse(original);
  for (const key of ['closureId', 'disposition', 'targetSprintId', 'targetParticipationId'])
    assert.equal(key in parsed, false);
  const scope = { ...scopePage(), transferred: undefined, closingTotals: undefined };
  assert.ok(isSprintScopePage(scope));
  assert.equal(sprintScopePageSchema.parse(scope).transferred, undefined);
  for (const closingTotals of [null, totals])
    assert.ok(isSprintScopePage({ ...scope, transferred: 0, closingTotals }));
});

test('approved primitive scalar correction rejects JSON arrays, coercible objects and former conversion exceptions', () => {
  const substitutes = (value) => [
    [value],
    new String(value),
    { toString: () => value },
    Object.create(null),
    { toString: 'invalid' },
  ];
  for (const action of substitutes('edit-task'))
    assert.equal(isPlanningHistoryPage(historyPage({ ...event, action })), false);
  for (const executionMode of substitutes('delegated'))
    assert.equal(
      isPlanningHistoryPage(
        historyPage({
          ...event,
          provenance: { ...provenance, executionMode, source: 'mcp', grantId: 'grant' },
        }),
      ),
      false,
    );
  for (const exitReason of substitutes('removed'))
    assert.equal(
      isSprintScopePage({
        ...scopePage(),
        items: [{ ...visit, exitedAt: at, exitedOrdinal: 4, exitReason, exit: snap }],
      }),
      false,
    );
  for (const scalar of ['start-sprint', 'set-task-sprint'])
    for (const type of substitutes(scalar))
      assert.equal(
        isSprintTransitionResult({
          operation: {
            activityId: 'a',
            type,
            sprintId: 's',
            enteredVisitId: 'visit',
            exitedVisitId: null,
          },
          current: planning,
        }),
        false,
      );
  assert.ok(
    isPlanningHistoryPage(
      historyPage({
        ...event,
        actor: { ...person, kind: 'agent' },
        provenance: { ...provenance, executionMode: 'autonomous', source: 'mcp', grantId: 'grant' },
      }),
    ),
  );
  assert.equal(
    isPlanningHistoryPage(historyPage({ ...event, actor: { ...person, kind: 'system' } })),
    false,
  );
});

test('public scope/history reject holes but retain populated inherited indices and ignore array extras', () => {
  for (const [base, item, guard] of [
    [scopePage(), visit, isSprintScopePage],
    [historyPage(), event, isPlanningHistoryPage],
  ]) {
    assert.equal(guard({ ...base, items: new Array(1) }), false);
    const items = new Array(1);
    Object.setPrototypeOf(items, Object.assign(Object.create(Array.prototype), { 0: item }));
    Object.defineProperty(items, 'ignored', {
      enumerable: true,
      get() {
        throw new Error('ignored array getter');
      },
    });
    assert.ok(guard({ ...base, items }));
  }
});

test('shared planning request schemas preserve explicit estimate, source/target binding and strict server-authored boundaries', () => {
  const start = { expectedVersion: 1, expectedProjectVersion: 2, expectedTaskRevision: 3 };
  const set = {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: null,
    expectedSourceVersion: null,
    targetSprintId: 's',
    expectedTargetVersion: 2,
  };
  for (const estimatePoints of [null, 0, 1000])
    assert.ok(estimateTaskInputSchema.safeParse({ expectedVersion: 1, estimatePoints }).success);
  for (const estimatePoints of [undefined, '0', -1, 1001, 0.5])
    assert.equal(
      estimateTaskInputSchema.safeParse({ expectedVersion: 1, estimatePoints }).success,
      false,
    );
  assert.ok(startSprintInputSchema.safeParse(start).success);
  assert.ok(setTaskSprintInputSchema.safeParse(set).success);
  for (const [schema, body] of [
    [startSprintInputSchema, start],
    [setTaskSprintInputSchema, set],
    [estimateTaskInputSchema, { expectedVersion: 1, estimatePoints: null }],
  ])
    assert.equal(schema.safeParse({ ...body, actorPrincipalId: 'forged' }).success, false);
  for (const patch of [
    { expectedSourceVersion: 1 },
    { targetSprintId: null },
    { expectedTargetVersion: null },
  ])
    assert.equal(setTaskSprintInputSchema.safeParse({ ...set, ...patch }).success, false);
});
test('planning query schemas retain strict own keys and typed inherited HTTP observations', () => {
  for (const schema of [planningEmptyHttpQuerySchema, planningPageHttpQuerySchema]) {
    assert.ok(schema.safeParse({}).success);
    assert.ok(schema.safeParse(() => {}).success);
    for (const value of [null, 0, 'cursor', { extra: 'x' }])
      assert.equal(schema.safeParse(value).success, false);
    for (const [key, values] of [
      ['view', ['active', 'archived']],
      ['cursor', ['cursor']],
      ['destination', ['target']],
      ['status', ['todo']],
      ['assignee', ['person']],
      ['priority', ['high']],
    ]) {
      for (const value of values)
        assert.ok(schema.safeParse(Object.create({ [key]: value })).success);
      assert.equal(schema.safeParse(Object.create({ [key]: [] })).success, false);
    }
    assert.throws(() => schema.safeParse(Object.create({ view: Object.create(null) })), TypeError);
  }
  assert.equal(planningEmptyHttpQuerySchema.safeParse({ cursor: 'a' }).success, false);
  assert.ok(
    planningEmptyHttpQuerySchema.safeParse(Object.create({ cursor: 'a'.repeat(128) })).success,
  );
  assert.equal(
    planningEmptyHttpQuerySchema.safeParse(Object.create({ cursor: 'a'.repeat(129) })).success,
    false,
  );
  for (const cursor of ['a', 'a'.repeat(2048), undefined])
    assert.ok(planningPageHttpQuerySchema.safeParse({ cursor }).success);
  for (const cursor of [null, '', '!', 'a'.repeat(2049), ['a']])
    assert.equal(planningPageHttpQuerySchema.safeParse({ cursor }).success, false);
});
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
  assert.equal(
    isSprintTransitionResult({
      operation: { ...op, type: 'start-sprint', enteredVisitId: null },
      current: planning,
    }),
    false,
  );
  assert.equal(isSprintTransitionResult({ operation: op, current: sprint }), false);
  for (const value of [
    null,
    { operation: op, current: {} },
    { operation: { ...op, activityId: null }, current: planning },
    { operation: { ...op, type: 'close-sprint' }, current: sprint },
    { operation: { ...op, enteredVisitId: undefined }, current: planning },
  ])
    assert.equal(isSprintTransitionResult(value), false);
});
