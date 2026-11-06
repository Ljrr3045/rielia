import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkFiles } from './checks.mjs';
import { changedPaths, fail, isMain, repositoryRoot } from './git.mjs';
import { formatEligible, formattingPolicy, relativePath } from './policy.mjs';

export async function checkFormatting(root, changed = []) {
  const { adopted } = formattingPolicy(root);
  await checkFiles(root, [...adopted, ...changed]);
}

async function main() {
  const root = repositoryRoot();
  const [mode = '--check', ...args] = process.argv.slice(2).filter((arg) => arg !== '--');
  if (mode === '--check' && !args.length) return checkFormatting(root);
  if (mode === '--changed' && args.length === 2) {
    return checkFormatting(root, changedPaths(root, ...args));
  }
  if (mode !== '--write' || !args.length) {
    throw new Error('Use --check, --changed <base> <head>, or --write <explicit files...>.');
  }
  const { options } = formattingPolicy(root);
  const prettier = await import('prettier');
  for (const input of args) {
    const file = relativePath(root, input);
    const target = resolve(root, file);
    if (!formatEligible(file) || !lstatSync(target).isFile()) {
      throw new Error(`Formatting requires an eligible regular file: ${JSON.stringify(file)}`);
    }
    writeFileSync(
      target,
      await prettier.format(readFileSync(target, 'utf8'), { ...options, filepath: target }),
    );
  }
}

if (isMain(import.meta.url)) main().catch(fail);
