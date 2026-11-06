import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { git, paths } from './git.mjs';

export const legacyCommit = '1c33560f2fca954cbac6d35a87881a41dd72b017';

export function relativePath(root, file) {
  const name = relative(root, resolve(root, file)).split(sep).join('/');
  if (!name || name === '..' || name.startsWith('../') || isAbsolute(name)) {
    throw new Error(`Expected a file inside the repository: ${JSON.stringify(file)}`);
  }
  return name;
}

export function excluded(file) {
  return (
    /(^|\/)(node_modules|dist|\.next|coverage)(\/|$)/.test(file) ||
    /^(docs\/handoff\/|patches\/|apps\/api\/src\/generated\/)/.test(file) ||
    file === 'docs/development/handoff-files.sha256' ||
    file === 'pnpm-lock.yaml' ||
    /(^|\/)next-env\.d\.ts$|\.tsbuildinfo$/.test(file)
  );
}

export function formatEligible(file) {
  // Legacy Markdown is inventoried separately; this first rollout targets maintained source/config.
  return !excluded(file) && /\.(?:[cm]?js|jsx|[cm]?ts|tsx|css|json|ya?ml)$/.test(file);
}

export function lintEligible(file) {
  return !excluded(file) && /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/.test(file);
}

export function policyInput(file) {
  return (
    /^(scripts\/quality\/|\.husky\/)/.test(file) ||
    /(^|\/)(package\.json|tsconfig[^/]*\.json|\.npmrc)$/.test(file) ||
    [
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      '.node-version',
      '.prettierrc.json',
      '.prettierignore',
      'eslint.config.mjs',
      'commitlint.config.mjs',
      'lint-staged.config.mjs',
      'format-adoption.json',
    ].includes(file)
  );
}

export function assertPolicyStaged(root) {
  if (git(root, ['ls-files', '--unmerged', '-z'])) {
    throw new Error('Resolve unmerged files before running staged checks.');
  }
  const different = paths(git(root, ['diff', '--name-only', '-z']));
  const untracked = paths(git(root, ['ls-files', '--others', '--exclude-standard', '-z']));
  const unsafe = [...new Set([...different, ...untracked].filter(policyInput))];
  if (unsafe.length) {
    throw new Error(
      `Quality policy or dependency inputs differ between index and worktree: ${unsafe.map((p) => JSON.stringify(p)).join(', ')}. ` +
        'Stage the complete intended file, or restore its unstaged changes yourself, then retry. No files were changed.',
    );
  }
}

export function formattingPolicy(root) {
  return {
    options: JSON.parse(readFileSync(resolve(root, '.prettierrc.json'), 'utf8')),
    adopted: JSON.parse(readFileSync(resolve(root, 'format-adoption.json'), 'utf8')).files,
  };
}
