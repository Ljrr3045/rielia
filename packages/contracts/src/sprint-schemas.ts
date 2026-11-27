import { z } from 'zod';

// Response objects retain unknown wire keys. DTOs expose only schema-defined keys,
// preserving existing union narrowing without a second handwritten DTO definition.
type KnownFields<T> = T extends (infer Item)[]
  ? KnownFields<Item>[]
  : T extends readonly (infer Item)[]
    ? readonly KnownFields<Item>[]
    : T extends object
      ? {
          [
            Key in keyof T as string extends Key ? never : number extends Key ? never : Key
          ]: KnownFields<T[Key]>;
        }
      : T;

const identifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const versionSchema = z.number().int().positive();
const instantSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  .refine(
    (value) =>
      !value.startsWith('0000-') &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString() === value,
  );

export const planningTimeZoneSchema = z.string().refine((value) => {
  if (value.length > 100 || !/^[A-Za-z][A-Za-z0-9_+./-]*$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
});

export const planningSettingsSchema = z.strictObject({
  mode: z.enum(['kanban', 'scrum']),
  timeZone: planningTimeZoneSchema,
  pointScale: z
    .array(z.number().int().min(0).max(1000))
    .min(1)
    .max(32)
    .refine((values) => values.every((value, index) => index === 0 || value > values[index - 1]!)),
});

export const sprintDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    if (value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

export const sprintFieldsSchema = z
  .strictObject({
    name: z
      .string()
      .refine(
        (value) =>
          value.length > 0 &&
          value.length <= 200 &&
          value === value.trim() &&
          !/[\r\n\t\0]/.test(value),
      ),
    goal: z
      .string()
      .refine(
        (value) =>
          value.length > 0 &&
          value.length <= 2000 &&
          value === value.trim() &&
          !value.includes('\0'),
      ),
    startDate: sprintDateSchema,
    endDateExclusive: sprintDateSchema,
  })
  .refine((value) => value.startDate < value.endDateExclusive);

export const configurePlanningInputSchema = planningSettingsSchema.safeExtend({
  expectedVersion: versionSchema,
});
export const createSprintInputSchema = sprintFieldsSchema.safeExtend({
  expectedProjectVersion: versionSchema,
});
export const editSprintInputSchema = sprintFieldsSchema.safeExtend({
  expectedVersion: versionSchema,
});

export const projectPlanningSchema = planningSettingsSchema
  .safeExtend({
    workspaceId: identifierSchema,
    projectId: identifierSchema,
    projectVersion: versionSchema,
    sprintRevision: versionSchema,
    archivedAt: instantSchema.nullable(),
    capabilities: z.looseObject({
      canConfigurePlanning: z.boolean(),
      canCreateSprint: z.boolean(),
    }),
  })
  .loose();

// These schemas own Sprint projections only. The legacy G02 person guard and
// other provenance/history families keep their separately scoped behavior.
const sprintPersonSchema = z.looseObject({
  principalId: z.string(),
  name: z.string(),
  kind: z.enum(['human', 'agent']),
  active: z.boolean(),
});
const sprintProvenanceSchema = z
  .looseObject({
    actorPrincipalId: z.string(),
    executionMode: z.enum(['human', 'delegated', 'autonomous']),
    source: z.enum(['web', 'mcp']),
    grantId: identifierSchema.nullable(),
  })
  .refine((value) =>
    value.executionMode === 'human'
      ? value.source === 'web' && value.grantId === null
      : value.source === 'mcp' && value.grantId !== null,
  );
const sprintCapabilitiesSchema = z.looseObject({
  canEdit: z.boolean(),
  canStart: z.boolean().exactOptional(),
  canChangeScope: z.boolean().exactOptional(),
  canClose: z.boolean().exactOptional(),
});
const sprintRecordSchema = sprintFieldsSchema
  .safeExtend({
    id: identifierSchema,
    workspaceId: identifierSchema,
    projectId: identifierSchema,
    version: versionSchema,
    timeZone: planningTimeZoneSchema,
    startsAt: instantSchema,
    endsAt: instantSchema,
    createdAt: instantSchema,
    updatedAt: instantSchema,
    creator: sprintPersonSchema,
    provenance: sprintProvenanceSchema,
    capabilities: sprintCapabilitiesSchema,
    url: z.string(),
  })
  .loose()
  .refine(
    (value) =>
      value.startsAt < value.endsAt &&
      value.provenance.actorPrincipalId === value.creator.principalId,
  );

export const plannedSprintSchema = sprintRecordSchema
  .safeExtend({ state: z.literal('planned') })
  .refine((value) => !('startedAt' in value) && !('closedAt' in value));
export const activeSprintSchema = sprintRecordSchema
  .safeExtend({ state: z.literal('active'), startedAt: instantSchema })
  .refine((value) => !('closedAt' in value));
/** Private generator view, also used at the original closed refinement stage. */
export const closedSprintCapabilitiesSchema = sprintCapabilitiesSchema.extend({
  canEdit: z.literal(false),
  canStart: z.literal(false),
  canChangeScope: z.literal(false),
  canClose: z.literal(false),
});
export const closedSprintSchema = sprintRecordSchema
  .safeExtend({ state: z.literal('closed'), startedAt: instantSchema, closedAt: instantSchema })
  .refine(
    (value) =>
      value.startedAt <= value.closedAt &&
      closedSprintCapabilitiesSchema.safeParse(value.capabilities).success,
  );
export const sprintSchema = z.discriminatedUnion('state', [
  plannedSprintSchema,
  activeSprintSchema,
  closedSprintSchema,
]);
export const sprintPageSchema = z
  .looseObject({
    workspaceId: identifierSchema,
    projectId: identifierSchema,
    revision: versionSchema,
    projectVersion: versionSchema,
    items: z.array(sprintSchema).max(100),
    total: z.number().int().nonnegative(),
    nextCursor: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,2048}$/)
      .nullable(),
    capabilities: z.looseObject({ canCreate: z.boolean() }),
  })
  .refine(
    (value) =>
      value.items.every(
        (row) => row.workspaceId === value.workspaceId && row.projectId === value.projectId,
      ) &&
      new Set(value.items.map((row) => row.id)).size === value.items.length &&
      value.total >= value.items.length,
  );

export type PlanningSettings = KnownFields<z.output<typeof planningSettingsSchema>>;
export type SprintFields = KnownFields<z.output<typeof sprintFieldsSchema>>;
export type ProjectPlanning = KnownFields<z.output<typeof projectPlanningSchema>>;
export type PlannedSprint = KnownFields<z.output<typeof plannedSprintSchema>>;
export type ActiveSprint = KnownFields<z.output<typeof activeSprintSchema>>;
export type ClosedSprint = KnownFields<z.output<typeof closedSprintSchema>>;
export type Sprint = KnownFields<z.output<typeof sprintSchema>>;
export type SprintPage = KnownFields<z.output<typeof sprintPageSchema>>;
export type ConfigurePlanningInput = z.input<typeof configurePlanningInputSchema>;
export type CreateSprintInput = z.input<typeof createSprintInputSchema>;
export type EditSprintInput = z.input<typeof editSprintInputSchema>;
