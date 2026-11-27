import {
  planningTimeZoneSchema,
  planningSettingsSchema,
  sprintDateSchema,
  sprintFieldsSchema,
  projectPlanningSchema,
  plannedSprintSchema,
  sprintSchema,
  sprintPageSchema,
  type PlanningSettings,
  type SprintFields,
  type ProjectPlanning,
  type PlannedSprint,
  type Sprint,
  type SprintPage,
} from './sprint-schemas.js';
export {
  planningTimeZoneSchema,
  planningSettingsSchema,
  sprintDateSchema,
  sprintFieldsSchema,
  configurePlanningInputSchema,
  createSprintInputSchema,
  editSprintInputSchema,
  projectPlanningSchema,
  plannedSprintSchema,
  activeSprintSchema,
  closedSprintSchema,
  sprintSchema,
  sprintPageSchema,
  type PlanningSettings,
  type SprintFields,
  type ProjectPlanning,
  type PlannedSprint,
  type ActiveSprint,
  type ClosedSprint,
  type Sprint,
  type SprintPage,
  type ConfigurePlanningInput,
  type CreateSprintInput,
  type EditSprintInput,
} from './sprint-schemas.js';

export const defaultPointScale = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type SprintPlanningCommand =
  | {
      type: 'configure-planning';
      workspaceId: string;
      projectId: string;
      expectedVersion: number;
      settings: PlanningSettings;
    }
  | {
      type: 'create-sprint';
      workspaceId: string;
      projectId: string;
      expectedProjectVersion: number;
      fields: SprintFields;
    }
  | {
      type: 'edit-sprint';
      workspaceId: string;
      projectId: string;
      sprintId: string;
      expectedVersion: number;
      fields: SprintFields;
    };
export type SprintPlanningResult = ProjectPlanning | Sprint;

export function isPlanningTimeZone(value: unknown): value is string {
  return planningTimeZoneSchema.safeParse(value).success;
}
export function isPlanningSettings(value: unknown): value is PlanningSettings {
  return planningSettingsSchema.safeParse(value).success;
}
export function isSprintDate(value: unknown): value is string {
  return sprintDateSchema.safeParse(value).success;
}
export function isSprintFields(value: unknown): value is SprintFields {
  return sprintFieldsSchema.safeParse(value).success;
}
export function isProjectPlanning(value: unknown): value is ProjectPlanning {
  return projectPlanningSchema.safeParse(value).success;
}
export function isPlannedSprint(value: unknown): value is PlannedSprint {
  return plannedSprintSchema.safeParse(value).success;
}
export function isSprint(value: unknown): value is Sprint {
  return sprintSchema.safeParse(value).success;
}
export function isSprintPage(value: unknown): value is SprintPage {
  return sprintPageSchema.safeParse(value).success;
}
