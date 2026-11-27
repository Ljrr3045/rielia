import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { buildOpenApi } from '../../packages/contracts/dist/openapi/document.js';
import * as contracts from '../../packages/contracts/dist/index.js';
import { assertSemanticSources } from './semantic-sources.mjs';
import {
  checkBindings,
  admissionBindings,
  transformBindings,
} from '../../packages/contracts/dist/openapi/schema-bindings.js';
import { resolveBinding } from '../../packages/contracts/dist/openapi/schema-export.js';
import { routesFromSources, assertRouteCoverage } from './route-census.mjs';
import { reconcileArtifacts, outputFiles } from './generate.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const prefix = "app.setGlobalPrefix('api/v1');";
const imports =
  "import {Controller as C, Get as Read, Post, Patch, RequestMapping, Header, HttpCode, Redirect} from '@nestjs/common';";
const source = (text) => [{ path: 'apps/api/src/test.controller.ts', text: imports + text }];
const fixture = (t) => {
  const path = mkdtempSync(join(tmpdir(), 'rielia-openapi-test-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
};
function write(root, name, text) {
  mkdirSync(dirname(join(root, name)), { recursive: true });
  writeFileSync(join(root, name), text);
}

test('AST census discovers aliases and multiline routes and rejects unsupported dynamic/inherited routing', () => {
  const parsed = routesFromSources(
    source(
      "@C('things') class Routes { @Read() @Header('Cache-Control','no-store') read(){} @Post('items/:itemId')\nwrite(){} }",
    ),
    prefix,
  );
  assert.deepEqual(
    parsed.routes.map((value) => [value.method, value.path]),
    [
      ['get', '/api/v1/things'],
      ['post', '/api/v1/things/items/{itemId}'],
    ],
  );
  assert.doesNotThrow(() =>
    routesFromSources(source('this.sprints.get(context, workspace, project, sprint);'), prefix),
  );
  for (const [text, message] of [
    ['@C(variable) class Routes { @Read() read(){} }', /dynamic controller/],
    ["@C('x') class Routes { @Read(variable) read(){} }", /dynamic route/],
    ["@C('x','y') class Routes {}", /dynamic controller/],
    ["@C('x') class Routes { @Patch('x') read(){} }", /Unsupported route decorator/],
    [
      "@C('x') class Routes { @RequestMapping({path:'x'}) read(){} }",
      /Unsupported route decorator/,
    ],
    ['class Routes { @Read() read(){} }', /outside controller/],
    ["@C('x') @C('y') class Routes {}", /Duplicate controller/],
    ["@C('x') class Routes extends Base { @Read() read(){} }", /inherited controller/],
    ['@Unknown() class Routes {}', /Unrecognized decorator/],
    ['@C class Routes {}', /Unsupported decorator/],
    ["@C('x') @Read() class Routes {}", /Unsupported class decorator/],
    ["@C('/x') class Routes { @Read() read(){} }", /Unsupported controller path/],
    ["@C('x/') class Routes { @Read() read(){} }", /Unsupported controller path/],
    ["@C('x//y') class Routes { @Read() read(){} }", /Unsupported controller path/],
    ["@C('x') class Routes { @Read(':id(abc)') read(){} }", /Unsupported controller path/],
    ["@C('x') class Routes { @Read() [method](){} }", /computed route/],
    ["@C('x') class Routes { @Read() @HttpCode(202) read(){} }", /HTTP metadata decorator/],
    ["@C('x') class Routes { @Read() @Redirect('/other') read(){} }", /HTTP metadata decorator/],
    [
      "@C('x') class Routes { @Read() @Header('Cache-Control','public') read(){} }",
      /HTTP metadata decorator/,
    ],
    [
      "@C('x') class Routes { @Read() @Header('Other','no-store') read(){} }",
      /HTTP metadata decorator/,
    ],
    [
      "@C('x') class Routes { @Read() @Header('Cache-Control',value) read(){} }",
      /HTTP metadata decorator/,
    ],
    [
      "@C('x') class Routes { @Read() @Header('Cache-Control') read(){} }",
      /HTTP metadata decorator/,
    ],
    ['const adapter = app.getHttpAdapter();', /raw adapter reference/],
    ['adapter.get(variable, () => {});', /Unregistered raw HTTP route/],
    ['adapter.get(variable, handler);', /Unregistered raw HTTP route/],
    ["app.getHttpAdapter().get('/new', handler);", /Unregistered raw HTTP route/],
    ['app.getHttpAdapter().custom(handler);', /raw adapter reference/],
    ['app.getHttpAdapter().all();', /raw adapter reference/],
    ['class Broken {', /Invalid controller source/],
  ])
    assert.throws(() => routesFromSources(source(text), prefix), message);
  assert.throws(
    () => routesFromSources(source("@Nest.Controller('x') class A {}"), prefix),
    /Unsupported decorator/,
  );
  for (const bootstrap of [
    '',
    "app.setGlobalPrefix('other');",
    "app.setGlobalPrefix('api/v1'); app.setGlobalPrefix('api/v1');",
  ])
    assert.throws(() => routesFromSources([], bootstrap), /Unsupported API prefix/);
  assert.throws(
    () => routesFromSources([], 'app.setGlobalPrefix(variable);'),
    /dynamic API prefix/,
  );
  assert.doesNotThrow(() =>
    routesFromSources(
      [
        {
          path: 'apps/api/src/application.ts',
          text: "app.getHttpAdapter().all('/api/auth/*splat', () => {});",
        },
      ],
      prefix,
    ),
  );
  for (const text of [
    "app.getHttpAdapter().all('/api/auth/*splat', handler);",
    "adapter.all('/api/auth/*splat', () => {});",
    'app.getHttpAdapter().all(variable, () => {});',
    "app.getHttpAdapter().all('/api/auth/*splat', () => {}); app.getHttpAdapter().all('/api/auth/*splat', () => {});",
  ])
    assert.throws(
      () => routesFromSources([{ path: 'apps/api/src/application.ts', text }], prefix),
      /Unregistered raw HTTP route|Duplicate raw auth route/,
    );
});

test('source inventory catches new unregistered controller files and duplicate routes with exact generated exclusion', (t) => {
  const path = fixture(t);
  write(path, 'apps/api/src/application.ts', prefix);
  write(
    path,
    'apps/api/src/example.controller.ts',
    imports + "@C('example') class Example { @Read() read(){} }",
  );
  write(path, 'apps/api/src/generated/ignored.ts', 'not maintained controller source');
  write(path, 'apps/api/src/readme.txt', 'non-TypeScript');
  const expected = [
    { controller: 'apps/api/src/example.controller.ts', method: 'get', path: '/api/v1/example' },
  ];
  assert.equal(assertRouteCoverage(path, expected).length, 1);
  write(path, 'apps/api/src/empty.controller.ts', imports + "@C('empty') class Empty {}");
  assert.throws(
    () => assertRouteCoverage(path, expected),
    /Unregistered, missing or duplicate API controller/,
  );
  rmSync(join(path, 'apps/api/src/empty.controller.ts'));
  write(
    path,
    'apps/api/src/new/new.controller.ts',
    imports + "@C('new') class New { @Read() read(){} }",
  );
  assert.throws(() => assertRouteCoverage(path, expected), /Unregistered, missing or duplicate/);
  rmSync(join(path, 'apps/api/src/new'), { recursive: true });
  write(
    path,
    'apps/api/src/example.controller.ts',
    imports + "@C('example') class Example { @Read() read(){} @Read() duplicate(){} }",
  );
  assert.throws(() => assertRouteCoverage(path, expected), /Unregistered, missing or duplicate/);
  symlinkSync('/absent-openapi-source', join(path, 'apps/api/src/link.ts'));
  assert.throws(() => assertRouteCoverage(path, expected), /symlink rejected/);
});

test('byte drift fails on missing and changed artifacts without check-mode writes; symlinks and incomplete writes reject', (t) => {
  const path = fixture(t);
  const content = ['{"canonical":true}\n', 'export interface generated {}\n'];
  assert.throws(() => reconcileArtifacts(path, content, '--check'), /OpenAPI drift/);
  reconcileArtifacts(path, content, '--write');
  reconcileArtifacts(path, content, '--check');
  writeFileSync(join(path, outputFiles[1]), content[1] + '\n');
  assert.throws(() => reconcileArtifacts(path, content, '--check'), /OpenAPI drift/);
  assert.equal(readFileSync(join(path, outputFiles[1]), 'utf8'), content[1] + '\n');
  assert.throws(() => reconcileArtifacts(path, content, '--other'), /Use --write or --check/);
  assert.throws(
    () => reconcileArtifacts(path, content.slice(0, 1), '--write'),
    /Incomplete generated/,
  );
  rmSync(join(path, 'packages/contracts/generated'), { recursive: true });
  symlinkSync('/absent-openapi-target', join(path, 'packages/contracts/generated'));
  assert.throws(() => reconcileArtifacts(path, content, '--write'), /symlink rejected/);
});

const tools = createRequire(new URL('./tools/package.json', import.meta.url));
const generator = createRequire(tools.resolve('openapi-typescript'));
const core = createRequire(generator.resolve('@redocly/openapi-core'));
const Ajv2020 = core('@redocly/ajv/dist/2020.js').default;
const ajv = new Ajv2020({ strict: false, validateFormats: false, allErrors: true });
const shapes = buildOpenApi().components.schemas;
const validate = (name) => ajv.compile(shapes[name]);
const close = {
  expectedVersion: 1,
  expectedProjectVersion: 1,
  expectedTaskRevision: 1,
  expectedSprintRevision: 1,
  expectedTargetVersion: null,
  destination: null,
  previewSchema: 1,
  previewHash: 'a'.repeat(64),
};

test('real JSON Schema 2020-12 validates canonical finite null/presence/strict-body relations with runtime parity', () => {
  for (const name of [
    'closeSprintInputSchema',
    'setTaskSprintInputSchema',
    'setTaskParentInputSchema',
    'createTaskInputSchema',
    'editTaskInputSchema',
    'editChecklistItemInputSchema',
    'updateWorkspaceMemberInputSchema',
  ])
    assert.equal(typeof validate(name), 'function');
  const closeJson = validate('closeSprintInputSchema');
  for (const destination of [null, 'backlog', 'target'])
    for (const expectedTargetVersion of [null, 1]) {
      const value = { ...close, destination, expectedTargetVersion };
      assert.equal(closeJson(value), contracts.closeSprintInputSchema.safeParse(value).success);
    }
  assert.equal(closeJson({ ...close, actorPrincipalId: 'forged' }), false);
  const participation = validate('setTaskSprintInputSchema');
  for (const current of [null, 'visit'])
    for (const source of [null, 1])
      for (const target of [null, 'target'])
        for (const version of [null, 1]) {
          const value = {
            expectedTaskVersion: 1,
            expectedCurrentParticipationId: current,
            expectedSourceVersion: source,
            targetSprintId: target,
            expectedTargetVersion: version,
          };
          assert.equal(
            participation(value),
            contracts.setTaskSprintInputSchema.safeParse(value).success,
          );
        }
  const parent = validate('setTaskParentInputSchema');
  for (const parentTaskId of [null, 'parent'])
    for (const versioned of [false, true]) {
      const value = {
        expectedVersion: 1,
        parentTaskId,
        ...(versioned ? { expectedParentVersion: 1 } : {}),
      };
      assert.equal(parent(value), contracts.setTaskParentInputSchema.safeParse(value).success);
    }
  const task = validate('createTaskInputSchema');
  for (const parented of [false, true])
    for (const versioned of [false, true]) {
      const value = {
        title: 'Task',
        ...(parented ? { parentTaskId: 'parent' } : {}),
        ...(versioned ? { expectedParentVersion: 1 } : {}),
      };
      assert.equal(task(value), contracts.createTaskInputSchema.safeParse(value).success);
    }
  for (const [name, values] of [
    ['editTaskInputSchema', [{ expectedVersion: 1 }, { expectedVersion: 1, title: 'Edit' }]],
    [
      'editChecklistItemInputSchema',
      [{ expectedVersion: 1 }, { expectedVersion: 1, completed: false }],
    ],
    ['updateWorkspaceMemberInputSchema', [{ version: 1 }, { version: 1, state: 'active' }]],
  ])
    for (const value of values)
      assert.equal(validate(name)(value), contracts[name].safeParse(value).success);
  // These deliberately remain structural subsets, not surrogate runtime validators.
  assert.equal(task({ title: '😀'.repeat(151) }), true);
  assert.equal(
    contracts.createTaskInputSchema.safeParse({ title: '😀'.repeat(151) }).success,
    false,
  );
  assert.equal(task({ title: 'Task', dueDate: '2026-02-30' }), true);
  assert.equal(
    contracts.createTaskInputSchema.safeParse({ title: 'Task', dueDate: '2026-02-30' }).success,
    false,
  );
});

test('JSON Schema carried outcomes preserve both target IDs while runtime cross-record correlations stay separate', () => {
  const value = {
    id: 'visit',
    closureId: 'closure',
    participationId: 'visit',
    taskId: 'task',
    snapshot: {
      version: 1,
      status: 'todo',
      estimatePoints: null,
      parentTaskId: null,
      archivedAt: null,
    },
    disposition: 'backlog',
    targetSprintId: null,
    targetParticipationId: null,
  };
  const component = shapes.sprintClosingOutcomePageSchema.properties.items.items;
  const outcome = ajv.compile(component);
  for (const disposition of ['done', 'canceled', 'backlog', 'carried'])
    for (const targetSprintId of [null, 'target'])
      for (const targetParticipationId of [null, 'target_visit']) {
        const sample = {
          ...value,
          disposition,
          targetSprintId,
          targetParticipationId,
          snapshot: {
            ...value.snapshot,
            status: disposition === 'done' || disposition === 'canceled' ? disposition : 'todo',
          },
        };
        assert.equal(
          outcome(sample),
          contracts.sprintClosingOutcomeSchema.safeParse(sample).success,
        );
      }
  assert.equal(outcome({ ...value, disposition: 'carried', targetSprintId: 'target' }), false);
});

test('isolated generator rejects external refs locally and genuine TS6 consumer rejects incompatible declarations', (t) => {
  const path = fixture(t);
  const input = join(path, 'external.json');
  const output = join(path, 'external.d.ts');
  writeFileSync(
    input,
    JSON.stringify({
      openapi: '3.1.2',
      components: { schemas: { private: { $ref: 'https://example.invalid/private' } } },
    }),
  );
  const external = spawnSync(
    process.execPath,
    [join(root, 'scripts/openapi/type-generator.mjs'), input, output],
    { cwd: root, encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(external.status, 1);
  assert.match(external.stderr, /External references are prohibited/);
  const usage = spawnSync(process.execPath, [join(root, 'scripts/openapi/type-generator.mjs')], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(usage.status, 1);
  assert.match(usage.stderr, /Expected local input/);
  writeFileSync(join(path, 'openapi.d.ts'), readFileSync(join(root, outputFiles[1])));
  writeFileSync(
    join(path, 'invalid.ts'),
    "import type {components} from './openapi.js'; const value: components['schemas']['estimateTaskInputSchema'] = { expectedVersion: 1, estimatePoints: 'wrong' }; void value;\n",
  );
  writeFileSync(
    join(path, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2023',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        types: [],
        skipLibCheck: false,
      },
      files: ['invalid.ts'],
    }),
  );
  const compiler = spawnSync(
    process.execPath,
    [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(path, 'tsconfig.json')],
    { cwd: root, encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(compiler.status, 2);
  assert.match(compiler.stdout, /TS2322/);
  assert.match(compiler.stdout, /string.*number/);
});

test('concrete semantic IDs retain source AST parity and reject stale/private/missing source bindings', (t) => {
  const records = [...checkBindings, ...admissionBindings, ...transformBindings];
  assert.equal(assertSemanticSources(root, records, resolveBinding), 128);
  assert.throws(
    () =>
      assertSemanticSources(
        root,
        [{ ...records[0], source: 'apps/api/src/private.ts:1' }],
        resolveBinding,
      ),
    /Invalid semantic source/,
  );
  assert.throws(
    () =>
      assertSemanticSources(
        root,
        [{ ...records[0], source: records[0].source.replace(/:\d+$/, ':1') }],
        resolveBinding,
      ),
    /Semantic source drift/,
  );
  assert.throws(
    () => assertSemanticSources(root, [records[0]], () => ({})),
    /Missing runtime source function/,
  );
  assert.throws(
    () =>
      assertSemanticSources(
        root,
        [admissionBindings.find((row) => row.id === 'A026')],
        resolveBinding,
      ),
    /Missing canonical snapshot/,
  );
  const path = fixture(t);
  write(path, 'packages/contracts/src/task-collaboration-input-schemas.ts', 'const broken = ;');
  assert.throws(
    () => assertSemanticSources(path, [records[0]], resolveBinding),
    /Invalid semantic source AST/,
  );
});

test('semantic source comparison preserves string, regexp and template whitespace while ignoring formatting and comments', (t) => {
  const path = fixture(t);
  const name = 'packages/contracts/src/fixture-schemas.ts';
  const record = { id: 'Rfixture', path: 'fixture/checks/0', source: `${name}:1` };
  const compare = (source, runtime) => {
    write(path, name, `export const schema = z.string().refine(${source});\n`);
    const check = contracts.taskStatusSchema.refine(runtime)._zod.def.checks.at(-1);
    return assertSemanticSources(path, [record], () => check);
  };
  for (const [source, runtime] of [
    ["value => value === 'a b'", (value) => value === 'ab'],
    ['value => /a +b/.test(value)', (value) => /a+b/.test(value)],
    ['value => /[ a]/.test(value)', (value) => /[a]/.test(value)],
    ['value => value === `a b`', (value) => value === `ab`],
    ["value => `a ${value} b` === 'a value b'", (value) => `a${value}b` === 'a value b'],
    ['value => !value', (value) => +value],
    ['value => value++ > 0 && value > 1', (value) => value-- > 0 && value > 1],
    ['value => value?.length', (value) => value.length],
  ])
    assert.throws(() => compare(source, runtime), /Semantic source drift/);
  assert.equal(
    compare(
      '( value ) => { /* formatting only */ return /a +b/ .test( value ) && value === `a b` ; }',
      (value) => {
        return /a +b/.test(value) && value === `a b`;
      },
    ),
    1,
  );
  write(
    path,
    name,
    "export function predicate(value: string) { /* formatting */ return value === 'a b'; }\n",
  );
  const check = contracts.taskStatusSchema
    .refine(function predicate(value) {
      return value === 'a b';
    })
    ._zod.def.checks.at(-1);
  assert.equal(
    assertSemanticSources(path, [record], () => check),
    1,
  );
  write(path, name, "export function predicate(value: string) { return value === 'ab'; }\n");
  assert.throws(() => assertSemanticSources(path, [record], () => check), /Semantic source drift/);
});
