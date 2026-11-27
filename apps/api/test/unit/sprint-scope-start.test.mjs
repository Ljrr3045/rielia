import {
  estimateTaskInput,
  startSprintInput,
  setTaskSprintInput,
} from '../../dist/projects/task-planning-input.js';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { TaskPlanningService } from '../../dist/projects/task-planning.service.js';
import { startSprint } from '../../dist/projects/sprint-start.js';
import {
  semanticChange,
  prepareTaskObservation,
  observeTask,
} from '../../dist/projects/sprint-participation.js';
import { planningSnapshot } from '../../dist/projects/task-planning.js';
import {
  summarizeSnapshots,
  sprintScope,
  planningHistory,
} from '../../dist/projects/sprint-scope-read.js';
import { canonical } from '../../dist/projects/project-task-input.js';
import { mutateProjectTask } from '../../dist/projects/project-task-mutation.js';
import { SprintController } from '../../dist/projects/sprint.controller.js';
import { TaskPlanningController } from '../../dist/projects/task-planning.controller.js';
import { SprintService } from '../../dist/projects/sprint.service.js';
const at = new Date('2026-11-19T00:00:00Z'),
  key = '11111111-1111-4111-8111-111111111111';
const project = {
  id: 'p',
  workspaceId: 'w',
  version: 2,
  taskRevision: 8,
  sprintRevision: 4,
  mode: 'scrum',
  archivedAt: null,
  pointScale: [0, 1, 3, 5],
};
const task = {
  id: 't',
  workspaceId: 'w',
  projectId: 'p',
  version: 2,
  status: 'todo',
  estimatePoints: null,
  parentTaskId: null,
  archivedAt: null,
};
const row = {
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  version: 2,
  state: 'planned',
  startedAt: null,
  name: 'Sprint',
  goal: 'Goal',
  timeZone: 'UTC',
  startDate: at,
  endDateExclusive: new Date('2026-11-20Z'),
  startsAt: at,
  endsAt: new Date('2026-11-20Z'),
  createdAt: at,
  updatedAt: at,
  createdByPrincipalId: 'h',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
};
const actor = { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null };
const snap = planningSnapshot(task),
  visit = {
    id: 'visit',
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    taskId: 't',
    enteredAt: at,
    enteredOrdinal: 2,
    entrySnapshot: snap,
    exitedAt: null,
    exitedOrdinal: null,
    exitReason: null,
    exitSnapshot: null,
  };
function fixture(options = {}) {
  const calls = [],
    effects = [],
    receipt = options.receipt ?? null;
  const record = (name, value) => async (args) => {
    calls.push([name, args]);
    if (options.fail === name) throw new Error('injected ' + name);
    return typeof value === 'function' ? value(args) : globalThis.structuredClone(value);
  };
  const tx = {
    $queryRaw: record('lock', []),
    project: { findUniqueOrThrow: record('project.current', options.project ?? project) },
    task: {
      findFirst: record('task.before', options.task ?? task),
      findUnique: record('task.current', options.task === undefined ? task : options.task),
      findUniqueOrThrow: record('task.version', options.task ?? task),
      findMany: record('task.rows', options.tasks ?? [task]),
      update: record('task.update', options.final ?? { ...task, version: 3, estimatePoints: 0 }),
    },
    sprint: {
      findUnique: record('sprint.current', (args) =>
        options.sprintReads
          ? options.sprintReads.shift()
          : { ...row, id: args.where.workspaceId_projectId_id.id, ...options.sprint },
      ),
      findFirst: record('sprint.active', options.active ?? null),
      update: record(
        'sprint.update',
        options.updatedSprint ?? { ...row, version: 3, state: 'active', startedAt: at },
      ),
    },
    sprintParticipation: {
      findFirst: record('visit.current', options.visit ?? null),
      findMany: record('visit.rows', options.visits ?? []),
      update: record('visit.exit', visit),
      create: record('visit.enter', (args) => ({ ...visit, ...args.data })),
    },
    sprintScopeEvent: { create: record('event', {}) },
    sprintStartReference: { createMany: record('references', {}) },
    membership: {
      findMany: record('people', [
        {
          principalId: 'h',
          state: 'active',
          principal: { displayName: 'Human', kind: 'human', state: 'active' },
        },
      ]),
    },
    activityEvent: { create: record('activity', {}) },
    outboxEvent: { create: record('outbox', {}) },
    projectTaskOperation: {
      findUnique: record('receipt.read', receipt),
      create: record('receipt', {}),
    },
  };
  const context = Object.freeze({ verified: true });
  const projects = {
    planningOperation: async (c, w, p, operation, work) => {
      assert.equal(c, context);
      assert.equal(w, 'w');
      assert.equal(p, 'p');
      calls.push(['authority', operation]);
      if (options.denied) throw new ForbiddenException();
      if (operation === 'write') await tx.$queryRaw(['Project FOR UPDATE']);
      return work(
        tx,
        options.actor ? { ...actor, ...options.actor } : actor,
        true,
        options.project ?? project,
      );
    },
  };
  return { tx, projects, context, calls, effects, service: new TaskPlanningService(projects) };
}
const startInput = { expectedVersion: 2, expectedProjectVersion: 2, expectedTaskRevision: 8 };
const runStart = (f) =>
  startSprint(f.projects, f.context, 'w', 'p', 's', key, 'request', startInput);
const runEstimate = (f, patch = {}) =>
  f.service.estimate(f.context, 'w', 'p', 't', key, 'request', {
    expectedVersion: 2,
    estimatePoints: 0,
    ...patch,
  });
const assignInput = {
  expectedTaskVersion: 2,
  expectedCurrentParticipationId: null,
  expectedSourceVersion: null,
  targetSprintId: 's',
  expectedTargetVersion: 2,
};
const runAssign = (f, patch = {}) =>
  f.service.setSprint(f.context, 'w', 'p', 't', key, 'request', { ...assignInput, ...patch });
const denied = (status, code) => (e) => {
  assert.equal(e.getStatus(), status);
  if (code) assert.equal(e.getResponse().code, code);
  return true;
};
const writes = (f) =>
  f.calls.filter(([name]) =>
    [
      'task.update',
      'sprint.update',
      'visit.exit',
      'visit.enter',
      'event',
      'references',
      'activity',
      'outbox',
      'receipt',
    ].includes(name),
  );

test('summary separates done/canceled/pending and top-level zero/null from child information', () => {
  assert.deepEqual(
    summarizeSnapshots([
      { ...snap, status: 'done', estimatePoints: 0 },
      { ...snap, status: 'canceled', estimatePoints: 5 },
      { ...snap, estimatePoints: null, archivedAt: at.toISOString() },
      { ...snap, status: 'done', estimatePoints: 8, parentTaskId: 'parent' },
    ]),
    {
      done: 1,
      canceled: 1,
      pending: 1,
      donePoints: 0,
      canceledPoints: 5,
      pendingPoints: 0,
      unestimated: 1,
      children: 1,
      archived: 1,
    },
  );
  assert.equal(semanticChange(snap, { ...snap, version: 99 }), false);
  for (const patch of [
    { status: 'done' },
    { estimatePoints: 0 },
    { parentTaskId: 'parent' },
    { archivedAt: at.toISOString() },
  ])
    assert.equal(semanticChange(snap, { ...snap, ...patch }), true);
});
test('observation locks Sprint before sorted Tasks and the full destination column without archive filtering', async () => {
  const f = fixture({ visit });
  await prepareTaskObservation(
    f.tx,
    project,
    't',
    'move-task',
    { status: 'done', parentTaskId: 'new-parent' },
    { ...task, parentTaskId: 'old-parent' },
  );
  const locks = f.calls
    .filter(([n, a]) => n === 'lock' && a.join('').includes('FOR UPDATE'))
    .map(([, a]) => a);
  assert.match(locks[0].join(''), /FROM sprint/);
  assert.match(locks[1].join(''), /ORDER BY id FOR UPDATE/);
  assert.equal(locks[1].join('').includes('archivedAt'), false);
  const final = { ...task, version: 4, parentTaskId: 'parent' };
  await observeTask(f.tx, project, { before: task, visit }, final, 'activity');
  assert.equal(f.calls.find(([n]) => n === 'event')[1].data.afterSnapshot.version, 4);
  const n = f.calls.length;
  await observeTask(f.tx, project, { before: task, visit }, { ...task, version: 10 }, 'activity');
  assert.equal(f.calls.length, n);
  await observeTask(f.tx, project, { before: null, visit }, final, 'activity');
  assert.equal(f.calls.length, n);
});
test('explicit empty start journals once in the same transaction and stores the transition reference before returning current state', async () => {
  const f = fixture({ sprintReads: [row, { ...row, state: 'active', startedAt: at, version: 3 }] }),
    r = await runStart(f);
  assert.equal(r.operation.type, 'start-sprint');
  assert.equal(r.operation.enteredVisitId, null);
  assert.equal(r.current.state, 'active');
  const names = f.calls.map(([n]) => n);
  for (const effect of ['sprint.update', 'activity', 'event', 'outbox', 'receipt']) {
    assert.ok(names.includes(effect), `Missing required ${effect}`);
    assert.equal(names.filter((name) => name === effect).length, 1, `${effect} must occur once`);
  }
  assert.ok(names.indexOf('sprint.update') < names.indexOf('activity'));
  assert.ok(names.indexOf('activity') < names.indexOf('event'));
  assert.ok(names.indexOf('event') < names.indexOf('outbox'));
  assert.ok(names.indexOf('outbox') < names.indexOf('receipt'));
  assert.equal(names.includes('references'), false);
});
test('granted start writes and exact replay preserve namespace, original operation and authorized current state', async () => {
  const granted = {
    ...actor,
    principalKind: 'human',
    workspaceId: 'w',
    role: 'member',
    executionMode: 'delegated',
    source: 'mcp',
    grantId: 'scope-grant',
  };
  const scope = {
    workspaceId: 'w',
    actorPrincipalId: 'h',
    executionScope: 'grant:scope-grant',
    key,
  };
  const receipts = new Map([
    ['web', { requestHash: 'wrong web binding', response: null }],
    ['grant:other', { requestHash: 'wrong grant binding', response: null }],
  ]);
  const lookup = (args) => {
    const selected = args.where.workspaceId_actorPrincipalId_executionScope_key;
    assert.deepEqual(selected, scope);
    return receipts.get(selected.executionScope) ?? null;
  };
  const f = fixture({
    actor: granted,
    receipt: lookup,
    sprintReads: [row, { ...row, state: 'active', startedAt: at, version: 3 }],
  });
  const started = await runStart(f);
  const stored = f.calls.find(([name]) => name === 'receipt')[1].data;
  for (const [field, value] of Object.entries(scope)) assert.equal(stored[field], value);
  assert.equal(
    stored.requestHash,
    createHash('sha256')
      .update(JSON.stringify(canonical(['start-sprint', ['p', 's'], startInput])))
      .digest('hex'),
  );
  assert.equal(stored.response.operation, started.operation);
  assert.equal(f.calls.find(([name]) => name === 'activity')[1].data.grantId, granted.grantId);
  receipts.set(stored.executionScope, stored);
  stored.response.operation.extra = { retained: true };
  Object.defineProperty(stored.response.operation, 'ignored', {
    get: () => assert.fail('ignored stored operation value was read'),
  });

  const replay = fixture({
    actor: granted,
    receipt: lookup,
    project: { ...project, mode: 'kanban', archivedAt: at },
    sprint: { state: 'active', startedAt: at, version: 9 },
  });
  const result = await runStart(replay);
  assert.equal(result.operation, stored.response.operation);
  assert.deepEqual(result.operation.extra, { retained: true });
  assert.equal(result.current.version, 9);
  assert.equal(result.current.capabilities.canEdit, false);
  assert.deepEqual(writes(replay), []);
  assert.equal(receipts.size, 3);
});
test('start captures every canonical Task including children and archived rows after locks', async () => {
  const f = fixture({
    visits: [visit],
    tasks: [{ ...task, parentTaskId: 'parent', archivedAt: at }],
    sprint: { ...row, state: 'active', startedAt: at },
  });
  await assert.rejects(runStart(f), denied(409, 'invalid-transition'));
  const g = fixture({
    visits: [visit],
    tasks: [{ ...task, parentTaskId: 'parent', archivedAt: at }],
  });
  await runStart(g);
  const refs = g.calls.find(([n]) => n === 'references')[1].data;
  assert.equal(refs.length, 1);
  assert.equal(refs[0].snapshot.parentTaskId, 'parent');
  assert.equal(refs[0].snapshot.archivedAt, at.toISOString());
  assert.ok(g.calls.find(([n]) => n === 'sprint.update')[1].data.startedAt instanceof Date);
});
test('start rejects stale, archived, Kanban and sibling-active state before any journal', async (t) => {
  for (const [name, options, code] of [
    ['version', { sprint: { ...row, version: 9 } }, 'version-conflict'],
    ['project', { project: { ...project, version: 9 } }, 'version-conflict'],
    ['revision', { project: { ...project, taskRevision: 9 } }, 'version-conflict'],
    ['archive', { project: { ...project, archivedAt: at } }, 'archived'],
    ['kanban', { project: { ...project, mode: 'kanban' } }, 'invalid-transition'],
    ['active', { active: { id: 'other' } }, 'active-sprint-exists'],
  ])
    await t.test(name, async () => {
      const f = fixture(options);
      await assert.rejects(runStart(f), denied(409, code));
      assert.deepEqual(writes(f), []);
    });
});
test('estimate writes null/zero and retains off-scale values while rejecting newly off-scale/archived/stale writes', async () => {
  const f = fixture();
  await runEstimate(f);
  assert.equal(f.calls.find(([n]) => n === 'task.update')[1].data.estimatePoints, 0);
  assert.ok(Array.isArray(f.calls.find(([n]) => n === 'activity')[1].data.changes));
  const g = fixture({
    task: { ...task, estimatePoints: 5 },
    project: { ...project, pointScale: [0] },
  });
  await runEstimate(g, { estimatePoints: 5 });
  const h = fixture();
  await runEstimate(h, { estimatePoints: null });
  assert.equal(h.calls.find(([n]) => n === 'task.update')[1].data.estimatePoints, null);
  for (const [options, patch, status, code] of [
    [{}, { estimatePoints: 8 }, 400],
    [{ task: { ...task, archivedAt: at } }, {}, 409, 'archived'],
    [{ project: { ...project, archivedAt: at } }, {}, 409, 'archived'],
    [{ task: { ...task, version: 9 } }, {}, 409, 'version-conflict'],
  ]) {
    const x = fixture(options);
    await assert.rejects(runEstimate(x, patch), denied(status, code));
    assert.deepEqual(writes(x), []);
  }
});
test('assigned estimate appends only a real semantic change and records the final Task version', async () => {
  const f = fixture({ visit, final: { ...task, version: 4, estimatePoints: 0 } });
  await runEstimate(f);
  assert.equal(f.calls.find(([n]) => n === 'event')[1].data.afterSnapshot.version, 4);
});
test('scope add/remove/transfer never writes Task and pairs exit/entry with one Activity', async () => {
  const add = fixture();
  await runAssign(add);
  assert.ok(add.calls.some(([n]) => n === 'visit.enter'));
  assert.equal(
    add.calls.some(([n]) => n === 'task.update'),
    false,
  );
  const remove = fixture({ visit });
  await runAssign(remove, {
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: 2,
    targetSprintId: null,
    expectedTargetVersion: null,
  });
  assert.ok(remove.calls.some(([n]) => n === 'visit.exit'));
  assert.equal(
    remove.calls.some(([n]) => n === 'visit.enter'),
    false,
  );
  const transfer = fixture({ visit });
  await runAssign(transfer, {
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: 2,
    targetSprintId: 'other',
    expectedTargetVersion: 2,
  });
  assert.equal(transfer.calls.filter(([n]) => n === 'activity').length, 1);
  assert.equal(transfer.calls.filter(([n]) => n === 'event').length, 2);
  assert.equal(
    transfer.calls.some(([n]) => n === 'task.update'),
    false,
  );
});
test('scope rejects changed Task/visit/source/destination versions and archive before durable work', async (t) => {
  for (const [name, options, patch, code] of [
    ['task', { task: { ...task, version: 9 } }, {}, 'current-sprint-conflict'],
    ['visit', { visit }, {}, 'current-sprint-conflict'],
    ['target', { sprint: { ...row, version: 9 } }, {}, 'current-sprint-conflict'],
    [
      'source',
      { visit },
      {
        expectedCurrentParticipationId: 'visit',
        expectedSourceVersion: 9,
        targetSprintId: null,
        expectedTargetVersion: null,
      },
      'current-sprint-conflict',
    ],
    ['archive', { task: { ...task, archivedAt: at } }, {}, 'archived'],
    [
      'same',
      { visit },
      { expectedCurrentParticipationId: 'visit', expectedSourceVersion: 2 },
      'invalid-transition',
    ],
    ['empty', {}, { targetSprintId: null, expectedTargetVersion: null }, 'invalid-transition'],
    [
      'closed target',
      { sprint: { state: 'closed', startedAt: at, closedAt: at } },
      {},
      'invalid-transition',
    ],
    [
      'closed source',
      { visit, sprint: { state: 'closed', startedAt: at, closedAt: at } },
      {
        expectedCurrentParticipationId: 'visit',
        expectedSourceVersion: 2,
        targetSprintId: null,
        expectedTargetVersion: null,
      },
      'invalid-transition',
    ],
  ])
    await t.test(name, async () => {
      const f = fixture(options);
      await assert.rejects(runAssign(f, patch), denied(409, code));
      assert.deepEqual(writes(f), []);
    });
});
test('new input boundaries reject missing/null/version mismatches, actor and timestamp injection before authority', () => {
  for (const payload of [
    {},
    { expectedVersion: 1, estimatePoints: -1 },
    { expectedVersion: 1, estimatePoints: 1.2 },
    { expectedVersion: 1, estimatePoints: null, actorPrincipalId: 'forged' },
  ]) {
    const f = fixture();
    assert.throws(() => f.service.estimate(f.context, 'w', 'p', 't', key, 'r', payload));
    assert.deepEqual(f.calls, []);
  }
  for (const patch of [
    { expectedCurrentParticipationId: 'visit' },
    { expectedSourceVersion: 2 },
    { targetSprintId: null },
    { expectedTargetVersion: null },
    { targetSprintId: '../bad' },
    { actor: 'forged' },
  ]) {
    const f = fixture();
    assert.throws(() => runAssign(f, patch));
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  assert.throws(() =>
    startSprint(f.projects, f.context, 'w', 'p', 's', key, 'r', {
      ...startInput,
      startedAt: at.toISOString(),
    }),
  );
  assert.deepEqual(f.calls, []);
});
test('receipt replay returns original successful transition and current state before stale versions/mode/archive checks', async () => {
  const input = assignInput,
    requestHash = createHash('sha256')
      .update(JSON.stringify(canonical(['set-task-sprint', ['p', 't'], input])))
      .digest('hex');
  const operation = {
    activityId: 'activity',
    type: 'set-task-sprint',
    sprintId: 's',
    enteredVisitId: 'old-visit',
    exitedVisitId: null,
  };
  const f = fixture({
    project: { ...project, mode: 'kanban', archivedAt: at },
    task: { ...task, version: 20 },
    receipt: {
      requestHash,
      response: { kind: 'sprint-transition', entity: 'task', id: 't', operation },
    },
  });
  const value = await runAssign(f);
  assert.deepEqual(value.operation, operation);
  assert.equal(value.current.snapshot.version, 20);
  assert.equal(value.current.currentParticipation, null);
  assert.deepEqual(writes(f), []);
  const g = fixture({
    denied: true,
    receipt: {
      requestHash,
      response: { kind: 'sprint-transition', entity: 'task', id: 't', operation },
    },
  });
  await assert.rejects(runAssign(g), denied(403));
  assert.equal(
    g.calls.some(([n]) => n === 'receipt.read'),
    false,
  );
});
test('different hashes and corrupt receipts never append history/outbox or bypass current authorization', async () => {
  const hash = createHash('sha256')
    .update(
      JSON.stringify(
        canonical(['estimate-task', ['p', 't'], { expectedVersion: 2, estimatePoints: 0 }]),
      ),
    )
    .digest('hex');
  for (const [response, requestHash, status] of [
    [{}, hash, 503],
    [{ kind: 'wrong', id: 't', entity: 'task' }, hash, 503],
    [{ kind: 'task-planning', id: 't', entity: 'task' }, 'different', 409],
  ]) {
    const f = fixture({ receipt: { requestHash, response } });
    await assert.rejects(runEstimate(f), denied(status));
    assert.deepEqual(writes(f), []);
  }
  const f = fixture({
    receipt: { requestHash: hash, response: { kind: 'task-planning', id: 't', entity: 'task' } },
  });
  assert.equal((await runEstimate(f)).taskId, 't');
  assert.deepEqual(writes(f), []);
});
test('scope receipt identity and current-state failures precede later stored operation reads', async () => {
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical(['set-task-sprint', ['p', 't'], assignInput])))
    .digest('hex');
  const ignored = () => {
    throw new Error('later receipt value was read');
  };
  const wrongTarget = fixture({
    receipt: () => ({
      requestHash,
      response: Object.defineProperty({ id: 'other' }, 'entity', { get: ignored }),
    }),
  });
  await assert.rejects(runAssign(wrongTarget), denied(503));
  assert.deepEqual(
    wrongTarget.calls.map(([name]) => name),
    ['authority', 'lock', 'receipt.read'],
  );

  const unavailable = fixture({
    fail: 'project.current',
    receipt: () => ({
      requestHash,
      response: Object.defineProperties(
        { id: 't', entity: 'task' },
        { kind: { get: ignored }, operation: { get: ignored } },
      ),
    }),
  });
  await assert.rejects(runAssign(unavailable), /injected project.current/);
  assert.deepEqual(writes(unavailable), []);

  const reads = [];
  const badTag = fixture({
    receipt: () => ({
      requestHash,
      response: Object.defineProperties(
        { id: 't', entity: 'task' },
        {
          operation: { get: () => (reads.push('operation'), null) },
          kind: { get: () => (reads.push('kind'), 'unknown') },
        },
      ),
    }),
  });
  await assert.rejects(runAssign(badTag), denied(503));
  assert.deepEqual(reads, ['operation', 'kind']);
  assert.ok(badTag.calls.some(([name]) => name === 'task.current'));
  assert.deepEqual(writes(badTag), []);
});
test('missing canonical Task on identity-valid replay retains taskRow403 before reading stored operation or tag', async () => {
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical(['set-task-sprint', ['p', 't'], assignInput])))
    .digest('hex');
  const later = () => assert.fail('later receipt value was read before the missing Task denial');
  const f = fixture({
    task: null,
    receipt: () => ({
      requestHash,
      response: Object.defineProperties(
        { id: 't', entity: 'task' },
        {
          kind: { get: later },
          operation: { get: later },
        },
      ),
    }),
  });
  await assert.rejects(runAssign(f), (error) => {
    assert.equal(error.getStatus(), 403);
    assert.equal(error.message, 'Project/task access is denied.');
    return true;
  });
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ['authority', 'lock', 'receipt.read', 'project.current', 'task.current'],
  );
  assert.deepEqual(writes(f), []);
});
test('scope replay returns the original operation and retained estimate fallback without tightening historical IDs', async () => {
  const operation = Object.defineProperty(
    {
      type: 'set-task-sprint',
      activityId: 'activity',
      sprintId: 'historical-source',
      enteredVisitId: null,
      exitedVisitId: 'prior-visit',
    },
    'extra',
    { get: () => assert.fail('ignored operation extra was read') },
  );
  const f = fixture({
    task: { ...task, version: 20 },
    receipt: () => ({
      requestHash: createHash('sha256')
        .update(JSON.stringify(canonical(['set-task-sprint', ['p', 't'], assignInput])))
        .digest('hex'),
      response: { kind: 'sprint-transition', id: 't', entity: 'task', operation },
    }),
  });
  const replay = await runAssign(f);
  assert.equal(replay.operation, operation);
  assert.equal(replay.current.snapshot.version, 20);
  assert.deepEqual(writes(f), []);

  const estimateHash = createHash('sha256')
    .update(
      JSON.stringify(
        canonical(['estimate-task', ['p', 't'], { expectedVersion: 2, estimatePoints: 0 }]),
      ),
    )
    .digest('hex');
  const fast = fixture({
    receipt: () => ({
      requestHash: estimateHash,
      response: Object.defineProperty(
        { kind: 'task-planning', id: 't', entity: 'task' },
        'operation',
        {
          get: () => assert.fail('estimate fast path read operation'),
        },
      ),
    }),
  });
  assert.equal((await runEstimate(fast)).taskId, 't');
  assert.deepEqual(writes(fast), []);
  const retained = { ...operation, type: 'estimate-task' };
  const g = fixture({
    receipt: () => ({
      requestHash: estimateHash,
      response: { kind: 'sprint-transition', id: 't', entity: 'task', operation: retained },
    }),
  });
  assert.equal((await runEstimate(g)).operation, retained);
  assert.deepEqual(writes(g), []);
});
test('start rejects an invalid UUID key before authority, receipt lookup or effects', () => {
  const f = fixture();
  assert.throws(
    () => startSprint(f.projects, f.context, 'w', 'p', 's', 'invalid-key', 'request', startInput),
    denied(400),
  );
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.effects, []);
});
test('original start receipt returns its operation and authorized later closed Sprint without new writes', async () => {
  const operation = {
    activityId: 'original-activity',
    type: 'start-sprint',
    sprintId: 's',
    enteredVisitId: null,
    exitedVisitId: null,
  };
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical(['start-sprint', ['p', 's'], startInput])))
    .digest('hex');
  const closedAt = new Date('2026-11-20T00:00:00.000Z');
  const f = fixture({
    project: { ...project, mode: 'kanban', archivedAt: at },
    sprint: { state: 'closed', version: 9, startedAt: at, closedAt },
    receipt: {
      requestHash,
      response: { kind: 'sprint-transition', entity: 'sprint', id: 's', operation },
    },
  });
  const value = await runStart(f);
  assert.deepEqual(value.operation, operation);
  assert.equal(value.current.id, 's');
  assert.equal(value.current.state, 'closed');
  assert.equal(value.current.version, 9);
  assert.equal(value.current.closedAt, closedAt.toISOString());
  assert.equal(value.current.capabilities.canStart, false);
  assert.equal(f.calls[0][0], 'authority');
  for (const name of ['receipt.read', 'project.current', 'sprint.current'])
    assert.ok(f.calls.some(([call]) => call === name));
  assert.deepEqual(writes(f), []);
  assert.deepEqual(f.effects, []);
});
test('malformed stored exit identity rejects after current-authority read without transition effects', async () => {
  const operation = {
    activityId: 'original-activity',
    type: 'start-sprint',
    sprintId: 's',
    enteredVisitId: null,
    exitedVisitId: 42,
  };
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical(['start-sprint', ['p', 's'], startInput])))
    .digest('hex');
  const f = fixture({
    receipt: {
      requestHash,
      response: { kind: 'sprint-transition', entity: 'sprint', id: 's', operation },
    },
  });
  await assert.rejects(runStart(f), denied(503));
  assert.equal(f.calls[0][0], 'authority');
  for (const name of ['receipt.read', 'project.current', 'sprint.current'])
    assert.ok(f.calls.some(([call]) => call === name));
  assert.deepEqual(writes(f), []);
  assert.deepEqual(f.effects, []);
});
test('journal failure stops every later collaborator rather than returning successful current state', async (t) => {
  for (const fail of ['sprint.update', 'activity', 'event', 'references', 'outbox', 'receipt'])
    await t.test(fail, async () => {
      const f = fixture({ fail, visits: [visit], tasks: [task] });
      await assert.rejects(runStart(f), new RegExp('injected ' + fail));
      const names = f.calls.map(([n]) => n),
        order = ['sprint.update', 'activity', 'event', 'references', 'outbox', 'receipt'];
      for (const later of order.slice(order.indexOf(fail) + 1))
        assert.equal(names.includes(later), false);
    });
});
test('scope read bounds rows, hydrates in groups, retains canonical totals and rejects changed/forged continuations', async () => {
  const f = fixture(),
    rows = Array.from({ length: 101 }, (_, i) => ({
      ...visit,
      id: `visit-${String(i).padStart(3, '0')}`,
    })),
    totals = summarizeSnapshots([snap]);
  f.tx.sprintParticipation.findMany = async (args) => {
    assert.equal(args.take, 101);
    return rows;
  };
  f.tx.sprintParticipation.count = async ({ where }) => (where.exitedAt ? 0 : 101);
  f.tx.sprintStartReference.findMany = async () => [];
  f.tx.$queryRaw = async () => [totals];
  const page = await sprintScope(f.tx, project, 's');
  assert.equal(page.items.length, 100);
  assert.equal(page.total, 101);
  assert.deepEqual(page.currentTotals, totals);
  assert.ok(page.nextCursor);
  await assert.rejects(
    sprintScope(f.tx, { ...project, taskRevision: 99 }, 's', page.nextCursor),
    denied(409, 'page-changed'),
  );
  await assert.rejects(sprintScope(f.tx, project, 's', page.nextCursor), denied(400));
  for (const patch of [
    { kind: 'task-sprint-history' },
    { w: 'foreign' },
    { entityVersion: 0 },
    { o: '99999999999999999999' },
    { a: '../bad' },
    { extra: 'bad' },
  ]) {
    const value = JSON.parse(Buffer.from(page.nextCursor, 'base64url'));
    await assert.rejects(
      sprintScope(
        f.tx,
        project,
        's',
        Buffer.from(JSON.stringify({ ...value, ...patch })).toString('base64url'),
      ),
      denied(400),
    );
  }
  f.tx.sprintParticipation.findFirst = async () => visit;
  f.tx.sprintParticipation.findMany = async () => [];
  const next = await sprintScope(f.tx, project, 's', page.nextCursor);
  assert.equal(next.nextCursor, null);
});
test('history hydrates actors once, projects retained activities with unknown historical snapshots left absent, and binds task order to outbox', async () => {
  const f = fixture();
  let queries = [];
  f.tx.$queryRaw = async (query) => {
    queries.push(query.sql);
    return query.sql.includes('count(*)')
      ? [{ total: 1 }]
      : [{ id: 'old', source: 'activity', ordering: 1n }];
  };
  f.tx.sprintScopeEvent.findMany = async () => [];
  f.tx.activityEvent.findMany = async () => [
    {
      id: 'old',
      workspaceId: 'w',
      projectId: 'p',
      sprintId: 's',
      taskId: null,
      actorPrincipalId: 'h',
      executionMode: 'human',
      source: 'web',
      grantId: null,
      entityVersion: 1,
      action: 'create-sprint',
      createdAt: at,
      changes: [],
    },
  ];
  const page = await planningHistory(f.tx, project, { sprintId: 's' });
  assert.equal(page.items[0].kind, 'metadata');
  assert.equal(page.items[0].before, null);
  assert.equal(page.items[0].after, null);
  assert.ok(queries.every((q) => q.includes('NOT EXISTS')));
  queries = [];
  f.tx.activityEvent.findMany = async () => [
    {
      id: 'old',
      workspaceId: 'w',
      projectId: 'p',
      sprintId: null,
      taskId: 't',
      actorPrincipalId: 'h',
      executionMode: 'human',
      source: 'web',
      grantId: null,
      entityVersion: 2,
      action: 'estimate-task',
      createdAt: at,
      changes: [{ planningBefore: snap, planningAfter: { ...snap, estimatePoints: 0 } }],
    },
  ];
  const taskPage = await planningHistory(f.tx, project, { taskId: 't' });
  assert.equal(taskPage.items[0].kind, 'estimate');
  assert.equal(taskPage.items[0].after.estimatePoints, 0);
  assert.ok(queries.every((q) => q.includes('o.sequence')));
  assert.equal((await f.service.get(f.context, 'w', 'p', 't')).snapshot.version, 2);
});
test('closed scope uses frozen outcomes, separates manual dispositions and rejects forged ordinal continuations', async () => {
  const f = fixture({ sprint: { state: 'closed', startedAt: at, closedAt: at } }),
    totals = summarizeSnapshots([snap]);
  f.tx.sprintParticipation.findMany = async () => [
    { ...visit, exitedAt: at, exitedOrdinal: 3, exitReason: 'closed', exitSnapshot: snap },
  ];
  f.tx.sprintParticipation.count = async ({ where }) => (where.exitReason ? 0 : 1);
  f.tx.sprintStartReference.findMany = async () => [{ participationId: visit.id, snapshot: snap }];
  f.tx.sprintClosingOutcome = { findMany: async () => [{ snapshot: snap }] };
  f.tx.$queryRaw = async () => [totals];
  const page = await sprintScope(f.tx, project, 's');
  assert.deepEqual(page.closingTotals, totals);
  assert.equal(page.removed, 0);
  assert.equal(page.transferred, 0);
  assert.equal(page.items[0].exitReason, 'closed');
  assert.deepEqual(page.items[0].start, snap);
  const bad = Buffer.from(
    JSON.stringify({
      v: 1,
      kind: 'sprint-scope',
      w: 'w',
      p: 'p',
      scope: 's',
      projectVersion: 2,
      taskRevision: 8,
      sprintRevision: 4,
      entityVersion: 2,
      a: visit.id,
      o: '1',
    }),
  ).toString('base64url');
  f.tx.sprintParticipation.findFirst = async () => visit;
  await assert.rejects(sprintScope(f.tx, project, 's', bad), denied(400));
});
test('task history hydrates aggregate outcome links and actors in groups with commit-order paging', async () => {
  const f = fixture(),
    outcome = {
      id: 'o',
      closureId: 'c',
      participationId: 'visit',
      taskId: 't',
      sprintId: 's',
      snapshot: snap,
      disposition: 'carried',
      targetSprintId: 'target',
      targetParticipationId: 'new',
    };
  const activity = {
    id: 'activity',
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    taskId: null,
    actorPrincipalId: 'h',
    executionMode: 'human',
    source: 'web',
    grantId: null,
    entityVersion: 4,
    action: 'close-sprint',
    createdAt: at,
    changes: [],
  };
  const events = Array.from({ length: 100 }, (_, i) => ({
    id: `e${i}`,
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: i + 2,
    activityId: 'activity',
    kind: 'task-change',
    occurredAt: at,
    beforeSnapshot: snap,
    afterSnapshot: snap,
  }));
  let rows = [
      { id: 'o', source: 'outcome', ordering: 1n },
      ...events.map((e, i) => ({ id: e.id, source: 'event', ordering: BigInt(i + 2) })),
    ],
    anchorExists = true;
  const calls = [];
  f.tx.$queryRaw = async (query) =>
    query.sql.includes('count(*)')
      ? [{ total: 101 }]
      : query.sql.includes('SELECT id FROM items')
        ? anchorExists
          ? [{ id: 'e98' }]
          : []
        : rows;
  f.tx.sprintScopeEvent.findMany = async () => events;
  f.tx.sprintClosingOutcome = {
    findMany: async (args) => {
      calls.push(args);
      return [outcome];
    },
  };
  f.tx.sprintClosure = { findMany: async () => [{ id: 'c', activityId: 'activity' }] };
  f.tx.activityEvent.findMany = async () => [activity];
  const page = await planningHistory(f.tx, project, { taskId: 't' });
  assert.equal(page.items.length, 100);
  assert.equal(page.items[0].kind, 'outcome');
  assert.equal(page.items[0].closureId, 'c');
  assert.equal(page.items[0].targetParticipationId, 'new');
  assert.deepEqual(page.items[0].after, snap);
  assert.equal(calls.length, 1);
  assert.ok(page.nextCursor);
  rows = [];
  assert.equal(
    (await planningHistory(f.tx, project, { taskId: 't' }, page.nextCursor)).items.length,
    0,
  );
  anchorExists = false;
  await assert.rejects(
    planningHistory(f.tx, project, { taskId: 't' }, page.nextCursor),
    denied(400),
  );
});
test('thin scope/start/task-planning controllers preserve selected target, exact body/key and bounded cursor mode', async () => {
  const calls = [],
    context = Object.freeze({ verified: true }),
    body = { expectedVersion: 3, estimatePoints: null },
    req = { headers: { 'idempotency-key': key }, body },
    res = {};
  const service = Object.fromEntries(
    ['start', 'scope', 'history', 'get', 'estimate', 'setSprint'].map((name) => [
      name,
      async (...args) => {
        calls.push({ name, args });
        return name;
      },
    ]),
  );
  const http = {
    respond: async (r, s, w, list, work) => {
      assert.equal(r, req);
      assert.equal(s, res);
      assert.equal(w, 'w');
      calls.push({ list });
      return work(context, 'request', 'active', 'cursor');
    },
  };
  const sprintController = new SprintController(service, http),
    taskController = new TaskPlanningController(service, http);
  for (const method of ['start', 'scope', 'history'])
    await sprintController[method]('w', 'p', 's', req, res);
  for (const method of ['get', 'history', 'estimate', 'setSprint'])
    await taskController[method]('w', 'p', 't', req, res);
  assert.deepEqual(
    calls.filter((x) => x.name).map((x) => x.name),
    ['start', 'scope', 'history', 'get', 'history', 'estimate', 'setSprint'],
  );
  assert.deepEqual(calls.find((x) => x.name === 'start').args, [
    context,
    'w',
    'p',
    's',
    key,
    'request',
    body,
  ]);
  assert.deepEqual(calls.find((x) => x.name === 'scope').args, [context, 'w', 'p', 's', 'cursor']);
  assert.deepEqual(calls.find((x) => x.name === 'setSprint').args, [
    context,
    'w',
    'p',
    't',
    key,
    'request',
    body,
  ]);
  assert.deepEqual(
    calls.filter((x) => 'list' in x).map((x) => x.list),
    [
      'planning-empty',
      'planning-page',
      'planning-page',
      'planning-empty',
      'planning-page',
      'planning-empty',
      'planning-empty',
    ],
  );
});
test('legacy Task mutation awaits the final Task observation after Activity and before outbox/receipt on the original transaction', async () => {
  const f = fixture({ visit, task: { ...task, version: 4, parentTaskId: 'parent' } });
  f.tx.project.findFirst = async () => project;
  f.tx.task.findFirst = async () => task;
  const principals = {
    domainOperation: async (c, w, mode, work) => {
      assert.equal(c, f.context);
      assert.equal(w, 'w');
      assert.equal(mode, 'write');
      return work(f.tx, actor);
    },
  };
  const result = await mutateProjectTask(
    principals,
    f.context,
    'w',
    key,
    'request',
    'set-task-parent',
    ['p', 't'],
    { expectedVersion: 2, parentTaskId: 'parent' },
    async (tx) => {
      assert.equal(tx, f.tx);
      return {
        id: 't',
        projectId: 'p',
        version: 4,
        status: 'todo',
        type: 'task',
        priority: 'none',
        dueDate: null,
      };
    },
  );
  assert.equal(result.version, 4);
  const names = f.calls.map(([n]) => n);
  for (const effect of ['activity', 'event', 'outbox', 'receipt']) {
    assert.ok(names.includes(effect), `Missing required ${effect}`);
    assert.equal(names.filter((name) => name === effect).length, 1, `${effect} must occur once`);
  }
  assert.ok(names.indexOf('activity') < names.indexOf('event'));
  assert.ok(names.indexOf('event') < names.indexOf('outbox'));
  assert.ok(names.indexOf('outbox') < names.indexOf('receipt'));
  assert.equal(f.calls.find(([n]) => n === 'event')[1].data.afterSnapshot.version, 4);
});
test('Project creation has no existing Project/Sprint/Task lock target and invalid keys never enter authority', async () => {
  const f = fixture(),
    principals = { domainOperation: async (_c, _w, _mode, work) => work(f.tx, actor) };
  const created = await mutateProjectTask(
    principals,
    f.context,
    'w',
    key,
    'request',
    'create-project',
    [],
    { name: 'New' },
    async () => ({ id: 'new', version: 1 }),
  );
  assert.equal(created.id, 'new');
  assert.equal(
    f.calls.some(([n]) => n === 'lock' || n.startsWith('visit.') || n.startsWith('task.')),
    false,
  );
  assert.throws(
    () =>
      mutateProjectTask(
        principals,
        f.context,
        'w',
        'invalid',
        'request',
        'create-project',
        [],
        {},
        async () => ({ id: 'new', version: 1 }),
      ),
    denied(400),
  );
});
test('Sprint and Task service sidecars compose their authorized transaction-taking read/start owners', async () => {
  const f = fixture({ sprintReads: [row, { ...row, state: 'active', startedAt: at }] }),
    service = new SprintService(f.projects);
  assert.equal(
    (await service.start(f.context, 'w', 'p', 's', key, 'request', startInput)).operation.type,
    'start-sprint',
  );
  const g = fixture(),
    read = new SprintService(g.projects),
    totals = summarizeSnapshots([]);
  g.tx.sprintParticipation.findMany = async () => [];
  g.tx.sprintParticipation.count = async () => 0;
  g.tx.sprintStartReference.findMany = async () => [];
  g.tx.sprintScopeEvent.findMany = async () => [];
  g.tx.activityEvent.findMany = async () => [];
  g.tx.$queryRaw = async (query) =>
    query.sql.includes('jsonb_build_object')
      ? [totals]
      : query.sql.includes('count(*)')
        ? [{ total: 0 }]
        : [];
  assert.equal((await read.scope(g.context, 'w', 'p', 's')).total, 0);
  assert.equal((await read.history(g.context, 'w', 'p', 's')).total, 0);
  assert.equal((await g.service.history(g.context, 'w', 'p', 't')).total, 0);
});

test('planning input adapters retain field error precedence and normalized explicit null/zero', () => {
  const invalid = (parse, body, message) =>
    assert.throws(
      () => parse(body),
      (error) => error.getStatus() === 400 && error.message === message,
    );
  invalid(estimateTaskInput, {}, 'Invalid project/task request.');
  invalid(estimateTaskInput, { expectedVersion: 0, estimatePoints: -1 }, 'Invalid estimate.');
  invalid(
    estimateTaskInput,
    { expectedVersion: 0, estimatePoints: 0 },
    'A positive expectedVersion is required.',
  );
  invalid(
    startSprintInput,
    { expectedVersion: 1, expectedProjectVersion: 0, expectedTaskRevision: 0 },
    'A positive expectedVersion is required.',
  );
  const set = {
    expectedTaskVersion: 1,
    expectedCurrentParticipationId: null,
    expectedSourceVersion: null,
    targetSprintId: 's',
    expectedTargetVersion: 2,
  };
  invalid(
    setTaskSprintInput,
    { ...set, expectedTaskVersion: 0, targetSprintId: '../bad' },
    'Invalid sprint participation.',
  );
  invalid(
    setTaskSprintInput,
    { ...set, expectedTaskVersion: 0 },
    'A positive expectedVersion is required.',
  );
  invalid(
    setTaskSprintInput,
    { ...set, expectedSourceVersion: 2 },
    'Sprint versions must match the explicit source and destination.',
  );
  assert.deepEqual(setTaskSprintInput(set), set);
  assert.deepEqual(
    startSprintInput({ expectedVersion: 1, expectedProjectVersion: 2, expectedTaskRevision: 3 }),
    { expectedVersion: 1, expectedProjectVersion: 2, expectedTaskRevision: 3 },
  );
  for (const estimatePoints of [null, 0])
    assert.deepEqual(estimateTaskInput({ expectedVersion: 1, estimatePoints }), {
      expectedVersion: 1,
      estimatePoints,
    });
});

test('scope snapshots reject corrupt required history, preserve nullable sides and keep SQL totals independent', async () => {
  const setup = (options = {}) => {
    const f = fixture({ sprint: options.closed ? { state: 'closed' } : {} });
    f.tx.sprintParticipation.findMany = async () => [{ ...visit, ...options.visit }];
    f.tx.sprintParticipation.count = async () => 1;
    f.tx.sprintStartReference.findMany = async () => options.references ?? [];
    f.tx.sprintClosingOutcome = { findMany: async () => options.outcomes ?? [] };
    f.tx.$queryRaw = async () => [{ done: 19, pendingPoints: 57 }];
    return f;
  };
  const historical = { ...snap, estimatePoints: 7 };
  const f = setup({
    visit: { entrySnapshot: historical },
    references: [{ participationId: 'visit', snapshot: historical }],
  });
  const page = await sprintScope(f.tx, project, 's');
  assert.equal(page.items[0].entry, historical);
  assert.equal(page.items[0].start, historical);
  assert.equal(page.items[0].exit, null);
  assert.equal(page.items[0].current.estimatePoints, null);
  assert.deepEqual(page.currentTotals, { done: 19, pendingPoints: 57 });
  for (const invalid of [
    null,
    [],
    {},
    { ...snap, extra: true },
    { ...snap, estimatePoints: '3' },
    { ...snap, version: Number.MAX_SAFE_INTEGER + 1 },
    { ...snap, archivedAt: '0000-01-01T00:00:00.000Z' },
    { ...snap, archivedAt: '2026-02-30T00:00:00.000Z' },
  ]) {
    for (const options of [
      { visit: { entrySnapshot: invalid } },
      { references: [{ participationId: 'visit', snapshot: invalid }] },
      { closed: true, outcomes: [{ snapshot: invalid }] },
      ...(invalid === null ? [] : [{ visit: { exitSnapshot: invalid } }]),
    ]) {
      const broken = setup(options);
      await assert.rejects(sprintScope(broken.tx, project, 's'), (error) => {
        assert.equal(error.getStatus(), 503);
        assert.equal(error.message, 'Planning snapshot is unavailable.');
        return true;
      });
    }
  }
  const missing = setup({ visit: { entrySnapshot: null } });
  missing.tx.sprint.findUnique = async () => null;
  await assert.rejects(sprintScope(missing.tx, project, 's'), denied(403));
});

test('planning history validates selected event/outcome snapshots but keeps first legacy nullable fallback', async () => {
  const activity = {
    id: 'activity',
    actorPrincipalId: 'h',
    executionMode: 'human',
    source: 'web',
    grantId: null,
    entityVersion: 2,
    action: 'estimate-task',
    createdAt: at,
    sprintId: 's',
    taskId: 't',
  };
  const event = {
    id: 'event',
    activityId: 'activity',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: 2,
    kind: 'task-change',
    occurredAt: at,
    beforeSnapshot: null,
    afterSnapshot: null,
  };
  const setup = ({ events = [], outcomes = [], changes = [] } = {}) => {
    const f = fixture();
    const id = outcomes.length ? 'outcome' : events.length ? 'event' : 'activity';
    const source = outcomes.length ? 'outcome' : events.length ? 'event' : 'activity';
    f.tx.$queryRaw = async (q) =>
      q.sql.includes('count(*)') ? [{ total: 1 }] : [{ id, source, ordering: 1n }];
    f.tx.sprintScopeEvent.findMany = async () => events;
    f.tx.sprintClosingOutcome = { findMany: async () => outcomes };
    f.tx.sprintClosure = { findMany: async () => [{ id: 'closure', activityId: 'activity' }] };
    f.tx.activityEvent.findMany = async () => [{ ...activity, changes }];
    return f;
  };
  const after = { ...snap, estimatePoints: 7 };
  const legacy = { planningBefore: snap, planningAfter: after };
  const f = setup({ changes: [legacy] });
  const item = (await planningHistory(f.tx, project, { taskId: 't' })).items[0];
  assert.equal(item.before, snap);
  assert.equal(item.after, after);
  const first = setup({ changes: [{ planningBefore: {}, planningAfter: null }, legacy] });
  const absent = (await planningHistory(first.tx, project, { taskId: 't' })).items[0];
  assert.equal(absent.before, null);
  assert.equal(absent.after, null);
  const partial = setup({ events: [{ ...event, beforeSnapshot: snap }], changes: [legacy] });
  const mixed = (await planningHistory(partial.tx, project, { taskId: 't' })).items[0];
  assert.equal(mixed.before, snap);
  assert.equal(mixed.after, after);
  const unread = {
    get planningBefore() {
      throw new Error('unused legacy before');
    },
    get planningAfter() {
      throw new Error('unused legacy after');
    },
  };
  const selected = setup({
    events: [{ ...event, beforeSnapshot: snap, afterSnapshot: after }],
    changes: [unread],
  });
  assert.equal(
    (await planningHistory(selected.tx, project, { taskId: 't' })).items[0].after,
    after,
  );
  for (const field of ['beforeSnapshot', 'afterSnapshot']) {
    const broken = setup({ events: [{ ...event, [field]: {} }], changes: [legacy] });
    await assert.rejects(planningHistory(broken.tx, project, { taskId: 't' }), denied(503));
  }
  const outcome = {
    id: 'outcome',
    closureId: 'closure',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    snapshot: snap,
    disposition: 'backlog',
    targetSprintId: null,
    targetParticipationId: null,
  };
  const frozen = setup({ outcomes: [outcome], changes: [unread] });
  const result = (await planningHistory(frozen.tx, project, { taskId: 't' })).items[0];
  assert.equal(result.before, snap);
  assert.equal(result.after, snap);
  for (const snapshot of [null, {}, { ...snap, status: 'unknown' }]) {
    const broken = setup({ outcomes: [{ ...outcome, snapshot }], changes: [legacy] });
    await assert.rejects(planningHistory(broken.tx, project, { taskId: 't' }), denied(503));
  }
});

test('planning cursors retain interleaved version precedence and bounded BigInt ordinals without eager exact-key rejection', async () => {
  const binding = {
    v: 1,
    kind: 'sprint-scope',
    w: 'w',
    p: 'p',
    scope: 's',
    projectVersion: 2,
    taskRevision: 8,
    sprintRevision: 4,
    entityVersion: 2,
    a: 'visit',
    o: '0',
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const versions = ['projectVersion', 'taskRevision', 'sprintRevision', 'entityVersion'];
  for (let i = 0; i < versions.length; i++) {
    const invalid = { ...binding, [versions[i]]: '2' };
    await assert.rejects(sprintScope(fixture().tx, project, 's', encode(invalid)), denied(400));
    for (let j = i + 1; j < versions.length; j++) {
      const stale = {
        ...binding,
        [versions[i]]: binding[versions[i]] + 1,
        [versions[j]]: 'invalid',
      };
      await assert.rejects(
        sprintScope(fixture().tx, project, 's', encode(stale)),
        denied(409, 'page-changed'),
      );
      delete stale[versions[j]];
      stale.extra = true;
      await assert.rejects(
        sprintScope(fixture().tx, project, 's', encode(stale)),
        denied(409, 'page-changed'),
      );
    }
  }
  for (const value of [
    null,
    { ...binding, extra: true },
    { ...binding, o: 0 },
    { ...binding, w: 'other', projectVersion: 1 },
    { ...binding, o: '9223372036854775808', projectVersion: 1 },
  ])
    await assert.rejects(sprintScope(fixture().tx, project, 's', encode(value)), denied(400));
  const f = fixture();
  let lookedUp = false;
  f.tx.sprintParticipation.findFirst = async () => {
    lookedUp = true;
    return visit;
  };
  await assert.rejects(
    sprintScope(f.tx, project, 's', encode({ ...binding, o: '00' })),
    denied(400),
  );
  assert.equal(lookedUp, true, 'scope ordinal text check remains after anchor lookup');
  const h = fixture();
  const queries = [];
  h.tx.$queryRaw = async (q) => {
    queries.push(q);
    return q.sql.includes('count(*)')
      ? [{ total: 0 }]
      : q.sql.includes('SELECT id FROM items')
        ? [{ id: 'visit' }]
        : [];
  };
  h.tx.sprintScopeEvent.findMany = async () => [];
  h.tx.activityEvent.findMany = async () => [];
  for (const o of ['0', '9223372036854775807', '09223372036854775807'])
    await planningHistory(
      h.tx,
      project,
      { taskId: 't' },
      encode({ ...binding, kind: 'task-sprint-history', scope: 't', o }),
    );
  assert.ok(queries.some((q) => q.values.includes(9223372036854775807n)));
});
