import { Buffer } from 'node:buffer';
// Internal subprocess: only local JSON enters; only declaration bytes leave.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
const expectedNode = readFileSync(new URL('../../.node-version', import.meta.url), 'utf8').trim();
if (process.versions.node !== expectedNode)
  throw new Error(`OpenAPI generation requires Node ${expectedNode}`);
const [input, output] = process.argv.slice(2);
if (!input || !output || process.argv.length !== 4)
  throw new Error('Expected local input/output files');
const data = JSON.parse(readFileSync(input, 'utf8'));
function local(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && (typeof child !== 'string' || !child.startsWith('#/components/schemas/')))
      throw new Error('External references are prohibited');
    if (key !== '$ref') local(child);
  }
}
local(data);
const tools = createRequire(new URL('./tools/package.json', import.meta.url));
const compiler = tools('typescript');
const packageInfo = tools('openapi-typescript/package.json');
if (compiler.version !== '5.9.3' || packageInfo.version !== '7.13.0')
  throw new Error('Unexpected isolated generator versions');
const generatorRequire = createRequire(tools.resolve('openapi-typescript'));
const core = generatorRequire('@redocly/openapi-core');
const entry = packageInfo.exports['.'].import;
if (typeof entry !== 'string') throw new Error('Missing pinned ESM generator export');
const { default: generate, astToString } = await import(
  new URL(entry, pathToFileURL(tools.resolve('openapi-typescript/package.json'))).href
);
const started = performance.now();
const redocly = await core.createConfig(
  { rules: { 'operation-operationId-unique': 'error', 'operation-parameters-unique': 'error' } },
  { extends: [] },
);
const nodes = await generate(data, {
  redocly,
  alphabetize: true,
  enum: false,
  immutable: false,
  arrayLength: false,
  defaultNonNullable: false,
  readWriteMarkers: false,
  silent: false,
});
const declarations =
  '/** Generated from rielia.openapi.json by openapi-typescript 7.13.0 / generator TS 5.9.3. Regenerate with pnpm openapi:generate. Do not edit. */\n' +
  astToString(nodes);
if (Buffer.byteLength(declarations) > 2 * 1024 * 1024)
  throw new Error('Generated declaration bound exceeded');
writeFileSync(output, declarations);
process.stdout.write(
  JSON.stringify({
    generator: packageInfo.version,
    compiler: compiler.version,
    bytes: Buffer.byteLength(declarations),
    elapsedMs: performance.now() - started,
    maxRSSKiB: process.resourceUsage().maxRSS,
  }) + '\n',
);
