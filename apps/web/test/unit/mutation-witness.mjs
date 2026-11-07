import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Local disposable proof. Only copies are mutated; checked-in source is never written.
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const evidence = realpathSync(mkdtempSync(join(tmpdir(), 'rielia-web-unit-witness-')));
const scratch = join(evidence, 'fixture');
mkdirSync(join(scratch, 'apps/web'), { recursive: true });
for (const file of [
  'package.json',
  'tsconfig.base.json',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
]) {
  cpSync(join(repository, file), join(scratch, file));
}
cpSync(join(repository, 'apps/web/src'), join(scratch, 'apps/web/src'), { recursive: true });
cpSync(join(repository, 'apps/web/test/unit'), join(scratch, 'apps/web/test/unit'), {
  recursive: true,
});
symlinkSync(join(repository, 'node_modules'), join(scratch, 'node_modules'), 'dir');
symlinkSync(
  join(repository, 'apps/web/node_modules'),
  join(scratch, 'apps/web/node_modules'),
  'dir',
);
mkdirSync(join(scratch, 'scripts/unit'), { recursive: true });
symlinkSync(join(repository, 'scripts/unit/tools'), join(scratch, 'scripts/unit/tools'), 'dir');
const cases = [
  {
    name: 'pending-guard',
    source: 'apps/web/src/app/identity/identity-view.tsx',
    before: 'if (pending !== null) return;',
    after: 'if (false) return;',
    test: 'apps/web/test/unit/identity-view.test.mjs',
    failure:
      /not ok \d+ - sign-in pending control announces progress and ignores repeated activation/,
  },
  {
    name: 'identity-load-cleanup',
    source: 'apps/web/src/lib/use-identity.ts',
    before: 'return controller.cancelPendingLoads;',
    after: 'return () => {};',
    test: 'apps/web/test/unit/identity-hook.test.mjs',
    failure:
      /not ok \d+ - StrictMode cleanup invalidates old loads, and unmount prevents late publication/,
  },
  {
    name: 'listener-cleanup',
    source: 'apps/web/src/lib/use-workspaces.ts',
    before: "window.removeEventListener('pageshow', refresh);",
    after: '/* Deliberately leaked pageshow subscription in disposable fixture. */',
    test: 'apps/web/test/unit/workspace-hook.test.mjs',
    failure: /not ok \d+ - StrictMode captures and scrubs mount\/hashchange invitations/,
  },
  {
    name: 'workspace-late-selection',
    source: 'apps/web/src/lib/workspace-controller.ts',
    before:
      "if (!current(request)) return;\n    publish({ ...state, status: 'ready', workspace, members, invitations",
    after:
      "/* Deliberately permit a stale result in this disposable fixture. */\n    publish({ ...state, status: 'ready', workspace, members, invitations",
    test: 'apps/web/test/unit/workspace-hook.test.mjs',
    failure:
      /not ok \d+ - unmount aborts a pending read and its late result cannot persist private selection/,
  },
];

function run(name, files) {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      pathToFileURL(join(repository, 'scripts/unit/tools/node_modules/tsx/dist/loader.mjs')).href,
      '--test',
      '--test-reporter=tap',
      ...files,
    ],
    {
      cwd: scratch,
      env: { ...process.env, TSX_TSCONFIG_PATH: join(scratch, 'apps/web/tsconfig.json') },
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 200 * 1024,
    },
  );
  assert.equal(result.error, undefined, `${name}: child execution failed`);
  assert.equal(result.signal, null, `${name}: child terminated by signal`);
  const log = result.stdout + result.stderr;
  writeFileSync(join(evidence, `${name}.log`), log);
  return { status: result.status, log };
}

try {
  const baseline = run('baseline', [
    'apps/web/test/unit/identity-hook.test.mjs',
    'apps/web/test/unit/identity-view.test.mjs',
    'apps/web/test/unit/workspace-hook.test.mjs',
  ]);
  assert.equal(baseline.status, 0, `Unmodified source must pass; inspect ${evidence}/baseline.log`);
  const results = [];
  for (const item of cases) {
    const path = join(scratch, item.source);
    const original = readFileSync(path, 'utf8');
    assert.equal(
      original.split(item.before).length,
      2,
      `${item.name}: mutation anchor must be unique`,
    );
    writeFileSync(path, original.replace(item.before, item.after));
    try {
      const mutant = run(item.name, [item.test]);
      assert.equal(mutant.status, 1, `${item.name}: mutation must fail assertions`);
      assert.match(mutant.log, /not ok/);
      assert.match(mutant.log, /code: 'ERR_ASSERTION'/);
      assert.match(mutant.log, item.failure);
      results.push({ mutation: item.name, rejected: true });
    } finally {
      writeFileSync(path, original);
    }
  }
  writeFileSync(
    join(evidence, 'summary.json'),
    JSON.stringify({ baselinePassed: true, results }, null, 2) + '\n',
  );
  console.log(
    `Unmodified DOM suites passed; pending guard, identity load cleanup, listener cleanup and late private-selection mutations rejected. Evidence: ${evidence}`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
