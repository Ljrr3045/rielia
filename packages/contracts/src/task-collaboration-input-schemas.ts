import { z } from 'zod';
import { projectTaskVersionInputSchema } from './project-task-input-schemas.js';
import { taskFiltersSchema } from './project-task-schemas.js';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import { collaborationCursorSchema } from './task-collaboration-schemas.js';
import type { KnownFields } from './schema-types.js';

export const collaborationActionSchema = z.enum([
  'set-task-parent',
  'add-checklist-item',
  'edit-checklist-item',
  'move-checklist-item',
  'remove-checklist-item',
  'add-comment',
  'edit-comment',
]);
export const checklistTextInputSchema = z
  .string()
  .refine((value) => value.length <= 500 && !!value.trim() && !/[\r\n\t\0]/.test(value))
  .transform((value) => value.trim());
export const commentTextInputSchema = z
  .string()
  .refine((value) => value.length <= 10000 && !value.includes('\0'));
export const commentBodyInputSchema = commentTextInputSchema.refine((value) => !!value.trim());
export const setTaskParentInputSchema = projectTaskVersionInputSchema
  .extend({
    parentTaskId: discoveryIdentifierSchema.nullable(),
    expectedParentVersion: projectTaskVersionInputSchema.shape.expectedVersion.exactOptional(),
  })
  .refine((value) =>
    value.parentTaskId === null
      ? !('expectedParentVersion' in value)
      : value.expectedParentVersion !== undefined,
  );
export const addChecklistItemInputSchema = projectTaskVersionInputSchema.extend({
  text: checklistTextInputSchema,
  beforeItemId: discoveryIdentifierSchema.nullable(),
});
export const editChecklistItemInputSchema = projectTaskVersionInputSchema
  .extend({
    text: checklistTextInputSchema.exactOptional(),
    completed: z.boolean().exactOptional(),
  })
  .refine((value) => 'text' in value || 'completed' in value);
export const moveChecklistItemInputSchema = projectTaskVersionInputSchema.extend({
  beforeItemId: discoveryIdentifierSchema.nullable(),
});
export const removeChecklistItemInputSchema = projectTaskVersionInputSchema;
export const addCommentInputSchema = projectTaskVersionInputSchema.extend({
  body: commentBodyInputSchema,
});
export const editCommentInputSchema = addCommentInputSchema.extend({
  expectedCommentVersion: projectTaskVersionInputSchema.shape.expectedVersion,
});
export const collaborationInputSchemas = {
  'set-task-parent': setTaskParentInputSchema,
  'add-checklist-item': addChecklistItemInputSchema,
  'edit-checklist-item': editChecklistItemInputSchema,
  'move-checklist-item': moveChecklistItemInputSchema,
  'remove-checklist-item': removeChecklistItemInputSchema,
  'add-comment': addCommentInputSchema,
  'edit-comment': editCommentInputSchema,
};
const target = {
  workspaceId: discoveryIdentifierSchema,
  projectId: discoveryIdentifierSchema,
  taskId: discoveryIdentifierSchema,
};
export const taskCollaborationCommandSchema = z.discriminatedUnion('type', [
  setTaskParentInputSchema.safeExtend({ ...target, type: z.literal('set-task-parent') }),
  addChecklistItemInputSchema.extend({ ...target, type: z.literal('add-checklist-item') }),
  editChecklistItemInputSchema.safeExtend({
    ...target,
    type: z.literal('edit-checklist-item'),
    itemId: discoveryIdentifierSchema,
  }),
  moveChecklistItemInputSchema.extend({
    ...target,
    type: z.literal('move-checklist-item'),
    itemId: discoveryIdentifierSchema,
  }),
  removeChecklistItemInputSchema.extend({
    ...target,
    type: z.literal('remove-checklist-item'),
    itemId: discoveryIdentifierSchema,
  }),
  addCommentInputSchema.extend({ ...target, type: z.literal('add-comment') }),
  editCommentInputSchema.extend({
    ...target,
    type: z.literal('edit-comment'),
    commentId: discoveryIdentifierSchema,
  }),
]);

const archiveViewSchema = z.enum(['active', 'archived']);
const cursorQueryObjectSchema = z.strictObject({ cursor: collaborationCursorSchema.optional() });
// HTTP's legacy fallback admits own enumerable cursor only, but also validates
// inherited view/destination/filter properties before authority. Keep that typed
// record behavior; URLSearchParams at the proxy supplies ordinary own fields.
export const collaborationHttpQuerySchema = z
  .custom<Record<string, unknown>>((value) => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false;
    const query = value as Record<string, unknown>;
    return (
      Object.keys(query).every((key) => key === 'cursor') &&
      (query['view'] === undefined || archiveViewSchema.safeParse(query['view']).success) &&
      (query['cursor'] === undefined ||
        collaborationCursorSchema.safeParse(query['cursor']).success) &&
      (query['destination'] === undefined ||
        discoveryIdentifierSchema.safeParse(query['destination']).success) &&
      taskFiltersSchema.safeParse(
        Object.fromEntries(
          ['status', 'assignee', 'priority']
            .filter((key) => key in query)
            .map((key) => [key, query[key]]),
        ),
      ).success
    );
  })
  .transform((query) => ('cursor' in query ? { cursor: query['cursor'] } : {}))
  .pipe(cursorQueryObjectSchema);

export type CollaborationAction = z.output<typeof collaborationActionSchema>;
export type TaskCollaborationCommand = KnownFields<z.output<typeof taskCollaborationCommandSchema>>;
