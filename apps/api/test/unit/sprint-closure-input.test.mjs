import assert from 'node:assert/strict';
import { test } from 'node:test';
import { closeSprintInput } from '../../dist/projects/sprint-closure-input.js';

const input = {
  expectedVersion: 1,
  expectedProjectVersion: 2,
  expectedTaskRevision: 3,
  expectedSprintRevision: 4,
  expectedTargetVersion: null,
  destination: 'backlog',
  previewSchema: 1,
  previewHash: 'a'.repeat(64),
};

test('closing input preserves shape-before-field rejection and the exact submitted binding', () => {
  assert.deepEqual(closeSprintInput(input), input);
  assert.deepEqual(
    closeSprintInput({ ...input, destination: 'target', expectedTargetVersion: 2 }),
    {
      ...input,
      destination: 'target',
      expectedTargetVersion: 2,
    },
  );
  const rejects = (value, message) =>
    assert.throws(
      () => closeSprintInput(value),
      (error) => error.getStatus() === 400 && error.message === message,
    );
  for (const value of [null, [], {}, { ...input, extra: 1, expectedVersion: 0 }])
    rejects(value, 'Invalid project/task request.');
  for (const key of Object.keys(input)) {
    const missing = { ...input };
    delete missing[key];
    rejects(missing, 'Invalid project/task request.');
    rejects({ ...input, [key]: undefined }, 'Invalid sprint closing request.');
  }
  rejects(Object.create(input), 'Invalid sprint closing request.');
  for (const patch of [
    { destination: null, expectedTargetVersion: 1 },
    { destination: 'target' },
    { previewSchema: 2 },
    { previewHash: 'A'.repeat(64) },
  ])
    rejects({ ...input, ...patch }, 'Invalid sprint closing request.');
});

test('closing input keeps the existing object-copy getter and symbol behavior', () => {
  const reads = [];
  const value = Object.defineProperty({ ...input }, 'expectedVersion', {
    enumerable: true,
    get() {
      reads.push('version');
      return 1;
    },
  });
  const symbol = Symbol('ignored');
  value[symbol] = 'not JSON';
  const parsed = closeSprintInput(value);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), input);
  assert.equal(parsed[symbol], 'not JSON');
  assert.deepEqual(reads, ['version']);
  const failure = new Error('body getter');
  Object.defineProperty(value, 'destination', {
    enumerable: true,
    get() {
      throw failure;
    },
  });
  assert.throws(
    () => closeSprintInput(value),
    (error) => error === failure,
  );
});
