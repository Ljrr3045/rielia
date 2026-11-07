import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { write, regular } from './files.mjs';
import { runProcess } from './process.mjs';

// Explicit real-HTTP mutation proof, separate from offline unit infrastructure.
const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rielia-http-deadline-')));
fs.chmodSync(scratch, 0o700);
write(scratch, 'package.json', '{"type":"module"}\n');
fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
for (const file of [
  'scripts/task-events-proxy.integration.test.mjs',
  'apps/web/src/lib/project-task-proxy.ts',
]) {
  write(scratch, file, fs.readFileSync(regular(root, file)));
}

async function run(name) {
  const result = await runProcess(
    process.execPath,
    [
      '--test',
      '--test-reporter=tap',
      path.join(scratch, 'scripts/task-events-proxy.integration.test.mjs'),
    ],
    {
      cwd: scratch,
      env: { PATH: process.env.PATH, NODE_ENV: 'test' },
      group: true,
      deadline: 10000,
    },
  );
  write(scratch, `${name}.log`, result.output);
  return result;
}

const baseline = await run('baseline');
assert.equal(baseline.code, 0, baseline.output);
const file = 'apps/web/src/lib/project-task-proxy.ts';
const source = fs.readFileSync(path.join(scratch, file), 'utf8');
const needle = 'events ? timeout.signal : AbortSignal.timeout(15000)';
assert.equal(source.split(needle).length, 2, 'Mutation target changed; review the witness');
// Retain the early pre-aborted control, but discard the live JSON body deadline.
const replacement =
  'events ? timeout.signal : (() => { const signal = AbortSignal.timeout(15000); return signal.aborted ? signal : request.signal; })()';
write(scratch, file, source.replace(needle, replacement));
try {
  const mutant = await run('missing-body-deadline');
  assert.equal(mutant.code, 1, mutant.output);
  assert.match(mutant.output, /Missing expected rejection/);
  console.log(
    `Real HTTP deadline witness passed; missing-body-deadline mutant rejected. Local evidence: ${scratch}`,
  );
} finally {
  write(scratch, file, source);
}
