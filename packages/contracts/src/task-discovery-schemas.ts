import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';
import { taskDiscoveryItemSchema, taskFiltersSchema } from './project-task-schemas.js';
import type { KnownFields } from './schema-types.js';

export const discoveryIdentifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const taskSearchSchema = z
  .string()
  .refine(
    (value) =>
      value.length <= 100 &&
      !Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127),
  );
const archiveViewSchema = z.enum(['active', 'archived']);
const discoveryCursorSchema = z.string().regex(/^[A-Za-z0-9_-]{1,2048}$/);
const discoveryQueryObjectSchema = z.strictObject({
  scope: z.enum(['mine', 'search']),
  q: taskSearchSchema,
  view: archiveViewSchema,
  filters: taskFiltersSchema,
  projectId: discoveryIdentifierSchema.exactOptional(),
});
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
// Preserve Object.keys and direct reads at this typed-record boundary, including
// inherited/nonenumerable selectors. Own enumerable extras remain invalid.
export const taskDiscoveryQuerySchema = z
  .custom<Record<string, unknown>>(
    (value) =>
      record(value) &&
      Object.keys(value).every((key) => Object.hasOwn(discoveryQueryObjectSchema.shape, key)) &&
      (value['scope'] !== 'mine' || !record(value['filters']) || !('assignee' in value['filters'])),
  )
  .transform((value) => ({
    scope: value['scope'],
    q: value['q'],
    view: value['view'],
    filters: value['filters'],
    ...('projectId' in value ? { projectId: value['projectId'] } : {}),
  }))
  .pipe(discoveryQueryObjectSchema);

const parameterKeys = ['scope', 'q', 'view', 'project', 'status', 'assignee', 'priority', 'cursor'];
const discoveryParametersRecordSchema = z.custom<Record<string, unknown>>(
  (value) => record(value) && Object.keys(value).every((key) => parameterKeys.includes(key)),
);
function parameterQuery(params: Record<string, unknown>): Record<string, unknown> {
  return {
    scope: params['scope'] ?? 'search',
    q: params['q'] ?? '',
    view: params['view'] ?? 'active',
    filters: Object.fromEntries(
      ['status', 'assignee', 'priority']
        .filter((key) => key in params)
        .map((key) => [key, params[key]]),
    ),
    ...('project' in params ? { projectId: params['project'] } : {}),
  };
}
// cursor is admitted and ignored here; transport admission and opaque decoding
// remain separate boundaries even when this raw parser succeeds.
export const taskDiscoveryParametersSchema = discoveryParametersRecordSchema
  .transform(parameterQuery)
  .pipe(taskDiscoveryQuerySchema);
export const taskDiscoveryHttpQuerySchema = discoveryParametersRecordSchema
  .pipe(
    z.custom<Record<string, unknown>>(
      (params) =>
        record(params) &&
        (params['view'] === undefined || archiveViewSchema.safeParse(params['view']).success) &&
        (params['cursor'] === undefined ||
          discoveryCursorSchema.safeParse(params['cursor']).success),
    ),
  )
  .transform(parameterQuery)
  .pipe(taskDiscoveryQuerySchema);

export const taskDiscoveryPageSchema = z
  .looseObject({
    workspaceId: discoveryIdentifierSchema,
    query: taskDiscoveryQuerySchema,
    principalId: discoveryIdentifierSchema,
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    items: denseArraySchema(taskDiscoveryItemSchema).refine((items) => items.length <= 100),
    total: z.number().int().nonnegative(),
    nextCursor: discoveryCursorSchema.nullable(),
  })
  .refine(
    (value) =>
      value.items.every((row) => row.workspaceId === value.workspaceId) &&
      new Set(value.items.map((row) => row.id)).size === value.items.length &&
      value.total >= value.items.length,
  );

const taskInvalidationObjectSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('reset') }),
  z.strictObject({ type: z.literal('heartbeat') }),
  z.strictObject({ type: z.literal('denied'), reason: z.enum(['signed-out', 'forbidden']) }),
  z.strictObject({
    type: z.literal('invalidate'),
    entity: z.enum(['task', 'project']),
    projectId: discoveryIdentifierSchema,
    id: discoveryIdentifierSchema,
    version: z.number().int().positive(),
  }),
]);
// Every protocol field must be an own enumerable string key. Projecting those
// keys preserves legacy treatment of symbols and unrelated inherited extras.
export const taskInvalidationSchema = z
  .custom<Record<string, unknown>>(
    (value) =>
      record(value) &&
      taskInvalidationObjectSchema.options.some((alternative) => {
        const keys = Object.keys(alternative.shape);
        return (
          value['type'] === alternative.shape.type.value &&
          Object.keys(value).length === keys.length &&
          keys.every((key) => Object.prototype.propertyIsEnumerable.call(value, key))
        );
      }),
  )
  .transform((value) => ({ ...value }))
  .pipe(taskInvalidationObjectSchema);

export type TaskDiscoveryQuery = KnownFields<z.output<typeof taskDiscoveryQuerySchema>>;
export type TaskDiscoveryItem = KnownFields<z.output<typeof taskDiscoveryItemSchema>>;
export type TaskDiscoveryPage = KnownFields<z.output<typeof taskDiscoveryPageSchema>>;
export type TaskInvalidation = KnownFields<z.output<typeof taskInvalidationSchema>>;
export type TaskScope = 'project' | TaskDiscoveryQuery['scope'];
