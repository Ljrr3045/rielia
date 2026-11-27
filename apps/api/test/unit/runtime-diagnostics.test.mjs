import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  diagnosticCommandSchema,
  diagnosticPayloadSchema,
  diagnosticResultSchema,
  diagnosticResult,
  isWorkerHeartbeatFresh,
} from '../../dist/runtime/diagnostic-schemas.js';

const id = '01234567-89ab-4cde-8fab-0123456789ab';
test('diagnostic admission keeps actions, UUID version/variant, case and exact arity', () => {
  for (const action of ['enqueue', 'status', 'wait']) {
    assert.deepEqual(diagnosticCommandSchema.parse([action, id]), [action, id]);
    assert.deepEqual(diagnosticCommandSchema.parse([action, id.toUpperCase()]), [
      action,
      id.toUpperCase(),
    ]);
  }
  for (const value of [
    [],
    ['enqueue'],
    ['status', ''],
    ['WAIT', id],
    ['unknown', id],
    ['status', id, 'extra'],
    ['status', id.replace('-4cde', '-1cde')],
    ['wait', id.replace('-8fab', '-7fab')],
    ['status', ` ${id}`],
    ['status', null],
    ['status', {}],
    { action: 'status', id },
  ])
    assert.equal(diagnosticCommandSchema.safeParse(value).success, false);
});

test('strict diagnostic payload admits correct own enumerable fields across ordinary prototypes', () => {
  for (const prototype of [Object.prototype, null, { other: 'inherited' }]) {
    const value = Object.assign(Object.create(prototype), { kind: 'runtime-probe', version: 1 });
    Object.defineProperty(value, 'ignored', {
      get() {
        throw new Error('Ignored hidden field read.');
      },
    });
    value[Symbol('ignored')] = 'ignored';
    assert.deepEqual(diagnosticPayloadSchema.parse(value), { kind: 'runtime-probe', version: 1 });
  }
  for (const value of [
    null,
    [],
    true,
    'runtime-probe',
    {},
    { kind: 'runtime-probe' },
    { kind: 'runtime-probe', version: '1' },
    { kind: ['runtime-probe'], version: 1 },
    { kind: 'runtime-probe', version: 1, extra: true },
    Object.assign([], { kind: 'runtime-probe', version: 1 }),
    Object.assign(Object.create({ kind: 'runtime-probe', version: 1 }), { a: 1, b: 2 }),
    Object.defineProperty({ version: 1 }, 'kind', { value: 'runtime-probe' }),
  ])
    assert.equal(diagnosticPayloadSchema.safeParse(value).success, false);
});

test('completed results expose only the bounded diagnostic literal and reject corruption', () => {
  assert.deepEqual(diagnosticResult, { diagnostic: 'ok' });
  for (const prototype of [Object.prototype, null, { unused: true }]) {
    const value = Object.assign(Object.create(prototype), { diagnostic: 'ok' });
    Object.defineProperty(value, 'private', {
      get() {
        throw new Error('Hidden result read.');
      },
    });
    value[Symbol('ignored')] = true;
    assert.deepEqual(diagnosticResultSchema.parse(value), { diagnostic: 'ok' });
  }
  for (const value of [
    undefined,
    null,
    [],
    {},
    'ok',
    { diagnostic: ['ok'] },
    { diagnostic: 'bad' },
    { diagnostic: 'ok', private: 'fictional-secret' },
    Object.create({ diagnostic: 'ok' }),
    Object.defineProperty({}, 'diagnostic', { value: 'ok' }),
  ])
    assert.equal(diagnosticResultSchema.safeParse(value).success, false);
});

test('heartbeat freshness retains inclusive age, future checks, fractions and ignored metadata', () => {
  const now = 100000;
  for (const at of [now, now - 20000, now - 0.5]) {
    for (const metadata of [undefined, null, -1, 0.5, 'unknown', { private: 'ignored' }])
      assert.equal(
        isWorkerHeartbeatFresh({ at, oldestPendingSeconds: metadata }, () => now),
        true,
      );
  }
  const value = { at: now };
  Object.defineProperty(value, 'oldestPendingSeconds', {
    get() {
      throw new Error('Ignored age read.');
    },
    enumerable: true,
  });
  Object.defineProperty(value, 'unknown', {
    get() {
      throw new Error('Ignored extra read.');
    },
    enumerable: true,
  });
  assert.equal(
    isWorkerHeartbeatFresh(value, () => now),
    true,
  );
  for (const value of [
    null,
    [],
    {},
    'bad',
    { at: '100000' },
    { at: now + 0.5 },
    { at: now - 20000.1 },
    JSON.parse('{"at":1e400}'),
    JSON.parse('{"at":-1e400}'),
  ])
    assert.equal(
      isWorkerHeartbeatFresh(value, () => now),
      false,
    );
});

test('heartbeat clock reads retain original order and short circuits', () => {
  let calls = 0;
  const clock = () => {
    calls++;
    return calls === 1 ? 100 : 101;
  };
  assert.equal(isWorkerHeartbeatFresh({ at: 101 }, clock), true);
  assert.equal(calls, 2);
  calls = 0;
  assert.equal(isWorkerHeartbeatFresh({ at: -30000 }, clock), false);
  assert.equal(calls, 1);
  calls = 0;
  assert.equal(isWorkerHeartbeatFresh({ at: 'bad' }, clock), false);
  assert.equal(calls, 0);
});

test('the default heartbeat clock observes the current time without normalizing the file timestamp', (t) => {
  t.mock.method(Date, 'now', () => 100000);
  assert.equal(isWorkerHeartbeatFresh({ at: 80000 }), true);
  assert.equal(isWorkerHeartbeatFresh({ at: 79999.5 }), false);
  assert.equal(isWorkerHeartbeatFresh({ at: 100000.5 }), false);
});
