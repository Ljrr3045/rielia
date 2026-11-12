import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { git, paths } from './git.mjs';

export const legacyCommit = '1c33560f2fca954cbac6d35a87881a41dd72b017';

export function assertRuntime(root) {
  const expected = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
  if (!/^\d+\.\d+\.\d+$/.test(expected) || process.versions.node !== expected) {
    throw new Error(
      `Quality checks require Node ${expected}; running ${process.versions.node}. Install the reviewed runtime explicitly; hooks never install dependencies.`,
    );
  }
}

export function relativePath(root, file) {
  const name = relative(root, resolve(root, file)).split(sep).join('/');
  if (!name || name === '..' || name.startsWith('../') || isAbsolute(name)) {
    throw new Error(`Expected a file inside the repository: ${JSON.stringify(file)}`);
  }
  return name;
}

export function checkedPath(root, file) {
  const name = relativePath(root, file);
  const canonicalRoot = realpathSync(root);
  let directory = canonicalRoot;
  for (const part of name.split('/').slice(0, -1)) {
    directory = resolve(directory, part);
    try {
      if (lstatSync(directory).isSymbolicLink()) {
        throw new Error(`Refusing a path through a symlink directory: ${JSON.stringify(name)}`);
      }
    } catch (error) {
      // A staged file can have an unstaged deletion; no absent ancestor can redirect a read.
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return resolve(canonicalRoot, name);
}

export function regularFile(root, file) {
  const target = checkedPath(root, file);
  if (!lstatSync(target).isFile()) {
    throw new Error(`Expected a regular file without symlink ancestors: ${JSON.stringify(file)}`);
  }
  return target;
}

export function excluded(file) {
  return (
    /(^|\/)(\.git|node_modules|dist|\.next|coverage)(\/|$)/.test(file) ||
    /^(docs\/handoff\/|patches\/|apps\/api\/src\/generated\/)/.test(file) ||
    /^apps\/web\/\.agents\/skills\/(frontend-design|impeccable|ui-ux-pro-max)\//.test(file) ||
    file === 'docs/development/handoff-files.sha256' ||
    file === 'pnpm-lock.yaml' ||
    file === 'scripts/unit/tools/pnpm-lock.yaml' ||
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
