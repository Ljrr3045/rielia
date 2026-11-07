import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { proxyIdentity } from '../apps/web/src/lib/identity-proxy.ts';

test('same-origin proxy streams body, preserves cookies/redirect/no-store and excludes untrusted forwarding headers', async (t) => {
  const previous = process.env.API_BASE_URL;
  const server = createServer(async (request, response) => {
    assert.equal(request.url, '/api/auth/sign-in/social?fixture=1');
    assert.equal(request.headers.origin, 'https://identity.example.test');
    assert.equal(request.headers.cookie, 'fixture=opaque');
    assert.equal(request.headers['x-forwarded-for'], undefined);
    assert.equal(request.headers['x-rielia-client-ip'], undefined);
    let body = '';
    for await (const chunk of request) body += chunk;
    assert.deepEqual(JSON.parse(body), { provider: 'github' });
    response.writeHead(302, {
      'content-type': 'application/json',
      location: 'https://identity.example.test/identity',
      'set-cookie': ['one=fixture; HttpOnly; Secure', 'two=fixture; HttpOnly; Secure'],
    });
    response.end('{"accepted":true}');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
  process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  const response = await proxyIdentity(
    new Request('https://identity.example.test/api/auth/sign-in/social?fixture=1', {
      method: 'POST',
      headers: {
        origin: 'https://identity.example.test',
        cookie: 'fixture=opaque',
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.1',
        'x-rielia-client-ip': '203.0.113.2',
      },
      body: JSON.stringify({ provider: 'github' }),
    }),
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('location'), 'https://identity.example.test/identity');
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.deepEqual(await response.json(), { accepted: true });
  server.close();
  await once(server, 'close');
  const unavailable = await proxyIdentity(
    new Request('https://identity.example.test/api/auth/get-session'),
  );
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
});
