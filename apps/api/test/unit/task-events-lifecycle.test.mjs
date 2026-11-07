import 'reflect-metadata';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrincipalService } from '../../dist/principals/principal.service.js';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';
import { TaskEventsService } from '../../dist/projects/task-events.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
class ResponseBoundary extends EventEmitter {
  headers = new Map();
  frames = [];
  destroyed = false;
  headersSent = false;
  ends = 0;
  writable = true;
  writeError = null;
  setHeader(name, value) {
    this.headers.set(name, value);
  }
  flushHeaders() {
    this.headersSent = true;
  }
  write(frame) {
    if (this.writeError) throw this.writeError;
    this.frames.push(frame);
    return this.writable;
  }
  end() {
    this.ends++;
    this.destroyed = true;
    this.emit('close');
  }
  disconnect() {
    this.destroyed = true;
    this.emit('close');
  }
  data() {
    return this.frames.map((frame) => JSON.parse(frame.split('data: ')[1].trim()));
  }
  lastId() {
    return /^id: (.+)$/m.exec(this.frames.at(-1))?.[1];
  }
}

// Timers are explicit scheduler handles; a setImmediate boundary drains the
// awaited poll's microtasks, never a wall-clock sleep. Real ProjectTaskService
// still supplies the events composition; these doubles cannot prove PG commit
// visibility, SQL policy fences or actual socket backpressure.
function fixture(t) {
  t.mock.timers.enable({ apis: ['Date'], now });
  let id = 0;
  t.mock.method(
    crypto,
    'randomUUID',
    () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
  );
  syncBuiltinESMExports();
  const timers = new Set();
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.equal(delay, 1000);
    const handle = { callback };
    timers.add(handle);
    return handle;
  });
  t.mock.method(globalThis, 'clearTimeout', (handle) => {
    timers.delete(handle);
  });
  const context = Object.freeze({
    binding: 'workspace:user:session',
    boundary: 'current actor composition',
  });
  const actor = {
    actorPrincipalId: 'reader',
    workspaceId: 'w',
    principalKind: 'human',
    role: 'member',
    executionMode: 'human',
    source: 'web',
    grantId: null,
  };
  const state = {
    projects: [{ id: 'p', version: 1 }],
    canWrite: true,
    latest: 5n,
    events: [],
    hold: null,
    error: null,
  };
  const calls = { polls: 0, active: 0, maxActive: 0, aggregates: [], events: [] };
  const tx = {
    project: {
      findMany: async ({ select }) => {
        assert.deepEqual(select, { id: true, version: true });
        return state.projects;
      },
    },
    outboxEvent: {
      aggregate: async (input) => {
        calls.aggregates.push(input);
        return { _max: { sequence: state.latest } };
      },
      findMany: async (input) => {
        calls.events.push(input);
        return state.events;
      },
    },
  };
  const principals = {
    webSubscriptionKey: (received) => received.binding,
    domainOperation: async (_received, w, operation, work) => {
      assert.equal(w, 'w');
      assert.equal(operation, 'read');
      calls.polls++;
      calls.active++;
      calls.maxActive = Math.max(calls.maxActive, calls.active);
      try {
        if (state.hold) await state.hold.promise;
        if (state.error) throw state.error;
        return await work(tx, actor, state.canWrite);
      } finally {
        calls.active--;
      }
    },
  };
  const service = new TaskEventsService(new ProjectTaskService(principals), principals);
  assert.deepEqual(Reflect.getMetadata('design:paramtypes', TaskEventsService), [
    ProjectTaskService,
    PrincipalService,
  ]);
  const responses = [];
  const response = () => {
    const res = new ResponseBoundary();
    responses.push(res);
    return res;
  };
  const serve = (res, resume, current = context) => service.serve(current, 'w', res, resume);
  const advance = (milliseconds) => t.mock.timers.tick(milliseconds);
  const fire = async (milliseconds = 1000) => {
    advance(milliseconds);
    const handle = timers.values().next().value;
    assert.ok(handle, 'one scheduled poll exists');
    timers.delete(handle);
    handle.callback();
    await setImmediate();
  };
  t.after(() => {
    try {
      service.onModuleDestroy();
      assert.equal(timers.size, 0, 'all owned polling timers are cancelled');
      for (const res of responses) assert.equal(res.listenerCount('close'), 0);
    } finally {
      t.mock.restoreAll();
      syncBuiltinESMExports();
    }
  });
  return { service, context, actor, state, calls, timers, response, serve, advance, fire };
}

test('initial admission sends only an opaque reset and installs one bounded poll', async (t) => {
  const f = fixture(t);
  const res = f.response();
  await f.serve(res);
  assert.equal(res.headersSent, true);
  assert.equal(res.headers.get('Content-Type'), 'text/event-stream; charset=utf-8');
  assert.equal(res.headers.get('Cache-Control'), 'no-store, no-transform');
  assert.equal(res.headers.get('X-Accel-Buffering'), 'no');
  assert.deepEqual(res.data(), [{ type: 'reset' }]);
  assert.match(res.lastId(), /^[0-9a-f-]{36}$/);
  assert.equal(res.frames[0].includes('sequence'), false);
  assert.equal(f.timers.size, 1);
  assert.equal(f.calls.polls, 1);
});

test('polls stay sequential and disconnect during an awaited poll cannot schedule another producer', async (t) => {
  const f = fixture(t);
  const res = f.response();
  await f.serve(res);
  const hold = deferred();
  f.state.hold = hold;
  await f.fire();
  assert.equal(f.calls.active, 1);
  assert.equal(f.timers.size, 0);
  f.advance(9000);
  assert.equal(f.calls.polls, 2);
  assert.equal(f.calls.maxActive, 1);
  res.disconnect();
  f.state.hold = null;
  hold.resolve();
  await setImmediate();
  assert.equal(f.calls.active, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(res.listenerCount('close'), 0);
  assert.equal(
    f.calls.aggregates.length,
    1,
    'closed poll never accesses outbox after awaiting authority',
  );
});

test('per-session admission reserves all four slots before the first authority await', async (t) => {
  const f = fixture(t);
  const hold = deferred();
  f.state.hold = hold;
  const pending = Array.from({ length: 4 }, () => f.serve(f.response()));
  const denied = f.response();
  await assert.rejects(f.serve(denied), (error) => error.getStatus() === 503);
  assert.equal(f.calls.polls, 4);
  assert.equal(denied.headersSent, false);
  f.state.hold = null;
  hold.resolve();
  await Promise.all(pending);
  assert.equal(f.timers.size, 4);
});

test('global admission is bounded across otherwise distinct session bindings', async (t) => {
  const f = fixture(t);
  for (let index = 0; index < 32; index++)
    await f.serve(f.response(), undefined, { binding: `session-${index}` });
  await assert.rejects(
    f.serve(f.response(), undefined, { binding: 'session-overflow' }),
    (error) => error.getStatus() === 503,
  );
  assert.equal(f.calls.polls, 32);
  assert.equal(f.timers.size, 32);
});

test('backpressure closes immediately without queuing a producer or keeping its listener', async (t) => {
  const f = fixture(t);
  const res = f.response();
  res.writable = false;
  await f.serve(res);
  assert.equal(res.frames.length, 1);
  assert.equal(res.ends, 1);
  assert.equal(res.listenerCount('close'), 0);
  assert.equal(f.timers.size, 0);
});

test('initial authority failure restores admission capacity and leaves HTTP error handling to its caller', async (t) => {
  const f = fixture(t);
  const failed = f.response();
  f.state.error = new ServiceUnavailableException('unavailable');
  await assert.rejects(f.serve(failed), (error) => error === f.state.error);
  assert.equal(failed.headersSent, false);
  assert.equal(failed.ends, 0);
  assert.equal(failed.listenerCount('close'), 0);
  assert.equal(f.timers.size, 0);
  f.state.error = null;
  for (let index = 0; index < 4; index++) await f.serve(f.response());
  assert.equal(f.timers.size, 4);
});

test('disconnect before initial authority resolves sends no headers and leaves no poll ownership', async (t) => {
  const f = fixture(t);
  const hold = deferred();
  f.state.hold = hold;
  const res = f.response();
  const opening = f.serve(res);
  assert.equal(res.listenerCount('close'), 1);
  res.disconnect();
  f.state.hold = null;
  hold.resolve();
  await opening;
  assert.equal(res.headersSent, false);
  assert.deepEqual(res.frames, []);
  assert.equal(f.calls.aggregates.length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(res.listenerCount('close'), 0);
});

test('response-write failure after headers closes and releases initial stream ownership', async (t) => {
  const f = fixture(t);
  const res = f.response();
  res.writeError = new Error('disconnected response');
  await f.serve(res);
  assert.equal(res.headersSent, true);
  assert.equal(res.ends, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(res.listenerCount('close'), 0);
});

for (const [name, error, reason] of [
  ['session expiry', new UnauthorizedException('private diagnostic'), 'signed-out'],
  ['current workspace access loss', new ForbiddenException('private diagnostic'), 'forbidden'],
])
  test(`${name} sends only generic denial and closes the current stream`, async (t) => {
    const f = fixture(t);
    const res = f.response();
    await f.serve(res);
    f.state.error = error;
    await f.fire();
    assert.deepEqual(res.data().at(-1), { type: 'denied', reason });
    assert.equal(res.frames.join('').includes('private diagnostic'), false);
    assert.equal(res.ends, 1);
    assert.equal(f.timers.size, 0);
    assert.equal(res.listenerCount('close'), 0);
  });

test('poll storage failure closes without publishing diagnostics or another event', async (t) => {
  const f = fixture(t);
  const res = f.response();
  await f.serve(res);
  f.state.error = new ServiceUnavailableException('private database details');
  await f.fire();
  assert.deepEqual(res.data(), [{ type: 'reset' }]);
  assert.equal(res.ends, 1);
  assert.equal(f.timers.size, 0);
});

test('a changed current readable-project policy resets instead of replaying prior entitlement', async (t) => {
  const f = fixture(t);
  const res = f.response();
  await f.serve(res);
  f.state.projects = [];
  f.actor.role = 'viewer';
  f.state.canWrite = false;
  await f.fire();
  assert.deepEqual(res.data(), [{ type: 'reset' }, { type: 'reset' }]);
  assert.equal(f.calls.events.length, 0);
  assert.deepEqual(f.calls.aggregates[1].where.activity.projectId.in, []);
});

test('same-session resume emits bounded safe id/version hints and an initial heartbeat', async (t) => {
  const f = fixture(t);
  const original = f.response();
  await f.serve(original);
  const resume = original.lastId();
  original.disconnect();
  f.state.latest = 6n;
  f.state.events = [
    {
      sequence: 6n,
      activity: { projectId: 'p', taskId: 'task', entityVersion: 3, body: 'must not escape' },
    },
  ];
  const res = f.response();
  await f.serve(res, resume);
  assert.deepEqual(res.data(), [
    { type: 'invalidate', entity: 'task', id: 'task', projectId: 'p', version: 3 },
    { type: 'heartbeat' },
  ]);
  assert.equal(res.frames.join('').includes('must not escape'), false);
  assert.equal(f.calls.events[0].take, 101);
  assert.deepEqual(f.calls.events[0].select, {
    sequence: true,
    activity: { select: { projectId: true, taskId: true, entityVersion: true } },
  });
});

test('unknown, foreign-session and exactly expired resume handles give the same generic reset', async (t) => {
  const f = fixture(t);
  const original = f.response();
  await f.serve(original);
  const resume = original.lastId();
  original.disconnect();
  const unknown = f.response();
  await f.serve(unknown, 'unknown');
  unknown.disconnect();
  const foreign = f.response();
  await f.serve(foreign, resume, { binding: 'different-session' });
  foreign.disconnect();
  f.advance(60000);
  const expired = f.response();
  await f.serve(expired, resume);
  assert.deepEqual(unknown.data(), [{ type: 'reset' }]);
  assert.deepEqual(foreign.data(), unknown.data());
  assert.deepEqual(expired.data(), unknown.data());
  assert.equal(f.calls.events.length, 0);
});

test('over-limit backlog resets without sending a partial first hundred hints', async (t) => {
  const f = fixture(t);
  const original = f.response();
  await f.serve(original);
  const resume = original.lastId();
  original.disconnect();
  f.state.latest = 106n;
  f.state.events = Array.from({ length: 101 }, (_, index) => ({
    sequence: BigInt(index + 6),
    activity: { projectId: 'p', taskId: `task-${index}`, entityVersion: 2 },
  }));
  const res = f.response();
  await f.serve(res, resume);
  assert.deepEqual(res.data(), [{ type: 'reset' }]);
  assert.equal(res.frames.length, 1);
});

test('heartbeat and sixty-second renewal use controlled time while rechecking current access', async (t) => {
  const f = fixture(t);
  const res = f.response();
  await f.serve(res);
  await f.fire(15000);
  assert.deepEqual(res.data().at(-1), { type: 'heartbeat' });
  assert.equal(res.ends, 0);
  await f.fire(45000);
  assert.equal(res.ends, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.calls.polls, 3);
});

test('module destruction cancels every timer and listener and ends each owned response once', async (t) => {
  const f = fixture(t);
  const first = f.response();
  const second = f.response();
  await f.serve(first);
  await f.serve(second);
  assert.equal(f.timers.size, 2);
  f.service.onModuleDestroy();
  assert.equal(f.timers.size, 0, 'module destruction cancels owned polling timers');
  assert.equal(first.ends, 1);
  assert.equal(second.ends, 1);
  assert.equal(first.listenerCount('close') + second.listenerCount('close'), 0);
  f.service.onModuleDestroy();
  f.advance(120000);
  assert.equal(first.ends + second.ends, 2);
  assert.equal(f.calls.polls, 2);
});
