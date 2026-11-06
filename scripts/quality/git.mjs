import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function git(root, args, options = {}) {
  return execFileSync('git', ['--literal-pathspecs', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 15_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

export function repositoryRoot() {
  return git(process.cwd(), ['rev-parse', '--show-toplevel']).trim();
}

export const paths = (output) => output.split('\0').filter(Boolean);

export function changedPaths(root, base, head) {
  return paths(
    git(root, ['diff', '--name-only', '--no-renames', '--diff-filter=ACMRT', '-z', base, head]),
  );
}

export function stagedPaths(root) {
  return paths(
    git(root, ['diff', '--cached', '--name-only', '--no-renames', '--diff-filter=ACMRT', '-z']),
  );
}

export function isMain(url) {
  return process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === url;
}

export function fail(error) {
  console.error(error.message);
  process.exitCode = 1;
}
