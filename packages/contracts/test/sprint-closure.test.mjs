import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isSprint,
  isPlannedSprint,
  isSprintTransitionResult,
  isSprintClosePreview,
  isCloseSprintInput,
  isSprintClosure,
  isSprintClosingOutcomePage,
  isSprintCloseResult,
  isSprintScopePage,
  isPlanningHistoryPage,
  closeSprintInputSchema,
  closeSprintBindingSchema,
  sprintClosePreviewSchema,
  sprintClosureSchema,
  sprintClosingOutcomePageSchema,
  sprintCloseResultSchema,
  sprintClosePreviewHttpQuerySchema,
} from '../dist/index.js';
const at = '2026-11-19T00:00:00.000Z';
const snapshot = {
  version: 1,
  status: 'todo',
  estimatePoints: null,
  parentTaskId: null,
  archivedAt: null,
};
const totals = {
  done: 0,
  canceled: 0,
  pending: 1,
  donePoints: 0,
  canceledPoints: 0,
  pendingPoints: 0,
  unestimated: 1,
  children: 0,
  archived: 0,
};
const input = {
  expectedVersion: 3,
  expectedProjectVersion: 2,
  expectedTaskRevision: 4,
  expectedSprintRevision: 8,
  expectedTargetVersion: null,
  destination: 'backlog',
  previewSchema: 1,
  previewHash: 'a'.repeat(64),
};
const item = { participationId: 'visit', taskId: 't', snapshot, disposition: 'backlog' };
const preview = {
  ...input,
  workspaceId: 'w',
  projectId: 'p',
  sprintId: 's',
  total: 1,
  pendingParticipants: 1,
  totals,
  items: [item],
  nextCursor: null,
  canClose: true,
};
const closure = {
  id: 'closure',
  workspaceId: 'w',
  projectId: 'p',
  sprintId: 's',
  destination: 'backlog',
  sourceOrdinal: 4,
  targetOrdinal: null,
  closedAt: at,
  previewSchema: 1,
  previewHash: input.previewHash,
  activityId: 'activity',
  total: 1,
  pendingParticipants: 1,
  totals,
};
const outcome = {
  ...item,
  id: 'visit',
  closureId: 'closure',
  targetSprintId: null,
  targetParticipationId: null,
};
const page = {
  workspaceId: 'w',
  projectId: 'p',
  sprintId: 's',
  closureId: 'closure',
  total: 1,
  items: [outcome],
  nextCursor: null,
};
const sprint = {
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  name: 'Sprint',
  goal: 'Goal',
  startDate: '2026-11-19',
  endDateExclusive: '2026-11-20',
  state: 'closed',
  startedAt: at,
  closedAt: at,
  version: 4,
  timeZone: 'UTC',
  startsAt: at,
  endsAt: '2026-11-20T00:00:00.000Z',
  createdAt: at,
  updatedAt: at,
  creator: { principalId: 'h', name: 'Human', kind: 'human', active: true },
  provenance: { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: false, canStart: false, canChangeScope: false, canClose: false },
  url: '/sprints/s',
};
test('closed is a real immutable discriminant and original start identity survives closure', () => {
  assert.ok(isSprint(sprint));
  assert.equal(isPlannedSprint(sprint), false);
  assert.ok(
    isSprintTransitionResult({
      operation: {
        type: 'start-sprint',
        sprintId: 's',
        activityId: 'original',
        enteredVisitId: null,
        exitedVisitId: null,
      },
      current: sprint,
    }),
  );
  for (const patch of [
    { closedAt: null },
    { closedAt: '2026-02-30T00:00:00.000Z' },
    { closedAt: '0000-01-01T00:00:00.000Z' },
    { closedAt: '2026-11-18T00:00:00.000Z' },
    { startedAt: null },
    { state: 'active' },
    { state: 'planned' },
    ...['canEdit', 'canStart', 'canChangeScope', 'canClose'].map((k) => ({
      capabilities: { ...sprint.capabilities, [k]: true },
    })),
    { capabilities: { ...sprint.capabilities, canClose: 'yes' } },
  ])
    assert.equal(isSprint({ ...sprint, ...patch }), false, JSON.stringify(patch));
});
test('close input requires versioned SHA binding and explicit destination/version agreement', () => {
  assert.ok(isCloseSprintInput(input));
  assert.ok(isCloseSprintInput({ ...input, destination: null }));
  assert.ok(isCloseSprintInput({ ...input, destination: 'target', expectedTargetVersion: 2 }));
  for (const value of [
    null,
    {},
    ...Object.keys(input).map((k) => ({ ...input, [k]: undefined })),
    ...[
      'expectedVersion',
      'expectedProjectVersion',
      'expectedTaskRevision',
      'expectedSprintRevision',
    ].map((k) => ({ ...input, [k]: 0 })),
    { ...input, expectedTargetVersion: 2 },
    { ...input, destination: 'target' },
    { ...input, destination: '../bad' },
    { ...input, previewSchema: 2 },
    { ...input, previewHash: 'BAD' },
  ])
    assert.equal(isCloseSprintInput(value), false);
});
test('preview validates full totals, child-only pending, null destination, bounded unique consequences and status dispositions', () => {
  assert.ok(isSprintClosePreview(preview));
  assert.ok(
    isSprintClosePreview({
      ...preview,
      destination: null,
      canClose: false,
      items: [{ ...item, disposition: 'pending' }],
    }),
  );
  assert.ok(
    isSprintClosePreview({
      ...preview,
      destination: null,
      pendingParticipants: 0,
      canClose: true,
      items: [],
    }),
  );
  assert.ok(
    isSprintClosePreview({
      ...preview,
      destination: 'target',
      expectedTargetVersion: 2,
      items: [{ ...item, disposition: 'carried' }],
    }),
  );
  for (const status of ['done', 'canceled'])
    assert.ok(
      isSprintClosePreview({
        ...preview,
        pendingParticipants: 0,
        destination: null,
        items: [{ ...item, snapshot: { ...snapshot, status }, disposition: status }],
      }),
    );
  for (const patch of [
    { workspaceId: '../bad' },
    { projectId: null },
    { sprintId: null },
    { total: -1 },
    { pendingParticipants: -1 },
    { pendingParticipants: 2 },
    { totals: null },
    { items: null },
    { items: [item, item], total: 2 },
    { items: Array.from({ length: 101 }, () => item), total: 101 },
    { items: [null] },
    { items: [{ ...item, participationId: null }] },
    { items: [{ ...item, taskId: null }] },
    { items: [{ ...item, snapshot: {} }] },
    { items: [{ ...item, disposition: 'pending' }] },
    { items: [{ ...item, snapshot: { ...snapshot, status: 'done' } }] },
    { items: [{ ...item, snapshot: { ...snapshot, status: 'canceled' } }] },
    { canClose: 'yes' },
    { canClose: false },
    { nextCursor: '../bad' },
  ])
    assert.equal(isSprintClosePreview({ ...preview, ...patch }), false, JSON.stringify(patch));
  assert.equal(isSprintClosePreview(null), false);
  assert.ok(isSprintClosePreview({ ...preview, nextCursor: 'cursor' }));
});
test('immutable closure summary rejects malformed scope, ordinal, date, destination and totals', () => {
  assert.ok(isSprintClosure(closure));
  assert.ok(isSprintClosure({ ...closure, destination: 'target', targetOrdinal: 2 }));
  assert.ok(isSprintClosure({ ...closure, destination: null, pendingParticipants: 0 }));
  for (const patch of [
    { id: null },
    { workspaceId: null },
    { projectId: null },
    { sprintId: null },
    { destination: '../bad' },
    { sourceOrdinal: 0 },
    { targetOrdinal: 1 },
    { destination: 'target' },
    { closedAt: null },
    { closedAt: 'bad' },
    { closedAt: '0000-01-01T00:00:00.000Z' },
    { closedAt: '2026-02-30T00:00:00.000Z' },
    { previewSchema: 2 },
    { previewHash: 'bad' },
    { activityId: null },
    { total: -1 },
    { pendingParticipants: -1 },
    { pendingParticipants: 2 },
    { destination: null },
    { totals: {} },
  ])
    assert.equal(isSprintClosure({ ...closure, ...patch }), false, JSON.stringify(patch));
  assert.equal(isSprintClosure(null), false);
});
test('outcome pages preserve separate frozen result and destination links', () => {
  assert.ok(isSprintClosingOutcomePage(page));
  assert.ok(
    isSprintClosingOutcomePage({
      ...page,
      items: [
        {
          ...outcome,
          disposition: 'carried',
          targetSprintId: 'target',
          targetParticipationId: 'new',
        },
      ],
    }),
  );
  for (const status of ['done', 'canceled'])
    assert.ok(
      isSprintClosingOutcomePage({
        ...page,
        items: [{ ...outcome, snapshot: { ...snapshot, status }, disposition: status }],
      }),
    );
  for (const patch of [
    { workspaceId: null },
    { closureId: null },
    { total: -1 },
    { total: 0 },
    { items: null },
    { items: [outcome, outcome], total: 2 },
    { items: Array.from({ length: 101 }, () => outcome), total: 101 },
    { items: [null] },
    ...['id', 'closureId', 'participationId', 'taskId', 'snapshot'].map((k) => ({
      items: [{ ...outcome, [k]: null }],
    })),
    { items: [{ ...outcome, disposition: 'pending' }] },
    { items: [{ ...outcome, targetSprintId: 'target' }] },
    { items: [{ ...outcome, targetParticipationId: 'new' }] },
    ...[
      { targetSprintId: null, targetParticipationId: 'new' },
      { targetSprintId: 's', targetParticipationId: 'new' },
      { targetSprintId: 'target', targetParticipationId: null },
    ].map((x) => ({ items: [{ ...outcome, disposition: 'carried', ...x }] })),
    { nextCursor: '!' },
  ])
    assert.equal(isSprintClosingOutcomePage({ ...page, ...patch }), false, JSON.stringify(patch));
  assert.equal(isSprintClosingOutcomePage(null), false);
  assert.ok(isSprintClosingOutcomePage({ ...page, nextCursor: 'cursor' }));
});
test('close result binds immutable operation/closure and true current closed state', () => {
  const result = {
    operation: {
      type: 'close-sprint',
      activityId: 'activity',
      closureId: 'closure',
      sprintId: 's',
    },
    closure,
    current: sprint,
  };
  assert.ok(isSprintCloseResult(result));
  for (const value of [
    null,
    {},
    ...['operation', 'closure', 'current'].map((k) => ({ ...result, [k]: null })),
    ...['type', 'activityId', 'closureId', 'sprintId'].map((k) => ({
      ...result,
      operation: { ...result.operation, [k]: 'foreign' },
    })),
    ...['id', 'workspaceId', 'projectId', 'version', 'closedAt'].map((k) => ({
      ...result,
      current: { ...sprint, [k]: k === 'version' ? 99 : 'foreign' },
    })),
    { ...result, current: { ...sprint, state: 'active', closedAt: undefined } },
  ])
    assert.equal(isSprintCloseResult(value), false);
});
test('closed scope summary and safe outcome history retain frozen values', () => {
  const shared = {
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    taskRevision: 4,
    sprintRevision: 8,
    total: 0,
    nextCursor: null,
    items: [],
  };
  const scope = {
    ...shared,
    sprintVersion: 4,
    currentTotals: totals,
    startTotals: totals,
    closingTotals: totals,
    removed: 0,
    transferred: 2,
  };
  assert.ok(isSprintScopePage(scope));
  assert.equal(isSprintScopePage({ ...scope, closingTotals: {} }), false);
  assert.equal(isSprintScopePage({ ...scope, transferred: -1 }), false);
  const event = {
    id: 'visit',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: 4,
    kind: 'outcome',
    action: 'close-sprint',
    occurredAt: at,
    before: snapshot,
    after: snapshot,
    actor: sprint.creator,
    provenance: sprint.provenance,
    closureId: 'closure',
    disposition: 'backlog',
    targetSprintId: null,
    targetParticipationId: null,
  };
  const history = { ...shared, taskId: null, total: 1, items: [event] };
  assert.ok(isPlanningHistoryPage(history));
  for (const k of ['closureId', 'disposition', 'targetSprintId', 'targetParticipationId'])
    assert.equal(
      isPlanningHistoryPage({ ...history, items: [{ ...event, [k]: '../bad' }] }),
      false,
    );
});
test('outcome disposition must be a scalar even when an array or object stringifies to an allowed value', () => {
  for (const value of [
    ['pending'],
    ['backlog'],
    ['carried'],
    { toString: () => 'backlog' },
    Object.create(null),
  ]) {
    assert.equal(
      isSprintClosingOutcomePage({ ...page, items: [{ ...outcome, disposition: value }] }),
      false,
    );
    assert.equal(
      isSprintClosePreview({ ...preview, items: [{ ...item, disposition: value }] }),
      false,
    );
  }
});
test('history preserves valid historical shapes and enforces scalar outcome kinds, dispositions and paired targets', () => {
  const event = {
    id: 'event',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: 4,
    kind: 'outcome',
    action: 'close-sprint',
    occurredAt: at,
    before: snapshot,
    after: snapshot,
    actor: sprint.creator,
    provenance: sprint.provenance,
    closureId: 'closure',
    disposition: 'backlog',
    targetSprintId: null,
    targetParticipationId: null,
  };
  const history = (item) => ({
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    taskId: null,
    taskRevision: 4,
    sprintRevision: 8,
    total: 1,
    nextCursor: null,
    items: [item],
  });
  for (const kind of [
    'entry',
    'exit',
    'task-change',
    'metadata',
    'start',
    'estimate',
    'close',
    'carryover',
  ]) {
    const legacy = { ...event };
    for (const key of ['closureId', 'disposition', 'targetSprintId', 'targetParticipationId'])
      delete legacy[key];
    assert.ok(isPlanningHistoryPage(history({ ...legacy, kind, before: null, after: null })));
  }
  for (const disposition of ['done', 'canceled', 'backlog']) {
    assert.ok(isPlanningHistoryPage(history({ ...event, disposition })));
    for (const targets of [
      { targetSprintId: 'dest' },
      { targetParticipationId: 'next' },
      { targetSprintId: 'dest', targetParticipationId: 'next' },
    ])
      assert.equal(isPlanningHistoryPage(history({ ...event, disposition, ...targets })), false);
  }
  assert.ok(
    isPlanningHistoryPage(
      history({
        ...event,
        disposition: 'carried',
        targetSprintId: 'dest',
        targetParticipationId: 'next',
      }),
    ),
  );
  for (const targets of [
    { targetSprintId: null, targetParticipationId: null },
    { targetSprintId: 'dest', targetParticipationId: null },
    { targetSprintId: null, targetParticipationId: 'next' },
  ])
    assert.equal(
      isPlanningHistoryPage(history({ ...event, disposition: 'carried', ...targets })),
      false,
    );
  for (const value of [['outcome'], ['entry'], { toString: () => 'outcome' }, Object.create(null)])
    assert.equal(
      isPlanningHistoryPage(history({ ...event, kind: value, closureId: undefined })),
      false,
    );
  for (const value of [
    ['backlog'],
    ['carried'],
    { toString: () => 'backlog' },
    Object.create(null),
  ])
    assert.equal(isPlanningHistoryPage(history({ ...event, disposition: value })), false);
});

test('close binding remains tolerant while the HTTP body requires exactly eight explicit fields', () => {
  const extra = { ...input, ignored: true };
  assert.ok(isCloseSprintInput(extra));
  assert.equal(closeSprintInputSchema.safeParse(extra).success, false);
  assert.deepEqual(closeSprintBindingSchema.parse(extra), input);
  assert.deepEqual(closeSprintInputSchema.parse(input), input);
  for (const field of Object.keys(input)) {
    const missing = { ...input };
    delete missing[field];
    assert.equal(closeSprintInputSchema.safeParse(missing).success, false, field);
  }
  for (const value of [NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', [1]])
    assert.equal(isCloseSprintInput({ ...input, expectedVersion: value }), false);
  assert.ok(isCloseSprintInput({ ...input, expectedVersion: Number.MAX_SAFE_INTEGER }));
});

test('closure arrays reject holes and explicit missing items while retaining inherited populated indices', () => {
  for (const [guard, value, row] of [
    [isSprintClosePreview, preview, item],
    [isSprintClosingOutcomePage, page, outcome],
  ]) {
    const mixed = Array(2);
    mixed[1] = row;
    for (const items of [Array(1), [undefined], [null], mixed])
      assert.equal(guard({ ...value, total: 2, items }), false);
    const items = Array(1);
    Object.setPrototypeOf(items, Object.assign(Object.create(Array.prototype), { 0: row }));
    assert.ok(guard({ ...value, items }));
  }
});

test('validation copies ignore extra getters and guards retain original descriptors and nested snapshot admission', () => {
  const closeResult = {
    operation: {
      type: 'close-sprint',
      activityId: 'activity',
      closureId: 'closure',
      sprintId: 's',
    },
    closure,
    current: sprint,
  };
  for (const [guard, schema, original] of [
    [isCloseSprintInput, closeSprintBindingSchema, input],
    [isSprintClosePreview, sprintClosePreviewSchema, preview],
    [isSprintClosure, sprintClosureSchema, closure],
    [isSprintClosingOutcomePage, sprintClosingOutcomePageSchema, page],
    [isSprintCloseResult, sprintCloseResultSchema, closeResult],
  ]) {
    const value = Object.defineProperty({ ...original }, 'ignored', {
      enumerable: true,
      get() {
        throw new Error('ignored getter was read');
      },
    });
    assert.ok(guard(value));
    const parsed = schema.parse(value);
    assert.equal('ignored' in parsed, false);
    assert.notEqual(parsed, value);
    assert.equal(typeof Object.getOwnPropertyDescriptor(value, 'ignored').get, 'function');
    assert.ok(guard(Object.create(original)));
  }
  const inheritedSnapshot = Object.create({ status: 'todo' });
  Object.assign(inheritedSnapshot, { ...snapshot, unrelated: true });
  delete inheritedSnapshot.status;
  assert.equal(Object.keys(inheritedSnapshot).length, 5);
  assert.ok(
    isSprintClosePreview({ ...preview, items: [{ ...item, snapshot: inheritedSnapshot }] }),
  );
  assert.equal(
    isSprintClosePreview({ ...preview, items: [{ ...item, snapshot: { ...snapshot, extra: 1 } }] }),
    false,
  );
});

test('close preview HTTP admission preserves scalar bounds and inherited known query reads', () => {
  for (const value of [null, undefined, false, 42, 'cursor'])
    assert.equal(sprintClosePreviewHttpQuerySchema.safeParse(value).success, false);
  // The existing raw HTTP query admission permits an empty callable object.
  assert.ok(sprintClosePreviewHttpQuerySchema.safeParse(() => {}).success);
  for (const value of [
    {},
    { destination: 'backlog' },
    { destination: 'null', cursor: 'a'.repeat(2048) },
  ])
    assert.ok(sprintClosePreviewHttpQuerySchema.safeParse(value).success);
  for (const query of [
    { view: 'active' },
    { destination: null },
    { destination: '' },
    { destination: ['backlog'] },
    { cursor: ['a'] },
    { cursor: 'a'.repeat(2049) },
    { actor: 'forged' },
  ])
    assert.equal(sprintClosePreviewHttpQuerySchema.safeParse(query).success, false);
  const query = Object.create({
    cursor: 'cursor',
    destination: 'target',
    view: 'active',
    status: 'todo',
  });
  assert.deepEqual(sprintClosePreviewHttpQuerySchema.parse(query), {
    cursor: 'cursor',
    destination: 'target',
  });
  assert.throws(
    () => sprintClosePreviewHttpQuerySchema.safeParse(Object.create({ view: Object.create(null) })),
    TypeError,
  );
});

test('invalid executable objects may throw while ignored extra getters remain unread', () => {
  const reads = [];
  const value = Object.defineProperty({ ...input, expectedVersion: 0 }, 'previewHash', {
    enumerable: true,
    get() {
      reads.push('previewHash');
      throw new Error('known previewHash');
    },
  });
  assert.throws(() => isCloseSprintInput(value), /known previewHash/);
  assert.deepEqual(reads, ['previewHash']);
});

test('malformed null snapshots reject without throwing through the shared consequence schema', () => {
  assert.equal(isSprintClosePreview({ ...preview, items: [{ ...item, snapshot: null }] }), false);
  assert.equal(
    isSprintClosingOutcomePage({ ...page, items: [{ ...outcome, snapshot: null }] }),
    false,
  );
});

test('closure arrays validate actual elements and ignore executable traversal methods', () => {
  for (const [guard, value, row] of [
    [isSprintClosePreview, preview, item],
    [isSprintClosingOutcomePage, page, outcome],
  ]) {
    const items = [row];
    for (const key of ['keys', 'every', 'map', Symbol.iterator])
      Object.defineProperty(items, key, {
        enumerable: true,
        get() {
          throw new Error('ignored array traversal getter');
        },
      });
    assert.ok(guard({ ...value, items }));
    assert.ok(
      guard({ ...value, items: Object.assign([row], { every: () => false, map: () => [] }) }),
    );
    assert.equal(
      guard({ ...value, items: Object.assign([null], { every: () => true, map: () => ['fake'] }) }),
      false,
    );
    assert.equal(
      guard({
        ...value,
        total: 2,
        items: Object.assign([row, row], {
          every: () => true,
          map: () => ['manufactured-one', 'manufactured-two'],
        }),
      }),
      false,
    );
  }
});
