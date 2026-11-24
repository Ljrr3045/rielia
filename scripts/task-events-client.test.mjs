import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { TextEncoder } from 'node:util';
import { ReadableStream } from 'node:stream/web';
import { connectTaskEvents } from '../apps/web/src/lib/task-events-client.ts';
async function until(check) {
  for (let n = 0; n < 200; n++) {
    if (check()) return;
    await delay(5);
  }
  assert.fail('Bounded wait expired');
}
test('T10 SSE parser handles split UTF8/CRLF, resumes exact opaque handle, bounds retries and cancels', async () => {
  const statuses = [];
  const events = [];
  const requests = [];
  let cancelled = false;
  const bytes = new TextEncoder().encode(
    'id: opaque-1\r\nevent: update\r\ndata: {"type":"invalidate","entity":"task","id":"t","projectId":"p","version":2}\r\n\r\n',
  );
  const close = connectTaskEvents({
    workspaceId: 'w',
    retryDelays: [0],
    onStatus: (s) => statuses.push(s),
    onEvent: (e) => events.push(e),
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (requests.length > 1) return new Response('', { status: 503 });
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(bytes.slice(0, 40));
            controller.enqueue(bytes.slice(40));
            controller.close();
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      );
    },
  });
  await until(() => statuses.includes('offline'));
  close();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].init.headers['Last-Event-ID'], 'opaque-1');
  assert.deepEqual(
    events.find((e) => e.type === 'invalidate'),
    { type: 'invalidate', entity: 'task', id: 't', projectId: 'p', version: 2 },
  );
  assert.ok(requests.every((r) => r.init.credentials === 'same-origin'));
  const before = events.length;
  await delay(10);
  assert.equal(events.length, before);
  assert.equal(typeof cancelled, 'boolean');
});
test('T10 SSE denial stops retries, late aborted connection emits nothing, malformed/oversized streams become offline', async () => {
  for (const status of [401, 403]) {
    const states = [];
    const events = [];
    let calls = 0;
    const close = connectTaskEvents({
      workspaceId: 'w',
      retryDelays: [0],
      onStatus: (s) => states.push(s),
      onEvent: (e) => events.push(e),
      fetch: async () => {
        calls++;
        return new Response('', { status });
      },
    });
    await until(() => events.some((e) => e.type === 'denied'));
    close();
    assert.equal(calls, 1);
    assert.ok(states.includes(status === 401 ? 'signed-out' : 'forbidden'));
  }
  let resolve;
  const late = new Promise((r) => {
    resolve = r;
  });
  const events = [];
  const close = connectTaskEvents({
    workspaceId: 'w',
    onStatus() {},
    onEvent: (e) => events.push(e),
    fetch: () => late,
  });
  close();
  resolve(
    new Response('event: update\ndata: {"type":"reset"}\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    }),
  );
  await delay(10);
  assert.equal(events.length, 0);
  for (const data of [
    'event: update\ndata: {"type":"reset","title":"secret"}\n\n',
    'x'.repeat(5000),
  ]) {
    const states = [];
    const close = connectTaskEvents({
      workspaceId: 'w',
      retryDelays: [],
      onStatus: (s) => states.push(s),
      onEvent() {},
      fetch: async () => new Response(data, { headers: { 'content-type': 'text/event-stream' } }),
    });
    await until(() => states.includes('offline'));
    close();
  }
});

test('schema-backed SSE alternatives survive actual split multibyte UTF8 and stop at wire denial', async () => {
  const events = [],
    statuses = [];
  const payload =
    ': café 😀\r\nid: resume_1\r\nevent: update\r\ndata: {"type":"heartbeat"}\r\n\r\nevent: update\ndata: {"type":"invalidate","entity":"project","id":"p","projectId":"p","version":9007199254740991}\n\nevent: update\ndata: {"type":"reset"}\n\nevent: update\ndata: {"type":"denied","reason":"forbidden"}\n\nevent: update\ndata: {"type":"heartbeat"}\n\n';
  const bytes = new TextEncoder().encode(payload);
  const split = bytes.findIndex((byte) => byte >= 128) + 1;
  let calls = 0;
  const close = connectTaskEvents({
    workspaceId: 'w',
    retryDelays: [0],
    onEvent: (event) => events.push(event),
    onStatus: (status) => statuses.push(status),
    fetch: async () => {
      calls++;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(bytes.slice(0, split));
            controller.enqueue(bytes.slice(split));
            controller.close();
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      );
    },
  });
  await until(() => statuses.includes('forbidden'));
  close();
  assert.deepEqual(events, [
    { type: 'reset' },
    { type: 'heartbeat' },
    {
      type: 'invalidate',
      entity: 'project',
      id: 'p',
      projectId: 'p',
      version: Number.MAX_SAFE_INTEGER,
    },
    { type: 'reset' },
    { type: 'denied', reason: 'forbidden' },
  ]);
  assert.equal(calls, 1);
});

test('malformed JSON event alternatives become offline without exposing payloads or retrying writes', async () => {
  const valid = { type: 'invalidate', entity: 'task', id: 't', projectId: 'p', version: 1 };
  for (const value of [
    null,
    [],
    {},
    { type: ['heartbeat'] },
    { type: 'reset', extra: true },
    { type: 'denied', reason: ['forbidden'] },
    { ...valid, version: 0 },
    { ...valid, version: Number.MAX_SAFE_INTEGER + 1 },
    { ...valid, entity: ['task'] },
    { ...valid, id: 'bad id' },
  ]) {
    const events = [],
      statuses = [];
    const close = connectTaskEvents({
      workspaceId: 'w',
      retryDelays: [],
      onEvent: (event) => events.push(event),
      onStatus: (status) => statuses.push(status),
      fetch: async () =>
        new Response(`event: update\ndata: ${JSON.stringify(value)}\n\n`, {
          headers: { 'content-type': 'text/event-stream' },
        }),
    });
    await until(() => statuses.includes('offline'));
    close();
    assert.deepEqual(events, [{ type: 'reset' }]);
  }
});
