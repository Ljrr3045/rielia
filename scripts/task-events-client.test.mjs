import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'node:http';
import { TextEncoder, TextDecoder } from 'node:util';
import { ReadableStream } from 'node:stream/web';
import { connectTaskEvents } from '../apps/web/src/lib/task-events-client.ts';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';
import { isTaskDiscoveryQuery, isTaskInvalidation, parseTaskDiscoveryQuery } from '@rielia/contracts';
async function until(check) { for (let n = 0; n < 200; n++) { if (check()) return; await delay(5); } assert.fail('Bounded wait expired'); }
test('T10 strict discovery/invalidation guards reject array/coercion and forged scalar values', () => {
  const query = { scope: 'mine', q: '', view: 'active', filters: {} }; assert.ok(isTaskDiscoveryQuery(query));
  for (const patch of [{ scope: ['mine'] }, { view: ['active'] }, { q: ['title'] }, { filters: { status: ['todo'] } }, { filters: { assignee: 'other' } }]) assert.equal(isTaskDiscoveryQuery({ ...query, ...patch }), false);
  assert.equal(parseTaskDiscoveryQuery({ scope: ['mine'] }), null); assert.equal(parseTaskDiscoveryQuery({ q: 'x', limit: '999' }), null);
  assert.equal(isTaskInvalidation({ type: ['reset'] }), false); assert.equal(isTaskInvalidation({ type: 'denied', reason: ['forbidden'] }), false);
  assert.equal(isTaskInvalidation({ type: 'invalidate', entity: ['task'], id: 't', projectId: 'p', version: 1 }), false);
});
test('T10 SSE parser handles split UTF8/CRLF, resumes exact opaque handle, bounds retries and cancels', async () => {
  const statuses = []; const events = []; const requests = []; let cancelled = false;
  const bytes = new TextEncoder().encode('id: opaque-1\r\nevent: update\r\ndata: {"type":"invalidate","entity":"task","id":"t","projectId":"p","version":2}\r\n\r\n');
  const close = connectTaskEvents({ workspaceId: 'w', retryDelays: [0], onStatus: s => statuses.push(s), onEvent: e => events.push(e), fetch: async (url, init) => {
    requests.push({ url, init }); if (requests.length > 1) return new Response('', { status: 503 });
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes.slice(0, 40)); controller.enqueue(bytes.slice(40)); controller.close(); }, cancel() { cancelled = true; } }), { headers: { 'content-type': 'text/event-stream' } });
  } });
  await until(() => statuses.includes('offline')); close(); assert.equal(requests.length, 2); assert.equal(requests[1].init.headers['Last-Event-ID'], 'opaque-1');
  assert.deepEqual(events.find(e => e.type === 'invalidate'), { type: 'invalidate', entity: 'task', id: 't', projectId: 'p', version: 2 }); assert.ok(requests.every(r => r.init.credentials === 'same-origin'));
  const before = events.length; await delay(10); assert.equal(events.length, before); assert.equal(typeof cancelled, 'boolean');
});
test('T10 SSE denial stops retries, late aborted connection emits nothing, malformed/oversized streams become offline', async () => {
  for (const status of [401, 403]) {
    const states = []; const events = []; let calls = 0; const close = connectTaskEvents({ workspaceId: 'w', retryDelays: [0], onStatus: s => states.push(s), onEvent: e => events.push(e), fetch: async () => { calls++; return new Response('', { status }); } });
    await until(() => events.some(e => e.type === 'denied')); close(); assert.equal(calls, 1); assert.ok(states.includes(status === 401 ? 'signed-out' : 'forbidden'));
  }
  let resolve; const late = new Promise(r => { resolve = r; }); const events = []; const close = connectTaskEvents({ workspaceId: 'w', onStatus() {}, onEvent: e => events.push(e), fetch: () => late }); close(); resolve(new Response('event: update\ndata: {"type":"reset"}\n\n', { headers: { 'content-type': 'text/event-stream' } })); await delay(10); assert.equal(events.length, 0);
  for (const data of ['event: update\ndata: {"type":"reset","title":"secret"}\n\n', 'x'.repeat(5000)]) {
    const states = []; const close = connectTaskEvents({ workspaceId: 'w', retryDelays: [], onStatus: s => states.push(s), onEvent() {}, fetch: async () => new Response(data, { headers: { 'content-type': 'text/event-stream' } }) }); await until(() => states.includes('offline')); close();
  }
});
test('T10 real HTTP proxy retains JSON body deadline while SSE outlives it and abort closes upstream', async t => {
  const server = createServer((req, res) => { res.setHeader('Content-Type', req.url.endsWith('/events') ? 'text/event-stream' : 'application/json'); res.flushHeaders(); if (req.url.endsWith('/events')) res.write('event: update\ndata: {"type":"heartbeat"}\n\n'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => { server.closeAllConnections(); server.close(); });
  const oldURL = process.env.API_BASE_URL; process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`; t.after(() => { if (oldURL === undefined) delete process.env.API_BASE_URL; else process.env.API_BASE_URL = oldURL; });
  const timeout = AbortSignal.timeout; AbortSignal.timeout = () => timeout(30); t.after(() => { AbortSignal.timeout = timeout; });
  const json = await proxyProjectTask(new Request('http://public.test/api/v1/workspaces/w/projects')); await assert.rejects(json.text());
  const abort = new AbortController(); let closed = false; server.on('connection', socket => socket.on('close', () => { closed = true; }));
  const sse = await proxyProjectTask(new Request('http://public.test/api/v1/workspaces/w/events', { signal: abort.signal })); assert.equal(sse.headers.get('x-accel-buffering'), 'no');
  const reader = sse.body.getReader(); assert.match(new TextDecoder().decode((await reader.read()).value), /heartbeat/); await delay(50); abort.abort(); await assert.rejects(reader.read()); await until(() => closed);
  assert.equal((await proxyProjectTask(new Request('http://public.test/api/v1/workspaces/w/task-discovery?scope=mine&scope=search'))).status, 400);
  assert.equal((await proxyProjectTask(new Request('http://public.test/api/v1/workspaces/w/events', { headers: { origin: 'http://foreign.test' } }))).status, 403);
});
