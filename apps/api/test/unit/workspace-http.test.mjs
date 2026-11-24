import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { WorkspaceController } from '../../dist/workspaces/workspace.controller.js';
import { PrincipalController } from '../../dist/principals/principal.controller.js';
import { HealthController } from '../../dist/health.controller.js';
import { IdentityController } from '../../dist/identity/identity.controller.js';
import { healthResponseSchema, readinessResponseSchema } from '@rielia/contracts';

const origin = 'https://app.example.test';
function response() {
  const headers = [];
  let data;
  return {
    headers,
    get data() {
      return data;
    },
    setHeader: (...args) => headers.push(args),
    append: (...args) => headers.push(args),
    json: (value) => {
      data = value;
    },
  };
}
const error = (code, message) => (value) => value.getStatus() === code && value.message === message;
const req = (patch = {}) => ({
  method: 'GET',
  params: { workspaceId: 'workspace' },
  query: {},
  headers: {},
  ...patch,
});
test('workspace admission retains header/path/query/body/origin/content-type/key precedence', () => {
  const controller = new WorkspaceController({}, { config: { origin } });
  const cases = [
    [
      req({ params: { workspaceId: 'bad/id' }, headers: { 'x-rielia-source': 'web' } }),
      400,
      'Execution identity is resolved by the server.',
    ],
    [
      req({ params: { workspaceId: 'bad/id' }, query: { bad: 'query' } }),
      400,
      'Invalid resource identifier.',
    ],
    [
      req({ query: { cursor: ['one', 'two'] }, headers: { 'content-length': '1' } }),
      400,
      'Invalid workspace query.',
    ],
    [req({ headers: { 'content-length': '1' } }), 400, 'Read requests have no payload.'],
    [req({ headers: { 'transfer-encoding': 'chunked' } }), 400, 'Read requests have no payload.'],
    [req({ method: 'POST', headers: {} }), 403, 'Untrusted workspace request origin.'],
    [
      req({ method: 'POST', headers: { origin, 'sec-fetch-site': 'cross-site' } }),
      403,
      'Untrusted workspace request origin.',
    ],
    [
      req({ method: 'POST', headers: { origin, 'content-type': 'text/plain' } }),
      400,
      'JSON is required.',
    ],
    [
      req({ method: 'POST', headers: { origin, 'content-type': 'application/json' } }),
      400,
      'Idempotency-Key is required.',
    ],
  ];
  for (const [request, status, message] of cases) {
    const res = response();
    assert.throws(() => controller.list(request, res), error(status, message));
    assert.deepEqual(res.headers, [['Cache-Control', 'no-store']]);
  }
});
test('successful workspace adapter preserves cursor/body identity, key timing and renewal cookies', async () => {
  const calls = [];
  const data = { items: [], total: 0, nextCursor: null };
  const headers = new globalThis.Headers({ 'set-cookie': 'renewed=value; HttpOnly' });
  const controller = new WorkspaceController(
    {
      list: (...args) => {
        calls.push(args);
        return Promise.resolve({ data, headers });
      },
      create: (...args) => {
        calls.push(args);
        return Promise.resolve({ data, headers });
      },
    },
    { config: { origin } },
  );
  const read = req({ query: { cursor: 'next' }, headers: { 'content-length': '0' } });
  const res = response();
  await controller.list(read, res);
  assert.deepEqual(calls[0], [read.headers, 'next']);
  assert.equal(res.data, data);
  assert.deepEqual(res.headers, [
    ['Cache-Control', 'no-store'],
    ['Set-Cookie', 'renewed=value; HttpOnly'],
  ]);
  const body = { name: ' Workspace ' };
  const write = req({
    method: 'POST',
    body,
    headers: {
      origin,
      'sec-fetch-site': 'none',
      'content-type': ' Application/JSON ; charset=utf-8',
      'idempotency-key': 'later-uuid-check',
    },
  });
  await controller.create(write, response());
  assert.deepEqual(calls[1], [write.headers, 'later-uuid-check', body]);
});
test('context rejects selectors/body/forged headers and leaves path authorization to principal service', async () => {
  const calls = [];
  const context = { informational: true };
  const controller = new PrincipalController({
    webContext: async (...args) => {
      calls.push(args);
      return { context, headers: new globalThis.Headers() };
    },
  });
  for (const patch of [
    { query: { source: 'web' } },
    { body: { actor: 'forged' } },
    { headers: { 'x-source': 'web' } },
    { headers: { 'transfer-encoding': 'chunked' } },
  ])
    await assert.rejects(
      controller.context('workspace', req(patch), response()),
      error(400, 'Execution identity is resolved by the server.'),
    );
  assert.equal(calls.length, 0);
  const res = response();
  await controller.context('unvalidated/path', req(), res);
  assert.equal(calls[0][1], 'unvalidated/path');
  assert.equal(res.data, context);
});
test('infrastructure literal projections and identity projection keep readiness failure and library Date ownership', async (t) => {
  const directory = new URL(
    '../../prisma/migrations/',
    new URL('../../dist/runtime/database.js', import.meta.url),
  );
  const original = fs.promises.readdir;
  let calls = 0;
  let finish;
  const observed = new Promise((resolve) => {
    finish = resolve;
  });
  // Only the unused import-time migration inventory is doubled. This does not
  // exercise database readiness or establish migration/schema correctness.
  t.mock.method(fs.promises, 'readdir', async (target, options) => {
    if (!(target instanceof URL) || target.href !== directory.href)
      return original.call(fs.promises, target, options);
    assert.deepEqual(options, { withFileTypes: true });
    calls++;
    finish();
    return [];
  });
  syncBuiltinESMExports();
  try {
    const { ReadinessController } = await import('../../dist/runtime/readiness.controller.js');
    assert.equal(calls, 1);
    await observed;
    assert.ok(healthResponseSchema.safeParse(new HealthController().health()).success);
    const runtime = { ready: async () => true };
    const readiness = new ReadinessController(runtime);
    assert.ok(readinessResponseSchema.safeParse(await readiness.readiness()).success);
    runtime.ready = async () => false;
    await assert.rejects(readiness.readiness(), error(503, 'Local runtime is unavailable.'));
    const data = { session: { expiresAt: new Date('2026-01-01') } };
    const identity = new IdentityController({
      config: { enabled: true, providers: { google: {} } },
      session: async () => ({
        data,
        headers: new globalThis.Headers({ 'set-cookie': 'renewed=value' }),
      }),
    });
    assert.deepEqual(identity.configuration(), { enabled: true, providers: ['google'] });
    const res = response();
    await identity.session(req(), res);
    assert.equal(res.data, data);
    assert.ok(res.data.session.expiresAt instanceof Date);
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});
