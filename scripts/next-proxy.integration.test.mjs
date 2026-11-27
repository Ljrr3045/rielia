import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, request as httpRequest } from 'node:http';
import { once } from 'node:events';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { TextDecoder } from 'node:util';
import { startProcess, stopProcess } from './smoke-process.mjs';
import { planning, settings } from '../apps/web/test/unit/sprint-client-fixtures.mjs';

const webDirectory = fileURLToPath(new URL('../apps/web/', import.meta.url));
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const requestId = '11111111-1111-4111-8111-111111111111';
const renewedCookies = [
  'first=fixture-renewed; Path=/; HttpOnly; SameSite=Lax',
  'second=fixture-renewed; Expires=Wed, 21 Oct 2037 07:28:00 GMT; Path=/; HttpOnly',
];
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function bounded(promise, milliseconds, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function firstEvent(reader) {
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    assert.equal(done, false, 'SSE ended before its first complete event');
    bytes += value.byteLength;
    assert.ok(bytes <= 4096, 'SSE first event exceeded fixture byte limit');
    text += decoder.decode(value, { stream: true });
    const end = text.indexOf('\n\n');
    if (end !== -1) return text.slice(0, end + 2);
  }
}
async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}
async function ready(entry, url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (entry.error || entry.child.exitCode !== null || entry.child.signalCode !== null)
      throw new Error(`Next fixture exited: ${entry.error ?? entry.log}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await response.body?.cancel();
      if (response.status === 404) return;
    } catch {
      /* Retry only bounded process readiness. */
    }
    await delay(100);
  }
  throw new Error(`Next fixture readiness timed out: ${entry.log}`);
}
function rawResponse(url, options) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      url,
      {
        method: options.method,
        headers: options.headers,
        signal: AbortSignal.timeout(10000),
        agent: false,
      },
      (response) => {
        const chunks = [];
        let bytes = 0;
        response.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > 65536) response.destroy(new Error('Fixture body limit exceeded'));
          else chunks.push(chunk);
        });
        response.on('error', reject);
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    request.on('error', reject);
    request.end(options.body);
  });
}

test(
  'production Next preserves compressed upstream JSON framing/status/cookies and delivers SSE before abort cleanup',
  { timeout: 45000 },
  async (t) => {
    let web;
    let upstreamFailure = null;
    let webURL;
    const upstreamCalls = [];
    const eventClosed = deferred();
    const eventStarted = deferred();
    const payload = { ...planning, fixture: 'café 👋'.repeat(512) };
    const jsonBytes = Buffer.from(JSON.stringify(payload));
    const conflict = { code: 'fixture-conflict', current: planning };
    const server = createServer(async (request, response) => {
      try {
        upstreamCalls.push(request.url);
        if (request.url === '/api/v1/workspaces/w/events') {
          assert.equal(request.headers.origin, undefined);
          assert.equal(request.headers['sec-fetch-site'], 'same-origin');
          response.once('close', eventClosed.resolve);
          response.writeHead(200, {
            'content-type': 'text/event-stream',
            'x-request-id': requestId,
          });
          response.flushHeaders();
          response.write('event: update\ndata: {"type":"heartbeat"}\n');
          eventStarted.resolve();
          await delay(10);
          response.write('\n');
          return;
        }
        const denied = request.url === '/api/v1/workspaces/w/projects/denied/planning';
        assert.equal(
          request.url,
          denied
            ? '/api/v1/workspaces/w/projects/denied/planning'
            : '/api/v1/workspaces/w/projects/p/planning',
        );
        if (!denied) {
          assert.equal(request.method, 'POST');
          assert.equal(request.headers.cookie, 'session=fictional');
          assert.equal(request.headers.origin, webURL);
          assert.equal(request.headers['idempotency-key'], requestId);
          let body = '';
          for await (const chunk of request) body += chunk;
          assert.equal(body, JSON.stringify({ expectedVersion: 2, ...settings }));
        }
        const compressed = gzipSync(denied ? Buffer.from(JSON.stringify(conflict)) : jsonBytes);
        response.writeHead(denied ? 409 : 201, {
          'content-type': 'application/json; charset=utf-8',
          'content-encoding': 'gzip',
          'content-length': compressed.length,
          'x-request-id': requestId,
          'set-cookie': renewedCookies,
        });
        response.end(compressed);
      } catch (error) {
        upstreamFailure = error;
        response.writeHead(500);
        response.end('Fixture failed');
      }
    });
    t.after(async () => {
      if (web) await stopProcess(web);
      const closed = new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      server.closeAllConnections();
      await closed;
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const upstreamURL = `http://127.0.0.1:${server.address().port}`;
    let port = await freePort();
    while (port === server.address().port) port = await freePort();
    webURL = `http://127.0.0.1:${port}`;
    web = startProcess(
      'Next HTTP boundary',
      [
        webRequire.resolve('next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      webDirectory,
      { API_BASE_URL: upstreamURL },
    );
    await ready(web, `${webURL}/api/v1/identity/unknown`);

    const body = JSON.stringify({ expectedVersion: 2, ...settings });
    const compressed = await rawResponse(`${webURL}/api/v1/workspaces/w/projects/p/planning`, {
      method: 'POST',
      headers: {
        origin: webURL,
        cookie: 'session=fictional',
        'sec-fetch-site': 'same-origin',
        'idempotency-key': requestId,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'accept-encoding': 'gzip',
      },
      body,
    });
    assert.equal(compressed.status, 201);
    assert.equal(compressed.headers['cache-control'], 'no-store');
    assert.equal(compressed.headers['x-request-id'], requestId);
    assert.deepEqual(compressed.headers['set-cookie'], renewedCookies);
    assert.equal(compressed.headers['content-encoding'], 'gzip');
    assert.equal(
      Boolean(compressed.headers['content-length'] && compressed.headers['transfer-encoding']),
      false,
    );
    if (compressed.headers['content-length'])
      assert.equal(Number(compressed.headers['content-length']), compressed.body.length);
    assert.deepEqual(gunzipSync(compressed.body), jsonBytes);

    const denied = await rawResponse(`${webURL}/api/v1/workspaces/w/projects/denied/planning`, {
      method: 'GET',
      headers: { 'accept-encoding': 'identity' },
    });
    assert.equal(denied.status, 409);
    assert.equal(denied.headers['x-request-id'], requestId);
    assert.deepEqual(denied.headers['set-cookie'], renewedCookies);
    assert.ok(
      !denied.headers['content-encoding'] || denied.headers['content-encoding'] === 'identity',
    );
    if (denied.headers['content-length'])
      assert.equal(Number(denied.headers['content-length']), denied.body.length);
    assert.deepEqual(JSON.parse(denied.body.toString('utf8')), conflict);

    const caller = new AbortController();
    const stream = await fetch(`${webURL}/api/v1/workspaces/w/events`, {
      headers: { 'sec-fetch-site': 'same-origin', accept: 'text/event-stream' },
      signal: AbortSignal.any([caller.signal, AbortSignal.timeout(10000)]),
    });
    assert.equal(stream.status, 200);
    assert.match(stream.headers.get('content-type'), /^text\/event-stream/);
    assert.equal(stream.headers.get('cache-control'), 'no-store, no-transform');
    assert.equal(stream.headers.get('x-accel-buffering'), 'no');
    const reader = stream.body.getReader();
    try {
      await eventStarted.promise;
      const first = await bounded(firstEvent(reader), 5000, 'SSE first event was buffered');
      assert.equal(first, 'event: update\ndata: {"type":"heartbeat"}\n\n');
      caller.abort();
      await assert.rejects(reader.read());
      await bounded(eventClosed.promise, 5000, 'SSE abort did not close upstream');
    } finally {
      caller.abort();
      reader.releaseLock();
    }
    assert.equal(upstreamFailure, null);
    assert.deepEqual(upstreamCalls, [
      '/api/v1/workspaces/w/projects/p/planning',
      '/api/v1/workspaces/w/projects/denied/planning',
      '/api/v1/workspaces/w/events',
    ]);
    await stopProcess(web);
    assert.ok(web.child.exitCode !== null || web.child.signalCode !== null);
  },
);
