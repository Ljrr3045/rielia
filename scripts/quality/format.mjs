import { readFileSync, writeFileSync } from 'node:fs';
import { checkFiles } from './checks.mjs';
import { changedPaths, fail, isMain, repositoryRoot } from './git.mjs';
import { formatEligible, formattingPolicy, relativePath, regularFile } from './policy.mjs';

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
  const targets = args.map((input) => {
    const file = relativePath(root, input);
    if (!formatEligible(file)) {
      throw new Error(`Formatting requires an eligible regular file: ${JSON.stringify(file)}`);
    }
    return { file, target: regularFile(root, file) };
  });
  // Validate every path and parse every input before the first explicit write.
  const output = await Promise.all(
    targets.map(({ target }) =>
      prettier.format(readFileSync(target, 'utf8'), { ...options, filepath: target }),
    ),
  );
  for (const [index, { file }] of targets.entries()) {
    writeFileSync(regularFile(root, file), output[index]);
  }
}

if (isMain(import.meta.url)) main().catch(fail);
