import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';
import { membershipRoleSchema } from './principal-schemas.js';
import type { KnownFields } from './schema-types.js';
import { pageSchema } from './workspace-schemas.js';

export const taskStatuses = ['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const;
export const taskTypes = ['task', 'bug', 'feature'] as const;
export const taskPriorities = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export const taskStatusSchema = z.enum(taskStatuses);
export const taskTypeSchema = z.enum(taskTypes);
export const taskPrioritySchema = z.enum(taskPriorities);
export const projectVisibilitySchema = z.enum(['workspace', 'private']);
const versionSchema = z.number().int().positive();
const countSchema = z.number().int().nonnegative();
const dateSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)));

export const taskFiltersSchema = z.strictObject({
  status: taskStatusSchema.exactOptional(),
  assignee: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,128}$/)
    .exactOptional(),
  priority: taskPrioritySchema.exactOptional(),
});
export const domainPersonSchema = z.looseObject({
  principalId: z.string(),
  name: z.string(),
  kind: z.enum(['human', 'agent']),
  active: z.boolean(),
});
// G02 deliberately retains broad grant/source combinations, unlike Sprint.
export const domainProvenanceSchema = z.looseObject({
  actorPrincipalId: z.string(),
  executionMode: z.enum(['human', 'delegated', 'autonomous']),
  source: z.enum(['web', 'mcp']),
  grantId: z.string().nullable(),
});
export const domainCapabilitiesSchema = z.looseObject({
  canEdit: z.boolean(),
  canArchive: z.boolean(),
  canRestore: z.boolean(),
});
export const projectCapabilitiesSchema = domainCapabilitiesSchema.extend({
  canManageAccess: z.boolean(),
  canChangeVisibility: z.boolean(),
  canGrantAccess: z.boolean(),
  canRevokeAccess: z.boolean(),
});
const domainRecordSchema = z.looseObject({
  id: z.string(),
  workspaceId: z.string(),
  version: versionSchema,
  archivedAt: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  creator: domainPersonSchema,
  provenance: domainProvenanceSchema,
  capabilities: domainCapabilitiesSchema,
  url: z.string(),
});
function sameCreator(value: z.output<typeof domainRecordSchema>) {
  return value.provenance.actorPrincipalId === value.creator.principalId;
}
export const projectSchema = domainRecordSchema
  .extend({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    visibility: projectVisibilitySchema,
    capabilities: projectCapabilitiesSchema,
  })
  .refine(sameCreator);
export const taskFieldsSchema = z.looseObject({
  title: z.string(),
  description: z.string(),
  type: taskTypeSchema,
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  assigneePrincipalId: z.string().nullable(),
  // Public historical projections only require the date-only format.
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});
const taskRecordSchema = domainRecordSchema.extend({
  ...taskFieldsSchema.shape,
  parentTaskId: z.string().nullable(),
  projectId: z.string(),
  projectKey: z.string(),
  number: versionSchema,
  key: z.string(),
  orderVersion: versionSchema,
  projectArchivedAt: dateSchema.nullable(),
  assignee: domainPersonSchema.nullable(),
});
export const taskSchema = taskRecordSchema.refine(sameCreator);
// Discovery checks original presence and the enumerable Task projection, while
// projectName retains its historical direct-property read.
export const taskDiscoveryItemSchema = z
  .custom<Record<string, unknown>>(
    (value) =>
      !!value && typeof value === 'object' && !Array.isArray(value) && !('description' in value),
  )
  .transform((value) => ({ ...value, projectName: value['projectName'] }))
  .pipe(
    taskRecordSchema
      .omit({ description: true })
      .extend({ projectName: z.string() })
      .refine(sameCreator),
  );
export function domainPageSchema<Item extends z.ZodType>(item: Item) {
  return pageSchema(item).safeExtend({
    capabilities: z.looseObject({
      canCreate: z.boolean(),
      canCreatePrivate: z.boolean().exactOptional(),
    }),
  });
}
export const projectPageSchema = domainPageSchema(projectSchema);
export const taskColumnCountsSchema = z.looseObject({
  backlog: countSchema,
  todo: countSchema,
  in_progress: countSchema,
  done: countSchema,
  canceled: countSchema,
});
export const taskPageSchema = domainPageSchema(taskSchema)
  .safeExtend({
    items: denseArraySchema(taskSchema).refine((items) => items.length <= 100),
    orderVersion: versionSchema,
    nextCursor: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,2048}$/)
      .nullable(),
    columnCounts: taskColumnCountsSchema,
    selectedAssignee: domainPersonSchema.nullable(),
  })
  .refine(
    (value) =>
      value.items.every((row) => row.orderVersion === value.orderVersion) &&
      taskStatuses.reduce((sum, status) => sum + value.columnCounts[status], 0) === value.total,
  );
export const projectAccessMemberSchema = domainPersonSchema.extend({
  role: membershipRoleSchema,
  explicitAccess: z.enum(['active', 'revoked']).nullable(),
  implicitAccess: z.boolean(),
  effectiveAccess: z.boolean(),
  capabilities: z.looseObject({ canGrant: z.boolean(), canRevoke: z.boolean() }),
});
export const projectAccessPageSchema = pageSchema(projectAccessMemberSchema).safeExtend({
  workspaceId: z.string(),
  projectId: z.string(),
  projectVersion: versionSchema,
});
export const projectAccessReviewSchema = z.looseObject({
  project: projectSchema,
  member: projectAccessMemberSchema,
});
export const projectAssigneePageSchema = pageSchema(domainPersonSchema)
  .safeExtend({ workspaceId: z.string(), projectId: z.string() })
  .refine((value) => value.items.every((row) => row.active));

export type ProjectVisibility = z.output<typeof projectVisibilitySchema>;
export type TaskStatus = z.output<typeof taskStatusSchema>;
export type TaskType = z.output<typeof taskTypeSchema>;
export type TaskPriority = z.output<typeof taskPrioritySchema>;
export type TaskFilters = KnownFields<z.output<typeof taskFiltersSchema>>;
export type DomainPerson = KnownFields<z.output<typeof domainPersonSchema>>;
export type DomainProvenance = KnownFields<z.output<typeof domainProvenanceSchema>>;
export type DomainCapabilities = KnownFields<z.output<typeof domainCapabilitiesSchema>>;
export type ProjectCapabilities = KnownFields<z.output<typeof projectCapabilitiesSchema>>;
export type Project = KnownFields<z.output<typeof projectSchema>>;
export type TaskFields = KnownFields<z.output<typeof taskFieldsSchema>>;
export type Task = KnownFields<z.output<typeof taskSchema>>;
export type TaskColumnCounts = KnownFields<z.output<typeof taskColumnCountsSchema>>;
export type TaskPage = KnownFields<z.output<typeof taskPageSchema>>;
export type ProjectAccessMember = KnownFields<z.output<typeof projectAccessMemberSchema>>;
export type ProjectAccessPage = KnownFields<z.output<typeof projectAccessPageSchema>>;
export type ProjectAccessReview = KnownFields<z.output<typeof projectAccessReviewSchema>>;
export type ProjectAssigneePage = KnownFields<z.output<typeof projectAssigneePageSchema>>;
// Preserve the original generic interface's chained predicate narrowing.
export interface DomainPage<T> extends Pick<
  KnownFields<z.output<ReturnType<typeof domainPageSchema>>>,
  'total' | 'nextCursor' | 'capabilities'
> {
  items: z.output<ReturnType<typeof domainPageSchema<z.ZodType<T>>>>['items'];
}
