import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { ForbiddenException } from '@nestjs/common';
import {
  closePreview,
  closeDestination,
  closingPage,
  consequenceBinding,
} from '../../dist/projects/sprint-close-preview.js';
import { closeSprint } from '../../dist/projects/sprint-close.js';
import { closureView, closureOutcomes } from '../../dist/projects/sprint-closure-read.js';
import { SprintService } from '../../dist/projects/sprint.service.js';
import { SprintController } from '../../dist/projects/sprint.controller.js';
import { canonical } from '../../dist/projects/project-task-input.js';
const at = new Date('2026-11-19T00:00:00.000Z'),
  key = '11111111-1111-4111-8111-111111111111';
const project = {
  id: 'p',
  workspaceId: 'w',
  version: 2,
  taskRevision: 8,
  sprintRevision: 10,
  mode: 'kanban',
  archivedAt: null,
};
const actor = {
  actorPrincipalId: 'h',
  principalKind: 'human',
  workspaceId: 'w',
  executionMode: 'human',
  source: 'web',
  role: 'owner',
  grantId: null,
};
const source = {
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  version: 4,
  state: 'active',
  startedAt: at,
  closedAt: null,
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
const task = {
  id: 't',
  workspaceId: 'w',
  projectId: 'p',
  version: 3,
  status: 'todo',
  estimatePoints: 0,
  parentTaskId: null,
  archivedAt: null,
};
function fixture(options = {}) {
  const calls = [],
    state = {
      source: { ...source, ...options.source },
      target: {
        ...source,
        id: 'dest',
        state: 'planned',
        startedAt: null,
        version: 2,
        ...options.target,
      },
      project: { ...project, ...options.project },
      closure: options.closure ?? null,
      outcomes: options.outcomes ?? [],
    };
  const tasks = options.tasks ?? [task],
    visits = tasks.map((t, i) => ({
      id: `visit_${String(i).padStart(4, '0')}`,
      taskId: t.id,
      sprintId: 's',
      exitedAt: null,
    }));
  const hit = (name, value) => async (args) => {
    calls.push([name, args]);
    if (options.fail === name) throw new Error(`injected ${name}`);
    return typeof value === 'function' ? value(args) : value;
  };
  const tx = {
    $queryRaw: hit('lock', []),
    $executeRaw: hit('exits', tasks.length),
    task: { findMany: hit('tasks', tasks) },
    project: { findUniqueOrThrow: hit('project', () => state.project) },
    sprint: {
      findUnique: hit('sprint', (a) =>
        a.where.workspaceId_projectId_id.id === 's'
          ? state.source
          : a.where.workspaceId_projectId_id.id === 'dest'
            ? state.target
            : null,
      ),
      findFirst: hit('active', { id: 's' }),
      update: hit('sprint.write', (a) => {
        const row = a.where.workspaceId_projectId_id.id === 's' ? state.source : state.target;
        Object.assign(row, a.data, { version: row.version + 1 });
        return row;
      }),
    },
    sprintParticipation: { findMany: hit('visits', visits), createMany: hit('entries', {}) },
    sprintClosure: {
      create: hit('closure.write', (a) => (state.closure = a.data)),
      findUnique: hit('closure', () => state.closure),
    },
    sprintClosingOutcome: {
      createMany: hit('outcomes.write', (a) => (state.outcomes = a.data)),
      findMany: hit('outcomes', () => state.outcomes),
    },
    sprintScopeEvent: { create: hit('event', {}) },
    executionGrant: {
      findUniqueOrThrow: hit(
        'grant',
        options.grant ?? {
          id: 'grant',
          allowedOperations: ['read', 'write'],
          createdAt: at,
          expiresAt: new Date('2026-11-20Z'),
          revokedAt: null,
        },
      ),
    },
    membership: {
      findMany: hit('people', [
        {
          principalId: 'h',
          state: 'active',
          principal: { displayName: 'Human', kind: 'human', state: 'active' },
        },
      ]),
    },
    activityEvent: { create: hit('activity', {}) },
    outboxEvent: { create: hit('outbox', {}) },
    projectTaskOperation: {
      findUnique: hit('receipt.read', options.receipt ?? null),
      create: hit('receipt', {}),
    },
  };
  const context = {};
  const projects = {
    planningOperation: async (c, w, p, mode, work) => {
      calls.push(['authority', mode]);
      assert.equal(c, context);
      assert.equal(w, 'w');
      assert.equal(p, 'p');
      if (options.denied) throw new ForbiddenException();
      if (mode === 'write') await tx.$queryRaw(['Project FOR UPDATE']);
      return work(tx, options.actor ?? actor, options.canWrite ?? true, state.project);
    },
  };
  return {
    tx,
    state,
    calls,
    context,
    projects,
    visits,
    tasks,
    service: new SprintService(projects),
  };
}
async function preview(f, destination = 'backlog', cursor) {
  return (await closePreview(f.tx, actor, true, f.state.project, 's', destination, cursor)).preview;
}
const body = (v) =>
  Object.fromEntries(
    [
      'expectedVersion',
      'expectedProjectVersion',
      'expectedTaskRevision',
      'expectedSprintRevision',
      'expectedTargetVersion',
      'destination',
      'previewSchema',
      'previewHash',
    ].map((k) => [k, v[k]]),
  );
const run = (f, input, k = key) =>
  closeSprint(f.projects, f.context, 'w', 'p', 's', k, 'request', input);
test('complete preview binds 103 participants, top-level totals, independent archived children and full paging', async () => {
  const tasks = Array.from({ length: 103 }, (_, i) => ({
    ...task,
    id: `t${i}`,
    status: i === 0 ? 'done' : i === 1 ? 'canceled' : 'todo',
    estimatePoints: i === 2 ? null : i === 0 ? 7 : 0,
    parentTaskId: i === 102 ? 'parent' : null,
    archivedAt: i === 102 ? at : null,
  }));
  const f = fixture({ tasks }),
    v = await preview(f, 'dest');
  assert.equal(v.total, 103);
  assert.equal(v.items.length, 100);
  assert.equal(v.pendingParticipants, 101);
  assert.equal(v.totals.pending, 100);
  assert.equal(v.totals.donePoints, 7);
  assert.equal(v.totals.unestimated, 1);
  assert.equal(v.totals.children, 1);
  assert.equal(v.totals.archived, 1);
  assert.ok(v.canClose);
  const last = await preview(f, 'dest', v.nextCursor);
  assert.equal(last.items.length, 3);
  assert.equal(last.previewHash, v.previewHash);
  assert.equal(last.nextCursor, null);
  assert.equal(last.items.at(-1).snapshot.archivedAt, at.toISOString());
  await assert.rejects(
    preview(f, 'backlog', v.nextCursor),
    (e) => e.getResponse().code === 'page-changed',
  );
});
test('child-only pending still requires a destination, zero/null/offscale and empty previews retain semantics', async () => {
  const f = fixture({
      tasks: [{ ...task, parentTaskId: 'parent', estimatePoints: null, archivedAt: at }],
    }),
    v = await preview(f, null);
  assert.equal(v.totals.pending, 0);
  assert.equal(v.pendingParticipants, 1);
  assert.equal(v.canClose, false);
  assert.equal(v.items[0].disposition, 'pending');
  await assert.rejects(run(f, body(v)), (e) => e.getResponse().code === 'destination-required');
  const empty = fixture({ tasks: [] });
  const e = await preview(empty, null);
  assert.equal(e.canClose, true);
  assert.equal(e.total, 0);
  const closed = await run(empty, body(e));
  assert.equal(closed.closure.total, 0);
  assert.equal(empty.calls.filter((x) => x[0] === 'outcomes.write').length, 0);
});
test('binding changes with every subject/grant/scope/version/revision/destination/snapshot consequence', () => {
  const items = [
    {
      participationId: 'v',
      taskId: 't',
      snapshot: {
        version: 3,
        status: 'todo',
        estimatePoints: 0,
        parentTaskId: null,
        archivedAt: null,
      },
      disposition: 'backlog',
    },
  ];
  const bind = (
      a = actor,
      p = project,
      s = { id: 's', version: 4 },
      t = null,
      d = 'backlog',
      i = items,
    ) => consequenceBinding(a, p, s, t, d, i),
    original = bind();
  for (const changed of [
    bind({ ...actor, actorPrincipalId: 'other' }),
    bind({ ...actor, grantId: 'g' }),
    bind({ ...actor, role: 'member' }),
    ...['version', 'taskRevision', 'sprintRevision'].map((k) =>
      bind(actor, { ...project, [k]: project[k] + 1 }),
    ),
    bind(actor, project, { id: 's', version: 5 }),
    bind(actor, project, { id: 's', version: 4 }, { id: 'dest', version: 2 }, 'dest'),
    ...['version', 'status', 'estimatePoints', 'parentTaskId', 'archivedAt'].map((k) =>
      bind(actor, project, undefined, null, 'backlog', [
        {
          ...items[0],
          snapshot: {
            ...items[0].snapshot,
            [k]: {
              version: 4,
              status: 'done',
              estimatePoints: null,
              parentTaskId: 'parent',
              archivedAt: at.toISOString(),
            }[k],
          },
        },
      ]),
    ),
  ])
    assert.notEqual(changed, original);
  assert.equal(bind(), original);
});
test('preview rejects denied, archived, inactive, missing/active/self target and malformed/bound cursor', async () => {
  for (const [options, destination, code] of [
    [{ project: { archivedAt: at } }, null, 'archived'],
    [{ source: { state: 'planned' } }, null, 'invalid-transition'],
    [{ target: { state: 'active' } }, 'dest', 'invalid-transition'],
    [{}, 's', 'invalid-transition'],
  ]) {
    const f = fixture(options);
    await assert.rejects(preview(f, destination), (e) => e.getResponse().code === code);
  }
  const f = fixture();
  await assert.rejects(
    closePreview(f.tx, actor, false, project, 's', null),
    (e) => e.getStatus() === 403,
  );
  await assert.rejects(preview(f, 'missing'), (e) => e.getStatus() === 403);
  for (const cursor of [
    '!',
    'e30',
    Buffer.from(JSON.stringify({ v: 1, binding: 'bad', anchor: 'a' })).toString('base64url'),
  ])
    await assert.rejects(preview(f, null, cursor));
  const c = closingPage(
    { scope: 'x' },
    Array.from({ length: 101 }, (_, i) => `id${i}`),
  );
  const decoded = JSON.parse(Buffer.from(c.nextCursor, 'base64url'));
  decoded.anchor = 'missing';
  assert.throws(() =>
    closingPage({ scope: 'x' }, ['a'], Buffer.from(JSON.stringify(decoded)).toString('base64url')),
  );
  assert.equal(closeDestination(undefined), null);
  assert.equal(closeDestination(null), null);
  assert.equal(closeDestination('backlog'), 'backlog');
  assert.throws(() => closeDestination('../bad'));
});
test('aggregate close touches each Sprint once, preserves Task content and orders journal effects exactly once', async () => {
  const f = fixture({
    tasks: [
      task,
      { ...task, id: 'child', parentTaskId: 't', archivedAt: at },
      { ...task, id: 'done', status: 'done' },
      { ...task, id: 'cancel', status: 'canceled' },
    ],
  });
  const input = body(await preview(f, 'dest'));
  f.calls.length = 0;
  const value = await run(f, input);
  assert.equal(value.current.state, 'closed');
  assert.equal(value.closure.pendingParticipants, 2);
  assert.equal(value.closure.total, 4);
  assert.equal(value.closure.totals.children, 1);
  assert.equal(f.calls.filter((x) => x[0] === 'sprint.write').length, 2);
  assert.equal(f.calls.filter((x) => x[0] === 'event').length, 2);
  assert.equal(f.calls.find((x) => x[0] === 'entries')[1].data.length, 2);
  assert.equal(f.state.outcomes[1].snapshot.archivedAt, at.toISOString());
  assert.deepEqual(f.tasks[0], task);
  const names = f.calls.map((x) => x[0]);
  for (const name of [
    'activity',
    'closure.write',
    'outcomes.write',
    'exits',
    'entries',
    'outbox',
    'receipt',
  ])
    assert.equal(names.filter((x) => x === name).length, 1, name);
  for (const [a, b] of [
    ['authority', 'receipt.read'],
    ['receipt.read', 'visits'],
    ['visits', 'tasks'],
    ['sprint.write', 'activity'],
    ['activity', 'closure.write'],
    ['closure.write', 'outcomes.write'],
    ['outcomes.write', 'exits'],
    ['exits', 'entries'],
    ['entries', 'event'],
    ['event', 'outbox'],
    ['outbox', 'receipt'],
  ])
    assert.ok(names.indexOf(a) < names.indexOf(b), `${a} before ${b}`);
  const pages = await closureOutcomes(f.tx, f.state.project, 's');
  assert.equal(pages.items.length, 4);
  assert.deepEqual((await closureView(f.tx, f.state.project, 's')).totals, value.closure.totals);
});
test('stale full binding/version and invalid inputs fail before any durable write', async () => {
  for (const field of [
    'previewHash',
    'expectedVersion',
    'expectedProjectVersion',
    'expectedTaskRevision',
    'expectedSprintRevision',
    'expectedTargetVersion',
  ]) {
    const f = fixture(),
      input = body(await preview(f, 'dest'));
    input[field] = field === 'previewHash' ? 'f'.repeat(64) : input[field] + 1;
    await assert.rejects(run(f, input), (e) => e.getResponse().code === 'close-preview-changed');
    assert.equal(
      f.calls.some((x) => x[0] === 'activity'),
      false,
    );
  }
  const f = fixture(),
    input = body(await preview(f));
  for (const payload of [
    null,
    {},
    { ...input, actorPrincipalId: 'spoof' },
    { ...input, destination: undefined },
    { ...input, previewSchema: 2 },
    { ...input, expectedVersion: 0 },
  ])
    assert.throws(() => run(f, payload));
  assert.throws(() => run(f, input, 'invalid'));
});
test('original close receipt reauthorizes before replay and ignores later archive/mode/target/task changes', async () => {
  const f = fixture(),
    input = body(await preview(f)),
    closed = await run(f, input),
    receipt = f.calls.find((x) => x[0] === 'receipt')[1].data;
  const replay = fixture({
    receipt,
    source: { ...f.state.source },
    closure: f.state.closure,
    outcomes: f.state.outcomes,
    project: { archivedAt: at, mode: 'scrum', taskRevision: 999 },
    tasks: [{ ...task, status: 'done', version: 99 }],
  });
  const result = await run(replay, input);
  assert.deepEqual(result.operation, closed.operation);
  assert.deepEqual(result.closure, closed.closure);
  assert.equal(result.current.capabilities.canEdit, false);
  assert.equal(
    replay.calls.some((x) => ['sprint.write', 'visits', 'tasks', 'activity'].includes(x[0])),
    false,
  );
  await assert.rejects(
    run(fixture({ receipt, denied: true }), input),
    (e) => e.getStatus() === 403,
  );
  await assert.rejects(
    run(fixture({ receipt }), { ...input, previewHash: 'f'.repeat(64) }),
    (e) => e.getResponse().code === 'idempotency-conflict',
  );
  for (const response of [
    null,
    { kind: 'task-planning' },
    { kind: 'sprint-close', sprintId: 's', closureId: 'c', activityId: 'a' },
  ]) {
    const bad = fixture({
      receipt: { ...receipt, response },
      closure: f.state.closure,
      outcomes: f.state.outcomes,
    });
    await assert.rejects(run(bad, input), (e) => e.getStatus() === 503);
  }
  assert.equal(
    receipt.requestHash,
    createHash('sha256')
      .update(JSON.stringify(canonical(['close-sprint', ['p', 's'], input])))
      .digest('hex'),
  );
});

test('granted close and replay preserve receipt namespace and recheck current authority first', async () => {
  const granted = {
    ...actor,
    executionMode: 'delegated',
    source: 'mcp',
    role: 'member',
    grantId: 'grant',
  };
  const f = fixture({ actor: granted });
  const reviewed = await f.service.closePreview(f.context, 'w', 'p', 's', 'backlog');
  const input = body(reviewed);
  const closed = await run(f, input);
  const lookup = f.calls.find(([name]) => name === 'receipt.read')[1].where
    .workspaceId_actorPrincipalId_executionScope_key;
  const receipt = f.calls.find(([name]) => name === 'receipt')[1].data;
  assert.deepEqual(lookup, {
    workspaceId: 'w',
    actorPrincipalId: 'h',
    executionScope: 'grant:grant',
    key,
  });
  assert.equal(receipt.executionScope, 'grant:grant');
  assert.equal(receipt.response.closureId, closed.operation.closureId);
  const replay = fixture({
    actor: granted,
    receipt,
    source: f.state.source,
    closure: f.state.closure,
    outcomes: f.state.outcomes,
  });
  const result = await run(replay, input);
  assert.deepEqual(result.operation, closed.operation);
  assert.equal(
    replay.calls.find(([name]) => name === 'receipt.read')[1].where
      .workspaceId_actorPrincipalId_executionScope_key.executionScope,
    'grant:grant',
  );
  assert.equal(
    replay.calls.some(([name]) =>
      ['sprint.write', 'closure.write', 'outcomes.write', 'activity', 'outbox', 'receipt'].includes(
        name,
      ),
    ),
    false,
  );
  const denied = fixture({ actor: granted, receipt, denied: true });
  await assert.rejects(run(denied, input), (error) => error.getStatus() === 403);
  assert.deepEqual(denied.calls, [['authority', 'write']]);
});
test('each durable collaborator failure prevents subsequent receipt and result; real SQL rollback is separately tested', async () => {
  for (const stage of [
    'sprint.write',
    'activity',
    'closure.write',
    'outcomes.write',
    'exits',
    'entries',
    'event',
    'outbox',
    'receipt',
  ]) {
    const f = fixture({ fail: stage }),
      input = body(await preview(f, 'dest'));
    await assert.rejects(run(f, input), new RegExp(stage.replace('.', '\\.')));
    const names = f.calls.map((x) => x[0]);
    if (stage !== 'receipt') assert.equal(names.includes('receipt'), false);
  }
});
test('service/controller keep closing requests scoped and transport-only', async () => {
  const f = fixture();
  assert.equal((await f.service.closePreview(f.context, 'w', 'p', 's', 'backlog')).sprintId, 's');
  const input = body(await preview(f));
  const value = await f.service.close(f.context, 'w', 'p', 's', key, 'r', input);
  assert.equal((await f.service.closure(f.context, 'w', 'p', 's')).id, value.closure.id);
  assert.equal((await f.service.outcomes(f.context, 'w', 'p', 's')).total, 1);
  const calls = [],
    services = new Proxy(
      {},
      {
        get:
          (_t, name) =>
          (...args) => {
            calls.push([name, args]);
            return Promise.resolve('ok');
          },
      },
    ),
    req = { headers: { 'idempotency-key': key }, body: input },
    res = {};
  const controller = new SprintController(services, {
    respond: (r, o, w, mode, work) => {
      assert.equal(r, req);
      assert.equal(o, res);
      assert.equal(w, 'w');
      return work(f.context, 'r', 'active', 'cursor', {}, 'backlog');
    },
  });
  for (const method of ['closePreview', 'close', 'closure', 'outcomes'])
    assert.equal(await controller[method]('w', 'p', 's', req, res), 'ok');
  assert.deepEqual(
    calls.map((x) => x[0]),
    ['closePreview', 'close', 'closure', 'outcomes'],
  );
  const missing = fixture();
  await assert.rejects(closureView(missing.tx, project, 's'), (e) => e.getStatus() === 403);
});
test('closed metadata denies new writes after current authority and receipt admission', async () => {
  const f = fixture({ source: { state: 'closed', closedAt: at } });
  await assert.rejects(
    f.service.save(
      f.context,
      'w',
      'p',
      key,
      'r',
      {
        expectedVersion: 4,
        name: 'Retained',
        goal: 'Goal',
        startDate: '2026-11-19',
        endDateExclusive: '2026-11-20',
      },
      's',
    ),
    (e) => e.getResponse().code === 'invalid-transition',
  );
  assert.equal(
    f.calls.some((x) => x[0] === 'sprint.write'),
    false,
  );
});
test('grant policy content is included in the freshness binding and outcomes page is scope-bound', async () => {
  const f = fixture(),
    granted = { ...actor, grantId: 'grant', executionMode: 'delegated', source: 'mcp' };
  const a = await closePreview(f.tx, granted, true, project, 's', 'backlog');
  const g = fixture({
    grant: {
      id: 'grant',
      allowedOperations: ['read', 'write'],
      createdAt: at,
      expiresAt: new Date('2026-11-21Z'),
      revokedAt: null,
    },
  });
  assert.notEqual(
    a.preview.previewHash,
    (await closePreview(g.tx, granted, true, project, 's', 'backlog')).preview.previewHash,
  );
  const many = fixture({
    tasks: Array.from({ length: 101 }, (_, i) => ({ ...task, id: `t${i}` })),
  });
  await run(many, body(await preview(many)));
  const page = await closureOutcomes(many.tx, project, 's');
  assert.equal(page.items.length, 100);
  assert.equal((await closureOutcomes(many.tx, project, 's', page.nextCursor)).items.length, 1);
});
