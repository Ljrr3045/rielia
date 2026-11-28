import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import {
  createWorkspaceTransport,
  WorkspaceFailure,
} from '../apps/web/src/lib/workspace-client.ts';
import { createWorkspaceQueryOwner } from '../apps/web/src/lib/workspace-query-owner.ts';
import { createWorkspaceController } from '../apps/web/src/lib/workspace-controller.ts';
import { proxyWorkspace } from '../apps/web/src/lib/workspace-proxy.ts';

const summary = {
  id: 'workspace',
  name: 'Workspace',
  ownerPrincipalId: 'human',
  role: 'owner',
  createdAt: '2026-01-01T00:00:00Z',
};
async function server(t, handle) {
  const http = createServer(handle);
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  t.after(async () => {
    http.closeAllConnections();
    await new Promise((resolve) => http.close(resolve));
  });
  return `http://127.0.0.1:${http.address().port}`;
}
test('real product transport uses exact API/body/key, validates payloads, enforces deadline and no automatic mutation retry', async (t) => {
  let hanging = false;
  let malformed = false;
  const calls = [];
  const baseURL = await server(t, async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    calls.push({ method: req.method, path: req.url, body, key: req.headers['idempotency-key'] });
    if (hanging) return;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify(
        malformed
          ? { unexpected: true }
          : req.method === 'POST'
            ? summary
            : { items: [summary], total: 1, nextCursor: null },
      ),
    );
  });
  const transport = createWorkspaceTransport({ baseURL, timeout: 100 });
  const signal = new AbortController().signal;
  assert.equal((await transport.workspaces(signal)).items[0].id, 'workspace');
  await transport.mutate({ type: 'create-workspace', name: 'Workspace' }, 'key', signal);
  assert.deepEqual(calls[1], {
    method: 'POST',
    path: '/api/v1/workspaces',
    body: '{"name":"Workspace"}',
    key: 'key',
  });
  malformed = true;
  await assert.rejects(
    transport.workspaces(signal),
    (error) => error instanceof WorkspaceFailure && error.status === 502,
  );
  malformed = false;
  hanging = true;
  const before = calls.length;
  await assert.rejects(
    transport.mutate({ type: 'create-workspace', name: 'Workspace' }, 'retry-key', signal),
  );
  assert.equal(calls.length, before + 1);
  hanging = false;
  await transport.mutate({ type: 'create-workspace', name: 'Workspace' }, 'retry-key', signal);
  assert.equal(calls.at(-1).key, 'retry-key');
});

test('proxy preserves exact cookies/origin/idempotency/no-store and strips spoofed host/IP/context; abort is bounded', async (t) => {
  let seen;
  const baseURL = await server(t, async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    seen = { path: req.url, headers: req.headers, body };
    res.writeHead(201, {
      'content-type': 'application/json',
      'set-cookie': ['first=1; HttpOnly', 'second=2; HttpOnly'],
    });
    res.end(JSON.stringify(summary));
  });
  const previous = process.env.API_BASE_URL;
  process.env.API_BASE_URL = baseURL;
  t.after(() => {
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
  const response = await proxyWorkspace(
    new Request('https://app.example.test/api/v1/workspaces', {
      method: 'POST',
      headers: {
        cookie: 'session=opaque',
        origin: 'https://app.example.test',
        'content-type': 'application/json',
        'idempotency-key': 'key',
        'x-forwarded-host': 'evil.test',
        'x-forwarded-for': '203.0.113.1',
      },
      body: '{"name":"Workspace"}',
    }),
  );
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(seen.path, '/api/v1/workspaces');
  assert.equal(seen.headers.cookie, 'session=opaque');
  assert.equal(seen.headers.origin, 'https://app.example.test');
  assert.equal(seen.headers['idempotency-key'], 'key');
  assert.equal(seen.headers['x-forwarded-host'], undefined);
  assert.equal(seen.headers['x-forwarded-for'], undefined);
  assert.equal(seen.body, '{"name":"Workspace"}');
  assert.equal(
    (
      await proxyWorkspace(
        new Request('https://app.example.test/api/v1/workspaces', {
          headers: { 'x-rielia-actor-principal-id': 'forged' },
        }),
      )
    ).status,
    400,
  );
  for (const path of [
    '/api/v1/workspaces//evil.test',
    '/api/v1/workspaces/a/not-allowed',
    '/api/v1/not-allowed',
    '/api/v1/workspace-invitations/accept/extra',
  ])
    assert.equal(
      (await proxyWorkspace(new Request(`https://app.example.test${path}`))).status,
      400,
    );
  const abort = new AbortController();
  abort.abort();
  assert.equal(
    (
      await proxyWorkspace(
        new Request('https://app.example.test/api/v1/workspaces', { signal: abort.signal }),
      )
    ).status,
    503,
  );
});

test('HTTP failures retain structured conflict code and mismatched/malformed product responses are rejected', async (t) => {
  let status = 409;
  let data = { code: 'invitation-link-unavailable' };
  const baseURL = await server(t, (_req, res) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(data));
  });
  const transport = createWorkspaceTransport({ baseURL });
  const signal = new AbortController().signal;
  await assert.rejects(
    transport.mutate(
      {
        type: 'invite',
        workspaceId: 'workspace',
        recipientEmail: 'x@example.test',
        role: 'member',
      },
      'key',
      signal,
    ),
    (error) => error.status === 409 && error.code === 'invitation-link-unavailable',
  );
  status = 200;
  data = { ...summary, id: 'foreign' };
  await assert.rejects(transport.detail('workspace', signal), (error) => error.status === 502);
  data = { items: [summary], total: 0, nextCursor: null };
  await assert.rejects(transport.workspaces(signal), (error) => error.status === 502);
  data = { items: [{ ...summary, role: ['admin'] }], total: 1, nextCursor: null };
  await assert.rejects(transport.workspaces(signal), (error) => error.status === 502);
});

for (const phase of ['headers', 'body']) {
  test(
    `real Query retirement aborts a workspace read during ${phase} and removes its actual record`,
    { timeout: 15_000 },
    async (t) => {
      let admit;
      const admitted = new Promise((resolve) => {
        admit = resolve;
      });
      let close;
      const closed = new Promise((resolve) => {
        close = resolve;
      });
      const baseURL = await server(t, (_req, res) => {
        res.once('close', close);
        if (phase === 'body') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.write('{"items":[');
        }
        admit();
      });
      const owner = createWorkspaceQueryOwner({
        transport: createWorkspaceTransport({ baseURL }),
        authorized: () => true,
        changed() {},
        denied() {
          assert.fail('retired read cannot deny');
        },
      });
      t.after(() => owner.clear());
      owner.bind('native-epoch');
      owner.select('workspace');
      const pending = owner.read('members');
      await admitted;
      owner.clear();
      await pending;
      await closed;
      assert.equal(owner.resources().members.data, null);
      assert.equal(owner.resources().members.status, 'idle');
    },
  );
}

test(
  'actual Query read retains the native response-body deadline and cannot later publish stalled JSON',
  { timeout: 15_000 },
  async (t) => {
    let response;
    let close;
    const closed = new Promise((resolve) => {
      close = resolve;
    });
    const baseURL = await server(t, (_req, res) => {
      response = res;
      res.once('close', close);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('{"items":[');
    });
    const owner = createWorkspaceQueryOwner({
      transport: createWorkspaceTransport({ baseURL, timeout: 500 }),
      authorized: () => true,
      changed() {},
      denied() {
        assert.fail('deadline is unavailable, not signed out');
      },
    });
    t.after(() => owner.clear());
    owner.bind('native-epoch');
    owner.select('workspace');
    await owner.read('members');
    await closed;
    assert.equal(owner.resources().members.status, 'error');
    assert.equal(owner.resources().members.data, null);
    response.end('],"total":0,"nextCursor":null}');
    assert.equal(owner.resources().members.data, null);
  },
);

test(
  'actual workspace controller selection aborts the former body while its replacement remains ready',
  { timeout: 15_000 },
  async (t) => {
    let admit;
    const admitted = new Promise((resolve) => {
      admit = resolve;
    });
    let close;
    const closed = new Promise((resolve) => {
      close = resolve;
    });
    const baseURL = await server(t, (req, res) => {
      if (req.url === '/api/v1/workspaces/a/members') {
        res.once('close', close);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.write('{"items":[');
        admit();
        return;
      }
      const value =
        req.url === '/api/v1/workspaces'
          ? { items: [{ ...summary, id: 'a', role: 'viewer' }], total: 1, nextCursor: null }
          : req.url.endsWith('/members')
            ? { items: [], total: 0, nextCursor: null }
            : { ...summary, id: req.url.split('/').at(-1), role: 'viewer' };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(value));
    });
    const controller = createWorkspaceController({
      identity: {
        configuration: async () => ({ enabled: true, providers: [] }),
        session: async () => ({
          user: { id: 'human', name: 'Human', email: 'human@example.test', emailVerified: true },
          session: { id: 'session', expiresAt: '2035-01-01T00:00:00Z' },
        }),
      },
      transport: createWorkspaceTransport({ baseURL }),
    });
    t.after(() => controller.dispose());
    const initial = controller.refresh();
    await admitted;
    await controller.selectWorkspace('b');
    await initial;
    await closed;
    assert.equal(controller.getState().status, 'ready');
    assert.equal(controller.getState().workspace.id, 'b');
    assert.deepEqual(controller.getState().members.items, []);
  },
);
