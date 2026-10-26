import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { startProcess, stopProcess } from '../../../scripts/smoke-process.mjs';

export const root = fileURLToPath(new URL('../../../', import.meta.url));
export const main = fileURLToPath(new URL('../dist/main.js', import.meta.url));
export const health = { status: 'ok', service: 'rielia-api' };
export const config = (origin) => ({ RIELIA_API_ORIGIN: origin, RIELIA_MCP_ALLOW_LOOPBACK_HTTP: 'true' });
const cleanup = new Set();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void Promise.allSettled([...cleanup].map((stop) => stop())).then(() => process.exit(signal === 'SIGINT' ? 130 : 143));
  });
}

export function trackedProcess(t, name, args, cwd, env) {
  const entry = startProcess(name, args, cwd, env);
  const stop = async () => {
    await stopProcess(entry);
    // A failed launcher can exit before its child. Its dedicated group still
    // belongs to this test, so reap descendants even when the parent has exited.
    if (process.platform !== 'win32' && typeof entry.child.pid === 'number') {
      try { process.kill(-entry.child.pid, 'SIGKILL'); }
      catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  };
  cleanup.add(stop);
  t.after(async () => { await stop(); cleanup.delete(stop); });
  return entry;
}

export async function assertGroupExited(entry) {
  if (process.platform === 'win32') return;
  const deadline = Date.now() + 500;
  while (Date.now() < deadline) {
    try { process.kill(-entry.child.pid, 0); }
    catch (error) { if (error.code === 'ESRCH') return; throw error; }
    await delay(10);
  }
  assert.fail(`${entry.name} left a child process in its dedicated group`);
}

export async function fixture(t, handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  t.after(async () => {
    const closed = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await closed;
    await assert.rejects(fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(500) }));
  });
  return { server, origin: `http://127.0.0.1:${port}`, port };
}

export async function backend(t) {
  // Reserve an ephemeral port, release it, then launch our own real Nest process.
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  const origin = `http://127.0.0.1:${port}`;
  await new Promise((resolve) => reservation.close(resolve));
  const entry = trackedProcess(t, 'MCP test Nest', ['apps/api/dist/main.js'], root, {
    HOST: '127.0.0.1', PORT: String(port), IDENTITY_ENABLED: 'false',
  });
  t.after(async () => {
    await stopProcess(entry);
    assert(entry.child.exitCode !== null || entry.child.signalCode !== null);
    await assert.rejects(fetch(`${origin}/api/v1/health`, { signal: AbortSignal.timeout(500) }));
  });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (entry.error || entry.child.exitCode !== null) throw new Error('Test Nest failed to start');
    try {
      const response = await fetch(`${origin}/api/v1/health`, { signal: AbortSignal.timeout(300) });
      assert.deepEqual(await response.json(), health);
      return origin;
    } catch { await delay(50); }
  }
  throw new Error('Test Nest startup timed out');
}

export function wire(t, env) {
  const child = spawn(process.execPath, [main], { cwd: root, env, stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  let sequence = 0;
  const pending = new Map();
  const lines = [];
  const exited = once(child, 'exit');
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
  };
  cleanup.add(stop);
  // Attach immediately, including invalid-startup cases.
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  createInterface({ input: child.stdout }).on('line', (line) => {
    lines.push(line);
    const message = JSON.parse(line); // Any nonprotocol stdout fails the test.
    assert.equal(message.jsonrpc, '2.0');
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  t.after(async () => {
    await stop();
    cleanup.delete(stop);
  });
  const send = (message) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
  const request = (method, params = {}) => {
    const id = ++sequence;
    const answer = new Promise((resolve) => pending.set(id, resolve));
    send({ id, method, params });
    return { id, answer: answer.then((result) => result) };
  };
  return {
    child, exited, lines, stderr: () => stderr, send, request,
    async initialize() {
      const result = await request('initialize', {
        protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'rielia-wire-test', version: '0.0.0' },
      }).answer;
      assert.equal(result.result.protocolVersion, '2025-11-25');
      send({ method: 'notifications/initialized' });
    },
    async close(signal) {
      if (signal) child.kill(signal);
      else child.stdin.end();
      const result = await Promise.race([exited, delay(1000, 'timeout', { ref: false })]);
      assert.notEqual(result, 'timeout', 'MCP child must exit promptly without forced cleanup');
      assert.deepEqual(result, [0, null]);
      assert.equal(stderr, '');
    },
  };
}

export async function diagnostic(t, origin) {
  const peer = wire(t, config(origin));
  await peer.initialize();
  return peer;
}
