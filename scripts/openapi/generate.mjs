import { Buffer } from 'node:buffer';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  lstatSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain, fail } from '../quality/git.mjs';
import { runProcess } from '../unit/process.mjs';
import { assertSemanticSources } from './semantic-sources.mjs';
import { assertRouteCoverage } from './route-census.mjs';

export const outputFiles = [
  'packages/contracts/openapi/rielia.openapi.json',
  'packages/contracts/generated/openapi.d.ts',
];
function regularParents(root, name) {
  let current = root;
  for (const part of name.split('/')) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error('Generated output symlink rejected');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
export function reconcileArtifacts(root, contents, mode) {
  if (!['--write', '--check'].includes(mode)) throw new Error('Use --write or --check');
  if (contents.length !== outputFiles.length) throw new Error('Incomplete generated artifacts');
  for (const name of outputFiles) regularParents(root, name);
  for (const [index, name] of outputFiles.entries()) {
    const text = contents[index];
    if (mode === '--write') {
      mkdirSync(dirname(join(root, name)), { recursive: true });
      writeFileSync(join(root, name), text);
    } else if (!existsSync(join(root, name)) || readFileSync(join(root, name), 'utf8') !== text)
      throw new Error(`OpenAPI drift: ${name}; regenerate with pnpm openapi:generate`);
  }
}
export async function generateArtifacts(
  mode,
  root = fileURLToPath(new URL('../../', import.meta.url)),
) {
  const expected = readFileSync(join(root, '.node-version'), 'utf8').trim();
  if (process.versions.node !== expected)
    throw new Error(`OpenAPI generation requires Node ${expected}`);
  // Root scripts always rebuild contracts first; generated outputs are outside src.
  const { buildOpenApi, stableJson } =
    await import('../../packages/contracts/dist/openapi/document.js');
  const { operations } = await import('../../packages/contracts/dist/openapi/operations.js');
  const { checkBindings, admissionBindings, transformBindings } =
    await import('../../packages/contracts/dist/openapi/schema-bindings.js');
  const { resolveBinding } = await import('../../packages/contracts/dist/openapi/schema-export.js');
  assertSemanticSources(
    root,
    [...checkBindings, ...admissionBindings, ...transformBindings],
    resolveBinding,
  );
  assertRouteCoverage(root, operations);
  const document = stableJson(buildOpenApi());
  const directory = mkdtempSync(join(tmpdir(), 'rielia-openapi-'));
  try {
    const input = join(directory, 'openapi.json');
    const output = join(directory, 'openapi.d.ts');
    writeFileSync(input, document);
    const generated = await runProcess(
      process.execPath,
      [fileURLToPath(new URL('./type-generator.mjs', import.meta.url)), input, output],
      { cwd: root, group: true, deadline: 120000, maxBytes: 204800 },
    );
    if (generated.code !== 0)
      throw new Error(`Isolated OpenAPI generator failed: ${generated.output}`);
    const types = readFileSync(output, 'utf8');
    reconcileArtifacts(root, [document, types], mode);
    return { ...JSON.parse(generated.output), documentBytes: Buffer.byteLength(document), mode };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--check', '--write'].includes(args[0]))
    fail(new Error('Use --check or --write'));
  else
    generateArtifacts(args[0])
      .then((result) => console.log(JSON.stringify(result)))
      .catch(fail);
}
