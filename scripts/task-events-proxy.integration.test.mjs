import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { TextDecoder } from 'node:util';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';
async function until(check) {
  for (let n = 0; n < 200; n++) {
    if (check()) return;
    await delay(5);
  }
  assert.fail('Bounded wait expired');
}

test('T10 real HTTP proxy retains JSON body deadline while SSE outlives it and abort closes upstream', async (t) => {
  const server = createServer((req, res) => {
    res.setHeader(
      'Content-Type',
      req.url.endsWith('/events') ? 'text/event-stream' : 'application/json',
    );
    res.flushHeaders();
    if (req.url.endsWith('/events')) res.write('event: update\ndata: {"type":"heartbeat"}\n\n');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const oldURL = process.env.API_BASE_URL;
  process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (oldURL === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = oldURL;
  });
  const timeout = AbortSignal.timeout;
  AbortSignal.timeout = () => timeout(30);
  t.after(() => {
    AbortSignal.timeout = timeout;
  });
  const json = await proxyProjectTask(
    new Request('http://public.test/api/v1/workspaces/w/projects'),
  );
  await assert.rejects(json.text());
  const abort = new AbortController();
  let closed = false;
  server.on('connection', (socket) =>
    socket.on('close', () => {
      closed = true;
    }),
  );
  const sse = await proxyProjectTask(
    new Request('http://public.test/api/v1/workspaces/w/events', { signal: abort.signal }),
  );
  assert.equal(sse.headers.get('x-accel-buffering'), 'no');
  const reader = sse.body.getReader();
  assert.match(new TextDecoder().decode((await reader.read()).value), /heartbeat/);
  await delay(50);
  abort.abort();
  await assert.rejects(reader.read());
  await until(() => closed);
  assert.equal(
    (
      await proxyProjectTask(
        new Request(
          'http://public.test/api/v1/workspaces/w/task-discovery?scope=mine&scope=search',
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await proxyProjectTask(
        new Request('http://public.test/api/v1/workspaces/w/events', {
          headers: { origin: 'http://foreign.test' },
        }),
      )
    ).status,
    403,
  );
});
