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
test('Sprint schema consumption rejects malformed scalars and keeps extra keys, scoped conflicts and terminal denials', async (t) => {
  let value = sprint;
  let status = 200;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json(value, { status, headers: { 'x-request-id': 'request' } });
  });
  const transport = createSprintPlanningTransport();
  const command = {
    type: 'edit-sprint',
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    expectedVersion: 1,
    fields,
  };
  for (const malformed of [
    { ...sprint, creator: { ...sprint.creator, kind: ['human'] } },
    { ...sprint, creator: { ...sprint.creator, kind: { value: 'human' } } },
    {
      ...sprint,
      provenance: {
        ...sprint.provenance,
        executionMode: ['delegated'],
        source: 'mcp',
        grantId: 'g',
      },
    },
    {
      ...sprint,
      provenance: {
        ...sprint.provenance,
        executionMode: { value: 'delegated' },
        source: 'mcp',
        grantId: 'g',
      },
    },
  ]) {
    value = malformed;
    await assert.rejects(transport.sprint('w', 'p', 's', signal()), { status: 502 });
    await assert.rejects(transport.mutate(command, 'original-key', signal()), { status: 502 });
    value = { ...page, items: [malformed] };
    await assert.rejects(transport.sprints('w', 'p', signal()), { status: 502 });
    status = 409;
    value = { code: 'version-conflict', current: malformed };
    await assert.rejects(
      transport.mutate(command, 'original-key', signal()),
      (error) =>
        error.status === 409 &&
        error.code === 'version-conflict' &&
        error.current === null &&
        error.requestId === 'request',
    );
    status = 200;
  }
  const enriched = {
    ...sprint,
    future: { retained: true },
    creator: { ...sprint.creator, future: true },
    provenance: { ...sprint.provenance, future: true },
    capabilities: { ...sprint.capabilities, future: true },
  };
  value = enriched;
  assert.deepEqual(await transport.sprint('w', 'p', 's', signal()), enriched);
  assert.deepEqual(await transport.mutate(command, 'original-key', signal()), enriched);
  status = 409;
  value = { code: 'version-conflict', current: enriched };
  await assert.rejects(transport.mutate(command, 'original-key', signal()), (error) => {
    assert.deepEqual(error.current, enriched);
    return error.status === 409;
  });
  for (status of [401, 403]) {
    value = { code: 'forbidden' };
    const before = calls;
    await assert.rejects(
      transport.mutate(command, 'original-key', signal()),
      (error) => error.status === status && error.current === null,
    );
    assert.equal(calls, before + 1);
  }
  status = 200;
  const configure = {
    type: 'configure-planning',
    workspaceId: 'w',
    projectId: 'p',
    expectedVersion: 2,
    settings,
  };
  for (const invalid of [sprint, { ...planning, projectId: 'foreign' }]) {
    value = invalid;
    await assert.rejects(transport.mutate(configure, 'configure-key', signal()), { status: 502 });
  }
  value = { ...planning, future: { retained: true } };
  assert.deepEqual(await transport.planning('w', 'p', signal()), value);
  assert.deepEqual(
    await transport.mutate(
      {
        type: 'configure-planning',
        workspaceId: 'w',
        projectId: 'p',
        expectedVersion: 2,
        settings,
      },
      'configure-key',
      signal(),
    ),
    value,
  );
  value = { ...page, items: [enriched], future: true };
  assert.deepEqual(await transport.sprints('w', 'p', signal()), value);
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
  for (const path of [
    '/planning',
    '/sprints',
    '/sprints/s',
    '/sprints/s/scope',
    '/sprints?cursor=' + 'a'.repeat(200),
  ])
    assert.equal((await proxyProjectTask(new Request(root + path))).status, 200);
  for (const path of [
    '/sprints/s/start',
    '/sprints/s/close',
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

test('planning HTTP retains original guarded objects and applies runtime provenance admission after return', async (t) => {
  let value = { ...sprint, future: { retained: true } };
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 200,
    headers: new globalThis.Headers(),
    json: async () => value,
  }));
  const transport = createSprintPlanningTransport();
  assert.strictEqual(await transport.sprint('w', 'p', 's', signal()), value);
  value = { ...planning, future: true };
  assert.strictEqual(await transport.planning('w', 'p', signal()), value);
  value = { ...page, future: true };
  assert.strictEqual(await transport.sprints('w', 'p', signal()), value);
  value = {
    ...sprint,
    provenance: {
      ...sprint.provenance,
      executionMode: 'delegated',
      source: 'web',
      grantId: 'grant',
    },
  };
  await assert.rejects(transport.sprint('w', 'p', 's', signal()), { status: 502, requestId: null });
});

test('planning HTTP keeps any2xx/content-type-independent JSON and error status/current/request-ID distinctions', async (t) => {
  let response;
  t.mock.method(globalThis, 'fetch', async () => response);
  const transport = createSprintPlanningTransport();
  const command = {
    type: 'configure-planning',
    workspaceId: 'w',
    projectId: 'p',
    expectedVersion: 2,
    settings,
  };
  for (const status of [200, 201, 202]) {
    response = new Response(JSON.stringify(planning), {
      status,
      headers: { 'content-type': 'text/plain' },
    });
    assert.deepEqual(await transport.mutate(command, 'original-key', signal()), planning);
  }
  for (const status of [400, 401, 403, 408, 409, 418, 503]) {
    response = Response.json(
      { code: 'arbitrary-code', current: { ...planning, future: true } },
      { status, headers: { 'x-request-id': 'original-id' } },
    );
    await assert.rejects(
      transport.mutate(command, 'original-key', signal()),
      (error) =>
        error instanceof SprintPlanningFailure &&
        error.status === status &&
        error.code === 'arbitrary-code' &&
        error.current.future === true &&
        error.requestId === 'original-id',
    );
  }
  response = Response.json(
    { code: { invalid: true }, current: { ...planning, projectId: 'foreign' } },
    { status: 409 },
  );
  await assert.rejects(transport.mutate(command, 'original-key', signal()), {
    status: 409,
    code: null,
    current: null,
    requestId: null,
  });
  response = Response.json(
    { ...planning, projectId: 'foreign' },
    { headers: { 'x-request-id': 'not-retained-for-shape-error' } },
  );
  await assert.rejects(transport.planning('w', 'p', signal()), { status: 502, requestId: null });
});

test('planning HTTP malformed, empty, primitive and body-rejection failures retain status/header and remain single-send', async (t) => {
  let response;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (response instanceof Error) throw response;
    return response;
  });
  const transport = createSprintPlanningTransport();
  for (const [status, text] of [
    [200, 'broken'],
    [200, ''],
    [204, null],
    [205, null],
    [409, 'broken'],
    [503, ''],
    [503, 'null'],
  ]) {
    response = new Response(text, { status, headers: { 'x-request-id': 'parse-id' } });
    const before = calls;
    await assert.rejects(transport.planning('w', 'p', signal()), {
      status: status < 300 ? 502 : status,
      code: null,
      current: null,
      requestId: 'parse-id',
    });
    assert.equal(calls, before + 1);
  }
  response = Response.json(null, { headers: { 'x-request-id': 'shape-id' } });
  await assert.rejects(transport.planning('w', 'p', signal()), { status: 502, requestId: null });
  response = new Response(JSON.stringify(planning), { headers: { 'content-length': '0' } });
  assert.deepEqual(await transport.planning('w', 'p', signal()), planning);
  for (const status of [200, 409]) {
    response = {
      ok: status === 200,
      status,
      headers: new globalThis.Headers({ 'x-request-id': 'body-id' }),
      json: async () => {
        throw new Error('Body failed');
      },
    };
    await assert.rejects(transport.planning('w', 'p', signal()), {
      status: status === 200 ? 502 : status,
      requestId: 'body-id',
    });
  }
  response = new Error('Before headers');
  const original = response;
  await assert.rejects(transport.planning('w', 'p', signal()), (error) => error === original);
});
