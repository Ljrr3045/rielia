import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createIdentityTransport } from '../apps/web/src/lib/identity-client.ts';

test('default same-origin transport can initialize during server rendering without an absolute public URL', () => {
  assert.doesNotThrow(() => createIdentityTransport());
});

test('actual identity reads retain raw projections, native defaults and status-before-JSON failure order', async (t) => {
  const calls = [];
  const values = [{ enabled: false, providers: [], extra: true }, null];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return Response.json(values.shift(), {
      status: 202,
      headers: { 'content-type': 'text/plain' },
    });
  });
  const transport = createIdentityTransport({ baseURL: 'https://app.example.test/discarded' });
  assert.deepEqual(await transport.configuration(), { enabled: false, providers: [], extra: true });
  assert.equal(await transport.session(), null);
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'https://app.example.test/api/v1/identity/config',
      'https://app.example.test/api/v1/identity/session',
    ],
  );
  for (const { init } of calls) {
    assert.equal('method' in init, false);
    assert.equal('redirect' in init, false);
    assert.equal(init.credentials, 'same-origin');
    assert.equal(init.cache, 'no-store');
  }
  let reads = 0;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    json() {
      reads++;
      throw new Error('must not parse');
    },
  }));
  await assert.rejects(transport.session(), { message: 'Identity response unavailable.' });
  assert.equal(reads, 0);
  const bodyFailure = new Error('body rejected');
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json() {
      throw bodyFailure;
    },
  }));
  await assert.rejects(transport.configuration(), (error) => error === bodyFailure);
  assert.equal(calls.length, 2);
});

test('adding projection requests preserves lazy raw-auth SSR rejection without starting a request', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json({ success: true });
  });
  const transport = createIdentityTransport();
  await assert.rejects(transport.signIn('github'), {
    message: 'Identity mutations require a browser origin.',
  });
  assert.equal(calls, 0);
});

test('projection reads coexist with the real library sign-out adapter and its explicit retry only', async (t) => {
  const calls = [];
  let fail = true;
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/config')) return Response.json({ enabled: false, providers: [] });
    return fail
      ? Response.json({ message: 'denied' }, { status: 403 })
      : Response.json({ success: true });
  });
  const transport = createIdentityTransport({ baseURL: 'https://app.example.test', timeout: 1000 });
  await transport.configuration();
  await assert.rejects(transport.signOut(), { message: 'Identity sign-out failed.' });
  assert.deepEqual(calls, [
    'https://app.example.test/api/v1/identity/config',
    'https://app.example.test/api/auth/sign-out',
  ]);
  fail = false;
  await transport.signOut();
  assert.deepEqual(calls, [
    'https://app.example.test/api/v1/identity/config',
    'https://app.example.test/api/auth/sign-out',
    'https://app.example.test/api/auth/sign-out',
  ]);
});
