import { z } from 'zod';
import {
  admissionBindings,
  checkBindings,
  looseCatchalls,
  transformBindings,
} from './schema-bindings.js';
import { applyStructuralRelation } from './structural-relations.js';
import { wireSchemas } from './wire-schemas.js';

type Schema = z.core.$ZodType;
type Json = z.core.JSONSchema.BaseSchema;
type Row = { id: string; source: string };
type View = Row & { schema: Schema; maxItems?: number; closed?: boolean };

function schema(value: unknown): value is Schema {
  return typeof value === 'object' && value !== null && '_zod' in value;
}
function definition(value: Schema): Record<string, unknown> {
  return value._zod.def as unknown as Record<string, unknown>;
}
/** Version-bound metadata navigation, never interpretation of untrusted wire data. */
export function resolveBinding(path: string): unknown {
  let value: unknown = wireSchemas;
  for (const key of path.split('/')) {
    if (typeof value !== 'object' || value === null)
      throw new Error(`Missing schema binding: ${path}`);
    value = schema(value)
      ? key === 'parent'
        ? value._zod.parent
        : definition(value)[key]
      : (value as Record<string, unknown>)[key];
  }
  if (value === undefined) throw new Error(`Missing schema binding: ${path}`);
  return value;
}
function boundSchema(path: string): Schema {
  const value = resolveBinding(path);
  if (!schema(value)) throw new Error(`Expected schema binding: ${path}`);
  return value;
}

/** A fresh export owner per generation. No Zod global metadata/registry mutation. */
export function createSchemaExporter() {
  const checks = new Map<unknown, Row>();
  for (const row of checkBindings) {
    const check = resolveBinding(row.path);
    if (!schema(check) || definition(check)['check'] !== 'custom')
      throw new Error(`Expected custom check: ${row.path}`);
    checks.set(check, row);
  }
  const views = new Map<Schema, View>();
  for (const row of admissionBindings) {
    views.set(boundSchema(row.path), { ...row, schema: boundSchema(row.target) });
  }
  const transforms = new Map(transformBindings.map((row) => [boundSchema(row.path), row.id]));
  const catchalls = new Set(looseCatchalls.map(boundSchema));

  const supportedTypes = new Set([
    'array',
    'boolean',
    'custom',
    'default',
    'enum',
    'literal',
    'never',
    'null',
    'nullable',
    'number',
    'object',
    'optional',
    'pipe',
    'string',
    'transform',
    'union',
    'unknown',
  ]);
  function verify(value: Schema) {
    const def = definition(value);
    if (value._zod.toJSONSchema !== undefined)
      throw new Error('Unregistered schema export override');
    for (const check of (def['checks'] ?? []) as Schema[]) {
      if (definition(check)['check'] === 'custom' && !checks.has(check))
        throw new Error('Unregistered nested runtime refinement');
    }
    if (def['type'] === 'any') throw new Error('Any structural schema is prohibited');
    if (!supportedTypes.has(String(def['type'])))
      throw new Error(`Unsupported schema export type: ${String(def['type'])}`);
    if (def['type'] === 'custom' && !views.has(value))
      throw new Error('Unregistered custom admission');
    if (def['type'] === 'unknown' && !views.has(value) && !catchalls.has(value))
      throw new Error('Unregistered unknown structural schema');
    if (def['type'] === 'transform' && !transforms.has(value))
      throw new Error('Unregistered normalization');
  }
  function inspect(root: Schema) {
    const seen = new Set<Schema>();
    function visit(value: Schema) {
      if (seen.has(value)) return;
      seen.add(value);
      verify(value);
      const def = definition(value);
      for (const [key, child] of Object.entries(def)) {
        if (key === 'checks') continue;
        if (schema(child)) visit(child);
        else if (Array.isArray(child)) child.filter(schema).forEach(visit);
        else if (key === 'shape') Object.values(child as Record<string, Schema>).forEach(visit);
      }
      if (value._zod.parent) visit(value._zod.parent);
    }
    visit(root);
  }

  function convert(value: Schema): Json {
    inspect(value);
    const result = z.toJSONSchema(value, {
      io: 'input',
      target: 'draft-2020-12',
      cycles: 'throw',
      reused: 'inline',
      metadata: z.registry(),
      unrepresentable(ctx) {
        const view = views.get(ctx.zodSchema);
        if (!view) throw new Error(`Unsupported schema export: ${ctx.message}`);
        return convertedView(view);
      },
      override(ctx) {
        verify(ctx.zodSchema);
        const view = views.get(ctx.zodSchema);
        if (view && definition(ctx.zodSchema)['type'] === 'unknown')
          Object.assign(ctx.jsonSchema, convertedView(view));
        const ids = ((definition(ctx.zodSchema)['checks'] ?? []) as Schema[])
          .map((check) => checks.get(check))
          .filter((row) => row !== undefined);
        for (const check of (definition(ctx.zodSchema)['checks'] ?? []) as Schema[]) {
          const row = checks.get(check);
          if (row)
            applyStructuralRelation(row.id, ctx.jsonSchema, definition(check)['fn'], convert);
        }
        if (ids.length)
          ctx.jsonSchema['x-rielia-runtime-semantics'] = ids.map((row) => ({
            id: row.id,
            source: row.source,
          }));
      },
    });
    delete result.$schema;
    return result;
  }
  function convertedView(view: View): Json {
    const json = convert(view.schema);
    if (view.maxItems !== undefined) json.maxItems = view.maxItems;
    if (view.closed) json.additionalProperties = false;
    if (view.id === 'A013') json.not = { required: ['description'] };
    json['x-rielia-admission'] = { id: view.id, source: view.source };
    return json;
  }
  return { convert, inspect };
}
