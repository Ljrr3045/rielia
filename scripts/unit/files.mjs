import { createHash } from 'node:crypto';
import {
  lstatSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { limits } from './config.mjs';

export function inside(root, file) {
  const name = relative(root, resolve(root, file)).replaceAll('\\', '/');
  if (!name || name.startsWith('../') || isAbsolute(name) || name.includes('\0')) {
    throw new Error('Expected a contained relative file path');
  }
  return name;
}

export function regular(root, file) {
  const name = inside(root, file);
  let current = root;
  for (const part of name.split('/')) {
    current = resolve(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`Source symlink rejected: ${name}`);
  }
  if (!lstatSync(current).isFile()) throw new Error(`Expected regular file: ${name}`);
  return current;
}

// Bounds fail the entire run; they never silently omit an input. No source symlink is followed.
export function tree(root, directory, { skip = [], bounds = limits } = {}) {
  const files = [];
  let bytes = 0;
  function visit(name, depth) {
    if (skip.includes(name)) return;
    if (depth > bounds.depth) throw new Error('Source depth bound exceeded');
    const info = lstatSync(resolve(root, name));
    if (info.isSymbolicLink()) throw new Error(`Source symlink rejected: ${name}`);
    if (info.isDirectory()) {
      for (const child of readdirSync(resolve(root, name)).sort())
        visit(`${name}/${child}`, depth + 1);
    } else if (info.isFile()) {
      files.push(name);
      bytes += info.size;
      if (files.length > bounds.files || bytes > bounds.bytes)
        throw new Error('Source size bound exceeded');
    } else throw new Error(`Unsupported source entry: ${name}`);
  }
  visit(directory, 0);
  return files.sort();
}

export function write(root, file, value) {
  inside(root, file);
  const target = resolve(root, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const hashFile = (root, file) => sha256(readFileSync(regular(root, file)));
export function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted(value[key])]),
    );
  }
  return value;
}
export const json = (value) => `${JSON.stringify(sorted(value), null, 2)}\n`;

export function coverageDirectory(root, name) {
  if (!['unit', 'unit-before', 'artifacts'].includes(name))
    throw new Error('Unknown owned coverage directory');
  for (const file of ['coverage', `coverage/${name}`]) {
    const target = resolve(root, file);
    if (!existsSync(target)) mkdirSync(target, { mode: 0o700 });
    const info = lstatSync(target);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Unsafe coverage directory');
  }
  return resolve(root, `coverage/${name}`);
}

export function freshOutput(root, name) {
  const output = coverageDirectory(root, name);
  for (const file of tree(root, `coverage/${name}`)) {
    if (
      !/^(?:(?:api|web|contracts|prototype)\/(?:summary\.json|manifest\.json|coverage-final\.json|lcov\.info)|failure\.json|status\.json)$/.test(
        relative(output, resolve(root, file)),
      )
    )
      throw new Error('Unknown file in owned coverage output');
  }
  rmSync(output, { recursive: true });
  mkdirSync(output, { mode: 0o700 });
  write(output, 'status.json', '{}\n');
  return output;
}

export function inventory(root) {
  const api = tree(root, 'apps/api/src', { skip: ['apps/api/src/generated'] }).filter((f) =>
    f.endsWith('.ts'),
  );
  const web = tree(root, 'apps/web/src').filter((f) => /\.tsx?$/.test(f));
  const prototype = (f) => /^apps\/web\/src\/(app\/prototype|lib\/task-prototype)\//.test(f);
  return {
    api: [...api, 'apps/api/prisma.config.ts'].sort(),
    web: [...web.filter((f) => !prototype(f)), 'apps/web/next.config.ts'].sort(),
    prototype: web.filter(prototype),
    contracts: tree(root, 'packages/contracts/src').filter((f) => f.endsWith('.ts')),
  };
}
