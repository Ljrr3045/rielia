import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTaskPlanningTransport,
  TaskPlanningFailure,
} from '../../src/lib/task-planning-client.ts';
import { createSprintPlanningTransport } from '../../src/lib/sprint-client.ts';
import { proxyProjectTask } from '../../src/lib/project-task-proxy.ts';
import { closeInput, sprintPageBinding } from '../../src/lib/sprint-client-state.ts';
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
const signal = () => new AbortController().signal;
const result = {
  operation: { type: 'close-sprint', activityId: 'activity', closureId: 'closure', sprintId: 's' },
  closure,
  current: sprint,
};
test('close transport retains full binding, destination, original body/key and explicit unknown-outcome retry', async (t) => {
  const calls = [];
  let value = preview,
    error = null;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    if (error) throw error;
    return Response.json(value);
  });
  const transport = createTaskPlanningTransport({ baseURL: 'https://app.example.test' });
  assert.deepEqual(
    await transport.closePreview('w', 'p', 's', 'backlog', signal(), 'cursor'),
    preview,
  );
  assert.match(calls.at(-1).url, /destination=backlog&cursor=cursor$/);
  value = { ...preview, destination: null, pendingParticipants: 0, items: [] };
  await transport.closePreview('w', 'p', 's', null, signal());
  assert.ok(calls.at(-1).url.endsWith('/close-preview'));
  value = result;
  error = new Error('committed response lost');
  const count = calls.length;
  await assert.rejects(
    transport.close('w', 'p', 's', input, 'captured', signal()),
    /response lost/,
  );
  assert.equal(calls.length, count + 1);
  const original = calls.at(-1);
  error = null;
  assert.deepEqual(await transport.close('w', 'p', 's', input, 'captured', signal()), result);
  assert.equal(calls.at(-1).init.body, original.init.body);
  assert.deepEqual(JSON.parse(original.init.body), input);
  assert.equal(original.init.headers['Idempotency-Key'], 'captured');
  assert.equal(original.init.credentials, 'same-origin');
  assert.equal(original.init.cache, 'no-store');
  assert.equal(original.init.redirect, 'error');
  value = closure;
  assert.deepEqual(await transport.closure('w', 'p', 's', signal()), closure);
  value = page;
  assert.deepEqual(await transport.outcomes('w', 'p', 's', signal(), 'cursor'), page);
  assert.match(calls.at(-1).url, /closure\/outcomes\?cursor=cursor$/);
  const carriedInput = { ...input, destination: 'target', expectedTargetVersion: 2 };
  value = { ...result, closure: { ...closure, destination: 'target', targetOrdinal: 3 } };
  assert.deepEqual(
    await transport.close('w', 'p', 's', carriedInput, 'carry-key', signal()),
    value,
  );
});
test('close sidecars reject foreign scope/entity, malformed payloads and mismatched original consequences', async (t) => {
  let value;
  t.mock.method(globalThis, 'fetch', async () => Response.json(value));
  const transport = createTaskPlanningTransport();
  for (const [method, good, args] of [
    ['closePreview', preview, ['w', 'p', 's', 'backlog', signal()]],
    ['closure', closure, ['w', 'p', 's', signal()]],
    ['outcomes', page, ['w', 'p', 's', signal()]],
  ])
    for (const patch of [
      null,
      { ...good, workspaceId: 'foreign' },
      { ...good, projectId: 'foreign' },
      { ...good, sprintId: 'foreign' },
    ]) {
      value = patch;
      await assert.rejects(
        transport[method](...args),
        (e) => e instanceof TaskPlanningFailure && e.status === 502,
      );
    }
  for (const patch of [
    { destination: 'target', expectedTargetVersion: 2 },
    { previewHash: 'invalid' },
  ]) {
    value = { ...preview, ...patch };
    await assert.rejects(
      transport.closePreview('w', 'p', 's', 'backlog', signal()),
      (e) => e.status === 502,
    );
  }
  for (const candidate of [
    null,
    { ...result, current: { ...sprint, workspaceId: 'foreign' } },
    { ...result, current: { ...sprint, projectId: 'foreign' } },
    { ...result, operation: { ...result.operation, sprintId: 'foreign' } },
    { ...result, closure: { ...closure, destination: null, pendingParticipants: 0 } },
    { ...result, closure: { ...closure, previewHash: 'b'.repeat(64) } },
    { ...result, closure: { ...closure, sourceOrdinal: 5 }, current: { ...sprint, version: 5 } },
    { ...result, closure: { ...closure, destination: 'target', targetOrdinal: 4 } },
  ]) {
    value = candidate;
    await assert.rejects(
      transport.close('w', 'p', 's', input, 'key', signal()),
      (e) => e.status === 502,
    );
  }
});
test('typed closed conflicts and original start/visit/configure/create/edit receipts still validate current closed state', async (t) => {
  let value = sprint,
    status = 200;
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json(value, { status, headers: { 'x-request-id': 'request' } }),
  );
  const transport = createTaskPlanningTransport(),
    planning = createSprintPlanningTransport();
  assert.equal((await planning.sprint('w', 'p', 's', signal())).state, 'closed');
  for (const type of ['create-sprint', 'edit-sprint'])
    assert.equal(
      (
        await planning.mutate(
          {
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
          },
          'old',
          signal(),
        )
      ).state,
      'closed',
    );
  value = {
    operation: {
      type: 'start-sprint',
      activityId: 'original',
      sprintId: 's',
      enteredVisitId: null,
      exitedVisitId: null,
    },
    current: sprint,
  };
  assert.equal(
    (
      await transport.start(
        'w',
        'p',
        's',
        { expectedVersion: 2, expectedProjectVersion: 2, expectedTaskRevision: 2 },
        'start',
        signal(),
      )
    ).current.state,
    'closed',
  );
  status = 409;
  value = { code: 'close-preview-changed', current: sprint };
  await assert.rejects(
    transport.close('w', 'p', 's', input, 'key', signal()),
    (e) =>
      e.code === 'close-preview-changed' &&
      e.current.state === 'closed' &&
      e.requestId === 'request',
  );
  value = { code: 'close-preview-changed', current: { ...sprint, projectId: 'foreign' } };
  await assert.rejects(
    transport.close('w', 'p', 's', input, 'key', signal()),
    (e) => e.current === null,
  );
});
test('proxy allows only exact close routes/scalar bounded queries and retains Origin/key forwarding', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({});
  });
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p/sprints/s';
  for (const suffix of [
    '/close-preview',
    '/close-preview?destination=backlog&cursor=cursor',
    '/closure',
    '/closure/outcomes?cursor=cursor',
  ])
    assert.equal((await proxyProjectTask(new Request(root + suffix))).status, 200);
  const headers = {
    'content-type': 'application/json',
    origin: 'https://app.example.test',
    'idempotency-key': 'key',
  };
  assert.equal(
    (
      await proxyProjectTask(
        new Request(root + '/close', { method: 'POST', headers, body: JSON.stringify(input) }),
      )
    ).status,
    200,
  );
  assert.equal(calls.at(-1).init.headers.get('idempotency-key'), 'key');
  for (const suffix of [
    '/close-preview?destination=../bad',
    '/close-preview?destination=a&destination=b',
    '/close-preview?cursor=x&cursor=y',
    '/close-preview?author=x',
    '/closure?cursor=x',
    '/closure/outcomes?destination=backlog',
    '/close-preview?view=active',
    '/close-preview?cursor=!',
    '/closure/outcomes?cursor=!',
    '/close/extra',
    '/closure/outcomes/extra',
    '/reopen',
  ])
    assert.equal((await proxyProjectTask(new Request(root + suffix))).status, 400, suffix);
  for (const suffix of [
    '/close-preview',
    '/closure',
    '/closure/outcomes',
    '/close?destination=backlog',
  ])
    assert.equal(
      (await proxyProjectTask(new Request(root + suffix, { method: 'POST', headers, body: '{}' })))
        .status,
      400,
    );
  assert.equal(
    (
      await proxyProjectTask(
        new Request(root + '/close-preview', { headers: { 'x-actor-principal-id': 'spoof' } }),
      )
    ).status,
    400,
  );
});

test('closure transport retains original response extras and never reads ignored getters', async (t) => {
  for (const [method, body, args] of [
    ['closePreview', preview, ['w', 'p', 's', 'backlog', signal()]],
    ['closure', closure, ['w', 'p', 's', signal()]],
    ['outcomes', page, ['w', 'p', 's', signal()]],
    ['close', result, ['w', 'p', 's', input, 'key', signal()]],
  ]) {
    const original = Object.defineProperty({ ...body, future: { preserved: true } }, 'ignored', {
      enumerable: true,
      get() {
        throw new Error('ignored response getter');
      },
    });
    t.mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      status: 200,
      headers: new globalThis.Headers(),
      json: async () => original,
    }));
    const received = await createTaskPlanningTransport()[method](...args);
    assert.equal(received, original);
    assert.equal(received.future, original.future);
    assert.equal(typeof Object.getOwnPropertyDescriptor(received, 'ignored').get, 'function');
  }
});

test('close projection keeps each admitted destination pair and the exact eight-field read/insertion order for submission and paging', () => {
  const keys = Object.keys(input);
  for (const [destination, expectedTargetVersion] of [
    [null, null],
    ['backlog', null],
    ['target', 2],
  ]) {
    const values = { ...preview, destination, expectedTargetVersion };
    const reads = [];
    const issued = { ...values };
    for (const key of keys)
      Object.defineProperty(issued, key, {
        enumerable: true,
        get() {
          reads.push(key);
          return values[key];
        },
      });
    const body = closeInput(issued);
    assert.deepEqual(reads, keys);
    assert.deepEqual(Object.keys(body), keys);
    assert.equal(
      JSON.stringify(body),
      JSON.stringify(Object.fromEntries(keys.map((key) => [key, values[key]]))),
    );
    assert.equal(body.destination, destination);
    assert.equal(body.expectedTargetVersion, expectedTargetVersion);
    assert.notEqual(
      sprintPageBinding(values),
      sprintPageBinding({ ...values, previewHash: 'b'.repeat(64) }),
    );
    if (expectedTargetVersion !== null)
      assert.notEqual(
        sprintPageBinding(values),
        sprintPageBinding({ ...values, expectedTargetVersion: 3 }),
      );
  }
});

test('close preview retains the original guarded objects for all destination pairs and rejects every mismatched pair without changing the reader', async (t) => {
  let value;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 202,
    headers: new globalThis.Headers({ 'x-request-id': 'preview-pair' }),
    json: async () => value,
  }));
  const transport = createTaskPlanningTransport();
  for (const [destination, expectedTargetVersion, disposition] of [
    [null, null, 'pending'],
    ['backlog', null, 'backlog'],
    ['target', 2, 'carried'],
  ]) {
    value = {
      ...preview,
      destination,
      expectedTargetVersion,
      canClose: destination !== null,
      items: [{ ...item, disposition }],
      future: { preserved: true },
    };
    assert.equal(await transport.closePreview('w', 'p', 's', destination, signal()), value);
  }
  for (const [destination, expectedTargetVersion] of [
    [null, 2],
    ['backlog', 2],
    ['target', null],
  ]) {
    value = {
      ...preview,
      destination,
      expectedTargetVersion,
      items: [],
      pendingParticipants: 0,
      canClose: true,
    };
    await assert.rejects(
      transport.closePreview('w', 'p', 's', destination, signal()),
      (error) =>
        error instanceof TaskPlanningFailure &&
        error.status === 502 &&
        error.requestId === 'preview-pair',
    );
  }
});

test('close sends the original predeclared body including extras/order, encodes selectors once and retains scoped error semantics', async (t) => {
  const body = { future: 'retained', ...input };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(
      { code: 'version-conflict', current: sprint },
      { status: 409, headers: { 'x-request-id': 'close-error' } },
    );
  });
  const transport = createTaskPlanningTransport({ baseURL: 'https://app.example.test/discarded' });
  await assert.rejects(
    transport.close('w/%', 'p ?', 's/#', body, 'original-key', signal()),
    (error) =>
      error.status === 409 &&
      error.current === null &&
      error.code === 'version-conflict' &&
      error.requestId === 'close-error',
  );
  assert.equal(
    calls[0].url,
    'https://app.example.test/api/v1/workspaces/w%2F%25/projects/p%20%3F/sprints/s%2F%23/close',
  );
  assert.equal(calls[0].init.body, JSON.stringify(body));
  assert.equal(calls[0].init.headers['Idempotency-Key'], 'original-key');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.credentials, 'same-origin');
});

test('close reads any successful JSON status while malformed successful and error bodies keep feature request IDs', async (t) => {
  let response;
  t.mock.method(globalThis, 'fetch', async () => response);
  const transport = createTaskPlanningTransport();
  response = new Response(JSON.stringify(result), {
    status: 202,
    headers: { 'content-type': 'text/plain' },
  });
  assert.deepEqual(await transport.close('w', 'p', 's', input, 'key', signal()), result);
  for (const [status, body, expected] of [
    [200, '', 502],
    [202, 'null', 502],
    [200, '{}', 502],
    [503, 'invalid', 503],
  ]) {
    response = new Response(body, { status, headers: { 'x-request-id': 'close-read' } });
    await assert.rejects(
      transport.close('w', 'p', 's', input, 'key', signal()),
      (error) =>
        error instanceof TaskPlanningFailure &&
        error.status === expected &&
        error.requestId === 'close-read' &&
        error.current === null &&
        error.code === null,
    );
  }
});
