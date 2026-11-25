import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';
import {
  domainPersonSchema,
  domainProvenanceSchema,
  taskFieldsSchema,
  taskPrioritySchema,
  taskSchema,
  taskStatusSchema,
  taskTypeSchema,
} from './project-task-schemas.js';
import { projectTaskVersionSchema } from './project-task-input-schemas.js';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import type { KnownFields } from './schema-types.js';

export const collaborationCollections = [
  'relations',
  'parent-candidates',
  'checklist',
  'comments',
  'history',
] as const;
export const collaborationCollectionSchema = z.enum(collaborationCollections);
export const taskActivityActions = [
  'create-task',
  'edit-task',
  'archive-task',
  'restore-task',
  'move-task',
  'set-task-parent',
  'add-checklist-item',
  'edit-checklist-item',
  'move-checklist-item',
  'remove-checklist-item',
  'add-comment',
  'edit-comment',
] as const;
export const taskActivityFields = [
  'title',
  'description',
  'type',
  'priority',
  'status',
  'assigneePrincipalId',
  'dueDate',
  'rank',
  'parentTaskId',
  'checklist',
  'comment',
] as const;
// G04 response schemas validate known fields without reading ignored extras. Their
// parse data strips unknown keys; compatibility guards/transports retain the
// original input object, including extras and property descriptors.
const identifierSchema = discoveryIdentifierSchema;
const versionSchema = projectTaskVersionSchema;
const countSchema = z.number().int().nonnegative();
const dateSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)));
export const collaborationCursorSchema = z.string().regex(/^[A-Za-z0-9_-]{1,2048}$/);
export const taskReferenceSchema = z.object({
  id: identifierSchema,
  key: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  archivedAt: dateSchema.nullable(),
  version: versionSchema,
  url: z.string(),
});
const historyProvenanceFields = domainProvenanceSchema
  .extend({
    executionMode: z.enum(['human', 'delegated', 'autonomous', 'system']),
    source: z.enum(['web', 'mcp', 'internal']),
    grantId: identifierSchema.nullable(),
  })
  .strip();
function validProvenance(value: z.output<typeof historyProvenanceFields>, system = false) {
  return (
    (value.executionMode === 'human' && value.source === 'web' && value.grantId === null) ||
    ((value.executionMode === 'delegated' || value.executionMode === 'autonomous') &&
      value.source === 'mcp' &&
      value.grantId !== null) ||
    (system &&
      value.executionMode === 'system' &&
      value.source === 'internal' &&
      value.grantId === null)
  );
}
export const collaborationProvenanceSchema = domainProvenanceSchema
  .extend({ grantId: identifierSchema.nullable() })
  .strip()
  .refine((value) => validProvenance(value));
export const taskHistoryProvenanceSchema = historyProvenanceFields.refine((value) =>
  validProvenance(value, true),
);
export const closeWarningSchema = z
  .object({ open: versionSchema, archivedOpen: countSchema, childrenVersion: versionSchema })
  .refine((value) => value.archivedOpen <= value.open);

const activityChangeObjectSchema = z
  .strictObject({
    field: z.enum(['status', 'type', 'priority', 'dueDate']),
    before: z.string().nullable(),
    after: z.string().nullable(),
  })
  .refine((value) => {
    const choices =
      value.field === 'status'
        ? taskStatusSchema
        : value.field === 'type'
          ? taskTypeSchema
          : value.field === 'priority'
            ? taskPrioritySchema
            : z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .nullable();
    return choices.safeParse(value.before).success && choices.safeParse(value.after).success;
  });
// This boundary historically checks Object.keys, then reads the three fields
// directly. Preserve inherited/hidden values and unrelated inherited extras.
export const activityChangeSchema = z
  .custom<Record<string, unknown>>(
    (value) =>
      !!value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => ['field', 'before', 'after'].includes(key)),
  )
  .transform((value) => ({ field: value['field'], before: value['before'], after: value['after'] }))
  .pipe(activityChangeObjectSchema);
export const taskCommentSchema = z
  .object({
    id: identifierSchema,
    body: z.string().refine((value) => value.length <= 10000),
    version: versionSchema,
    author: domainPersonSchema,
    provenance: collaborationProvenanceSchema,
    createdAt: dateSchema,
    updatedAt: dateSchema,
    editedAt: dateSchema.nullable(),
    capabilities: z.object({ canEdit: z.boolean() }),
  })
  .refine((value) => value.provenance.actorPrincipalId === value.author.principalId);
export const taskCommentReviewSchema = z.object({
  task: taskSchema,
  comment: taskCommentSchema,
});
export const taskActivitySchema = z
  .object({
    id: identifierSchema,
    action: z.enum(taskActivityActions),
    fields: denseArraySchema(z.enum(taskActivityFields)),
    actor: z.union([
      domainPersonSchema,
      z.object({
        principalId: identifierSchema,
        name: z.string(),
        kind: z.literal('system'),
        active: z.boolean(),
      }),
    ]),
    provenance: taskHistoryProvenanceSchema,
    entityVersion: versionSchema,
    createdAt: dateSchema,
    changes: denseArraySchema(activityChangeSchema).refine((items) => items.length <= 4),
  })
  .refine((value) => value.provenance.actorPrincipalId === value.actor.principalId);
export function collaborationPageSchema<Item extends z.ZodType>(item: Item) {
  return z
    .object({
      workspaceId: identifierSchema,
      projectId: identifierSchema,
      taskId: identifierSchema,
      revision: versionSchema,
      items: denseArraySchema(item).refine((items) => items.length <= 100),
      total: countSchema,
      nextCursor: collaborationCursorSchema.nullable(),
    })
    .refine((value) => value.total >= value.items.length);
}
export const taskRelationsSchema = collaborationPageSchema(taskReferenceSchema)
  .safeExtend({
    parent: taskReferenceSchema.nullable(),
    open: countSchema,
    archivedOpen: countSchema,
    capabilities: z.object({
      canCreate: z.boolean(),
      canLink: z.boolean(),
      canUnlink: z.boolean(),
    }),
  })
  .refine((value) => value.archivedOpen <= value.open && value.open <= value.total);
export const taskParentCandidatesSchema = collaborationPageSchema(taskReferenceSchema).safeExtend({
  capabilities: z.object({ canSelect: z.boolean() }),
});
export const checklistItemSchema = z.object({
  id: identifierSchema,
  text: z.string().refine((value) => value.length <= 500),
  completed: z.boolean(),
  position: versionSchema,
  version: versionSchema,
  moveUpBeforeItemId: identifierSchema.nullable(),
  moveDownBeforeItemId: identifierSchema.nullable(),
  capabilities: z.object({
    canEdit: z.boolean(),
    canRemove: z.boolean(),
    canMoveUp: z.boolean(),
    canMoveDown: z.boolean(),
  }),
});
export const taskChecklistSchema = collaborationPageSchema(checklistItemSchema).safeExtend({
  capabilities: z.object({ canCreate: z.boolean(), canEdit: z.boolean() }),
});
export const taskCommentsSchema = collaborationPageSchema(taskCommentSchema).safeExtend({
  capabilities: z.object({ canCreate: z.boolean() }),
});
export const taskHistorySchema = collaborationPageSchema(taskActivitySchema);
export const taskCollaborationPageSchemas = {
  relations: taskRelationsSchema,
  'parent-candidates': taskParentCandidatesSchema,
  checklist: taskChecklistSchema,
  comments: taskCommentsSchema,
  history: taskHistorySchema,
};
// Client creation drafts are broader than normalized backend create bodies.
export const createTaskFieldsSchema = taskFieldsSchema.extend({
  description: taskFieldsSchema.shape.description.exactOptional(),
  type: taskFieldsSchema.shape.type.exactOptional(),
  priority: taskFieldsSchema.shape.priority.exactOptional(),
  status: taskFieldsSchema.shape.status.exactOptional(),
  assigneePrincipalId: taskFieldsSchema.shape.assigneePrincipalId.exactOptional(),
  dueDate: taskFieldsSchema.shape.dueDate.exactOptional(),
  parentTaskId: z.string().exactOptional(),
  expectedParentVersion: z.number().exactOptional(),
});

export type CollaborationCollection = z.output<typeof collaborationCollectionSchema>;
export type TaskReference = KnownFields<z.output<typeof taskReferenceSchema>>;
export interface CollaborationPage<T> extends Pick<
  KnownFields<z.output<ReturnType<typeof collaborationPageSchema>>>,
  'workspaceId' | 'projectId' | 'taskId' | 'revision' | 'total' | 'nextCursor'
> {
  items: z.output<ReturnType<typeof collaborationPageSchema<z.ZodType<T>>>>['items'];
}
export type TaskRelations = KnownFields<z.output<typeof taskRelationsSchema>>;
export type TaskParentCandidates = KnownFields<z.output<typeof taskParentCandidatesSchema>>;
export type ChecklistItem = KnownFields<z.output<typeof checklistItemSchema>>;
export type TaskChecklist = KnownFields<z.output<typeof taskChecklistSchema>>;
export type TaskComment = KnownFields<z.output<typeof taskCommentSchema>>;
export type TaskComments = KnownFields<z.output<typeof taskCommentsSchema>>;
export type TaskCommentReview = KnownFields<z.output<typeof taskCommentReviewSchema>>;
export type ActivityChange = KnownFields<z.output<typeof activityChangeSchema>>;
export type TaskActivity = KnownFields<z.output<typeof taskActivitySchema>>;
export type TaskHistory = KnownFields<z.output<typeof taskHistorySchema>>;
export type TaskCollaborationPages = {
  [Key in keyof typeof taskCollaborationPageSchemas]: KnownFields<
    z.output<(typeof taskCollaborationPageSchemas)[Key]>
  >;
};
export type CloseWarning = KnownFields<z.output<typeof closeWarningSchema>>;
export type CreateTaskFields = KnownFields<z.output<typeof createTaskFieldsSchema>>;
