import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sep } from 'node:path';
import { fail, git, isMain, repositoryRoot, stagedPaths } from './git.mjs';
import { assertPolicyStaged, formatEligible, lintEligible } from './policy.mjs';

if (isMain(import.meta.url)) {
  try {
    const root = repositoryRoot();
    assertPolicyStaged(root);
    if (sep !== '\\' && stagedPaths(root).some((file) => file.includes('\\'))) {
      throw new Error(
        'lint-staged normalizes backslash filenames. Rename that candidate before committing; no files were changed.',
      );
    }
    // lint-staged omits symlinks before its function task; reject eligible type changes here.
    for (const file of stagedPaths(root).filter(
      (name) => formatEligible(name) || lintEligible(name),
    )) {
      if (
        !/^100(?:644|755) [a-f0-9]+ 0\t/.test(git(root, ['ls-files', '--stage', '-z', '--', file]))
      ) {
        throw new Error(`Cannot check a nonregular staged file: ${JSON.stringify(file)}`);
      }
    }
    const cli = fileURLToPath(
      new URL('../../node_modules/lint-staged/bin/lint-staged.js', import.meta.url),
    );
    const result = spawnSync(
      process.execPath,
      [
        cli,
        '--config',
        'lint-staged.config.mjs',
        '--no-stash',
        '--diff-filter',
        'ACMRT',
        '--no-hide-partially-staged',
        '--fail-on-changes',
        '--concurrent',
        'false',
      ],
      { stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    fail(error);
  }
}
