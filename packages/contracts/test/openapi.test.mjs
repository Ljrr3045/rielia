import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import * as contracts from '../dist/index.js';
import { buildOpenApi, assertLocalReferences, stableJson } from '../dist/openapi/document.js';
import { operations } from '../dist/openapi/operations.js';
import { wireSchemas } from '../dist/openapi/wire-schemas.js';
import { createSchemaExporter, resolveBinding } from '../dist/openapi/schema-export.js';
import { checkBindings, admissionBindings } from '../dist/openapi/schema-bindings.js';
import { applyStructuralRelation } from '../dist/openapi/structural-relations.js';

const document = buildOpenApi();
const entries = Object.entries(wireSchemas);
const op = (id) => operations.find((value) => value.id === id);
const route = (id) => document.paths[op(id).path][op(id).method];

test('bounded document exposes real statuses, same-origin surface distinctions and unmodeled errors', () => {
  assert.equal(document.openapi, '3.1.2');
  assert.equal(Object.values(document.paths).flatMap(Object.values).length, 66);
  assert.equal(operations.filter((value) => value.method === 'post').length, 32);
  assert.equal(Object.keys(document.components.schemas).length, 67);
  assert.equal(route('H01')['x-rielia-surface'], 'api-only');
  assert.equal(route('H55')['x-rielia-surface'], 'api-only');
  assert.equal(
    route('H57').responses['201'].content['application/json'].schema.$ref,
    '#/components/schemas/workspaceSummarySchema',
  );
  assert.equal(route('H03').responses['503'].content, undefined);
  assert.deepEqual(route('H03').security[0], {});
  assert.deepEqual(route('H02').security, []);
  assert.equal(route('H04').parameters[0].schema.pattern, undefined);
  assert.match(route('H05').parameters[0].schema.pattern, /128/);
  assert.equal(route('H50').responses['200'].content['application/json'], undefined);
  assert.equal(
    route('H50').responses['200']['x-rielia-framing'].data.$ref,
    '#/components/schemas/taskInvalidationSchema',
  );
  assert.equal(route('H50').responses['200'].headers['X-Accel-Buffering'].schema.const, 'no');
  assert.equal(route('H56').responses['200'].headers['X-Request-Id'], undefined);
  assert.ok(route('H05').responses['200'].headers['X-Request-Id']);
  assert.equal(route('H03')['x-rielia-query'].unknownRejected, false);
  assert.equal(route('H56')['x-rielia-query'].unknownRejected, true);
  assert.deepEqual(route('H49')['x-rielia-query'].names, [
    'scope',
    'q',
    'view',
    'project',
    'status',
    'assignee',
    'priority',
    'cursor',
  ]);
  assert.ok(route('H24').parameters.find((value) => value.name === 'Idempotency-Key').required);
  assert.match(
    document.components.securitySchemes.LocalHttpWebSession.description,
    /nonproduction/,
  );
  assertLocalReferences(document);
  for (const name of [
    'activityChangeValueSchemas',
    'closedSprintCapabilitiesSchema',
    'sprintTransitionWireSchema',
  ])
    assert.equal(Object.hasOwn(contracts, name), false);
});

test('wire conversion preserves strict requests, tolerant outputs, default optionality and runtime-only UTF16/date semantics', () => {
  const shapes = document.components.schemas;
  assert.equal(shapes.createTaskInputSchema.additionalProperties, false);
  assert.deepEqual(shapes.createTaskInputSchema.required, ['title']);
  assert.equal(shapes.createTaskInputSchema.properties.type.default, 'task');
  assert.equal(shapes.createTaskInputSchema.properties.title.maxLength, undefined);
  assert.equal(shapes.taskCommentsSchema.additionalProperties, undefined);
  assert.deepEqual(shapes.healthResponseSchema.additionalProperties, {});
  const snapshot = shapes.taskPlanningSchema.properties.snapshot;
  assert.equal(snapshot.additionalProperties, false);
  assert.equal(snapshot.required.length, 5);
  const title = '😀'.repeat(151);
  const before = contracts.createTaskInputSchema.safeParse({ title });
  assert.equal(before.success, false);
  createSchemaExporter().convert(contracts.createTaskInputSchema);
  assert.deepEqual(contracts.createTaskInputSchema.safeParse({ title }), before);
  assert.equal(
    contracts.createTaskInputSchema.safeParse({ title: 'valid', dueDate: '2026-02-30' }).success,
    false,
  );
  assert.equal(shapes.workspaceSummarySchema.properties.createdAt.format, undefined);
  assert.equal(
    shapes.identitySessionSchema.anyOf[0].properties.session.properties.expiresAt.format,
    undefined,
  );
  assert.equal(shapes.closeSprintInputSchema.allOf[0].anyOf.length, 3);
  assert.equal(shapes.setTaskSprintInputSchema.allOf[0].anyOf.length, 4);
  assert.ok(shapes.sprintTransitionResultSchema.allOf[0].anyOf.length);
});

test('canonical registry refuses missing, duplicated, private and mismatched schema or operation metadata', () => {
  assert.throws(
    () =>
      buildOpenApi(
        operations,
        entries.filter(([name]) => name !== 'taskSchema'),
      ),
    /Missing operation schema/,
  );
  assert.throws(() => buildOpenApi(operations, [...entries, entries[0]]), /Duplicate schema ID/);
  assert.throws(
    () => buildOpenApi(operations, [['privateReceiptSchema', z.object({ issued: z.boolean() })]]),
    /Noncanonical/,
  );
  assert.throws(
    () => buildOpenApi(operations, [['bad-name', z.string()]]),
    /Invalid public schema ID/,
  );
  assert.throws(
    () => buildOpenApi(operations, [['healthResponseSchema', z.object({ secret: z.string() })]]),
    /Noncanonical/,
  );
  assert.throws(() => buildOpenApi([op('H01'), op('H01')]), /Duplicate operation ID/);
  assert.throws(() => buildOpenApi([op('H01'), { ...op('H01'), id: 'new' }]), /Duplicate route/);
  const { body: _body, ...missingBody } = op('H06');
  assert.equal(typeof _body, 'string');
  assert.throws(() => buildOpenApi([missingBody]), /Missing or unexpected request body/);
  assert.throws(
    () => buildOpenApi([{ ...op('H01'), body: 'createTaskInputSchema' }]),
    /Missing or unexpected request body/,
  );
  assert.throws(
    () => buildOpenApi([{ ...op('H01'), response: 'absentSchema' }]),
    /Missing operation schema/,
  );
});

test('added nested refinements/custom/unknown/any/transforms and unsupported structural types fail closed', () => {
  const exporter = createSchemaExporter();
  for (const [value, message] of [
    [
      z.object({ nested: z.string().refine((value) => value !== 'new') }),
      /Unregistered nested runtime refinement/,
    ],
    [z.object({ nested: z.custom(() => true) }), /Unregistered custom admission/],
    [z.object({ nested: z.unknown() }), /Unregistered unknown structural/],
    [z.object({ nested: z.any() }), /Any structural/],
    [
      z.object({ nested: z.string().transform((value) => value.trim()) }),
      /Unregistered normalization/,
    ],
    [z.object({ nested: z.date() }), /Unsupported schema export/],
    [
      z.object({ nested: z.lazy(() => z.string().refine(() => true)) }),
      /Unsupported schema export type: lazy/,
    ],
  ])
    assert.throws(() => exporter.convert(value), message);
  assert.throws(
    () => exporter.convert(contracts.workspaceNameInputSchema.out),
    /Unsupported schema export/,
  );
  // Fault injection adds a check after preflight, at the real conversion boundary.
  const dynamic = z.object({ nested: z.string() });
  const process = dynamic._zod.processJSONSchema;
  dynamic._zod.processJSONSchema = (ctx, json, params) => {
    dynamic._zod.def.shape.nested = z.string().refine(() => true);
    process(ctx, json, params);
  };
  assert.throws(() => exporter.convert(dynamic), /Unregistered nested runtime refinement/);
  const overridden = z.object({ field: z.string() });
  overridden._zod.toJSONSchema = () => ({});
  assert.throws(() => exporter.convert(overridden), /Unregistered schema export override/);
});

test('stale concrete metadata bindings fail instead of accepting a moved or changed check', () => {
  assert.equal(resolveBinding('createTaskInputSchema/type'), 'object');
  for (const path of ['absent', 'absent/path', 'createTaskInputSchema/type/path'])
    assert.throws(() => resolveBinding(path), /Missing schema binding/);
  const check = checkBindings[0];
  const saved = check.path;
  try {
    check.path = 'healthResponseSchema/type';
    assert.throws(createSchemaExporter, /Expected custom check/);
  } finally {
    check.path = saved;
  }
  const admission = admissionBindings[0];
  const original = admission.target;
  try {
    admission.target = 'healthResponseSchema/type';
    assert.throws(createSchemaExporter, /Expected schema binding/);
  } finally {
    admission.target = original;
  }
});

test('reference closure rejects external, malformed and dangling refs through nested arrays', () => {
  for (const value of [
    { $ref: 'https://example.invalid/secret' },
    { $ref: 1 },
    { nested: [{ $ref: '#/components/schemas/missing' }] },
  ])
    assert.throws(() => assertLocalReferences(value), /External|Dangling/);
  assert.throws(
    () =>
      assertLocalReferences({
        components: { schemas: {} },
        schema: { $ref: '#/components/schemas/missing' },
      }),
    /Dangling/,
  );
  assertLocalReferences({ value: null, literal: 'safe' });
  assert.equal(
    stableJson({ z: [2, { b: true, a: null }], a: 1 }),
    '{\n  "a": 1,\n  "z": [\n    2,\n    {\n      "a": null,\n      "b": true\n    }\n  ]\n}\n',
  );
});

test('invalid finite relation metadata cannot silently export empty or widened structural schemas', () => {
  const convert = createSchemaExporter().convert;
  const apply = (id, json, predicate = () => true) =>
    applyStructuralRelation(id, json, predicate, convert);
  assert.throws(
    () => applyStructuralRelation('R004', {}, undefined, convert),
    /Missing canonical refinement/,
  );
  assert.throws(() => apply('R004', {}), /Missing relation property/);
  const badClose = (destination) => ({
    properties: {
      destination,
      expectedTargetVersion:
        document.components.schemas.closeSprintInputSchema.properties.expectedTargetVersion,
    },
  });
  assert.throws(() => apply('R004', badClose({ type: 'string' })), /Expected canonical nullable/);
  assert.throws(
    () => apply('R004', badClose({ anyOf: [{ type: 'null' }, { type: 'null' }] })),
    /Expected one non-null/,
  );
  assert.throws(
    () => apply('R004', badClose({ anyOf: [false, { type: 'null' }] })),
    /Expected canonical nullable/,
  );
  assert.throws(
    () => apply('R031', { properties: { disposition: { type: 'string' } } }),
    /Missing canonical disposition/,
  );
  assert.throws(() => apply('R019', { properties: {} }), /Unsupported patch partition/);
  assert.throws(() => apply('R019', {}), /Unsupported patch partition/);
  assert.throws(
    () => apply('R019', { properties: { a: {}, b: {} } }, (value) => 'a' in value !== 'b' in value),
    /Unsupported presence refinement/,
  );
  assert.throws(
    () => apply('R019', { properties: { a: {} } }, () => false),
    /Empty presence relation/,
  );
  assert.throws(
    () => apply('R046', {}, (value) => !('startedAt' in value) || !('closedAt' in value)),
    /Unsupported state presence/,
  );
  assert.throws(() => apply('R048', {}, () => true), /Empty state presence/);
  assert.throws(
    () => apply('R030', { properties: { executionMode: {}, source: {} } }),
    /Missing canonical provenance/,
  );
  assert.throws(
    () => apply('R042', { properties: { disposition: {} } }),
    /Missing consequence dispositions/,
  );
  assert.throws(() => apply('R004', {}, () => false), /Empty structural relation/);
  const unchanged = { type: 'string' };
  applyStructuralRelation('runtime-only', unchanged, () => true, convert);
  assert.deepEqual(unchanged, { type: 'string' });
});
