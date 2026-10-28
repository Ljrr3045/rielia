import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { isHealthResponse } from '@rielia/contracts';
import { startProcess, stopProcess as stop } from './smoke-process.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const webDirectory = fileURLToPath(new URL('../apps/web/', import.meta.url));
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const children = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function start(name, args, cwd, env) {
  const entry = startProcess(name, args, cwd, env);
  children.push(entry);
  return entry;
}

async function ready(entry, url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (entry.error || entry.child.exitCode !== null || entry.child.signalCode !== null) {
      throw new Error(`${entry.name} failed to start: ${entry.error ?? entry.log}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* Retry until startup deadline. */ }
    await delay(100);
  }
  throw new Error(`${entry.name} startup timed out.\n${entry.log}`);
}

try {
  const apiPort = await freePort();
  let webPort = await freePort();
  while (webPort === apiPort) webPort = await freePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;
  const api = start('API', ['apps/api/dist/main.js'], root, { HOST: '127.0.0.1', PORT: String(apiPort), IDENTITY_ENABLED: 'false' });
  await ready(api, `${apiUrl}/api/v1/health`);
  const health = await fetch(`${apiUrl}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
  assert.equal(health.status, 200);
  assert.match(health.headers.get('content-type') ?? '', /application\/json/);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  const body = await health.json();
  assert(isHealthResponse(body), 'API response must satisfy the public contract');
  assert.deepEqual(body, { status: 'ok', service: 'rielia-api' });
  assert.equal((await fetch(`${apiUrl}/api/v1/tasks`)).status, 404, 'Product routes must not be claimed');

  const web = start('Web', [webRequire.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(webPort)], webDirectory, { API_BASE_URL: apiUrl });
  await ready(web, webUrl);
  const response = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  const html = await response.text();
  assert.match(html, /lang="es"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /A technical starting point/);
  assert.match(html, /Todavía no es una aplicación/);
  assert.match(html, /data-api-status="available"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);

  const config = await fetch(`${webUrl}/api/v1/identity/config`);
  assert.equal(config.status, 200);
  assert.equal(config.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await config.json(), { enabled: false, providers: [] });
  assert.equal((await fetch(`${webUrl}/api/v1/identity/session`)).status, 503);
  for (const path of ['workspaces', 'workspaces/unknown/members']) {
    const response = await fetch(`${webUrl}/api/v1/${path}`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const acceptance = await fetch(`${webUrl}/api/v1/workspace-invitations/accept`, { method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': '00000000-0000-4000-8000-000000000000' }, body: JSON.stringify({ token: 'x'.repeat(43) }) });
  assert.equal(acceptance.status, 403, 'Next acceptance route must reach the backend origin guard');
  assert.equal((await fetch(`${webUrl}/api/v1/identity/unknown`)).status, 404);
  assert.equal((await fetch(`${webUrl}/api/auth/ok`)).status, 404);

  await stop(api);
  const offline = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
  assert.equal(offline.status, 200, 'The development page must survive API downtime');
  assert.match(await offline.text(), /data-api-status="unavailable"/);
  const unavailableIdentity = await fetch(`${webUrl}/api/v1/identity/session`);
  assert.equal(unavailableIdentity.status, 503);
  assert.equal(unavailableIdentity.headers.get('cache-control'), 'no-store');
  console.log('Smoke passed: API contract/404, web ES/EN HTTP, identity proxy/disabled state, API-down fallback.');
} catch (error) {
  console.error(error);
  for (const entry of children) console.error(`${entry.name}:\n${entry.log}`);
  process.exitCode = 1;
} finally {
  await Promise.all(children.map(stop));
}
