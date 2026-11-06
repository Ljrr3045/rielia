import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkFiles } from './checks.mjs';
import { checkEvent, eventRange } from './ci.mjs';
import { checkCommits, checkMessage, newCommits } from './commits.mjs';
import { changedPaths, git as repositoryGit, stagedPaths } from './git.mjs';
import { assertPolicyStaged, excluded } from './policy.mjs';

// This file runs in its own node:test process. Imported production helpers must
// also be isolated from any Git hook/alternate-index context of the caller.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('GIT_')) delete process.env[key];
}
process.env.GIT_CONFIG_NOSYSTEM = '1';
process.env.GIT_CONFIG_GLOBAL = process.platform === 'win32' ? 'NUL' : '/dev/null';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cleanEnv = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  HUSKY: '1',
  CI: 'false',
  NODE_ENV: 'development',
};

const git = (root, args) => repositoryGit(root, args, { env: cleanEnv });

function command(root, executable, args, env = {}) {
  return spawnSync(executable, args, {
    cwd: root,
    env: { ...cleanEnv, ...env },
    encoding: 'utf8',
    timeout: 25_000,
  });
}

function ok(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function fixture(t, { initial = true, dependencies = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'rielia-quality-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  ok(command(root, 'git', ['init', '-q', '-b', 'dev']));
  ok(command(root, 'git', ['config', 'user.name', 'Quality fixture']));
  ok(command(root, 'git', ['config', 'user.email', 'quality@example.invalid']));
  mkdirSync(join(root, 'scripts/quality'), { recursive: true });
  for (const file of readdirSync(join(sourceRoot, 'scripts/quality')).filter(
    (file) => !file.endsWith('.test.mjs'),
  )) {
    cpSync(join(sourceRoot, 'scripts/quality', file), join(root, 'scripts/quality', file));
  }
  for (const file of [
    '.husky',
    '.prettierrc.json',
    'commitlint.config.mjs',
    'lint-staged.config.mjs',
  ]) {
    cpSync(join(sourceRoot, file), join(root, file), { recursive: true });
  }
  writeFileSync(join(root, '.gitignore'), 'node_modules\n');
  writeFileSync(join(root, 'format-adoption.json'), '{"files":[]}\n');
  writeFileSync(
    join(root, 'eslint.config.mjs'),
    "export default [{ files: ['**/*.{mjs,js}'], rules: { 'no-undef': 'error' } }];\n",
  );
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      scripts: { 'quality:staged': 'node scripts/quality/staged.mjs' },
    }) + '\n',
  );
  if (dependencies)
    symlinkSync(join(sourceRoot, 'node_modules'), join(root, 'node_modules'), 'dir');
  git(root, ['add', '.']);
  if (initial)
    ok(
      command(root, 'git', [
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '-qm',
        'legacy subject without a conventional prefix',
      ]),
    );
  return root;
}

function commit(root, message, file = 'witness.txt', text = message + '\n') {
  writeFileSync(join(root, file), text);
  git(root, ['add', file]);
  ok(command(root, 'git', ['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', message]));
  return git(root, ['rev-parse', 'HEAD']).trim();
}

function snapshot(root, file) {
  return {
    tree: git(root, ['write-tree']),
    cached: git(root, ['diff', '--cached', '--binary']),
    unstaged: git(root, ['diff', '--binary']),
    bytes: readFileSync(join(root, file)),
    stash: git(root, ['stash', 'list', '--format=%H']),
  };
}

test('staged formatting/lint inspect index bytes and preserve both sides of partial staging', (t) => {
  const root = fixture(t);
  const file = "space [id] ' dollar$\nsource.mjs";
  commit(root, 'test: seed partial staging', file, 'export const value = 1;\n');
  // Keep a preexisting stash; the runner must neither borrow nor remove it.
  writeFileSync(join(root, 'witness.txt'), 'stash witness\n');
  git(root, ['add', 'witness.txt']);
  git(root, ['stash', 'push', '-qm', 'preexisting fixture stash']);
  const scenarios = [
    ['export const value = 2;\n', 'export const value=3\n', true, ''],
    ['export const value=4\n', 'export const value = 5;\n', false, 'Format'],
    ['missing();\n', 'export const value = 6;\n', false, 'no-undef'],
  ];
  for (const [index, [staged, worktree, valid, error]] of scenarios.entries()) {
    writeFileSync(join(root, file), staged);
    git(root, ['add', file]);
    writeFileSync(join(root, file), worktree);
    const before = snapshot(root, file);
    const trace = join(root, '.git', `trace-${index}.jsonl`);
    const result = command(root, process.execPath, ['scripts/quality/staged.mjs'], {
      GIT_TRACE2_EVENT: trace,
    });
    assert.equal(result.status === 0, valid, result.stdout + result.stderr);
    if (error) assert.match(result.stdout + result.stderr, new RegExp(error));
    assert.deepEqual(snapshot(root, file), before);
    const starts = readFileSync(trace, 'utf8')
      .trim()
      .split('\n')
      .map(JSON.parse)
      .filter((event) => event.event === 'start');
    for (const { argv } of starts) {
      assert.equal(
        argv.some((arg) => ['stash', 'add', 'restore', 'reset', 'update-index'].includes(arg)),
        false,
        JSON.stringify(argv),
      );
    }
  }
});

test('partially staged policy, dependency manifests and untracked policy inputs fail actionable without writes', (t) => {
  const root = fixture(t);
  for (const file of ['.prettierrc.json', 'package.json', 'scripts/quality/checks.mjs']) {
    const original = readFileSync(join(root, file));
    writeFileSync(join(root, file), original + '\n');
    const before = snapshot(root, file);
    const result = command(root, process.execPath, ['scripts/quality/staged.mjs']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Stage the complete intended file/);
    assert.deepEqual(snapshot(root, file), before);
    writeFileSync(join(root, file), original);
  }
  writeFileSync(join(root, '.npmrc'), 'registry=https://example.invalid\n');
  assert.throws(() => assertPolicyStaged(root), /dependency inputs differ/);
});

test('renamed/deleted files, no-match commits and initial staging use correct candidates', (t) => {
  const root = fixture(t);
  const legacy = git(root, ['rev-parse', 'HEAD']).trim();
  commit(root, 'test: seed rename', 'old.mjs', 'export const value = 1;\n');
  git(root, ['mv', 'old.mjs', 'new [key].mjs']);
  assert.deepEqual(stagedPaths(root), ['new [key].mjs']);
  ok(command(root, process.execPath, ['scripts/quality/staged.mjs']));
  const renamed = commit(root, 'test: preserve rename');
  assert.ok(changedPaths(root, legacy, renamed).includes('new [key].mjs'));
  git(root, ['rm', 'new [key].mjs']);
  assert.deepEqual(stagedPaths(root), []);
  ok(command(root, process.execPath, ['scripts/quality/staged.mjs']));
  const initial = fixture(t, { initial: false });
  writeFileSync(join(initial, 'source.mjs'), 'export const value = 1;\n');
  git(initial, ['add', 'source.mjs']);
  // Use the source checker, avoiding unrelated unformatted fixture policy in the initial index.
  return checkFiles(initial, ['source.mjs'], { staged: true, lint: true });
});

test('quality process clears inherited Git context before imported helpers and leaves a sentinel index untouched', (t) => {
  const sentinel = fixture(t);
  const file = 'witness.mjs';
  commit(sentinel, 'test: seed an unrelated sentinel', file, 'export const sentinel = 1;\n');
  writeFileSync(join(sentinel, file), 'export const sentinel = 2;\n');
  git(sentinel, ['add', file]);
  writeFileSync(join(sentinel, file), 'export const sentinel=3\n');
  const before = snapshot(sentinel, file);
  const indexBefore = readFileSync(join(sentinel, '.git/index'));
  const configBefore = readFileSync(join(sentinel, '.git/config'));
  const result = command(
    sourceRoot,
    process.execPath,
    ['--test', '--test-name-pattern=^renamed/deleted files', 'scripts/quality/quality.test.mjs'],
    {
      GIT_DIR: join(sentinel, '.git'),
      NODE_TEST_CONTEXT: undefined,
      GIT_WORK_TREE: sentinel,
      GIT_INDEX_FILE: join(sentinel, '.git/index'),
      GIT_COMMON_DIR: join(sentinel, '.git'),
    },
  );
  assert.match(ok(result), /renamed\/deleted files/, result.stderr);
  assert.deepEqual(readFileSync(join(sentinel, '.git/index')), indexBefore);
  assert.deepEqual(readFileSync(join(sentinel, '.git/config')), configBefore);
  assert.deepEqual(snapshot(sentinel, file), before);
});

test('production staged helpers still honor a legitimate alternate index in both directions', async (t) => {
  const root = fixture(t);
  const file = 'candidate.mjs';
  commit(root, 'test: seed an alternate-index candidate', file, 'export const value = 1;\n');
  const alternate = join(root, '.git/alternate-index');
  cpSync(join(root, '.git/index'), alternate);
  for (const [alt, ordinary, pass] of [
    ['export const value = 2;\n', 'export const value=3\n', true],
    ['export const value=4\n', 'export const value = 5;\n', false],
  ]) {
    writeFileSync(join(root, file), alt);
    repositoryGit(root, ['add', file], { env: { ...cleanEnv, GIT_INDEX_FILE: alternate } });
    writeFileSync(join(root, file), ordinary);
    git(root, ['add', file]);
    writeFileSync(join(root, file), 'export const value = 6;\n');
    const before = snapshot(root, file);
    const alternateBefore = readFileSync(alternate);
    const previous = process.env.GIT_INDEX_FILE;
    process.env.GIT_INDEX_FILE = alternate;
    try {
      const check = checkFiles(root, [file], { staged: true, lint: true });
      if (pass) await check;
      else await assert.rejects(check, /Format/);
    } finally {
      if (previous === undefined) delete process.env.GIT_INDEX_FILE;
      else process.env.GIT_INDEX_FILE = previous;
    }
    assert.deepEqual(readFileSync(alternate), alternateBefore);
    assert.deepEqual(snapshot(root, file), before);
  }
});

test('protected/generated files are skipped and staged symlinks are rejected', async (t) => {
  const root = fixture(t);
  assert.equal(excluded('docs/handoff/source.ts'), true);
  assert.equal(excluded('apps/api/src/generated/client.ts'), true);
  await checkFiles(root, ['docs/handoff/missing.ts', 'apps/api/src/generated/missing.ts'], {
    staged: true,
  });
  symlinkSync('package.json', join(root, 'link.mjs'));
  git(root, ['add', 'link.mjs']);
  await assert.rejects(checkFiles(root, ['link.mjs'], { staged: true }), /nonregular/);
  commit(
    root,
    'test: seed a regular type-change candidate',
    'regular.mjs',
    'export const value = 1;\n',
  );
  rmSync(join(root, 'regular.mjs'));
  symlinkSync('package.json', join(root, 'regular.mjs'));
  git(root, ['add', 'regular.mjs']);
  assert.ok(stagedPaths(root).includes('regular.mjs'));
  const result = command(root, process.execPath, ['scripts/quality/staged.mjs']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /nonregular/);
});

test('backslash filenames are rejected before lint-staged normalization; conflicted indexes fail closed', (t) => {
  const root = fixture(t);
  const file = 'back\\slash.mjs';
  writeFileSync(join(root, file), 'export const value = 1;\n');
  git(root, ['add', file]);
  const before = snapshot(root, file);
  const result = command(root, process.execPath, ['scripts/quality/staged.mjs']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /normalizes backslash filenames/);
  assert.deepEqual(snapshot(root, file), before);
  const conflict = fixture(t);
  commit(conflict, 'test: seed a merge conflict');
  git(conflict, ['switch', '-c', 'other']);
  commit(conflict, 'test: change the other side');
  git(conflict, ['switch', 'dev']);
  commit(conflict, 'test: change this side');
  assert.notEqual(command(conflict, 'git', ['merge', 'other']).status, 0);
  assert.throws(() => assertPolicyStaged(conflict), /Resolve unmerged files/);
});

test('interrupted supported function tasks do not need stash/index recovery', async (t) => {
  const root = fixture(t);
  writeFileSync(
    join(root, 'lint-staged.config.mjs'),
    "export default { '*': { title: 'Wait for signal', task: async () => { console.log('fixture-waiting'); await new Promise(resolve => setTimeout(resolve, 60000)); } } };\n",
  );
  git(root, ['add', 'lint-staged.config.mjs']);
  ok(
    command(root, 'git', [
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '-qm',
      'test: prepare interrupted runner',
    ]),
  );
  writeFileSync(join(root, 'source.mjs'), 'export const value = 1;\n');
  git(root, ['add', 'source.mjs']);
  writeFileSync(join(root, 'source.mjs'), 'export const value=2\n');
  const before = snapshot(root, 'source.mjs');
  const cli = join(sourceRoot, 'node_modules/lint-staged/bin/lint-staged.js');
  const child = spawn(
    process.execPath,
    [
      cli,
      '--config',
      'lint-staged.config.mjs',
      '--no-stash',
      '--no-hide-partially-staged',
      '--fail-on-changes',
      '--concurrent',
      'false',
    ],
    { cwd: root, env: cleanEnv, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  t.after(() => child.kill('SIGKILL'));
  await new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Runner did not start'));
    }, 5_000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('fixture-waiting')) {
        clearTimeout(timeout);
        resolveReady();
      }
    });
  });
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await exited;
  assert.deepEqual(snapshot(root, 'source.mjs'), before);
});

test('explicit formatting and checks reject symlink ancestors without modifying any selected/protected bytes', async (t) => {
  const root = fixture(t);
  const outside = mkdtempSync(join(tmpdir(), 'rielia-format-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const external = join(outside, 'witness.mjs');
  const selected = join(root, 'selected.mjs');
  const immutable = join(root, 'docs/handoff/witness.json');
  mkdirSync(dirname(immutable), { recursive: true });
  writeFileSync(external, 'export const value=1\n');
  writeFileSync(selected, 'export const value=2\n');
  writeFileSync(immutable, '{"value":3}');
  symlinkSync(outside, join(root, 'external-alias'), 'dir');
  symlinkSync(dirname(immutable), join(root, 'handoff-alias'), 'dir');
  const original = [external, selected, immutable].map((file) => readFileSync(file));
  for (const alias of ['external-alias/witness.mjs', 'handoff-alias/witness.json']) {
    const result = command(root, process.execPath, [
      'scripts/quality/format.mjs',
      '--write',
      'selected.mjs',
      alias,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symlink directory/);
    await assert.rejects(checkFiles(root, [alias]), /symlink directory/);
    assert.deepEqual(
      [external, selected, immutable].map((file) => readFileSync(file)),
      original,
    );
  }
  writeFileSync(join(root, 'invalid.mjs'), 'export =\n');
  assert.notEqual(
    command(root, process.execPath, [
      'scripts/quality/format.mjs',
      '--write',
      'selected.mjs',
      'invalid.mjs',
    ]).status,
    0,
  );
  assert.deepEqual(readFileSync(selected), original[1]);
  ok(command(root, process.execPath, ['scripts/quality/format.mjs', '--write', 'selected.mjs']));
  assert.equal(readFileSync(selected, 'utf8'), 'export const value = 2;\n');
  assert.deepEqual(readFileSync(external), original[0]);
  assert.deepEqual(readFileSync(immutable), original[2]);
});

test('installer preserves an active default Git hook and its rejecting behavior', (t) => {
  const root = fixture(t, { dependencies: false });
  const hook = join(root, '.git/hooks/pre-commit');
  writeFileSync(hook, '#!/bin/sh\necho original-default-hook-rejected >&2\nexit 17\n', {
    mode: 0o755,
  });
  const configBefore = readFileSync(join(root, '.git/config'));
  const hookBefore = readFileSync(hook);
  const attempt = () =>
    command(root, 'git', ['commit', '--allow-empty', '-m', 'chore: retain the original hook']);
  assert.match(attempt().stderr, /original-default-hook-rejected/);
  const installer = command(root, process.execPath, ['.husky/install.mjs']);
  assert.match(ok(installer), /Existing default Git hooks preserved/);
  const after = attempt();
  assert.notEqual(after.status, 0);
  assert.match(after.stderr, /original-default-hook-rejected/);
  assert.deepEqual(readFileSync(join(root, '.git/config')), configBefore);
  assert.deepEqual(readFileSync(hook), hookBefore);
  assert.equal(existsSync(join(root, '.husky/_')), false);
});

test('installer skips without importing missing Husky across CI/production/no-Git/linked contexts', (t) => {
  const root = fixture(t, { dependencies: false });
  for (const env of [
    { HUSKY: '0' },
    { CI: 'true' },
    { CI: '1' },
    { NODE_ENV: 'production' },
    { npm_config_production: 'true' },
    { npm_config_only: 'production' },
    { npm_config_omit: 'dev' },
  ]) {
    ok(command(root, process.execPath, ['.husky/install.mjs'], env));
  }
  const noGit = mkdtempSync(join(tmpdir(), 'rielia-no-git-'));
  t.after(() => rmSync(noGit, { recursive: true, force: true }));
  cpSync(join(sourceRoot, '.husky'), join(noGit, '.husky'), { recursive: true });
  ok(command(noGit, process.execPath, ['.husky/install.mjs']));
  const sibling = join(root, 'sibling');
  git(root, ['worktree', 'add', '--detach', sibling]);
  const common = readFileSync(join(root, '.git/config'));
  ok(command(sibling, process.execPath, ['.husky/install.mjs']));
  ok(command(root, process.execPath, ['.husky/install.mjs']));
  assert.deepEqual(readFileSync(join(root, '.git/config')), common);
});

test('single clone uses upstream Husky; custom hooks and linked per-command checks stay isolated', (t) => {
  const root = fixture(t);
  ok(command(root, process.execPath, ['.husky/install.mjs']));
  assert.equal(git(root, ['config', '--get', 'core.hooksPath']).trim(), '.husky/_');
  assert.ok(existsSync(join(root, '.husky/_/pre-commit')));
  git(root, ['config', 'core.hooksPath', 'custom-hooks']);
  const common = readFileSync(join(root, '.git/config'));
  ok(command(root, process.execPath, ['.husky/install.mjs']));
  assert.deepEqual(readFileSync(join(root, '.git/config')), common);
  const sibling = join(root, 'sibling');
  git(root, ['worktree', 'add', '--detach', sibling]);
  symlinkSync(join(sourceRoot, 'node_modules'), join(sibling, 'node_modules'), 'dir');
  const result = command(sibling, 'git', [
    '-c',
    'core.hooksPath=.husky',
    'commit',
    '--allow-empty',
    '-m',
    'invalid message',
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /Commit message rejected/);
  ok(
    command(sibling, 'git', [
      '-c',
      'core.hooksPath=.husky',
      'commit',
      '--allow-empty',
      '-m',
      'chore: verify direct hooks',
    ]),
  );
  assert.deepEqual(readFileSync(join(root, '.git/config')), common);
});

for (const { verbose, comment } of [
  { verbose: false },
  { verbose: true },
  { verbose: true, comment: ';' },
]) {
  test(`real editor commits accept comments and diffs (verbose=${verbose}, comment=${comment ?? '#'})`, (t) => {
    const root = fixture(t);
    const base = git(root, ['rev-parse', 'HEAD']).trim();
    const candidate = 'long-'.repeat(24) + '.txt';
    writeFileSync(join(root, candidate), 'a verbose diff line '.repeat(12) + '\n');
    git(root, ['add', candidate]);
    const editor = join(root, '.git/editor.cjs');
    writeFileSync(
      editor,
      "const fs = require('node:fs'); const file = process.argv[2]; const text = process.env.RIELIA_TEST_COMMIT_MESSAGE + '\\n\\n' + fs.readFileSync(file, 'utf8'); fs.writeFileSync(file + '.fixture-raw', text); fs.writeFileSync(file, text);\n",
    );
    const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
    const env = {
      GIT_EDITOR: quote(process.execPath) + ' ' + quote(editor),
      RIELIA_TEST_COMMIT_MESSAGE: 'feat: capture a valid editor message',
    };
    if (comment) git(root, ['config', 'core.commentChar', comment]);
    const args = ['-c', 'core.hooksPath=.husky', 'commit'];
    if (verbose) args.push('-v');
    ok(command(root, 'git', args, env));
    const raw = readFileSync(join(root, '.git/COMMIT_EDITMSG.fixture-raw'), 'utf8');
    assert.ok(raw.includes(candidate), 'Git comment template was preserved by the editor');
    if (verbose)
      assert.ok(raw.includes('>8') && raw.includes('diff --git'), 'real verbose diff present');
    const stored = git(root, ['show', '-s', '--format=%B', 'HEAD']);
    assert.equal(stored.trim(), env.RIELIA_TEST_COMMIT_MESSAGE);
    checkCommits(root, base, git(root, ['rev-parse', 'HEAD']).trim(), base);
    for (const invalid of [
      'invalid editor subject',
      'feat: reject an invalid real body\n\n' + 'x'.repeat(120),
    ]) {
      const head = git(root, ['rev-parse', 'HEAD']).trim();
      const rejected = command(root, 'git', [...args, '--allow-empty'], {
        ...env,
        RIELIA_TEST_COMMIT_MESSAGE: invalid,
      });
      assert.notEqual(rejected.status, 0);
      assert.match(rejected.stdout + rejected.stderr, /Commit message rejected/);
      assert.equal(git(root, ['rev-parse', 'HEAD']).trim(), head);
    }
  });
}

test('hook installation ignores executable backups and unrelated helpers that Git does not execute', (t) => {
  const root = fixture(t);
  for (const name of ['pre-commit.bak', 'helper-script']) {
    writeFileSync(join(root, '.git/hooks', name), '#!/bin/sh\nexit 19\n', { mode: 0o755 });
  }
  writeFileSync(join(root, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 29\n', { mode: 0o644 });
  const backupBefore = readFileSync(join(root, '.git/hooks/pre-commit.bak'));
  ok(command(root, 'git', ['commit', '--allow-empty', '-m', 'chore: backups are not hooks']));
  ok(command(root, process.execPath, ['.husky/install.mjs']));
  assert.equal(git(root, ['config', '--get', 'core.hooksPath']).trim(), '.husky/_');
  assert.deepEqual(readFileSync(join(root, '.git/hooks/pre-commit.bak')), backupBefore);
});

test('hook installation ignores dangling recognized hook symlinks without a filesystem exception', (t) => {
  const root = fixture(t);
  symlinkSync('missing-target', join(root, '.git/hooks/pre-commit'));
  ok(
    command(root, 'git', ['commit', '--allow-empty', '-m', 'chore: missing targets are not hooks']),
  );
  ok(command(root, process.execPath, ['.husky/install.mjs']));
  assert.equal(git(root, ['config', '--get', 'core.hooksPath']).trim(), '.husky/_');
  assert.equal(readlinkSync(join(root, '.git/hooks/pre-commit')), 'missing-target');
});

test('hook installation preserves a real executable symlink target and its rejecting behavior', (t) => {
  const root = fixture(t, { dependencies: false });
  const target = join(root, '.git/real-hook');
  writeFileSync(target, '#!/bin/sh\necho real-symlink-hook-rejected >&2\nexit 23\n', {
    mode: 0o755,
  });
  symlinkSync('../real-hook', join(root, '.git/hooks/pre-commit'));
  const before = readFileSync(join(root, '.git/config'));
  const bytes = readFileSync(target);
  const attempt = () =>
    command(root, 'git', ['commit', '--allow-empty', '-m', 'chore: keep the active symlink hook']);
  assert.notEqual(attempt().status, 0);
  assert.match(
    ok(command(root, process.execPath, ['.husky/install.mjs'])),
    /Existing default Git hooks preserved/,
  );
  const rejected = attempt();
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /real-symlink-hook-rejected/);
  assert.deepEqual(readFileSync(join(root, '.git/config')), before);
  assert.deepEqual(readFileSync(target), bytes);
});

test('strict Conventional Commits rejects fake merges/fixups/versions/generated reverts, regardless of author', (t) => {
  const root = fixture(t);
  for (const message of [
    'feat: add a behavior',
    'fix(api): preserve retries',
    'revert: restore prior behavior',
    'chore(deps): update a pinned tool',
  ])
    checkMessage(root, message);
  for (const message of [
    'bad message',
    'Merge fake context',
    'fixup! feat: unfinished',
    'squash! feat: unfinished',
    'amend! feat: unfinished',
    'v1.2.3',
    'Revert "some change"',
  ]) {
    assert.throws(() => checkMessage(root, message), /Commit message rejected/);
  }
});

test('PR/push graph ranges include multiple new children, exclude legacy and real merge commits', async (t) => {
  const root = fixture(t);
  const oldest = git(root, ['rev-parse', 'HEAD']).trim();
  const legacy = commit(root, 'another legacy subject');
  git(root, ['switch', '-c', 'feature']);
  const first = commit(root, 'feat: first change', 'first.mjs', 'export const first = 1;\n');
  const head = commit(root, 'fix: second change', 'second.mjs', 'export const second = 2;\n');
  git(root, ['switch', 'dev']);
  const base = commit(root, 'chore: advance base', 'base.txt');
  assert.deepEqual(newCommits(root, oldest, head, legacy), [first, head]);
  const pull = {
    pull_request: { base: { sha: base }, head: { sha: head }, title: '$(touch title-injected)' },
  };
  assert.deepEqual(eventRange(root, 'pull_request', pull, legacy), {
    base,
    head,
    formatBase: legacy,
  });
  ok(
    command(root, 'git', [
      '-c',
      'core.hooksPath=/dev/null',
      'merge',
      '--no-ff',
      'feature',
      '-m',
      'Generated nonconventional merge',
    ]),
  );
  const merged = git(root, ['rev-parse', 'HEAD']).trim();
  assert.deepEqual(newCommits(root, base, merged, legacy), [first, head]);
  checkCommits(root, base, merged, legacy);
  await checkEvent(root, 'pull_request', pull, legacy);
  for (const ref of ['refs/heads/dev', 'refs/heads/main']) {
    await checkEvent(root, 'push', { ref, before: base, after: merged }, legacy);
    assert.equal(
      eventRange(root, 'push', { ref, before: '0'.repeat(40), after: merged }, legacy).base,
      legacy,
    );
  }
  assert.equal(existsSync(join(root, 'title-injected')), false);
  assert.throws(
    () =>
      eventRange(
        root,
        'pull_request',
        { pull_request: { base: { sha: '$(touch sha-injected)' }, head: { sha: head } } },
        legacy,
      ),
    /full commit SHA/,
  );
  assert.throws(
    () => eventRange(root, 'push', { ref: 'refs/heads/dev', after: merged }, legacy),
    /full commit SHA/,
  );
  assert.throws(
    () =>
      eventRange(root, 'push', { ref: 'refs/heads/other', before: base, after: merged }, legacy),
    /Unsupported/,
  );
  assert.throws(
    () =>
      eventRange(
        root,
        'push',
        { ref: 'refs/heads/dev', before: base, after: '0'.repeat(40) },
        legacy,
      ),
    /nonzero/,
  );
});

test('CI catches skipped hooks, an invalid earlier commit and malformed changed formatting', async (t) => {
  const root = fixture(t);
  const legacy = git(root, ['rev-parse', 'HEAD']).trim();
  commit(root, 'invalid earlier commit', 'bad.txt');
  const head = commit(root, 'chore: valid final subject', 'good.txt');
  await assert.rejects(
    checkEvent(root, 'push', { ref: 'refs/heads/dev', before: legacy, after: head }, legacy),
    /Commit message rejected/,
  );
  const formatRoot = fixture(t);
  const base = git(formatRoot, ['rev-parse', 'HEAD']).trim();
  const malformed = commit(
    formatRoot,
    'test: bypass hooks with malformed source',
    'source.mjs',
    'export const value=1\n',
  );
  await assert.rejects(
    checkEvent(
      formatRoot,
      'push',
      { ref: 'refs/heads/main', before: base, after: malformed },
      base,
    ),
    /Format/,
  );
  const valid = commit(
    formatRoot,
    'style: format the changed source',
    'source.mjs',
    'export const value = 1;\n',
  );
  await checkEvent(
    formatRoot,
    'push',
    { ref: 'refs/heads/main', before: base, after: valid },
    base,
  );
});
