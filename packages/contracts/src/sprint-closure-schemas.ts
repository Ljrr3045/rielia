import { z } from 'zod';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import { projectTaskVersionSchema } from './project-task-input-schemas.js';
import { collaborationCursorSchema } from './task-collaboration-schemas.js';
import { closedSprintSchema, sprintSchema } from './sprint-schemas.js';
import { planningSnapshotSchema, sprintTotalsSchema } from './task-planning-schemas.js';
import type { KnownFields } from './schema-types.js';

const identifier = discoveryIdentifierSchema;
const version = projectTaskVersionSchema;
const count = sprintTotalsSchema.shape.done;
const instant = closedSprintSchema.shape.closedAt;
const previewHash = z.string().regex(/^[0-9a-f]{64}$/);
const scope = { workspaceId: identifier, projectId: identifier, sprintId: identifier };

// Read actual indices, never executable traversal methods supplied by an input array.
function closingItemsSchema<Item extends z.ZodType>(item: Item) {
  return z
    .custom<unknown[]>((value) => {
      if (!Array.isArray(value) || value.length > 100) return false;
      for (let index = 0; index < value.length; index++) if (!(index in value)) return false;
      return true;
    })
    .pipe(z.array(item));
}

/** Null is unselected; backlog preserves Task state without Sprint membership. */
export const sprintCloseDestinationSchema = identifier.nullable();
export const closingDispositionSchema = z.enum(['done', 'canceled', 'backlog', 'carried']);
export const closingConsequenceSchema = z
  .object({
    participationId: identifier,
    taskId: identifier,
    snapshot: planningSnapshotSchema,
    disposition: z.enum([...closingDispositionSchema.options, 'pending']),
  })
  .refine(
    (value) =>
      // Snapshot admission can produce a continuable issue; never dereference it first.
      planningSnapshotSchema.safeParse(value.snapshot).success &&
      (value.snapshot.status === 'done'
        ? value.disposition === 'done'
        : value.snapshot.status === 'canceled'
          ? value.disposition === 'canceled'
          : ['pending', 'backlog', 'carried'].includes(value.disposition)),
  );

// Tolerant public binding, also embedded in preview. HTTP bodies are separately strict.
export const closeSprintBindingSchema = z
  .object({
    expectedVersion: version,
    expectedProjectVersion: version,
    expectedTaskRevision: version,
    expectedSprintRevision: version,
    expectedTargetVersion: version.nullable(),
    destination: sprintCloseDestinationSchema,
    previewSchema: z.literal(1),
    previewHash,
  })
  .refine((value) =>
    value.destination === null || value.destination === 'backlog'
      ? value.expectedTargetVersion === null
      : value.expectedTargetVersion !== null,
  );

export const sprintClosePreviewSchema = closeSprintBindingSchema
  .safeExtend({
    ...scope,
    total: count,
    pendingParticipants: count,
    totals: sprintTotalsSchema,
    items: closingItemsSchema(closingConsequenceSchema),
    nextCursor: collaborationCursorSchema.nullable(),
    canClose: z.boolean(),
  })
  .refine(
    (value) =>
      value.pendingParticipants <= value.total &&
      value.items.length <= value.total &&
      new Set(value.items.map((item) => item.participationId)).size === value.items.length &&
      value.canClose === (value.pendingParticipants === 0 || value.destination !== null) &&
      value.items.every(
        (item) =>
          item.disposition === 'done' ||
          item.disposition === 'canceled' ||
          item.disposition ===
            (value.destination === null
              ? 'pending'
              : value.destination === 'backlog'
                ? 'backlog'
                : 'carried'),
      ),
  );

export const sprintClosureSchema = z
  .object({
    id: identifier,
    ...scope,
    destination: sprintCloseDestinationSchema,
    sourceOrdinal: version,
    targetOrdinal: version.nullable(),
    closedAt: instant,
    previewSchema: z.literal(1),
    previewHash,
    activityId: identifier,
    total: count,
    pendingParticipants: count,
    totals: sprintTotalsSchema,
  })
  .refine(
    (value) =>
      (value.destination === null || value.destination === 'backlog'
        ? value.targetOrdinal === null
        : value.targetOrdinal !== null) &&
      value.pendingParticipants <= value.total &&
      (value.pendingParticipants === 0 || value.destination !== null),
  );

export const sprintClosingOutcomeSchema = closingConsequenceSchema
  .safeExtend({
    id: identifier,
    closureId: identifier,
    disposition: closingDispositionSchema,
    targetSprintId: identifier.nullable(),
    targetParticipationId: identifier.nullable(),
  })
  .refine((value) =>
    value.disposition === 'carried'
      ? value.targetSprintId !== null && value.targetParticipationId !== null
      : value.targetSprintId === null && value.targetParticipationId === null,
  );

export const sprintClosingOutcomePageSchema = z
  .object({
    ...scope,
    closureId: identifier,
    total: count,
    items: closingItemsSchema(sprintClosingOutcomeSchema),
    nextCursor: collaborationCursorSchema.nullable(),
  })
  .refine(
    (value) =>
      value.items.length <= value.total &&
      value.items.every(
        (item) => item.closureId === value.closureId && item.targetSprintId !== value.sprintId,
      ) &&
      new Set(value.items.map((item) => item.id)).size === value.items.length &&
      new Set(value.items.map((item) => item.participationId)).size === value.items.length,
  );

export const sprintCloseResultSchema = z
  .object({
    operation: z.object({
      type: z.literal('close-sprint'),
      activityId: identifier,
      closureId: identifier,
      sprintId: identifier,
    }),
    closure: sprintClosureSchema,
    current: sprintSchema,
  })
  .refine((value) => {
    const { operation, closure, current } = value;
    return (
      operation.closureId === closure.id &&
      operation.activityId === closure.activityId &&
      operation.sprintId === closure.sprintId &&
      current.id === closure.sprintId &&
      current.workspaceId === closure.workspaceId &&
      current.projectId === closure.projectId &&
      current.state === 'closed' &&
      current.closedAt === closure.closedAt &&
      current.version === closure.sourceOrdinal
    );
  });

export type SprintCloseDestination = z.output<typeof sprintCloseDestinationSchema>;
export type ClosingDisposition = z.output<typeof closingDispositionSchema>;
export type ClosingConsequence = KnownFields<z.output<typeof closingConsequenceSchema>>;
export type CloseSprintInput = KnownFields<z.output<typeof closeSprintBindingSchema>>;
export type SprintClosePreview = KnownFields<z.output<typeof sprintClosePreviewSchema>>;
export type SprintClosure = KnownFields<z.output<typeof sprintClosureSchema>>;
export type SprintClosingOutcome = KnownFields<z.output<typeof sprintClosingOutcomeSchema>>;
export type SprintClosingOutcomePage = KnownFields<z.output<typeof sprintClosingOutcomePageSchema>>;
export type SprintCloseResult = KnownFields<z.output<typeof sprintCloseResultSchema>>;
