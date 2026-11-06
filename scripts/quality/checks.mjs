import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { git, repositoryRoot } from './git.mjs';
import {
  assertPolicyStaged,
  formatEligible,
  formattingPolicy,
  lintEligible,
  relativePath,
} from './policy.mjs';

function source(root, file, staged) {
  if (staged) {
    const entry = git(root, ['ls-files', '--stage', '-z', '--', file]);
    if (!/^100(?:644|755) [a-f0-9]+ 0\t/.test(entry)) {
      throw new Error(
        `Cannot check a nonregular or unresolved staged file: ${JSON.stringify(file)}`,
      );
    }
    return git(root, ['show', `:${file}`]);
  }
  if (!lstatSync(resolve(root, file)).isFile()) {
    throw new Error(`Cannot check a nonregular file: ${JSON.stringify(file)}`);
  }
  return readFileSync(resolve(root, file), 'utf8');
}

export async function checkFiles(root, files, { staged = false, lint = false } = {}) {
  if (staged) assertPolicyStaged(root);
  const { options } = formattingPolicy(root);
  const prettier = await import('prettier');
  const eslint = lint
    ? new (await import('eslint')).ESLint({
        cwd: root,
        overrideConfigFile: resolve(root, 'eslint.config.mjs'),
      })
    : undefined;
  const errors = [];
  for (const input of [...new Set(files)]) {
    const file = relativePath(root, input);
    if (!formatEligible(file) && !(lint && lintEligible(file))) continue;
    const text = source(root, file, staged);
    if (
      formatEligible(file) &&
      !(await prettier.check(text, { ...options, filepath: resolve(root, file) }))
    ) {
      errors.push(
        `Format ${JSON.stringify(file)} with pnpm format:write -- <file>, review it, and stage the intended changes.`,
      );
    }
    if (eslint && lintEligible(file) && !(await eslint.isPathIgnored(resolve(root, file)))) {
      const results = await eslint.lintText(text, { filePath: resolve(root, file) });
      if (results.some((result) => result.errorCount || result.warningCount)) {
        errors.push((await eslint.loadFormatter('stylish')).format(results));
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export async function checkStagedFiles(files) {
  await checkFiles(repositoryRoot(), files, { staged: true, lint: true });
}
