import { z } from 'zod';
import {
  projectVisibilitySchema,
  taskFiltersSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskTypeSchema,
} from './project-task-schemas.js';

const identifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const projectTaskVersionSchema = z.number().int().positive();
function requiredText(limit: number) {
  return z
    .string()
    .refine((value) => value.length <= limit && !!value.trim() && !/[\r\n\t\0]/.test(value))
    .transform((value) => value.trim());
}
export const projectNameInputSchema = requiredText(200);
export const taskTitleInputSchema = requiredText(300);
export const projectTaskDescriptionInputSchema = z
  .string()
  .refine((value) => value.length <= 20000 && !value.includes('\0'));
export const taskDueDateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    if (value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });
export const createProjectInputSchema = z.strictObject({
  name: projectNameInputSchema,
  key: z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/),
  description: projectTaskDescriptionInputSchema.nullish().transform((value) => value ?? ''),
  visibility: projectVisibilitySchema.exactOptional(),
});
export const projectTaskVersionInputSchema = z.strictObject({
  expectedVersion: projectTaskVersionSchema,
});
export const editProjectInputSchema = projectTaskVersionInputSchema.extend({
  name: projectNameInputSchema,
  description: projectTaskDescriptionInputSchema,
});
export const changeProjectVisibilityInputSchema = projectTaskVersionInputSchema.extend({
  visibility: projectVisibilitySchema,
});
export const changeProjectAccessInputSchema = projectTaskVersionInputSchema.extend({
  state: z.enum(['active', 'revoked']),
});
export const createTaskFieldsInputSchema = z.strictObject({
  title: taskTitleInputSchema,
  description: projectTaskDescriptionInputSchema.nullish().transform((value) => value ?? ''),
  type: taskTypeSchema.default('task'),
  priority: taskPrioritySchema.default('none'),
  status: taskStatusSchema.default('backlog'),
  assigneePrincipalId: identifierSchema.nullish().transform((value) => value ?? null),
  dueDate: taskDueDateInputSchema.nullish().transform((value) => value ?? null),
});
export const editTaskFieldsInputSchema = z.strictObject({
  title: taskTitleInputSchema.exactOptional(),
  description: projectTaskDescriptionInputSchema.exactOptional(),
  type: taskTypeSchema.exactOptional(),
  priority: taskPrioritySchema.exactOptional(),
  status: taskStatusSchema.exactOptional(),
  // Presence is retained: explicit undefined clears; omission does not edit.
  assigneePrincipalId: identifierSchema.nullish(),
  dueDate: taskDueDateInputSchema.nullish(),
});
export const taskProperties = Object.keys(createTaskFieldsInputSchema.shape);
export const createTaskInputSchema = createTaskFieldsInputSchema
  .extend({
    parentTaskId: identifierSchema.optional(),
    expectedParentVersion: projectTaskVersionSchema.exactOptional(),
  })
  .refine((value) =>
    value.parentTaskId === undefined
      ? !('expectedParentVersion' in value)
      : value.expectedParentVersion !== undefined,
  );
export const editTaskInputSchema = editTaskFieldsInputSchema
  .extend({
    expectedVersion: projectTaskVersionSchema,
    acknowledgedChildrenVersion: projectTaskVersionSchema.exactOptional(),
  })
  .refine((value) => taskProperties.some((key) => key in value));
export const moveTaskInputSchema = projectTaskVersionInputSchema.extend({
  expectedOrderVersion: projectTaskVersionSchema,
  status: taskStatusSchema,
  beforeTaskId: identifierSchema.nullable(),
  acknowledgedChildrenVersion: projectTaskVersionSchema.exactOptional(),
});
const viewSchema = z.enum(['active', 'archived']);
export const projectListQuerySchema = z.strictObject({
  view: viewSchema.optional(),
  cursor: identifierSchema.optional(),
});
export const projectMemberPageQuerySchema = z.strictObject({ cursor: identifierSchema.optional() });
export const taskListQuerySchema = taskFiltersSchema.extend({
  view: viewSchema.optional(),
  cursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,2048}$/)
    .optional(),
});

export type CreateProjectInput = z.input<typeof createProjectInputSchema>;
export type EditProjectInput = z.input<typeof editProjectInputSchema>;
export type ProjectTaskVersionInput = z.input<typeof projectTaskVersionInputSchema>;
export type ChangeProjectVisibilityInput = z.input<typeof changeProjectVisibilityInputSchema>;
export type ChangeProjectAccessInput = z.input<typeof changeProjectAccessInputSchema>;
export type CreateTaskInput = z.input<typeof createTaskInputSchema>;
export type EditTaskInput = z.input<typeof editTaskInputSchema>;
export type MoveTaskInput = z.input<typeof moveTaskInputSchema>;
