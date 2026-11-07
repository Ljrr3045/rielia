import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { TextDecoder } from 'node:util';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';

test(
  'T10 real HTTP proxy retains JSON body deadline while SSE outlives it and abort closes upstream',
  { timeout: 5000 },
  async (t) => {
    let resolveClosed;
    let completeJSONBody;
    const sseClosed = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const server = createServer((req, res) => {
      res.setHeader(
        'Content-Type',
        req.url.endsWith('/events') ? 'text/event-stream' : 'application/json',
      );
      res.flushHeaders();
      if (req.url.endsWith('/events')) {
        res.once('close', resolveClosed);
        res.write('event: update\ndata: {"type":"heartbeat"}\n\n');
      } else {
        completeJSONBody = () => {
          if (!res.destroyed) res.end('{"late":true}');
        };
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(async () => {
      const closed = new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      server.closeAllConnections();
      await closed;
    });
    const oldURL = process.env.API_BASE_URL;
    process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
    t.after(() => {
      if (oldURL === undefined) delete process.env.API_BASE_URL;
      else process.env.API_BASE_URL = oldURL;
    });
    const timeout = AbortSignal.timeout;
    const earlyDeadline = new AbortController();
    earlyDeadline.abort();
    const bodyDeadline = new AbortController();
    let timeoutCalls = 0;
    AbortSignal.timeout = (milliseconds) => {
      assert.equal(milliseconds, 15000);
      return ++timeoutCalls === 1 ? earlyDeadline.signal : bodyDeadline.signal;
    };
    t.after(() => {
      AbortSignal.timeout = timeout;
    });
    // A timeout before headers is a legitimate 503 response, not a rejected body.
    // Control deadline admission rather than racing a 30ms wall clock on busy CI.
    const early = await proxyProjectTask(
      new Request('http://public.test/api/v1/workspaces/w/projects'),
    );
    assert.equal(early.status, 503);
    assert.deepEqual(await early.json(), { message: 'Project/task request unavailable.' });
    const json = await proxyProjectTask(
      new Request('http://public.test/api/v1/workspaces/w/projects'),
    );
    assert.equal(json.status, 200);
    assert.equal(json.headers.get('content-type'), 'application/json');
    const bodyRejected = assert.rejects(json.text());
    bodyDeadline.abort();
    completeJSONBody();
    await bodyRejected;
    const abort = new AbortController();
    const sse = await proxyProjectTask(
      new Request('http://public.test/api/v1/workspaces/w/events', { signal: abort.signal }),
    );
    assert.equal(sse.status, 200);
    assert.equal(sse.headers.get('content-type'), 'text/event-stream');
    assert.equal(sse.headers.get('x-accel-buffering'), 'no');
    const reader = sse.body.getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value), /heartbeat/);
    assert.equal(timeoutCalls, 2, 'SSE never subscribes to the already expired JSON deadline');
    const streamRejected = assert.rejects(reader.read());
    abort.abort();
    await streamRejected;
    await sseClosed;
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
  },
);
