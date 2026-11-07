import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { git, fail, isMain, repositoryRoot } from './git.mjs';
import { assertPolicyStaged, assertRuntime, legacyCommit } from './policy.mjs';

export function verifyCommit(root, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha) || /^0+$/.test(sha))
    throw new Error('Expected a nonzero full commit SHA.');
  git(root, ['cat-file', '-e', `${sha}^{commit}`]);
  return sha;
}

export function newCommits(root, base, head, legacy = legacyCommit) {
  [base, head, legacy].forEach((sha) => verifyCommit(root, sha));
  return git(root, ['rev-list', '--reverse', '--no-merges', head, '--not', base, legacy])
    .trim()
    .split('\n')
    .filter(Boolean);
}

function runCommitlint(root, args, message) {
  assertRuntime(root);
  const cli = fileURLToPath(new URL('../../node_modules/@commitlint/cli/cli.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, '--config', 'commitlint.config.mjs', ...args], {
    cwd: root,
    input: message,
    encoding: 'utf8',
    timeout: 15_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Commit message rejected:\n${result.stdout}${result.stderr}`);
}

export function checkMessage(root, message) {
  runCommitlint(root, [], message);
}

export function checkCommits(root, base, head, legacy = legacyCommit) {
  const commits = newCommits(root, base, head, legacy);
  for (const commit of commits)
    checkMessage(root, git(root, ['show', '-s', '--format=%B', commit]));
  console.log(`Conventional Commits: ${commits.length} new nonmerge commit(s) checked.`);
}

function main() {
  const root = repositoryRoot();
  const [mode, ...args] = process.argv.slice(2);
  if (mode === '--stdin' && !args.length) return checkMessage(root, readFileSync(0, 'utf8'));
  if (mode === '--edit' && args.length === 1) {
    assertPolicyStaged(root);
    // Git's real merge context is exempt; a nonmerge message merely saying Merge is not.
    const mergeHead = git(root, ['rev-parse', '--git-path', 'MERGE_HEAD']).trim();
    try {
      if (readFileSync(mergeHead, 'utf8').trim()) return;
    } catch {
      /* Not a merge. */
    }
    // The pinned edit parser handles Git comments and the verbose scissors/diff block.
    return runCommitlint(root, ['--edit', args[0]]);
  }
  if (mode === '--range' && args.length === 2) return checkCommits(root, ...args);
  throw new Error('Use --stdin, --edit <message-file>, or --range <base-sha> <head-sha>.');
}

if (isMain(import.meta.url)) {
  try {
    main();
  } catch (error) {
    fail(error);
  }
}
