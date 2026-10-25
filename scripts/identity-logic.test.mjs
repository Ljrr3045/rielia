import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createIdentityController } from '../apps/web/src/lib/identity-controller.ts';
import { proxyIdentity } from '../apps/web/src/lib/identity-proxy.ts';

const active = { user: { id: 'user', name: 'Fixture', email: 'fixture@example.test', emailVerified: true },
  session: { id: 'session', expiresAt: '2035-01-01T00:00:00.000Z' } };
function transport(overrides = {}) {
  return { configuration: async () => ({ enabled: true, providers: ['google', 'github'] }),
    session: async () => null, signIn: async () => {}, signOut: async () => {}, ...overrides };
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('disabled configuration avoids session lookup; malformed responses and network failure remain unavailable', async () => {
  let called = false;
  const disabled = createIdentityController(transport({ configuration: async () => ({ enabled: false, providers: [] }),
    session: async () => { called = true; } }));
  await disabled.refresh();
  assert.equal(disabled.getState().status, 'disabled');
  assert.equal(called, false);
  for (const configuration of [async () => { throw new Error(); }, async () => ({ enabled: true, providers: ['unknown'] })]) {
    const controller = createIdentityController(transport({ configuration }));
    await controller.refresh();
    assert.equal(controller.getState().status, 'unavailable');
    assert.equal(controller.getState().session, null);
  }
  const malformed = createIdentityController(transport({ session: async () => ({ user: { name: 'partial' } }) }));
  await malformed.refresh();
  assert.equal(malformed.getState().status, 'unavailable');
});

test('sign-in only permits configured providers, blocks duplicate mutations and supports retry/cancellation message', async () => {
  const pending = deferred();
  let calls = 0;
  const controller = createIdentityController(transport({ configuration: async () => ({ enabled: true, providers: ['github'] }),
    signIn: async () => { calls++; if (calls === 1) await pending.promise; else throw new Error(); } }));
  controller.markIncomplete();
  await controller.refresh();
  assert.equal(controller.getState().message, 'sign-in-incomplete');
  await controller.signIn('google');
  assert.equal(calls, 0);
  const first = controller.signIn('github');
  await controller.signIn('github');
  await controller.refresh();
  assert.equal(calls, 1);
  assert.equal(controller.getState().pending, 'sign-in');
  pending.resolve(); await first;
  await controller.signIn('github');
  assert.equal(controller.getState().message, 'sign-in-failed');
  assert.equal(controller.getState().pending, null);
  controller.dismissMessage();
  assert.equal(controller.getState().message, null);
});

test('sign-out failure preserves uncertainty; success rechecks canonical session and never claims success on network failure', async () => {
  let value = active;
  let fail = true;
  const controller = createIdentityController(transport({ session: async () => value,
    signOut: async () => { if (fail) throw new Error(); value = null; } }));
  await controller.refresh();
  await controller.signOut();
  assert.equal(controller.getState().status, 'signed-in');
  assert.equal(controller.getState().message, 'sign-out-failed');
  fail = false; await controller.signOut();
  assert.equal(controller.getState().status, 'signed-out');
  const unavailable = createIdentityController(transport({ session: async () => { if (value === null) throw new Error(); return active; },
    signOut: async () => { value = null; } }));
  value = active; await unavailable.refresh(); await unavailable.signOut();
  assert.equal(unavailable.getState().status, 'unavailable');
  assert.equal(unavailable.getState().session, null);
});

test('a stale refresh or abandoned mutation cannot overwrite a newer result', async () => {
  const old = deferred();
  let count = 0;
  const controller = createIdentityController(transport({ session: async () => ++count === 1 ? old.promise : active }));
  const first = controller.refresh();
  await Promise.resolve();
  await controller.refresh();
  old.resolve(null); await first;
  assert.equal(controller.getState().status, 'signed-in');
  const pending = deferred();
  const mutation = createIdentityController(transport({ signIn: () => pending.promise }));
  await mutation.refresh();
  const signingIn = mutation.signIn('github');
  mutation.cancelPendingLoads();
  await mutation.refresh();
  pending.resolve(); await signingIn;
  assert.equal(mutation.getState().pending, null);
  assert.equal(mutation.getState().status, 'signed-out');
});

test('same-origin proxy streams body, preserves cookies/redirect/no-store and excludes untrusted forwarding headers', async t => {
  const previous = process.env.API_BASE_URL;
  const server = createServer(async (request, response) => {
    assert.equal(request.url, '/api/auth/sign-in/social?fixture=1');
    assert.equal(request.headers.origin, 'https://identity.example.test');
    assert.equal(request.headers.cookie, 'fixture=opaque');
    assert.equal(request.headers['x-forwarded-for'], undefined);
    assert.equal(request.headers['x-rielia-client-ip'], undefined);
    let body = ''; for await (const chunk of request) body += chunk;
    assert.deepEqual(JSON.parse(body), { provider: 'github' });
    response.writeHead(302, { 'content-type': 'application/json', location: 'https://identity.example.test/identity',
      'set-cookie': ['one=fixture; HttpOnly; Secure', 'two=fixture; HttpOnly; Secure'] });
    response.end('{"accepted":true}');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { if (server.listening) await new Promise(resolve => server.close(resolve)); if (previous === undefined) delete process.env.API_BASE_URL; else process.env.API_BASE_URL = previous; });
  process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  const response = await proxyIdentity(new Request('https://identity.example.test/api/auth/sign-in/social?fixture=1', {
    method: 'POST', headers: { origin: 'https://identity.example.test', cookie: 'fixture=opaque', 'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1', 'x-rielia-client-ip': '203.0.113.2' }, body: JSON.stringify({ provider: 'github' }),
  }));
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('location'), 'https://identity.example.test/identity');
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.deepEqual(await response.json(), { accepted: true });
  server.close(); await once(server, 'close');
  const unavailable = await proxyIdentity(new Request('https://identity.example.test/api/auth/get-session'));
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
});
