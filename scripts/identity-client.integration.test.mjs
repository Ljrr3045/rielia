import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createIdentityTransport } from '../apps/web/src/lib/identity-client.ts';
import { createIdentityController } from '../apps/web/src/lib/identity-controller.ts';

test('real browser client aborts stalled mutations, sends no automatic retry, and allows explicit retry', async (t) => {
  let hanging = true;
  const calls = new Map();
  const server = createServer((request, response) => {
    calls.set(request.url, (calls.get(request.url) ?? 0) + 1);
    if (hanging) return;
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify(
        request.url.endsWith('/config')
          ? { enabled: true, providers: ['github'] }
          : { url: 'https://identity.example.test/identity', redirect: false, success: true },
      ),
    );
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const transport = createIdentityTransport({
    baseURL: `http://127.0.0.1:${server.address().port}/api/auth`,
    timeout: 100,
  });
  const controller = createIdentityController({
    ...transport,
    configuration: async () => ({ enabled: true, providers: ['github'] }),
    session: async () => null,
  });
  await controller.refresh();
  await controller.signIn('github');
  assert.equal(controller.getState().pending, null);
  assert.equal(controller.getState().message, 'sign-in-failed');
  assert.equal(calls.get('/api/auth/sign-in/social'), 1);
  hanging = false;
  await controller.signIn('github');
  assert.equal(controller.getState().message, null);
  assert.equal(calls.get('/api/auth/sign-in/social'), 2);

  let value = {
    user: { id: 'fixture', name: 'Fixture', email: 'fixture@example.test', emailVerified: true },
    session: { id: 'fixture-session', expiresAt: '2035-01-01T00:00:00.000Z' },
  };
  const signedIn = createIdentityController({
    ...transport,
    configuration: async () => ({ enabled: true, providers: ['github'] }),
    session: async () => value,
    signOut: async () => {
      await transport.signOut();
      value = null;
    },
  });
  await signedIn.refresh();
  hanging = true;
  await signedIn.signOut();
  assert.equal(signedIn.getState().pending, null);
  assert.equal(signedIn.getState().message, 'sign-out-failed');
  assert.equal(calls.get('/api/auth/sign-out'), 1);
  hanging = false;
  await signedIn.signOut();
  assert.equal(signedIn.getState().status, 'signed-out');
  assert.equal(calls.get('/api/auth/sign-out'), 2);
  hanging = true;
  await assert.rejects(transport.configuration());
  hanging = false;
  assert.equal((await transport.configuration()).enabled, true);
});

test(
  'identity projections retain native redirect following and a deadline through real body consumption',
  { timeout: 8000 },
  async (t) => {
    const calls = [];
    let headers;
    let closed;
    const headersSeen = new Promise((resolve) => {
      headers = resolve;
    });
    const disconnected = new Promise((resolve) => {
      closed = resolve;
    });
    const server = createServer((request, response) => {
      calls.push(request.url);
      request.resume();
      if (request.url.endsWith('/config')) {
        response.writeHead(302, { location: '/projection' });
        response.end();
      } else if (request.url === '/projection') {
        response.writeHead(202, { 'content-type': 'text/plain' });
        response.end('{"enabled":false,"providers":[]}');
      } else {
        response.once('close', closed);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.flushHeaders();
        response.write('{"user":');
        headers();
      }
    });
    t.after(async () => {
      const stopped = new Promise((resolve) => server.close(resolve));
      server.closeAllConnections();
      await stopped;
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = createIdentityTransport({
      baseURL: `http://127.0.0.1:${server.address().port}/discarded`,
      timeout: 1000,
    });
    assert.deepEqual(await transport.configuration(), { enabled: false, providers: [] });
    const pending = transport.session();
    const rejected = assert.rejects(pending, (error) =>
      ['AbortError', 'TimeoutError'].includes(error.name),
    );
    await headersSeen;
    await rejected;
    await disconnected;
    assert.deepEqual(calls, ['/api/v1/identity/config', '/projection', '/api/v1/identity/session']);
  },
);
