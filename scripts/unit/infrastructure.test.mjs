import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setImmediate } from 'node:timers/promises';
import { scopes, metrics } from './config.mjs';
import { tree, inventory, write, json, freshOutput } from './files.mjs';
import { assertGate, baselineFor, normalizeReport, assertComparable } from './report.mjs';
import { packageArtifacts } from './artifacts.mjs';
import { runProcess } from './process.mjs';

const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const tools = createRequire(path.join(root, 'scripts/unit/tools/package.json'));
const nyc = tools.resolve('nyc/bin/nyc.js');
const coverage = createRequire(nyc)('istanbul-lib-coverage');
const ts = createRequire(path.join(root, 'package.json'))('typescript');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const scratch = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rielia-unit-proof-')));
const clone = (value) => JSON.parse(JSON.stringify(value));

test(
  'actual four-scope reports pass all gates, preserve unexecuted inputs and reject each raised metric',
  { timeout: 5000 },
  () => {
    const inputs = inventory(root);
    for (const scope of scopes) {
      const summary = read(`coverage/unit/${scope}/summary.json`);
      const baseline = read(`scripts/unit/baselines/${scope}.json`);
      const published = read(`coverage/unit/${scope}/manifest.json`);
      assert.deepEqual(
        published.tests,
        baseline.manifest.tests,
        'Published manifest must retain exact selected test/helper fingerprints',
      );
      assert.ok(Array.isArray(published.selectedTests) && published.selectedTests.length > 0);
      assert.deepEqual(Object.keys(summary.files).sort(), inputs[scope]);
      assertGate(summary, baseline);
      for (const metric of metrics) {
        const raised = clone(baseline);
        const units = summary.total[metric];
        if (units.covered === units.total) {
          // A saturated real metric cannot have a valid higher floor. Exercise
          // a valid 100% threshold against a well-formed partial synthetic report.
          const partial = clone(summary);
          const file = Object.keys(partial.files).find(
            (name) => partial.files[name][metric].covered > 0,
          );
          partial.total[metric].covered--;
          partial.files[file][metric].covered--;
          const comparable = baselineFor(partial, baseline.manifest);
          comparable.floors[metric] = 10000;
          assert.throws(
            () => assertGate(partial, comparable),
            new RegExp(`${metric} floor failed`),
          );
        } else {
          raised.floors[metric] = Math.floor((units.covered * 10000) / units.total) + 1;
          assert.ok(raised.floors[metric] <= 10000);
          assert.throws(
            () => assertGate(summary, raised),
            new RegExp(`${metric} floor failed`),
            `${scope} ${metric} valid raised gate must reject`,
          );
        }
      }
    }
    const web = read('coverage/unit/web/summary.json');
    for (const file of [
      'apps/web/src/app/projects/projects-view.tsx',
      'apps/web/src/app/projects/task-detail.tsx',
    ]) {
      assert.equal(web.files[file].functions.covered, 0);
      assert.ok(
        web.files[file].functions.total > 1,
        'Unimported functions must have actual AST counters',
      );
    }
    const hook = web.files['apps/web/src/lib/use-project-tasks.ts'];
    assert.ok(hook.functions.covered > 0, 'The actual project hook must execute in React units');
    assert.ok(hook.branches.covered > 0, 'Project hook lifecycle decisions must retain coverage');
    const api = read('coverage/unit/api/summary.json');
    assert.equal(api.files['apps/api/src/main.ts'].statements.covered, 0);
    assert.equal(api.files['apps/api/prisma.config.ts'].branches.total, 2);
    const prototype = read('coverage/unit/prototype/summary.json');
    assert.equal(prototype.files['apps/web/src/lib/task-prototype/types.ts'].statements.total, 0);
  },
);

test(
  'equal aggregate cannot conceal a regressed policy file and malformed counts fail closed',
  { timeout: 5000 },
  () => {
    const baseline = read('scripts/unit/baselines/api.json');
    const actual = clone(baseline);
    const policy = 'apps/api/src/principals/principal.service.ts';
    const other = 'apps/api/src/main.ts';
    actual.files[policy].statements.covered--;
    actual.files[other].statements.covered++;
    assert.deepEqual(actual.total, baseline.total);
    assert.throws(() => assertGate(actual, baseline), /principal\.service\.ts.*regression/);
    for (const covered of [NaN, -1, 1.5, Infinity, '1']) {
      const bad = clone(baseline);
      bad.total.lines.covered = covered;
      assert.throws(() => assertGate(bad, baseline));
    }
    const missing = clone(baseline);
    delete missing.files[policy];
    assert.throws(() => assertGate(missing, baseline), /inventory/);
    const invalidFloor = clone(baseline);
    invalidFloor.floors.lines = 10001;
    assert.throws(() => assertGate(baseline, invalidFloor), /Invalid metric floor/);
    assert.throws(
      () => normalizeReport(root, 'web', ['apps/web/src/lib/use-project-tasks.ts'], {}, coverage),
      /mismatch/,
    );
  },
);

test(
  'critical test/helper omission or content change fails even with identical coverage totals',
  { timeout: 5000 },
  () => {
    for (const scope of scopes) {
      const baseline = read(`scripts/unit/baselines/${scope}.json`);
      const key = Object.keys(baseline.manifest.tests).find((file) => file.endsWith('.test.mjs'));
      assert.ok(key, 'Explicit selected test inventory required');
      for (const remove of [true, false]) {
        const changed = clone(baseline.manifest);
        if (remove) delete changed.tests[key];
        else changed.tests[key] = '0'.repeat(64);
        assert.throws(() => assertComparable(changed, baseline.manifest), /test manifest changed/);
        assertGate(baseline, baseline);
      }
    }
  },
);

async function probe(directory, mode, extra = false) {
  write(directory, 'package.json', '{"type":"module"}\n');
  for (const name of extra ? ['choice', 'never'] : ['choice']) {
    const source = `export function ${name}(value: boolean) {\n if (value) {\n  return 1;\n } else {\n  return 2;\n }\n}\n`;
    write(directory, `source/${name}.ts`, source);
    const emitted = ts.transpileModule(source, {
      fileName: `${name}.ts`,
      compilerOptions: {
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.ESNext,
        sourceMap: true,
      },
    });
    const map = JSON.parse(emitted.sourceMapText);
    map.sources = [path.join(directory, `source/${name}.ts`)];
    write(
      directory,
      `src/${name}.js`,
      emitted.outputText.replace(/\/\/# sourceMappingURL=.*/g, '') +
        '\n//# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(JSON.stringify(map)).toString('base64') +
        '\n',
    );
  }
  write(
    directory,
    'case.test.mjs',
    `import assert from 'node:assert/strict';\nimport {test} from 'node:test';\nimport {setImmediate} from 'node:timers';\nimport {choice} from './src/choice.js';\ntest('fixture choice', () => { assert.equal(choice(true), ${mode === 'assertion' ? '999' : '1'}); ${mode === 'rejection' ? "setImmediate(() => Promise.reject(new Error('unit-rejection-witness')));" : ''} });\n`,
  );
  const config = {
    all: true,
    instrument: false,
    cache: false,
    completeCopy: false,
    excludeAfterRemap: false,
    include: ['src/**/*.js'],
    exclude: ['**/node_modules/**'],
    reporter: ['json'],
    reportDir: path.join(directory, 'report'),
    tempDir: path.join(directory, 'raw'),
  };
  write(directory, '.nycrc.json', json(config));
  tree(directory, 'src');
  const common = ['--cwd', directory, '--nycrc-path', path.join(directory, '.nycrc.json')];
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    FORCE_COLOR: '0',
  };
  const instrument = await runProcess(
    process.execPath,
    [
      nyc,
      'instrument',
      ...common,
      '--instrument',
      'true',
      '--es-modules',
      'true',
      '--produce-source-map',
      'true',
      '--in-place',
      path.join(directory, 'src'),
    ],
    { cwd: directory, env, deadline: 10000 },
  );
  assert.equal(instrument.code, 0, instrument.output);
  const result = await runProcess(
    process.execPath,
    [
      nyc,
      ...common,
      '--all',
      '--instrument',
      'false',
      process.execPath,
      '--test',
      '--test-reporter=tap',
      '--test-timeout=5000',
      path.join(directory, 'case.test.mjs'),
    ],
    { cwd: directory, env, deadline: 10000 },
  );
  write(directory, `${mode}.log`, result.output);
  return result;
}

test(
  'real nyc child preserves passing/assertion/unawaited-rejection exit status',
  { timeout: 30000 },
  async (t) => {
    for (const mode of ['pass', 'assertion', 'rejection']) {
      const dir = scratch();
      const result = await probe(dir, mode);
      assert.equal(result.code, mode === 'pass' ? 0 : 1, result.output);
      if (mode === 'rejection') assert.match(result.output, /unit-rejection-witness/);
      if (mode === 'pass') t.after(() => fs.rmSync(dir, { recursive: true }));
      // Deliberate failures retain their bounded local logs; no raw output is uploaded.
    }
  },
);

test(
  'a newly maintained never-imported two-branch witness enters denominator and fails old scope/floor',
  { timeout: 20000 },
  async (t) => {
    const before = scratch();
    const after = scratch();
    t.after(() => {
      fs.rmSync(before, { recursive: true });
      fs.rmSync(after, { recursive: true });
    });
    assert.equal((await probe(before, 'pass')).code, 0);
    assert.equal((await probe(after, 'pass', true)).code, 0);
    const oldRaw = JSON.parse(
      fs.readFileSync(path.join(before, 'report/coverage-final.json'), 'utf8'),
    );
    const newRaw = JSON.parse(
      fs.readFileSync(path.join(after, 'report/coverage-final.json'), 'utf8'),
    );
    const oldReport = normalizeReport(before, 'web', ['source/choice.ts'], oldRaw, coverage);
    const newReport = normalizeReport(
      after,
      'web',
      ['source/choice.ts', 'source/never.ts'],
      newRaw,
      coverage,
    );
    const baseline = baselineFor(oldReport.summary, {});
    assert.throws(
      () =>
        normalizeReport(
          after,
          'web',
          ['source/choice.ts', 'source/never.ts', 'source/missing.ts'],
          newRaw,
          coverage,
        ),
      /mismatch/,
    );
    assert.equal(newReport.summary.files['source/never.ts'].branches.covered, 0);
    assert.equal(newReport.summary.files['source/never.ts'].branches.total, 2);
    assert.throws(() => assertGate(newReport.summary, baseline), /inventory/);
    assert.ok(
      newReport.summary.total.branches.covered / newReport.summary.total.branches.total <
        baseline.floors.branches / 10000,
    );
  },
);

test(
  'source preflight refuses symlinks and exceeds file/byte/depth bounds without following them',
  { timeout: 5000 },
  (t) => {
    const dir = scratch();
    t.after(() => fs.rmSync(dir, { recursive: true }));
    write(dir, 'source/a.js', 'safe');
    write(dir, 'source/deep/b.js', 'safe');
    for (const bounds of [
      { files: 1, bytes: 1000, depth: 16 },
      { files: 10, bytes: 1, depth: 16 },
      { files: 10, bytes: 1000, depth: 0 },
    ])
      assert.throws(() => tree(dir, 'source', { bounds }), /bound/);
    fs.symlinkSync(path.join(dir, 'source/deep'), path.join(dir, 'source/link'));
    assert.throws(() => tree(dir, 'source'), /symlink/);
    assert.equal(fs.readFileSync(path.join(dir, 'source/deep/b.js'), 'utf8'), 'safe');
  },
);

test(
  'wrong runtime is rejected before build, and caller coverage configuration is not accepted',
  { timeout: 5000 },
  async () => {
    const code = `Object.defineProperty(process.versions,'node',{value:'0.0.0'}); await import(${JSON.stringify(new URL('./pipeline.mjs', import.meta.url).href)});`;
    const result = await runProcess(process.execPath, ['--input-type=module', '-e', code], {
      cwd: root,
      deadline: 4000,
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /pinned runtime/);
    const args = await runProcess(process.execPath, ['scripts/unit/run.mjs', '--include=**/*'], {
      cwd: root,
      deadline: 4000,
    });
    assert.equal(args.code, 1);
    assert.match(args.output, /fixed scope/);
  },
);

test(
  'parent deadline kills descendant work instead of relying on glob cancellation',
  { timeout: 5000 },
  async (t) => {
    const dir = scratch();
    t.after(() => fs.rmSync(dir, { recursive: true }));
    const marker = path.join(dir, 'escaped');
    const code = `import {spawn} from 'node:child_process'; spawn(process.execPath,['--input-type=module','-e',${JSON.stringify(`import fs from 'node:fs';setTimeout(()=>fs.writeFileSync(${JSON.stringify(marker)},'bad'),500);setInterval(()=>{},1000);`)}],{stdio:'ignore'});setInterval(()=>{},1000);`;
    await assert.rejects(
      runProcess(process.execPath, ['--input-type=module', '-e', code], {
        cwd: dir,
        group: true,
        deadline: 100,
      }),
      /deadline/,
    );
    // Let the marker's scheduled deadline pass using an independent bounded child.
    await runProcess(process.execPath, ['-e', 'setTimeout(()=>{},600)'], {
      cwd: dir,
      deadline: 1000,
    });
    assert.equal(fs.existsSync(marker), false);
  },
);

test(
  'CI rejects every maintenance mode before clearing or measuring reports',
  { timeout: 5000 },
  async () => {
    const status = fs.readFileSync(path.join(root, 'coverage/unit/status.json'));
    for (const entry of ['run.mjs', 'pipeline.mjs']) {
      for (const flag of ['--measure', '--pre-unit', '--write-baseline']) {
        for (const marker of ['CI', 'GITHUB_ACTIONS']) {
          const result = await runProcess(process.execPath, [`scripts/unit/${entry}`, flag], {
            cwd: root,
            env: { PATH: process.env.PATH, [marker]: '1' },
            deadline: 3000,
            group: true,
          });
          assert.equal(result.code, 1);
          assert.match(result.output, /CI cannot run unit maintenance modes/);
          assert.deepEqual(fs.readFileSync(path.join(root, 'coverage/unit/status.json')), status);
        }
      }
    }
  },
);

test(
  'spawn failure preserves ENOENT without attempting to kill a missing process group',
  { timeout: 5000 },
  async (t) => {
    const directory = scratch();
    t.after(() => fs.rmSync(directory, { recursive: true }));
    const calls = [];
    const kill = process.kill;
    t.mock.method(process, 'kill', (...args) => {
      calls.push(args);
      return kill(...args);
    });
    await assert.rejects(
      runProcess(path.join(directory, 'missing-command'), [], { cwd: directory, group: true }),
      (error) => error.code === 'ENOENT',
    );
    await setImmediate();
    assert.deepEqual(calls, [], 'No process group exists after ENOENT');
  },
);

test(
  'artifact CLI executes in paths with spaces, URL punctuation and Unicode',
  { timeout: 5000 },
  async (t) => {
    const directory = path.join(scratch(), 'space # percent% ñ');
    fs.mkdirSync(directory);
    t.after(() => fs.rmSync(path.dirname(directory), { recursive: true }));
    write(directory, 'package.json', '{"type":"module"}\n');
    for (const file of ['artifacts.mjs', 'files.mjs', 'config.mjs'])
      write(
        directory,
        `scripts/unit/${file}`,
        fs.readFileSync(path.join(root, 'scripts/unit', file)),
      );
    const result = await runProcess(process.execPath, ['scripts/unit/artifacts.mjs'], {
      cwd: directory,
      env: { PATH: process.env.PATH },
      deadline: 3000,
    });
    assert.equal(result.code, 0, result.output);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(directory, 'coverage/artifacts/status.json'))),
      Object.fromEntries(scopes.map((scope) => [scope, 'missing or partial'])),
    );
  },
);

test(
  'mirror inventory rejects maintained config/shared escapes and permits scoped public contracts',
  { timeout: 10000 },
  async (t) => {
    const directory = scratch();
    t.after(() => fs.rmSync(directory, { recursive: true }));
    const original = path.join(directory, 'original');
    const mirror = path.join(directory, 'mirror');
    fs.mkdirSync(original);
    fs.mkdirSync(mirror);
    write(original, 'package.json', '{"type":"module"}\n');
    write(mirror, 'package.json', '{"type":"module"}\n');
    const inputs = [
      'apps/api/prisma.config.ts',
      'apps/web/next.config.ts',
      'packages/contracts/src/index.ts',
      'apps/web/src/lib/unimported.ts',
    ];
    for (const file of inputs) write(original, file, 'export const value = "original";\n');
    write(
      original,
      'packages/contracts/package.json',
      JSON.stringify({ name: '@rielia/contracts', type: 'module', exports: './dist/index.js' }),
    );
    write(
      original,
      'packages/contracts/dist/index.js',
      'export const value = "public-contract";\n',
    );
    write(mirror, 'apps/api/prisma.config.js', 'export const value = "mirror";\n');
    write(
      mirror,
      'scripts/unit/mirror-loader.mjs',
      fs.readFileSync(path.join(root, 'scripts/unit/mirror-loader.mjs')),
    );
    fs.mkdirSync(path.join(mirror, 'node_modules/@rielia'), { recursive: true });
    fs.symlinkSync(
      path.join(original, 'packages/contracts'),
      path.join(mirror, 'node_modules/@rielia/contracts'),
      'dir',
    );
    const configure = (scope) =>
      write(
        mirror,
        'scripts/unit/mirror-paths.json',
        json({ root: original, mirror, scope, inputs }),
      );
    const run = async (code) => {
      write(mirror, 'case.mjs', code);
      return runProcess(
        process.execPath,
        ['--import', './scripts/unit/mirror-loader.mjs', 'case.mjs'],
        {
          cwd: mirror,
          env: { PATH: process.env.PATH },
          deadline: 3000,
        },
      );
    };
    configure('web');
    for (const file of inputs) {
      const result = await run(
        `import ${JSON.stringify(pathToFileURL(path.join(original, file)).href)};`,
      );
      assert.equal(result.code, 1, file);
      assert.match(result.output, /escaped the instrumented mirror/);
    }
    const compiled = await run(
      'import {value} from "./apps/api/prisma.config.ts"; console.log(value);',
    );
    assert.equal(compiled.code, 0, compiled.output);
    assert.match(compiled.output, /mirror/);
    const publicContract = await run(
      'import {value} from "@rielia/contracts"; console.log(value);',
    );
    assert.equal(publicContract.code, 0, publicContract.output);
    assert.match(publicContract.output, /public-contract/);
    configure('contracts');
    const sharedEscape = await run('import "@rielia/contracts";');
    assert.equal(sharedEscape.code, 1);
    assert.match(sharedEscape.output, /Shared source escaped instrumented mirror/);
  },
);

test(
  'artifact allowlist rejects source content, absolute paths and size overruns',
  { timeout: 5000 },
  (t) => {
    const dir = scratch();
    t.after(() => fs.rmSync(dir, { recursive: true }));
    for (const file of ['summary.json', 'manifest.json', 'coverage-final.json', 'lcov.info'])
      write(dir, `coverage/unit/api/${file}`, '{}');
    write(dir, 'coverage/unit/status.json', json({ api: 'complete' }));
    assert.equal(packageArtifacts(dir).api, 'complete');
    for (const body of [
      '{"sourcesContent":["private"]}',
      'SF:/Users/fixture/source.ts',
      'x'.repeat(2 * 1024 * 1024 + 1),
    ]) {
      write(dir, 'coverage/unit/api/coverage-final.json', body);
      assert.throws(() => packageArtifacts(dir), /artifact|Artifact/);
    }
  },
);

test(
  'new run clears old reports before any child runs; partial output cannot become complete',
  { timeout: 5000 },
  (t) => {
    const dir = scratch();
    t.after(() => fs.rmSync(dir, { recursive: true }));
    for (const file of ['summary.json', 'manifest.json', 'coverage-final.json', 'lcov.info'])
      write(dir, `coverage/unit/api/${file}`, '{}');
    write(dir, 'coverage/unit/status.json', json({ api: 'complete' }));
    freshOutput(dir, 'unit');
    assert.equal(fs.existsSync(path.join(dir, 'coverage/unit/api')), false);
    for (const file of ['summary.json', 'manifest.json', 'coverage-final.json', 'lcov.info'])
      write(dir, `coverage/unit/api/${file}`, '{}');
    write(
      dir,
      'coverage/unit/failure.json',
      json({
        status: 'failed',
        phase: 'api:tests',
        diagnostics: [{ phase: 'api:tests', exit: 1 }],
      }),
    );
    assert.equal(packageArtifacts(dir).api, 'missing or partial');
  },
);

test(
  'artifact roots/parents cannot be symlinks and failure diagnostics obey schema and bounds',
  { timeout: 5000 },
  (t) => {
    const dir = scratch();
    const external = scratch();
    t.after(() => {
      fs.rmSync(dir, { recursive: true });
      fs.rmSync(external, { recursive: true });
    });
    fs.symlinkSync(external, path.join(dir, 'coverage'));
    assert.throws(() => packageArtifacts(dir), /Unsafe coverage/);
    assert.deepEqual(fs.readdirSync(external), []);
    fs.unlinkSync(path.join(dir, 'coverage'));
    write(
      dir,
      'coverage/unit/failure.json',
      json({
        status: 'failed',
        phase: 'api:tests',
        diagnostics: Array(70).fill({ phase: 'api:tests', exit: 1 }),
      }),
    );
    assert.throws(() => packageArtifacts(dir), /schema/);
    write(
      dir,
      'coverage/unit/failure.json',
      json({
        status: 'failed',
        phase: 'api:tests',
        diagnostics: [{ phase: '/Users/private', exit: 1 }],
      }),
    );
    assert.throws(() => packageArtifacts(dir), /schema/);
  },
);
