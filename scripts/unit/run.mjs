import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runProcess } from './process.mjs';
import { scopes, assertRunMode } from './config.mjs';
import { freshOutput } from './files.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2).filter((arg) => arg !== '--');
assertRunMode(args);
if (
  args.some(
    (arg) => ![...scopes, '--measure', '--write-baseline', '--pre-unit', '--built'].includes(arg),
  )
) {
  throw new Error(
    'Use a fixed scope and optional --measure, --pre-unit or explicit --write-baseline',
  );
}
try {
  freshOutput(root, args.includes('--pre-unit') ? 'unit-before' : 'unit');
  const result = await runProcess(
    process.execPath,
    [resolve(root, 'scripts/unit/pipeline.mjs'), ...args],
    {
      cwd: root,
      group: true,
      deadline: 120000,
      maxBytes: 204800,
    },
  );
  process.stdout.write(result.output);
  process.exitCode = result.code ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
