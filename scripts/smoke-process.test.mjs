import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startProcess, stopProcess } from './smoke-process.mjs';

test('failed spawn preserves its error and cleanup stops the live sibling', { timeout: 3000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rielia-smoke-process-'));
  const sibling = startProcess('sibling', ['-e', 'setInterval(() => {}, 1000)'], directory);
  try {
    await once(sibling.child, 'spawn');
    const failed = startProcess('failed', [], join(directory, 'missing'));
    const failure = once(failed.child, 'error');
    assert.equal(failed.child.pid, undefined);
    // Teardown can run before Node emits the asynchronous spawn error.
    await Promise.all([stopProcess(failed), stopProcess(sibling)]);
    const [originalError] = await failure;
    assert.equal(originalError.code, 'ENOENT');
    assert.equal(failed.error, originalError);
    assert(sibling.child.exitCode !== null || sibling.child.signalCode !== null);
  } finally {
    await stopProcess(sibling);
    await rm(directory, { recursive: true, force: true });
  }
});
