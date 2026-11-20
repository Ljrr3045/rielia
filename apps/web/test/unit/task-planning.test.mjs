import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTaskPlanningTransport,
  TaskPlanningFailure,
} from '../../src/lib/task-planning-client.ts';
import { createSprintPlanningTransport } from '../../src/lib/sprint-client.ts';
import { proxyProjectTask } from '../../src/lib/project-task-proxy.ts';
const at = '2026-11-19T00:00:00.000Z';
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
  creator: { principalId: 'h', name: 'Human', kind: 'human', active: true },
  provenance: { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: true, canStart: false, canChangeScope: true },
  url: '/sprints/s',
};
const planning = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  taskRevision: 5,
  sprintRevision: 8,
  snapshot: { version: 2, status: 'todo', estimatePoints: 0, parentTaskId: null, archivedAt: null },
  currentParticipation: { id: 'visit', sprint },
  capabilities: { canEstimate: true, canChangeScope: true },
};
const op = {
  activityId: 'activity',
  type: 'set-task-sprint',
  sprintId: 's',
  enteredVisitId: 'visit',
  exitedVisitId: null,
};
const input = {
  expectedTaskVersion: 2,
  expectedCurrentParticipationId: null,
  expectedSourceVersion: null,
  targetSprintId: 's',
  expectedTargetVersion: 2,
};
const signal = () => new AbortController().signal;
test('planning transport preserves exact explicit null/zero payload and original keys without automatic retry', async (t) => {
  const calls = [];
  let value = planning,
    error = null;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    if (error) throw error;
    return Response.json(value);
  });
  const transport = createTaskPlanningTransport({ baseURL: 'https://app.example.test' });
  assert.deepEqual(await transport.planning('w', 'p', 't', signal()), planning);
  await transport.estimate(
    'w',
    'p',
    't',
    { expectedVersion: 2, estimatePoints: 0 },
    'estimate-key',
    signal(),
  );
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedVersion: 2, estimatePoints: 0 });
  await transport.estimate(
    'w',
    'p',
    't',
    { expectedVersion: 2, estimatePoints: null },
    'clear-key',
    signal(),
  );
  assert.equal(JSON.parse(calls.at(-1).init.body).estimatePoints, null);
  value = { operation: op, current: { ...planning, currentParticipation: null } };
  error = new Error('committed response lost');
  const before = calls.length;
  await assert.rejects(
    transport.setSprint('w', 'p', 't', input, 'captured-key', signal()),
    /response lost/,
  );
  assert.equal(calls.length, before + 1);
  const original = calls.at(-1);
  error = null;
  const retry = await transport.setSprint('w', 'p', 't', input, 'captured-key', signal());
  assert.deepEqual(retry.operation, op);
  assert.equal(retry.current.currentParticipation, null);
  assert.equal(calls.at(-1).init.body, original.init.body);
  assert.equal(calls.at(-1).init.headers['Idempotency-Key'], 'captured-key');
  assert.equal(original.init.redirect, 'error');
  assert.equal(original.init.cache, 'no-store');
  assert.equal(original.init.credentials, 'same-origin');
  value = { operation: { ...op, type: 'start-sprint', enteredVisitId: null }, current: sprint };
  await transport.start(
    'w',
    'p',
    's',
    { expectedVersion: 2, expectedProjectVersion: 2, expectedTaskRevision: 5 },
    'start-key',
    signal(),
  );
  assert.ok(calls.at(-1).url.endsWith('/sprints/s/start'));
});
test('bounded scope/history transports validate exact target and encode continuation', async (t) => {
  const totals = {
    done: 0,
    canceled: 0,
    pending: 0,
    donePoints: 0,
    canceledPoints: 0,
    pendingPoints: 0,
    unestimated: 0,
    children: 0,
    archived: 0,
  };
  const base = {
    workspaceId: 'w',
    projectId: 'p',
    taskRevision: 5,
    sprintRevision: 8,
    total: 0,
    items: [],
    nextCursor: null,
  };
  let value = {
      ...base,
      sprintId: 's',
      sprintVersion: 3,
      currentTotals: totals,
      startTotals: totals,
      removed: 0,
    },
    last;
  t.mock.method(globalThis, 'fetch', async (url) => {
    last = String(url);
    return Response.json(value);
  });
  const transport = createTaskPlanningTransport();
  await transport.scope('w', 'p', 's', signal(), 'a_b');
  assert.ok(last.endsWith('/scope?cursor=a_b'));
  value = { ...base, sprintId: 's', taskId: null };
  await transport.sprintHistory('w', 'p', 's', signal());
  value = { ...base, sprintId: null, taskId: 't' };
  await transport.taskHistory('w', 'p', 't', signal());
  value = { ...base, sprintId: 'foreign', taskId: null };
  await assert.rejects(transport.sprintHistory('w', 'p', 's', signal()), { status: 502 });
  await assert.rejects(transport.scope('w', 'p', 's', signal()), { status: 502 });
  value = { ...base, sprintId: null, taskId: 'foreign' };
  await assert.rejects(transport.taskHistory('w', 'p', 't', signal()), { status: 502 });
});
test('planning errors retain only currently scoped conflict DTOs, correlation and status; malformed bodies never look saved', async (t) => {
  let response;
  t.mock.method(globalThis, 'fetch', async () => response);
  const transport = createTaskPlanningTransport();
  response = Response.json(
    { code: 'version-conflict', current: planning },
    { status: 409, headers: { 'x-request-id': 'request' } },
  );
  await assert.rejects(
    transport.estimate('w', 'p', 't', { expectedVersion: 1, estimatePoints: 0 }, 'key', signal()),
    (e) =>
      e instanceof TaskPlanningFailure &&
      e.code === 'version-conflict' &&
      e.current.taskId === 't' &&
      e.requestId === 'request',
  );
  for (const current of [
    { ...planning, workspaceId: 'foreign' },
    { ...planning, taskId: 'other' },
    sprint,
    {},
  ]) {
    response = Response.json({ code: 'current-sprint-conflict', current }, { status: 409 });
    await assert.rejects(
      transport.setSprint('w', 'p', 't', input, 'key', signal()),
      (e) => e.status === 409 && e.current === null,
    );
  }
  response = Response.json({ code: 'version-conflict', current: sprint }, { status: 409 });
  await assert.rejects(
    transport.start('w', 'p', 's', {}, 'key', signal()),
    (e) => e.current.state === 'active',
  );
  for (const [status, expected] of [
    [200, 502],
    [503, 503],
  ]) {
    response = new Response('invalid', { status });
    await assert.rejects(transport.planning('w', 'p', 't', signal()), { status: expected });
  }
  response = Response.json({ ...planning, projectId: 'foreign' });
  await assert.rejects(transport.planning('w', 'p', 't', signal()), { status: 502 });
  response = Response.json({
    operation: { ...op, type: 'start-sprint' },
    current: { ...sprint, id: 'other' },
  });
  await assert.rejects(transport.start('w', 'p', 's', {}, 'key', signal()), { status: 502 });
});
test('legacy planning transport accepts current active normal/conflict/create-edit replay DTOs', async (t) => {
  let value = sprint,
    status = 200;
  t.mock.method(globalThis, 'fetch', async () => Response.json(value, { status }));
  const transport = createSprintPlanningTransport();
  assert.equal((await transport.sprint('w', 'p', 's', signal())).state, 'active');
  for (const type of ['create-sprint', 'edit-sprint']) {
    const command = {
      type,
      workspaceId: 'w',
      projectId: 'p',
      sprintId: 's',
      expectedVersion: 1,
      expectedProjectVersion: 2,
      fields: {
        name: 'Sprint',
        goal: 'Goal',
        startDate: '2026-11-19',
        endDateExclusive: '2026-11-20',
      },
    };
    assert.equal((await transport.mutate(command, 'original-key', signal())).state, 'active');
    status = 409;
    value = { code: 'version-conflict', current: sprint };
    await assert.rejects(
      transport.mutate(command, 'key', signal()),
      (e) => e.current.state === 'active',
    );
    status = 200;
    value = sprint;
  }
});
test('proxy exposes only implemented planning routes and retains scalar cursors/body/key and same-origin boundaries', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({});
  });
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p';
  for (const path of [
    '/tasks/t/planning',
    '/tasks/t/sprint-history?cursor=abc',
    '/sprints/s/scope?cursor=abc',
    '/sprints/s/history',
  ])
    assert.equal((await proxyProjectTask(new Request(root + path))).status, 200);
  const headers = {
    origin: 'https://app.example.test',
    'content-type': 'application/json',
    'idempotency-key': 'captured-key',
  };
  for (const path of ['/tasks/t/planning', '/tasks/t/sprint', '/sprints/s/start']) {
    const body = JSON.stringify(input);
    assert.equal(
      (await proxyProjectTask(new Request(root + path, { method: 'POST', headers, body }))).status,
      200,
    );
    assert.equal(calls.at(-1).init.headers.get('idempotency-key'), 'captured-key');
  }
  for (const path of [
    '/sprints/s/close',
    '/sprints/s/close-preview',
    '/tasks/t/sprint',
    '/sprints/s/history?cursor=a&cursor=b',
    '/sprints/s/scope?view=active',
    '/tasks/t/planning?cursor=a',
  ])
    assert.equal((await proxyProjectTask(new Request(root + path))).status, 400);
  await proxyProjectTask(
    new Request(root + '/sprints/s/start', {
      method: 'POST',
      headers: { ...headers, origin: 'https://hostile.test' },
      body: '{}',
    }),
  );
  assert.equal(calls.at(-1).init.headers.get('origin'), 'https://hostile.test');
});
