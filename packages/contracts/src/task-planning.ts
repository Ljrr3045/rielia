import {
  planningSnapshotSchema,
  taskPlanningSchema,
  sprintTotalsSchema,
  sprintScopePageSchema,
  planningHistoryPageSchema,
  sprintTransitionResultSchema,
  type PlanningSnapshot,
  type TaskPlanning,
  type SprintTotals,
  type SprintScopePage,
  type PlanningHistoryPage,
  type SprintTransitionResult,
} from './task-planning-schemas.js';
export {
  estimatePointsSchema,
  planningSnapshotSchema,
  taskPlanningSchema,
  sprintVisitSchema,
  sprintTotalsSchema,
  sprintScopePageSchema,
  planningHistoryItemSchema,
  planningHistoryPageSchema,
  sprintTransitionResultSchema,
  type PlanningSnapshot,
  type TaskPlanning,
  type SprintVisit,
  type SprintTotals,
  type SprintScopePage,
  type PlanningHistoryItem,
  type PlanningHistoryPage,
  type SprintTransitionResult,
} from './task-planning-schemas.js';
export * from './task-planning-input-schemas.js';

// Predicates narrow originals, never stripped copies; optional-field debt stays.
export function isPlanningSnapshot(value: unknown): value is PlanningSnapshot {
  return planningSnapshotSchema.safeParse(value).success;
}
export function isTaskPlanning(value: unknown): value is TaskPlanning {
  return taskPlanningSchema.safeParse(value).success;
}
export function isSprintTotals(value: unknown): value is SprintTotals {
  return sprintTotalsSchema.safeParse(value).success;
}
export function isSprintScopePage(value: unknown): value is SprintScopePage {
  return sprintScopePageSchema.safeParse(value).success;
}
export function isPlanningHistoryPage(value: unknown): value is PlanningHistoryPage {
  return planningHistoryPageSchema.safeParse(value).success;
}
export function isSprintTransitionResult(value: unknown): value is SprintTransitionResult {
  return sprintTransitionResultSchema.safeParse(value).success;
}
