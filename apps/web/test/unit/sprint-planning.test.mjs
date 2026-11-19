import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createSprintPlanningTransport,
  SprintPlanningFailure,
} from '../../src/lib/sprint-client.ts';
import { proxyProjectTask } from '../../src/lib/project-task-proxy.ts';
const settings = { mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 2, 5] };
const fields = {
  name: 'Sprint',
  goal: 'Goal',
  startDate: '2026-11-19',
  endDateExclusive: '2026-12-03',
};
const planning = {
  ...settings,
  workspaceId: 'w',
  projectId: 'p',
  projectVersion: 2,
  sprintRevision: 1,
  archivedAt: null,
  capabilities: { canConfigurePlanning: true, canCreateSprint: true },
};
const sprint = {
  ...fields,
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  state: 'planned',
  version: 1,
  timeZone: 'UTC',
  startsAt: '2026-11-19T00:00:00.000Z',
  endsAt: '2026-12-03T00:00:00.000Z',
  createdAt: '2026-11-19T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
  creator: { principalId: 'h', name: 'Human', kind: 'human', active: true },
  provenance: { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: true },
  url: '/api/v1/workspaces/w/projects/p/sprints/s',
};
const page = {
  workspaceId: 'w',
  projectId: 'p',
  revision: 1,
  projectVersion: 2,
  items: [sprint],
  total: 1,
  nextCursor: null,
  capabilities: { canCreate: true },
};
const signal = () => new AbortController().signal;
test('sprint transport preserves scope, captured versions, original mutation key and explicit null-free wire', async (t) => {
  const calls = [];
  let result = planning;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(result);
  });
  const transport = createSprintPlanningTransport({ baseURL: 'https://app.example.test' });
  assert.deepEqual(await transport.planning('w', 'p', signal()), planning);
  result = sprint;
  await transport.sprint('w', 'p', 's', signal());
  result = page;
  await transport.sprints('w', 'p', signal(), 'cursor');
  assert.ok(calls.at(-1).url.endsWith('/sprints?cursor=cursor'));
  result = planning;
  await transport.mutate(
    { type: 'configure-planning', workspaceId: 'w', projectId: 'p', expectedVersion: 2, settings },
    'original-key',
    signal(),
  );
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedVersion: 2, ...settings });
  result = sprint;
  await transport.mutate(
    { type: 'create-sprint', workspaceId: 'w', projectId: 'p', expectedProjectVersion: 2, fields },
    'original-key',
    signal(),
  );
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedProjectVersion: 2, ...fields });
  await transport.mutate(
    {
      type: 'edit-sprint',
      workspaceId: 'w',
      projectId: 'p',
      sprintId: 's',
      expectedVersion: 1,
      fields,
    },
    'original-key',
    signal(),
  );
  assert.equal(calls.at(-1).init.headers['Idempotency-Key'], 'original-key');
  assert.ok(calls.at(-1).url.endsWith('/sprints/s'));
  assert.equal(calls.at(-1).init.redirect, 'error');
  assert.equal(calls.at(-1).init.cache, 'no-store');
});
test('sprint transport rejects mismatched/invalid output, preserves authorized conflict and never retries a lost response', async (t) => {
  let reply = Response.json({ ...sprint, projectId: 'foreign' });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (reply instanceof Error) throw reply;
    return reply;
  });
  const transport = createSprintPlanningTransport();
  await assert.rejects(
    transport.sprint('w', 'p', 's', signal()),
    (e) => e instanceof SprintPlanningFailure && e.status === 502,
  );
  for (const [method, result] of [
    ['planning', { ...planning, workspaceId: 'foreign' }],
    ['sprints', { ...page, items: [{ ...sprint, id: 'bad id' }] }],
  ]) {
    reply = Response.json(result);
    await assert.rejects(transport[method]('w', 'p', signal()), { status: 502 });
  }
  const command = {
    type: 'edit-sprint',
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    expectedVersion: 1,
    fields,
  };
  reply = Response.json(
    { code: 'version-conflict', current: sprint },
    { status: 409, headers: { 'x-request-id': 'request' } },
  );
  await assert.rejects(
    transport.mutate(command, 'key', signal()),
    (e) =>
      e.status === 409 &&
      e.code === 'version-conflict' &&
      e.current.id === 's' &&
      e.requestId === 'request',
  );
  reply = Response.json(
    { code: 'version-conflict', current: { ...sprint, id: 'other' } },
    { status: 409 },
  );
  await assert.rejects(transport.mutate(command, 'key', signal()), (e) => e.current === null);
  reply = new Response('invalid', { status: 200 });
  await assert.rejects(transport.planning('w', 'p', signal()), { status: 502 });
  reply = new Response('invalid', { status: 503 });
  await assert.rejects(transport.planning('w', 'p', signal()), { status: 503 });
  reply = new Error('response lost');
  const before = calls;
  await assert.rejects(transport.mutate(command, 'original-key', signal()), /response lost/);
  assert.equal(calls, before + 1);
  reply = Response.json(planning);
  await assert.rejects(transport.mutate(command, 'key', signal()), { status: 502 });
});
test('proxy allows only implemented sprint paths/scalar cursors and preserves fixed destination/security headers', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(planning, {
      headers: { 'x-request-id': '11111111-1111-4111-8111-111111111111' },
    });
  });
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p';
  for (const path of ['/planning', '/sprints', '/sprints/s', '/sprints?cursor=' + 'a'.repeat(200)])
    assert.equal((await proxyProjectTask(new Request(root + path))).status, 200);
  for (const path of [
    '/sprints/s/start',
    '/sprints/s/close',
    '/sprints/s/scope',
    '/sprints?view=active',
    '/sprints?cursor=a&cursor=b',
    '/sprints/s?cursor=a',
    '/planning?mode=scrum',
  ])
    assert.equal((await proxyProjectTask(new Request(root + path))).status, 400);
  const response = await proxyProjectTask(
    new Request(root + '/planning', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://app.example.test',
        cookie: 'fictional',
        'idempotency-key': 'key',
        'x-forwarded-host': 'hostile.example',
      },
      body: JSON.stringify({ expectedVersion: 2, ...settings }),
    }),
  );
  assert.equal(response.status, 200);
  const call = calls.at(-1);
  assert.ok(call.url.startsWith('http://127.0.0.1:3001/api/v1/workspaces/w/projects/p/planning'));
  assert.equal(call.init.headers.get('x-forwarded-host'), null);
  assert.equal(call.init.headers.get('idempotency-key'), 'key');
  assert.equal(
    (
      await proxyProjectTask(
        new Request(root + '/planning', { headers: { 'x-rielia-execution-mode': 'autonomous' } }),
      )
    ).status,
    400,
  );
});
