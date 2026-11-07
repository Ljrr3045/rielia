import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import {
  scopes,
  webSuites,
  providerVersions,
  compiler,
  artifactLimits,
  assertRunMode,
} from './config.mjs';
import {
  inventory,
  tree,
  write,
  json,
  hashFile,
  sha256,
  regular,
  coverageDirectory,
} from './files.mjs';
import {
  normalizeReport,
  normalizeLcov,
  assertGate,
  baselineFor,
  assertComparable,
} from './report.mjs';
import { runProcess } from './process.mjs';

const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2);
assertRunMode(args);
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
let tools;
try {
  tools = createRequire(path.join(root, 'scripts/unit/tools/package.json'));
  tools.resolve('nyc');
} catch {
  throw new Error(
    'Unit tools missing. Run pnpm --dir scripts/unit/tools install --frozen-lockfile explicitly.',
  );
}
const nyc = tools.resolve('nyc/bin/nyc.js');
const provider = createRequire(nyc);
const coverage = provider('istanbul-lib-coverage');
const selected = scopes.filter((scope) => args.includes(scope));
const requested = selected.length ? selected : scopes;
const before = args.includes('--pre-unit');
const update = args.includes('--write-baseline');
assert.equal(process.versions.node, '24.22.1', 'Use the pinned runtime: pnpm exec node');
assert.equal(ts.version, compiler.version, 'Wrong TypeScript provider');
for (const [name, version] of Object.entries(providerVersions))
  assert.equal(provider(`${name}/package.json`).version, version, `Wrong ${name} provider`);
assert.equal(tools('jsdom/package.json').version, '31.0.0');
assert.equal(tools('tsx/package.json').version, '4.23.15');
assert.equal(tools('@testing-library/dom/package.json').version, '10.4.2');

const sources = inventory(root);
const providerManifest = {
  runtime: '24.22.1',
  pnpm: '12.15.0',
  compiler,
  provider: providerVersions,
  toolsLock: hashFile(root, 'scripts/unit/tools/pnpm-lock.yaml'),
  configs: Object.fromEntries(
    [
      'tsconfig.base.json',
      'apps/api/tsconfig.json',
      'apps/web/tsconfig.json',
      'packages/contracts/tsconfig.json',
    ].map((f) => [f, hashFile(root, f)]),
  ),
};
const output = coverageDirectory(root, before ? 'unit-before' : 'unit');
const status = {};
const work = fs.realpathSync(fs.mkdtempSync(path.join(root, 'coverage', '.unit-')));
fs.chmodSync(work, 0o700);
const diagnostics = [];
let phase = 'build';
const unitEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'PNPM_HOME'].includes(key),
  ),
);
unitEnv.PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN = 'error';
unitEnv.NODE_ENV = 'test';
unitEnv.FORCE_COLOR = '0';
async function run(command, argv, cwd = root, env = process.env) {
  const result = await runProcess(command, argv, { cwd, env, deadline: 110000 });
  diagnostics.push({ phase, exit: result.code ?? 1 });
  write(work, `logs/${diagnostics.length}.log`, result.output);
  if (result.code !== 0) {
    process.stderr.write(result.output);
    throw new Error(`Unit ${phase} failed (exit ${result.code ?? result.signal})`);
  }
  return result.output;
}

function link(mirror, destination, target) {
  fs.mkdirSync(path.dirname(path.join(mirror, destination)), { recursive: true });
  fs.symlinkSync(target, path.join(mirror, destination), 'dir');
}
function copy(mirror, file) {
  write(mirror, file, fs.readFileSync(regular(root, file)));
}
function emitted(mirror, source, destination, code, map) {
  map.sources = [path.join(root, source)];
  map.sourceRoot = '';
  map.sourcesContent = [fs.readFileSync(regular(root, source), 'utf8')];
  const body = code.replace(/\/\/# sourceMappingURL=.*/g, '');
  write(
    mirror,
    destination,
    `${body}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}\n`,
  );
}
function transpile(mirror, source, destination) {
  const result = ts.transpileModule(fs.readFileSync(regular(root, source), 'utf8'), {
    fileName: path.join(root, source),
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: true,
      sourceMap: true,
      inlineSources: true,
    },
    reportDiagnostics: true,
  });
  assert.ok(
    !result.diagnostics?.some((d) => d.category === ts.DiagnosticCategory.Error),
    `Emit failed: ${source}`,
  );
  emitted(mirror, source, destination, result.outputText, JSON.parse(result.sourceMapText));
}
function unitFiles(directory) {
  return tree(root, directory).filter((f) => f.endsWith('.test.mjs'));
}

// Reproduce the original baseline on unchanged maintained source, with exact AST case
// selection (never text-pattern skipping). No integration imports execute in the API case.
async function oldTests(mirror, scope) {
  if (scope === 'contracts') {
    write(
      mirror,
      'empty.test.mjs',
      "import { test } from 'node:test'; test('no prior dedicated contract units', () => {});\n",
    );
    return ['empty.test.mjs'];
  }
  async function original(file) {
    return run('git', ['show', `465d9e44e480c5f115d92bc294e913d2fb599330:${file}`]);
  }
  if (scope === 'api') {
    const source = await original('apps/api/test/identity.test.mjs');
    const ast = ts.createSourceFile(
      'identity.mjs',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const statement = ast.statements.find(
      (s) =>
        ts.isExpressionStatement(s) &&
        ts.isCallExpression(s.expression) &&
        s.expression.arguments[0]?.text === 'configuration fails closed without exposing values',
    );
    assert.ok(statement, 'Missing original config baseline');
    const fixture = {
      IDENTITY_ENABLED: 'true',
      NODE_ENV: 'production',
      BETTER_AUTH_URL: 'https://identity.example.test',
      BETTER_AUTH_SECRET: 'synthetic-unit-fixture-value-000000000000000000000000',
      DATABASE_URL: 'postgresql://unit:unit@127.0.0.1:1/unit',
      GOOGLE_CLIENT_ID: 'unit-google',
      GOOGLE_CLIENT_SECRET: 'unit-google-secret',
      GITHUB_CLIENT_ID: 'unit-github',
      GITHUB_CLIENT_SECRET: 'unit-github-secret',
      IDENTITY_TRUSTED_PROXIES: '',
      IDENTITY_ALLOW_HTTP_LOOPBACK: 'false',
    };
    write(
      mirror,
      'apps/api/test/original.test.mjs',
      `import assert from 'node:assert/strict';\nimport { test } from 'node:test';\nimport { readIdentityConfig } from '../dist/identity/config.js';\nObject.assign(process.env, ${JSON.stringify(fixture)});\n${statement.getText(ast)}\n`,
    );
    return ['apps/api/test/original.test.mjs'];
  }
  const files = scope === 'prototype' ? ['scripts/task-prototype.test.mjs'] : webSuites;
  const networkCases = new Set([
    'same-origin proxy streams body, preserves cookies/redirect/no-store and excludes untrusted forwarding headers',
    'real browser client aborts stalled mutations, sends no automatic retry, and allows explicit retry',
    'T10 real HTTP proxy retains JSON body deadline while SSE outlives it and abort closes upstream',
  ]);
  for (const file of files) {
    let source = await original(file);
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const s of [...ast.statements].reverse()) {
      if (
        ts.isExpressionStatement(s) &&
        ts.isCallExpression(s.expression) &&
        networkCases.has(s.expression.arguments[0]?.text)
      )
        source = source.slice(0, s.getFullStart()) + source.slice(s.end);
    }
    write(mirror, file, source);
  }
  return files;
}

try {
  assert.equal((await run('pnpm', ['--version'])).trim(), '12.15.0', 'Wrong pnpm runtime');
  if (!args.includes('--built')) {
    await run('pnpm', ['--filter', '@rielia/contracts', 'build']);
    if (requested.includes('api')) await run('pnpm', ['--filter', '@rielia/api', 'build']);
  }
  const contractEmit = path.join(work, 'contracts-emitted');
  if (requested.includes('contracts'))
    await run(process.execPath, [
      require.resolve('typescript/bin/tsc'),
      '-p',
      'packages/contracts/tsconfig.json',
      '--sourceMap',
      '--inlineSources',
      '--outDir',
      contractEmit,
    ]);
  const baselines = {};
  for (const scope of requested) {
    phase = `${scope}:prepare`;
    status[scope] = 'partial';
    write(output, 'status.json', json(status));
    const mirror = path.join(work, scope);
    fs.mkdirSync(mirror, { mode: 0o700 });
    write(mirror, 'package.json', '{"type":"module"}\n');
    const mirrorPaths = { root, mirror, scope, inputs: Object.values(sources).flat() };
    write(mirror, 'mirror-paths.json', json(mirrorPaths));
    copy(mirror, 'scripts/unit/mirror-loader.mjs');
    write(mirror, 'scripts/unit/mirror-paths.json', json(mirrorPaths));
    link(mirror, 'node_modules', path.join(root, 'node_modules'));
    link(
      mirror,
      'scripts/unit/tools/node_modules',
      path.join(root, 'scripts/unit/tools/node_modules'),
    );
    copy(mirror, 'scripts/unit/tools/package.json');
    const emittedInputs = [];
    for (const source of sources[scope]) {
      let destination;
      if (scope === 'api' && source.startsWith('apps/api/src/')) {
        destination = source.replace('/src/', '/dist/').replace(/\.ts$/, '.js');
        const code = fs.readFileSync(regular(root, destination), 'utf8');
        const map = JSON.parse(fs.readFileSync(regular(root, `${destination}.map`), 'utf8'));
        emitted(mirror, source, destination, code, map);
      } else if (scope === 'contracts') {
        destination = source.replace('/src/', '/dist/').replace(/\.ts$/, '.js');
        const file = path.join(contractEmit, path.basename(destination));
        emitted(
          mirror,
          source,
          destination,
          fs.readFileSync(file, 'utf8'),
          JSON.parse(fs.readFileSync(`${file}.map`, 'utf8')),
        );
      } else {
        destination = source.replace(/\.tsx?$/, '.js');
        transpile(mirror, source, destination);
      }
      emittedInputs.push(destination);
    }
    if (scope === 'api') {
      copy(mirror, 'apps/api/package.json');
      link(mirror, 'apps/api/node_modules', path.join(root, 'apps/api/node_modules'));
      for (const file of tree(root, 'apps/api/dist/generated'))
        if (/\.(js|json)$/.test(file)) copy(mirror, file);
    } else if (scope === 'web' || scope === 'prototype') {
      copy(mirror, 'apps/web/package.json');
      link(mirror, 'apps/web/node_modules', path.join(root, 'apps/web/node_modules'));
    } else copy(mirror, 'packages/contracts/package.json');

    let tests;
    if (before) tests = await oldTests(mirror, scope);
    else {
      tests =
        scope === 'web'
          ? [...webSuites, ...unitFiles('apps/web/test/unit')]
          : scope === 'prototype'
            ? ['scripts/task-prototype.test.mjs']
            : unitFiles(scope === 'api' ? 'apps/api/test/unit' : 'packages/contracts/test');
      assert.ok(tests.length, `No ${scope} units found`);
      for (const file of tests) copy(mirror, file);
      if (scope === 'web')
        for (const file of tree(root, 'apps/web/test/unit'))
          if (file.endsWith('.mjs') && !file.endsWith('.test.mjs')) copy(mirror, file);
    }
    if (scope === 'api' && !before) {
      write(
        mirror,
        'apps/api/test/unit/compiler-metadata.test.mjs',
        "import 'reflect-metadata';\nimport assert from 'node:assert/strict';\nimport { test } from 'node:test';\nimport { PrincipalService } from '../../dist/principals/principal.service.js';\nimport { IdentityService } from '../../dist/identity/identity.service.js';\ntest('real tsc retains Nest constructor metadata in the instrumented mirror', {timeout:5000}, () => {assert.deepEqual(Reflect.getMetadata('design:paramtypes', PrincipalService), [IdentityService]);});\n",
      );
      tests.push('apps/api/test/unit/compiler-metadata.test.mjs');
    }
    // All include/exclude patterns are fixed maintained configuration, never CLI/event input.
    // Each nyc traversal sees only this finite private mirror; dependency symlinks are ignored.
    const include =
      scope === 'api'
        ? ['apps/api/dist/**/*.js', 'apps/api/prisma.config.js']
        : scope === 'contracts'
          ? ['packages/contracts/dist/**/*.js']
          : ['apps/web/**/*.js'];
    const config = {
      all: true,
      instrument: false,
      completeCopy: false,
      cache: false,
      excludeAfterRemap: false,
      extension: ['.js'],
      include,
      exclude: ['**/node_modules/**', '**/test/**', 'apps/api/dist/generated/**'],
      reporter: ['json', 'json-summary', 'lcovonly'],
      reportDir: path.join(work, `${scope}-report`),
      tempDir: path.join(work, `${scope}-raw`),
    };
    write(mirror, '.nycrc.json', json(config));
    assert.equal(emittedInputs.length, sources[scope].length);
    phase = `${scope}:instrument`;
    const instrumentRoot =
      scope === 'api' ? 'apps/api' : scope === 'contracts' ? 'packages/contracts/dist' : 'apps/web';
    await run(
      process.execPath,
      [
        nyc,
        'instrument',
        '--cwd',
        mirror,
        '--nycrc-path',
        path.join(mirror, '.nycrc.json'),
        '--instrument',
        'true',
        '--es-modules',
        'true',
        '--compact',
        'false',
        '--produce-source-map',
        'true',
        '--in-place',
        path.join(mirror, instrumentRoot),
      ],
      mirror,
      unitEnv,
    );
    for (const file of emittedInputs) {
      const code = fs.readFileSync(path.join(mirror, file), 'utf8');
      // Empty/type-only modules are reconciled explicitly after remapping.
      if (
        ![
          'apps/web/src/lib/task-prototype/index.js',
          'apps/web/src/lib/task-prototype/types.js',
        ].includes(file)
      )
        assert.match(code, /function cov_/, `Input not instrumented: ${file}`);
    }
    phase = `${scope}:tests`;
    const outputText = await run(
      process.execPath,
      [
        nyc,
        '--cwd',
        mirror,
        '--nycrc-path',
        path.join(mirror, '.nycrc.json'),
        '--all',
        '--instrument',
        'false',
        '--exclude-after-remap',
        'false',
        process.execPath,
        '--import',
        path.join(mirror, 'scripts/unit/mirror-loader.mjs'),
        '--test',
        '--test-reporter=tap',
        '--test-concurrency=1',
        '--test-timeout=5000',
        ...tests.map((f) => path.join(mirror, f)),
      ],
      mirror,
      unitEnv,
    );
    process.stdout.write(
      `${scope}: ${outputText
        .split('\n')
        .filter((l) => /^# (tests|pass|fail|cancelled|skipped) /.test(l))
        .join('; ')}\n`,
    );
    phase = `${scope}:report`;
    const raw = JSON.parse(
      fs.readFileSync(path.join(work, `${scope}-report/coverage-final.json`), 'utf8'),
    );
    const report = normalizeReport(root, scope, sources[scope], raw, coverage);
    const helpers =
      scope === 'web' && !before
        ? tree(root, 'apps/web/test/unit').filter(
            (f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'),
          )
        : [];
    const testInputs = [
      ...new Set([...tests, ...helpers, 'scripts/unit/mirror-loader.mjs']),
    ].sort();
    const manifest = {
      ...providerManifest,
      inputs: Object.fromEntries(sources[scope].map((f) => [f, hashFile(root, f)])),
      tests: Object.fromEntries(
        testInputs.map((f) => [f, sha256(fs.readFileSync(path.join(mirror, f)))]),
      ),
    };
    const baseline = baselineFor(report.summary, manifest);
    baselines[scope] = baseline;
    if (!update && !args.includes('--measure') && !before) {
      const accepted = JSON.parse(
        fs.readFileSync(path.join(root, `scripts/unit/baselines/${scope}.json`), 'utf8'),
      );
      assertComparable(manifest, accepted.manifest);
      assertGate(report.summary, accepted);
    }
    for (const [file, body] of Object.entries({
      'summary.json': json(report.summary),
      'manifest.json': json({
        ...manifest,
        selectedTests: tests,
        exclusions: [
          'generated Prisma',
          'dependencies/vendor',
          'build duplicates',
          'tests/harnesses',
          'CSS/SQL/Prisma schema (other checks)',
          'immutable handoff',
        ],
        zeroUnitReconciliation: sources[scope].filter((f) =>
          Object.values(report.summary.files[f]).every((m) => m.total === 0),
        ),
      }),
      'coverage-final.json': JSON.stringify(report.counters),
      'lcov.info': normalizeLcov(
        root,
        fs.readFileSync(path.join(work, `${scope}-report/lcov.info`), 'utf8'),
        sources[scope],
        mirror,
      ),
    })) {
      assert.ok(
        Buffer.byteLength(body) <= artifactLimits.file,
        `Artifact exceeds per-file limit: ${scope}/${file}`,
      );
      write(output, `${scope}/${file}`, body);
    }
    if (update)
      write(
        root,
        `scripts/unit/baselines/${before ? 'pre-unit-' : ''}${scope}.json`,
        json(baseline),
      );
    status[scope] = 'complete';
    write(output, 'status.json', json(status));
    console.log(
      `${scope}: ${sources[scope].length} maintained inputs; ${Object.entries(report.summary.total)
        .map(([m, c]) => `${m} ${c.covered}/${c.total}`)
        .join(', ')}`,
    );
  }
  phase = 'artifacts';
  const artifacts = tree(root, path.relative(root, output));
  assert.ok(
    artifacts.reduce((n, f) => n + fs.statSync(regular(root, f)).size, 0) <= artifactLimits.total,
    'Artifact total size exceeded',
  );
  if (requested.length === scopes.length)
    console.log(
      `Deterministic count digest: ${sha256(json(Object.fromEntries(Object.entries(baselines).map(([s, b]) => [s, { total: b.total, files: b.files, manifest: b.manifest }]))))}`,
    );
} catch (error) {
  write(output, 'failure.json', json({ status: 'failed', phase, diagnostics }));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Scratch contains raw logs/maps and sources. It is never uploaded.
  // Preserve failed-run scratch locally to diagnose failures; success removes only our mkdtemp tree.
  if (!process.exitCode) fs.rmSync(work, { recursive: true, force: true });
  else console.error(`Local private failure evidence: ${path.relative(root, work)}`);
}
