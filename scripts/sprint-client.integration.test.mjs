import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Buffer } from 'node:buffer';
import {
  createSprintPlanningTransport,
  SprintPlanningFailure,
} from '../apps/web/src/lib/sprint-client.ts';
import { settings } from '../apps/web/test/unit/sprint-client-fixtures.mjs';
import {
  createTaskPlanningTransport,
  TaskPlanningFailure,
} from '../apps/web/src/lib/task-planning-client.ts';

const command = {
  type: 'configure-planning',
  workspaceId: 'w',
  projectId: 'p',
  expectedVersion: 2,
  settings,
};
const key = '11111111-1111-4111-8111-111111111111';
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function fixture(t, handler) {
  const seen = deferred();
  const disconnected = deferred();
  const calls = [];
  const bodies = [];
  const server = createServer((request, response) => {
    calls.push({ path: request.url, key: request.headers['idempotency-key'] });
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.once('end', () => bodies.push(Buffer.concat(chunks).toString('utf8')));
    request.resume();
    response.once('close', disconnected.resolve);
    handler(response);
    seen.resolve();
  });
  t.after(async () => {
    const closed = new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    server.closeAllConnections();
    await closed;
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    seen: seen.promise,
    disconnected: disconnected.promise,
    calls,
    bodies,
    baseURL: `http://127.0.0.1:${server.address().port}`,
  };
}

test(
  'Sprint real HTTP caller abort disconnects one captured write and already-aborted calls send nothing',
  { timeout: 8000 },
  async (t) => {
    const f = await fixture(t, () => {});
    const transport = createSprintPlanningTransport({ baseURL: f.baseURL });
    const preAborted = new AbortController();
    preAborted.abort();
    await assert.rejects(
      transport.mutate(command, key, preAborted.signal),
      (error) => error.name === 'AbortError' && !(error instanceof SprintPlanningFailure),
    );
    assert.equal(f.calls.length, 0);
    const caller = new AbortController();
    const pending = transport.mutate(command, key, caller.signal);
    await f.seen;
    const rejected = assert.rejects(
      pending,
      (error) => error.name === 'AbortError' && !(error instanceof SprintPlanningFailure),
    );
    caller.abort();
    await rejected;
    await f.disconnected;
    assert.deepEqual(f.calls, [{ path: '/api/v1/workspaces/w/projects/p/planning', key }]);
  },
);

test(
  'Sprint real HTTP deadline before headers preserves raw failure and closes one write',
  { timeout: 8000 },
  async (t) => {
    const f = await fixture(t, () => {});
    const transport = createSprintPlanningTransport({ baseURL: f.baseURL, timeout: 1000 });
    const pending = transport.mutate(command, key, new AbortController().signal);
    const rejected = assert.rejects(
      pending,
      (error) => error.name === 'TimeoutError' && !(error instanceof SprintPlanningFailure),
    );
    await f.seen;
    await rejected;
    await f.disconnected;
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].key, key);
  },
);

test(
  'Sprint real HTTP body deadline remains active after headers and retains parse-failure request ID',
  { timeout: 8000 },
  async (t) => {
    const f = await fixture(t, (response) => {
      response.writeHead(201, { 'content-type': 'application/json', 'x-request-id': 'body-id' });
      response.flushHeaders();
      response.write('{"mode":');
    });
    const transport = createSprintPlanningTransport({ baseURL: f.baseURL, timeout: 1000 });
    const pending = transport.mutate(command, key, new AbortController().signal);
    const rejected = assert.rejects(
      pending,
      (error) =>
        error instanceof SprintPlanningFailure &&
        error.status === 502 &&
        error.code === null &&
        error.current === null &&
        error.requestId === 'body-id',
    );
    await f.seen;
    await rejected;
    await f.disconnected;
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].key, key);
  },
);

test(
  'Sprint real HTTP redirect rejection never follows or replays a submitted write',
  { timeout: 8000 },
  async (t) => {
    const f = await fixture(t, (response) => {
      response.writeHead(302, { location: '/replayed' });
      response.end();
    });
    const transport = createSprintPlanningTransport({ baseURL: f.baseURL });
    await assert.rejects(
      transport.mutate(command, key, new AbortController().signal),
      (error) => error instanceof TypeError && !(error instanceof SprintPlanningFailure),
    );
    await f.seen;
    await f.disconnected;
    assert.deepEqual(f.calls, [{ path: '/api/v1/workspaces/w/projects/p/planning', key }]);
  },
);

test(
  'expanded task estimate keeps captured bytes/key and request ID when its real successful body times out',
  { timeout: 8000 },
  async (t) => {
    const f = await fixture(t, (response) => {
      response.writeHead(202, { 'content-type': 'text/plain', 'x-request-id': 'estimate-body-id' });
      response.flushHeaders();
      response.write('{"taskId":');
    });
    const transport = createTaskPlanningTransport({ baseURL: f.baseURL, timeout: 1000 });
    const input = { expectedVersion: 2, estimatePoints: 0 };
    const pending = transport.estimate('w', 'p', 't', input, key, new AbortController().signal);
    const rejected = assert.rejects(
      pending,
      (error) =>
        error instanceof TaskPlanningFailure &&
        error.status === 502 &&
        error.requestId === 'estimate-body-id',
    );
    await f.seen;
    await rejected;
    await f.disconnected;
    assert.deepEqual(f.calls, [{ path: '/api/v1/workspaces/w/projects/p/tasks/t/planning', key }]);
    assert.deepEqual(f.bodies, ['{"expectedVersion":2,"estimatePoints":0}']);
  },
);
