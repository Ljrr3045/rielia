import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { request as rawHttpRequest } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { Controller, Module, Post, Req } from '@nestjs/common';
import { AppModule } from '../dist/app.module.js';
import { configureApplication } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { readIdentityConfig } from '../dist/identity/config.js';
import { proxyIdentity } from '../../web/src/lib/identity-proxy.ts';

const publicOrigin = process.env.BETTER_AUTH_URL;
const networkFetch = globalThis.fetch;

// Parsing verification exists only in this test module, never a public API route.
class ParsingController { echo(request) { return request.body; } }
Controller('parse')(ParsingController);
Post()(ParsingController.prototype, 'echo', Object.getOwnPropertyDescriptor(ParsingController.prototype, 'echo'));
Req()(ParsingController.prototype, 'echo', 0);
class TestModule {}
Module({ imports: [AppModule], controllers: [ParsingController] })(TestModule);

async function start() {
  const app = await NestFactory.create(TestModule, { bodyParser: false, logger: false });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  return { app, identity: app.get(IdentityService), url: await app.getUrl() };
}

function cookies(response) { return response.headers.getSetCookie().map(value => value.split(';')[0]).join('; '); }
function sessionCookie(response) {
  return response.headers.getSetCookie().find(value => value.includes('session_token='))?.split(';')[0] ?? '';
}
function jsonResponse(value) { return Response.json(value); }

test('configuration fails closed without exposing values', () => {
  const base = { ...process.env };
  assert.equal(readIdentityConfig({}).enabled, false);
  for (const key of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']) {
    assert.throws(() => readIdentityConfig({ ...base, [key]: '' }));
  }
  for (const origin of ['https://a.example/path', 'https://user:pass@a.example', 'https://a.example?x=1', 'http://a.example', 'javascript:example']) {
    assert.throws(() => readIdentityConfig({ ...base, BETTER_AUTH_URL: origin }));
  }
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: 'true' }));
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_TRUSTED_PROXIES: '127.0.0.1/33' }));
  assert.throws(() => readIdentityConfig({ ...base, GOOGLE_CLIENT_SECRET: '' }));
  assert.throws(() => readIdentityConfig({ ...base, DATABASE_URL: 'file:identity.db' }));
  assert.throws(() => readIdentityConfig({ ...base, BETTER_AUTH_SECRET: 'short' }));
  assert.throws(() => readIdentityConfig({ ...base, IDENTITY_ENABLED: 'yes' }));
  assert.throws(() => readIdentityConfig({ ...base, NODE_ENV: 'production', BETTER_AUTH_URL: 'http://localhost:3000', IDENTITY_ALLOW_HTTP_LOOPBACK: 'true' }));
  assert.equal(readIdentityConfig({ ...base, NODE_ENV: 'development', BETTER_AUTH_URL: 'http://127.0.0.1:3000', IDENTITY_ALLOW_HTTP_LOOPBACK: 'true' }).origin, 'http://127.0.0.1:3000');
});

test('real Better Auth, Nest Express, Prisma and PostgreSQL (simulated provider HTTP only)', async t => {
  // Better Auth's process-wide memory limiter survives creating another app.
  // Advance only Date between cases to isolate real limiter windows; retain
  // real network/DB/timers and leave rate limiting enabled in all requests.
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  let fixture = { id: 'github-1', email: 'private@example.test', verified: true };
  let googleAudience = process.env.GOOGLE_CLIENT_ID;
  let googleIssuer = 'https://accounts.google.com';
  let googleExpired = false;
  let googleWrongSignature = false;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let providerCalls = 0;
  mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin === 'https://github.com' && url.pathname === '/login/oauth/access_token') {
      providerCalls++;
      const body = new URLSearchParams(init.body);
      assert.equal(body.get('redirect_uri'), `${publicOrigin}/api/auth/callback/github`);
      return jsonResponse({ access_token: 'simulated-provider-token', token_type: 'bearer', scope: 'read:user,user:email' });
    }
    if (url.href === 'https://api.github.com/user') {
      providerCalls++;
      return jsonResponse({ id: fixture.id, login: 'fixture-user', name: 'Fixture User', email: null, avatar_url: null });
    }
    if (url.href === 'https://api.github.com/user/emails') {
      providerCalls++;
      return jsonResponse(fixture.email ? [{ email: fixture.email, primary: true, verified: fixture.verified, visibility: 'private' }] : []);
    }
    if (url.href === 'https://oauth2.googleapis.com/token') {
      providerCalls++;
      const body = new URLSearchParams(init.body);
      assert.equal(body.get('redirect_uri'), `${publicOrigin}/api/auth/callback/google`);
      assert.ok(body.get('code_verifier')?.length > 0);
      const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const payload = `${encode({ alg: 'RS256', kid: 'simulated-key' })}.${encode({
        iss: googleIssuer, sub: 'simulated-google-subject', aud: googleAudience,
        iat: now, exp: googleExpired ? now - 600 : now + 3600, email: 'google@example.test', email_verified: true, name: 'Google Fixture',
      })}`;
      const signature = sign('RSA-SHA256', Buffer.from(payload), privateKey);
      if (googleWrongSignature) signature[0] ^= 1;
      const idToken = `${payload}.${signature.toString('base64url')}`;
      return jsonResponse({ access_token: 'simulated-google-token', token_type: 'Bearer', expires_in: 3600, id_token: idToken });
    }
    if (url.href === 'https://www.googleapis.com/oauth2/v3/certs') {
      return jsonResponse({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'simulated-key', alg: 'RS256', use: 'sig' }] });
    }
    if (url.hostname === '127.0.0.1') return networkFetch(input, init);
    throw new Error('Unexpected external provider request in simulated test.');
  });
  t.after(() => { mock.restoreAll(); mock.timers.reset(); });
  let context;
  t.beforeEach(async () => {
    mock.timers.tick(11000);
    process.env.IDENTITY_TRUSTED_PROXIES = '';
    googleAudience = process.env.GOOGLE_CLIENT_ID;
    googleIssuer = 'https://accounts.google.com';
    googleExpired = false;
    googleWrongSignature = false;
    context = await start();
    await context.identity.runtime.prisma.verification.deleteMany();
    await context.identity.runtime.prisma.user.deleteMany();
  });
  t.afterEach(async () => { await context?.app.close(); });

  const request = (path, init = {}) => networkFetch(context.url + path, { ...init, redirect: 'manual' });
  const post = (path, body, cookie = '', extraHeaders = {}) => request(path, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: publicOrigin, cookie, ...extraHeaders }, body: JSON.stringify(body),
  });
  function rawPost(path, body, origin, cookie) {
    return new Promise((resolve, reject) => {
      const server = new URL(context.url);
      const outgoing = rawHttpRequest({ hostname: server.hostname, port: server.port,
        path, method: 'POST', headers: { 'content-type': 'application/json',
          ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}) } }, incoming => {
        incoming.resume();
        incoming.on('end', () => resolve({ status: incoming.statusCode, headers: incoming.headers }));
      });
      outgoing.on('error', reject);
      outgoing.setTimeout(5000, () => outgoing.destroy(new Error('Raw HTTP fixture timed out.')));
      outgoing.end(JSON.stringify(body));
    });
  }
  async function begin(extraHeaders = {}, provider = 'github', callbackURL = `${publicOrigin}/identity`) {
    mock.timers.tick(11000);
    const response = await post('/api/auth/sign-in/social', { provider, callbackURL, errorCallbackURL: `${publicOrigin}/identity?auth=error` }, '', extraHeaders);
    assert.equal(response.status, 200);
    const body = await response.json();
    const target = new URL(body.url);
    return { response, state: target.searchParams.get('state'), target, cookie: cookies(response) };
  }
  async function login(extraHeaders = {}, provider = 'github') {
    const flow = await begin(extraHeaders, provider);
    const response = await request(`/api/auth/callback/${provider}?code=simulated-code&state=${encodeURIComponent(flow.state)}`, { headers: { cookie: flow.cookie, ...extraHeaders } });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), `${publicOrigin}/identity`);
    const cookie = sessionCookie(response);
    assert.ok(cookie.length > 0, 'the real library must issue a session cookie');
    return { cookie, response, flow };
  }
  async function session(cookie) {
    const response = await request('/api/v1/identity/session', { headers: { cookie } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return response.json();
  }

  await t.test('auth raw JSON and normal API JSON/urlencoded parsers coexist; health remains public', async () => {
    const flow = await begin();
    assert.equal(flow.target.origin, 'https://github.com');
    assert.equal(flow.target.searchParams.get('redirect_uri'), `${publicOrigin}/api/auth/callback/github`);
    assert.ok(flow.target.searchParams.get('scope').includes('user:email'));
    assert.equal((await request('/api/v1/health')).status, 200);
    assert.equal((await request('/api/v1/tasks')).status, 404);
    const parsed = await post('/api/v1/parse', { nested: { value: 42 } });
    assert.deepEqual(await parsed.json(), { nested: { value: 42 } });
    const form = await request('/api/v1/parse', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'value=parsed&nested[title]=preserved' });
    assert.deepEqual(await form.json(), { value: 'parsed', nested: { title: 'preserved' } });
    assert.equal((await request('/api/auth/ok')).headers.get('cache-control'), 'no-store');
    assert.equal((await request('/api/v1/identity/config')).headers.get('cache-control'), 'no-store');
    assert.equal((await request('/api/auth/sign-up/email', { method: 'POST' })).status >= 400, true);
  });

  await t.test('unconfigured provider, malicious origins and untrusted return URLs fail', async () => {
    assert.equal((await post('/api/auth/sign-in/social', { provider: 'discord' })).status >= 400, true);
    const badOrigin = await post('/api/auth/sign-in/social', { provider: 'github' }, '', { origin: 'https://attacker.example' });
    assert.equal(badOrigin.status, 403);
    for (const callbackURL of ['https://attacker.example', '//attacker.example', '/%2f%2fattacker.example', '/\\attacker.example']) {
      const result = await post('/api/auth/sign-in/social', { provider: 'github', callbackURL });
      assert.equal(result.status >= 400, true, `Reject callback fixture: ${callbackURL}`);
    }
  });

  await t.test('enabled auth rate limiting rejects repeated requests', async () => {
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const response = await post('/api/auth/sign-in/social', { provider: 'github' });
      if (response.status === 429) { limited = true; break; }
    }
    assert.equal(limited, true);
  });

  await t.test('raw dot-segment targets cannot disguise mutations as callbacks; malformed encoding fails closed', async () => {
    for (const origin of [undefined, 'https://attacker.example']) {
      for (const path of ['/api/auth/callback/../sign-in/social', '/api/auth/callback/%2e%2e/sign-in/social',
        '/api/auth/callback/x/../../sign-in/social', '/api/auth/callback/..\\sign-in/social']) {
        const denied = await rawPost(path, { provider: 'github', callbackURL: `${publicOrigin}/identity` }, origin);
        assert.equal(denied.status, 403, 'Raw non-callback mutation must require exact origin.');
      }
    }
    const malformed = await rawPost('/api/auth/callback/%zz', {}, undefined);
    assert.equal(malformed.status, 400);
    assert.equal(await context.identity.runtime.prisma.verification.count(), 0);
    assert.equal(await context.identity.runtime.prisma.session.count(), 0);
  });

  await t.test('callback POST without cookies redirects to the state-validated GET', async () => {
    fixture = { id: 'callback-post', email: 'callback-post@example.test', verified: true };
    const flow = await begin();
    // Cross-site POST does not carry a SameSite=Lax state cookie. The redirect
    // GET carries it, and must still pass the real library's state validation.
    const forwarded = await rawPost('/api/auth/callback/github', { code: 'fixture', state: flow.state }, undefined);
    assert.equal(forwarded.status, 302);
    const target = new URL(forwarded.headers.location);
    assert.equal(target.origin, publicOrigin);
    assert.equal(target.pathname, '/api/auth/callback/github');
    const completed = await request(target.pathname + target.search, { headers: { cookie: flow.cookie } });
    assert.equal(completed.status, 302);
    assert.ok(sessionCookie(completed));
  });

  await t.test('invalid/replayed OAuth state and provider cancellation create no session', async () => {
    const before = providerCalls;
    const invalid = await request('/api/auth/callback/github?code=fixture&state=invalid');
    assert.equal(sessionCookie(invalid), '');
    assert.equal(providerCalls, before);
    const flow = await begin();
    const cancelled = await request(`/api/auth/callback/github?error=access_denied&state=${flow.state}`, { headers: { cookie: flow.cookie } });
    assert.equal(sessionCookie(cancelled), '');
    assert.equal(await context.identity.runtime.prisma.session.count(), 0);
    await request(`/api/auth/callback/github?code=fixture&state=${flow.state}`, { headers: { cookie: flow.cookie } });
    assert.equal(await context.identity.runtime.prisma.session.count(), 0);
  });

  await t.test('private-email fixture creates DB identity; secure host-only cookie; supported API agrees', async () => {
    fixture = { id: 'private-email', email: 'private@example.test', verified: true };
    const { cookie, response } = await login({ 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'http', 'x-forwarded-for': '203.0.113.1', 'x-rielia-client-ip': '203.0.113.2' });
    const setCookie = response.headers.getSetCookie().find(value => value.includes('session_token='));
    assert.ok(setCookie.startsWith('__Secure-'));
    for (const attribute of ['httponly', 'secure', 'samesite=lax', 'path=/']) assert.ok(setCookie.toLowerCase().includes(attribute));
    assert.ok(!/;\s*domain=/i.test(setCookie));
    assert.ok(!response.headers.getSetCookie().some(value => value.includes('session_data=')));
    const current = await session(cookie);
    assert.equal(current.user.email, fixture.email);
    assert.equal(current.user.emailVerified, true);
    assert.equal(Object.hasOwn(current.session, 'token'), false);
    const library = await request('/api/auth/get-session', { headers: { cookie } });
    assert.equal((await library.json()).user.id, current.user.id);
    const stored = await context.identity.runtime.prisma.session.findFirstOrThrow();
    assert.ok(['127.0.0.1', '::ffff:127.0.0.1'].includes(stored.ipAddress));
    const account = await context.identity.runtime.prisma.account.findFirstOrThrow();
    assert.equal(account.providerId, 'github');
    assert.equal(account.accountId, fixture.id);
    assert.ok(account.accessToken !== 'simulated-provider-token', 'stored provider tokens must be encrypted');
  });

  await t.test('same provider subject reuses identity; verified or unverified matching email never auto-links', async () => {
    fixture = { id: 'stable-subject', email: 'stable@example.test', verified: true };
    await login();
    await login();
    assert.equal(await context.identity.runtime.prisma.user.count(), 1);
    assert.equal(await context.identity.runtime.prisma.account.count(), 1);
    for (const verified of [true, false]) {
      fixture = { id: `different-${verified}`, email: 'stable@example.test', verified };
      const flow = await begin();
      const denied = await request(`/api/auth/callback/github?code=fixture&state=${flow.state}`, { headers: { cookie: flow.cookie } });
      assert.equal(sessionCookie(denied), '');
      assert.ok(denied.headers.get('location').includes('account_not_linked'));
    }
    assert.equal(await context.identity.runtime.prisma.user.count(), 1);
    assert.equal(await context.identity.runtime.prisma.account.count(), 1);
  });

  await t.test('simulated Google code exchange uses PKCE and signed ID token; cross-provider same-email linking fails', async () => {
    const { cookie, flow } = await login({}, 'google');
    assert.equal(flow.target.origin, 'https://accounts.google.com');
    assert.equal(flow.target.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(flow.target.searchParams.get('code_challenge')?.length > 0);
    assert.equal((await session(cookie)).user.email, 'google@example.test');
    assert.equal((await context.identity.runtime.prisma.account.findFirstOrThrow()).providerId, 'google');
    fixture = { id: 'cross-provider', email: 'google@example.test', verified: false };
    const github = await begin();
    const denied = await request(`/api/auth/callback/github?code=fixture&state=${github.state}`, { headers: { cookie: github.cookie } });
    assert.equal(Boolean(sessionCookie(denied)), false);
    assert.equal(await context.identity.runtime.prisma.account.count(), 1);
  });

  await t.test('simulated Google ID token wrong audience/issuer/signature/expiry cannot create identity or session', async () => {
    for (const invalid of ['audience', 'issuer', 'signature', 'expiry']) {
      googleAudience = invalid === 'audience' ? 'wrong-client' : process.env.GOOGLE_CLIENT_ID;
      googleIssuer = invalid === 'issuer' ? 'https://attacker.example' : 'https://accounts.google.com';
      googleWrongSignature = invalid === 'signature';
      googleExpired = invalid === 'expiry';
      const flow = await begin({}, 'google');
      const denied = await request(`/api/auth/callback/google?code=fixture&state=${flow.state}`, { headers: { cookie: flow.cookie } });
      assert.equal(Boolean(sessionCookie(denied)), false, `Reject Google fixture with invalid ${invalid}`);
      assert.equal(await context.identity.runtime.prisma.user.count(), 0);
    }
  });

  await t.test('missing private email fails with no invented identity', async () => {
    fixture = { id: 'no-email', email: null, verified: false };
    const flow = await begin();
    const denied = await request(`/api/auth/callback/github?code=fixture&state=${flow.state}`, { headers: { cookie: flow.cookie } });
    assert.equal(sessionCookie(denied), '');
    assert.equal(await context.identity.runtime.prisma.user.count(), 0);
  });

  await t.test('tampering and expiry fail; session persists through API restart', async () => {
    fixture = { id: 'persistent', email: 'persistent@example.test', verified: true };
    const { cookie } = await login();
    const original = await session(cookie);
    await context.app.close();
    context = await start();
    assert.equal((await session(cookie)).user.id, original.user.id);
    assert.equal(await session(cookie + 'tampered'), null);
    await context.identity.runtime.prisma.session.updateMany({ data: { expiresAt: new Date(0) } });
    assert.equal(await session(cookie), null);
  });

  await t.test('supported session refresh forwards renewal cookie with the new DB expiry', async () => {
    fixture = { id: 'refresh', email: 'refresh@example.test', verified: true };
    const { cookie } = await login();
    await context.identity.runtime.prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() + 3600000) } });
    const refreshed = await request('/api/v1/identity/session', { headers: { cookie } });
    assert.equal(refreshed.status, 200);
    assert.ok(refreshed.headers.getSetCookie().some(value => value.includes('session_token=')));
    const stored = await context.identity.runtime.prisma.session.findFirstOrThrow();
    assert.ok(stored.expiresAt.getTime() > Date.now() + 6 * 86400000);
  });

  await t.test('same-origin web proxy preserves real session and logout semantics', async () => {
    const previous = process.env.API_BASE_URL;
    process.env.API_BASE_URL = context.url;
    try {
      fixture = { id: 'web-proxy', email: 'web-proxy@example.test', verified: true };
      const { cookie } = await login();
      const current = await proxyIdentity(new Request(`${publicOrigin}/api/v1/identity/session`, { headers: { cookie } }));
      assert.equal(current.status, 200);
      assert.equal((await current.json()).user.email, fixture.email);
      const logout = await proxyIdentity(new Request(`${publicOrigin}/api/auth/sign-out`, {
        method: 'POST', headers: { cookie, origin: publicOrigin, 'content-type': 'application/json' }, body: '{}',
      }));
      assert.equal(logout.status, 200);
      assert.ok(logout.headers.getSetCookie().some(value => /max-age=0/i.test(value)));
      assert.equal(await session(cookie), null);
    } finally { if (previous === undefined) delete process.env.API_BASE_URL; else process.env.API_BASE_URL = previous; }
  });

  await t.test('logout and cross-session revocation block the very next request with old cookie', async () => {
    fixture = { id: 'revocation', email: 'revocation@example.test', verified: true };
    const first = await login();
    const firstSession = await context.identity.runtime.prisma.session.findFirstOrThrow();
    const second = await login();
    const wrongOrigin = await post('/api/auth/sign-out', {}, first.cookie, { origin: 'https://attacker.example' });
    assert.equal(wrongOrigin.status, 403);
    assert.ok(await session(first.cookie));
    const revoked = await post('/api/auth/revoke-session', { token: firstSession.token }, second.cookie);
    assert.equal(revoked.status, 200);
    assert.equal(await session(first.cookie), null);
    assert.ok(await session(second.cookie));
    const logout = await post('/api/auth/sign-out', {}, second.cookie);
    assert.equal(logout.status, 200);
    assert.ok(logout.headers.getSetCookie().some(value => /max-age=0/i.test(value)));
    assert.equal(await session(second.cookie), null);
  });

  await t.test('narrow trusted proxy takes nearest untrusted IP, ignoring spoofed leftmost token', async () => {
    await context.app.close();
    process.env.IDENTITY_TRUSTED_PROXIES = '127.0.0.1';
    context = await start();
    fixture = { id: 'proxy', email: 'proxy@example.test', verified: true };
    await login({ 'x-forwarded-for': '203.0.113.200, 198.51.100.10', 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'http' });
    const stored = await context.identity.runtime.prisma.session.findFirstOrThrow();
    assert.equal(stored.ipAddress, '198.51.100.10');
  });

  await t.test('database lookup failure returns unavailable and never authenticates', async () => {
    fixture = { id: 'failure', email: 'failure@example.test', verified: true };
    const { cookie } = await login();
    // Make a real PostgreSQL table temporarily unavailable in this disposable DB.
    await context.identity.runtime.prisma.$executeRawUnsafe('ALTER TABLE "session" RENAME TO "unavailable_session"');
    try {
      const failed = await request('/api/v1/identity/session', { headers: { cookie } });
      assert.equal(failed.status, 503);
      assert.equal((await failed.json()).message, 'Identity session lookup is unavailable.');
      assert.equal((await request('/api/v1/health')).status, 200);
    } finally {
      await context.identity.runtime.prisma.$executeRawUnsafe('ALTER TABLE "unavailable_session" RENAME TO "session"');
    }
  });

  await t.test('disabled identity exposes no auth handler and never falls back to stateless login', async () => {
    await context.app.close();
    process.env.IDENTITY_ENABLED = 'false';
    try {
      context = await start();
      assert.equal(context.identity.runtime, undefined);
      assert.deepEqual(await (await request('/api/v1/identity/config')).json(), { enabled: false, providers: [] });
      assert.equal((await request('/api/v1/identity/session')).status, 503);
      assert.equal((await request('/api/auth/ok')).status, 404);
      assert.equal((await request('/api/v1/health')).status, 200);
    } finally { process.env.IDENTITY_ENABLED = 'true'; }
  });
});
