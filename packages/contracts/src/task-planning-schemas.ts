import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';
import { taskStatusSchema, domainPersonSchema } from './project-task-schemas.js';
import { projectTaskVersionSchema } from './project-task-input-schemas.js';
import { sprintSchema } from './sprint-schemas.js';
import {
  collaborationProvenanceSchema,
  collaborationCursorSchema,
} from './task-collaboration-schemas.js';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import type { KnownFields } from './schema-types.js';

const identifier = discoveryIdentifierSchema;
const version = projectTaskVersionSchema;
const count = z.number().int().nonnegative();
const instant = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  .refine(
    (value) =>
      !value.startsWith('0000-') &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString() === value,
  );
export const estimatePointsSchema = z.number().int().min(0).max(1000).nullable();
// Admission counts own enumerable keys, then the field schema reads properties.
// Five own required fields are not required; ignored extra values stay unread.
const planningSnapshotAdmissionSchema = z
  .unknown()
  .refine(
    (value) =>
      !!value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 5,
  );
export const planningSnapshotSchema = planningSnapshotAdmissionSchema.pipe(
  z.object({
    version,
    status: taskStatusSchema,
    estimatePoints: estimatePointsSchema,
    parentTaskId: identifier.nullable(),
    archivedAt: instant.nullable(),
  }),
);
export const taskPlanningSchema = z
  .object({
    workspaceId: identifier,
    projectId: identifier,
    taskId: identifier,
    taskRevision: version,
    sprintRevision: version,
    snapshot: planningSnapshotSchema,
    currentParticipation: z.object({ id: identifier, sprint: sprintSchema }).nullable(),
    capabilities: z.object({ canEstimate: z.boolean(), canChangeScope: z.boolean() }),
  })
  .refine(
    (value) =>
      value.currentParticipation === null ||
      (value.currentParticipation.sprint.workspaceId === value.workspaceId &&
        value.currentParticipation.sprint.projectId === value.projectId),
  );
export const sprintVisitSchema = z
  .object({
    id: identifier,
    taskId: identifier,
    enteredAt: instant,
    enteredOrdinal: version,
    entry: planningSnapshotSchema,
    current: planningSnapshotSchema,
    start: planningSnapshotSchema.nullable(),
    exitedAt: instant.nullable(),
    exitedOrdinal: version.nullable(),
    exitReason: z.enum(['removed', 'transferred', 'closed']).nullable(),
    exit: planningSnapshotSchema.nullable(),
  })
  .refine((value) =>
    value.exitedAt === null
      ? value.exitedOrdinal === null && value.exitReason === null && value.exit === null
      : value.exitedOrdinal !== null &&
        value.exitedOrdinal > value.enteredOrdinal &&
        value.exitReason !== null &&
        value.exit !== null,
  );
export const sprintTotalsSchema = z.object({
  done: count,
  canceled: count,
  pending: count,
  donePoints: count,
  canceledPoints: count,
  pendingPoints: count,
  unestimated: count,
  children: count,
  archived: count,
});
const pageFields = {
  workspaceId: identifier,
  projectId: identifier,
  taskRevision: version,
  sprintRevision: version,
  total: count,
  nextCursor: collaborationCursorSchema.nullable(),
};
export const sprintScopePageSchema = z
  .object({
    ...pageFields,
    sprintId: identifier,
    sprintVersion: version,
    items: denseArraySchema(sprintVisitSchema).refine((items) => items.length <= 100),
    currentTotals: sprintTotalsSchema,
    startTotals: sprintTotalsSchema,
    removed: count,
    transferred: count.optional(),
    closingTotals: sprintTotalsSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.total >= value.items.length &&
      new Set(value.items.map((item) => item.id)).size === value.items.length,
  );
const historyKinds = [
  'entry',
  'exit',
  'task-change',
  'metadata',
  'start',
  'estimate',
  'close',
  'carryover',
] as const;
const historyActions = [
  'close-sprint',
  'create-sprint',
  'edit-sprint',
  'start-sprint',
  'set-task-sprint',
  'estimate-task',
  'edit-task',
  'move-task',
  'set-task-parent',
  'archive-task',
  'restore-task',
] as const;
const historyCommonSchema = z.object({
  id: identifier,
  sprintId: identifier.nullable(),
  taskId: identifier.nullable(),
  participationId: identifier.nullable(),
  ordinal: version,
  kind: z.enum([...historyKinds, 'outcome']),
  action: z.string().refine((value) => historyActions.some((action) => action === value)),
  occurredAt: instant,
  before: planningSnapshotSchema.nullable(),
  after: planningSnapshotSchema.nullable(),
  actor: domainPersonSchema,
  provenance: collaborationProvenanceSchema,
});
const outcomeHistorySchema = historyCommonSchema
  .extend({
    kind: z.literal('outcome'),
    closureId: identifier,
    disposition: z.enum(['done', 'canceled', 'backlog', 'carried']),
    targetSprintId: identifier.nullable(),
    targetParticipationId: identifier.nullable(),
  })
  .refine((value) =>
    value.disposition === 'carried'
      ? value.targetSprintId !== null && value.targetParticipationId !== null
      : value.targetSprintId === null && value.targetParticipationId === null,
  );
// Non-outcome records deliberately never read the four outcome-only slots.
export const planningHistoryItemSchema = z
  .discriminatedUnion('kind', [
    historyCommonSchema.extend({ kind: z.enum(historyKinds) }),
    outcomeHistorySchema,
  ])
  .refine((value) => value.provenance.actorPrincipalId === value.actor.principalId);
export const planningHistoryPageSchema = z
  .object({
    ...pageFields,
    sprintId: identifier.nullable(),
    taskId: identifier.nullable(),
    items: denseArraySchema(planningHistoryItemSchema).refine((items) => items.length <= 100),
  })
  .refine(
    (value) =>
      (value.sprintId === null) !== (value.taskId === null) &&
      value.total >= value.items.length &&
      value.items.every(
        (item) =>
          (value.sprintId === null || item.sprintId === value.sprintId) &&
          (value.taskId === null || item.taskId === value.taskId),
      ) &&
      new Set(value.items.map((item) => item.id)).size === value.items.length,
  );
export const sprintTransitionResultSchema = z
  .object({
    operation: z.object({
      activityId: identifier,
      type: z.enum(['start-sprint', 'set-task-sprint']),
      sprintId: identifier.nullable(),
      enteredVisitId: identifier.nullable(),
      exitedVisitId: identifier.nullable(),
    }),
    current: z.union([sprintSchema, taskPlanningSchema]),
  })
  .refine((value) => {
    const operation = value.operation;
    if (operation.type === 'start-sprint') {
      const current = sprintSchema.safeParse(value.current);
      return (
        current.success &&
        (current.data.state === 'active' || current.data.state === 'closed') &&
        operation.sprintId === current.data.id &&
        operation.enteredVisitId === null &&
        operation.exitedVisitId === null
      );
    }
    return (
      taskPlanningSchema.safeParse(value.current).success &&
      operation.sprintId !== null &&
      (operation.enteredVisitId !== null || operation.exitedVisitId !== null)
    );
  });

export type PlanningSnapshot = KnownFields<z.output<typeof planningSnapshotSchema>>;
export type TaskPlanning = KnownFields<z.output<typeof taskPlanningSchema>>;
export type SprintVisit = KnownFields<z.output<typeof sprintVisitSchema>>;
export type SprintTotals = KnownFields<z.output<typeof sprintTotalsSchema>>;
type ScopeOutput = z.output<typeof sprintScopePageSchema>;
// Type-level legacy compatibility only: originals accept explicit undefined.
type ScopeOptionalCompatibility = {
  [Key in 'transferred' | 'closingTotals']?: Exclude<ScopeOutput[Key], undefined>;
};
export type SprintScopePage = KnownFields<
  Omit<ScopeOutput, keyof ScopeOptionalCompatibility> & ScopeOptionalCompatibility
>;
// Non-outcome originals ignore these typed slots, even malformed values/getters.
// Parse data strips them. Later G06 correction owns this disclosed unsoundness.
type HistoryOutcomeOptionalCompatibility = Partial<
  Pick<
    z.output<typeof outcomeHistorySchema>,
    'closureId' | 'disposition' | 'targetSprintId' | 'targetParticipationId'
  >
>;
export type PlanningHistoryItem = KnownFields<
  z.output<typeof historyCommonSchema> & HistoryOutcomeOptionalCompatibility
>;
export type PlanningHistoryPage = KnownFields<
  Omit<z.output<typeof planningHistoryPageSchema>, 'items'> & { items: PlanningHistoryItem[] }
>;
export type SprintTransitionResult = KnownFields<z.output<typeof sprintTransitionResultSchema>>;
