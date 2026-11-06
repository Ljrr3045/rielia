import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

async function install() {
  const enabled = (value) => value && value !== 'false' && value !== '0';
  if (
    process.env.HUSKY === '0' ||
    enabled(process.env.CI) ||
    process.env.NODE_ENV === 'production' ||
    ['prod', 'production'].includes(process.env.npm_config_only) ||
    enabled(process.env.npm_config_production) ||
    process.env.npm_config_omit?.split(/[ ,]+/).includes('dev') ||
    !existsSync('.git')
  )
    return;
  if (!lstatSync('.git').isDirectory()) {
    console.log(
      'Linked worktree: use git -c core.hooksPath=.husky commit; shared Git config is unchanged.',
    );
    return;
  }
  const query = (args) => spawnSync('git', args, { encoding: 'utf8', timeout: 5_000 });
  const top = query(['rev-parse', '--show-toplevel']);
  const worktrees = query(['worktree', 'list', '--porcelain']);
  const hooks = query(['config', '--get', 'core.hooksPath']);
  if (top.status !== 0 || resolve(top.stdout.trim()) !== process.cwd() || worktrees.status !== 0)
    return;
  if (
    worktrees.stdout.split('\n').filter((line) => line.startsWith('worktree ')).length !== 1 ||
    (hooks.status === 0 && hooks.stdout.trim() !== '.husky/_')
  ) {
    console.log(
      'Existing worktrees/hooks: use git -c core.hooksPath=.husky commit; Git config is unchanged.',
    );
    return;
  }
  if (!existsSync('.husky/pre-commit') || !existsSync('.husky/commit-msg')) return;
  if (hooks.status !== 0 && hooks.status !== 1)
    throw new Error('Cannot verify existing Git hook configuration.');
  if (hooks.status === 1) {
    const defaultPath = query(['rev-parse', '--git-path', 'hooks']);
    if (defaultPath.status !== 0) throw new Error('Cannot verify existing default Git hooks.');
    const directory = defaultPath.stdout.trim();
    if (
      existsSync(directory) &&
      (lstatSync(directory).isSymbolicLink() ||
        readdirSync(directory).some((name) => {
          if (name.endsWith('.sample')) return false;
          const entry = statSync(join(directory, name));
          return entry.isFile() && (process.platform === 'win32' || (entry.mode & 0o111) !== 0);
        }))
    ) {
      console.log(
        'Existing default Git hooks preserved. Run quality:staged and commit:check separately or integrate hooks deliberately.',
      );
      return;
    }
  }
  const husky = (await import('husky')).default;
  const message = husky();
  if (message) throw new Error(message);
}

install().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
