import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { isHealthResponse } from '@rielia/contracts';

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
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ...env },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const entry = { name, child, log: '', stopped: false, error: undefined };
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => { entry.log = (entry.log + chunk.toString()).slice(-16000); });
  }
  child.on('error', (error) => { entry.error = error; });
  children.push(entry);
  return entry;
}

function signal(entry, name) {
  try {
    if (process.platform === 'win32') entry.child.kill(name);
    else process.kill(-entry.child.pid, name);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

async function stop(entry) {
  if (entry.stopped) return;
  entry.stopped = true;
  if (entry.child.exitCode !== null || entry.child.signalCode !== null) return;
  const exited = once(entry.child, 'exit');
  signal(entry, 'SIGTERM');
  let timer;
  const timedOut = new Promise((resolve) => { timer = setTimeout(() => resolve(true), 5000); });
  if (await Promise.race([exited.then(() => false), timedOut])) {
    signal(entry, 'SIGKILL');
    await exited;
  }
  clearTimeout(timer);
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
  const api = start('API', ['apps/api/dist/main.js'], root, { HOST: '127.0.0.1', PORT: String(apiPort) });
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

  await stop(api);
  const offline = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
  assert.equal(offline.status, 200, 'The development page must survive API downtime');
  assert.match(await offline.text(), /data-api-status="unavailable"/);
  console.log('Smoke passed: API contract/404, web ES/EN HTTP, live API status, API-down fallback.');
} catch (error) {
  console.error(error);
  for (const entry of children) console.error(`${entry.name}:\n${entry.log}`);
  process.exitCode = 1;
} finally {
  await Promise.all(children.map(stop));
}
