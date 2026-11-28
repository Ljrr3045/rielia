import type {
  PlanningHistoryPage,
  PlanningSettings,
  ProjectPlanning,
  Sprint,
  SprintClosePreview,
  SprintCloseResult,
  SprintClosure,
  SprintClosingOutcomePage,
  SprintFields,
  SprintPage,
  SprintPlanningCommand,
  SprintPlanningResult,
  SprintScopePage,
  SprintTransitionResult,
  StartSprintInput,
  TaskPlanning,
} from '@rielia/contracts';
import type { RequestInput } from './api-contract-client.ts';

type ProjectPath = '/api/v1/workspaces/{workspaceId}/projects/{projectId}';
type CloseSprintInput = RequestInput<'post', `${ProjectPath}/sprints/{sprintId}/close`>['body'];
type SetTaskSprintInput = RequestInput<'post', `${ProjectPath}/tasks/{taskId}/sprint`>['body'];
// The transport retains G07's checked correlation without changing the public DTO.
type AdmittedClosePreview = SprintClosePreview & CloseSprintInput;

/** An execution lifetime, supplied by the existing authenticated project owner. */
export interface SprintClientContext {
  userId: string;
  sessionId: string;
  expiresAt: string;
  workspaceId: string;
  projectId: string;
}
export interface SprintResource<T> {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'changed';
  data: T | null;
  stale: boolean;
  loadingMore: boolean;
  failure: SprintClientFailure | null;
}
export interface SprintClientFailure {
  status: number;
  code: string | null;
  requestId: string | null;
}
export interface SprintResources {
  planning: SprintResource<ProjectPlanning>;
  sprints: SprintResource<SprintPage>;
  sprint: SprintResource<Sprint>;
  target: SprintResource<Sprint>;
  task: SprintResource<TaskPlanning>;
  scope: SprintResource<SprintScopePage>;
  sprintHistory: SprintResource<PlanningHistoryPage>;
  taskHistory: SprintResource<PlanningHistoryPage>;
  preview: SprintResource<AdmittedClosePreview>;
  closure: SprintResource<SprintClosure>;
  outcomes: SprintResource<SprintClosingOutcomePage>;
}
export type SprintResourceName = keyof SprintResources;
export type SprintCollection =
  'sprints' | 'scope' | 'sprintHistory' | 'taskHistory' | 'preview' | 'outcomes';
export type SprintIntent =
  | { type: 'configure-planning'; settings: PlanningSettings }
  | { type: 'create-sprint'; fields: SprintFields }
  | { type: 'edit-sprint'; fields: SprintFields }
  | { type: 'estimate-task'; estimatePoints: number | null }
  | { type: 'set-task-sprint'; targetSprintId: string | null }
  | { type: 'start-sprint' | 'close-sprint' };
export type SprintClientCommand =
  | SprintPlanningCommand
  | {
      type: 'estimate-task';
      workspaceId: string;
      projectId: string;
      taskId: string;
      input: { expectedVersion: number; estimatePoints: number | null };
    }
  | {
      type: 'set-task-sprint';
      workspaceId: string;
      projectId: string;
      taskId: string;
      input: SetTaskSprintInput;
    }
  | {
      type: 'start-sprint';
      workspaceId: string;
      projectId: string;
      sprintId: string;
      input: StartSprintInput;
    }
  | {
      type: 'close-sprint';
      workspaceId: string;
      projectId: string;
      sprintId: string;
      input: CloseSprintInput;
    };
export type SprintClientResult =
  SprintPlanningResult | TaskPlanning | SprintTransitionResult | SprintCloseResult;
export interface SprintClientState {
  status: 'inactive' | 'verifying' | 'ready' | 'signed-out' | 'forbidden';
  context: SprintClientContext | null;
  selection: { sprintId: string | null; taskId: string | null; targetId: string | null };
  destination: string | null;
  resources: SprintResources;
  draft: SprintClientCommand | null;
  needsReview: boolean;
  mutation: {
    status: 'idle' | 'pending' | 'confirmed' | 'failed' | 'unknown' | 'conflict';
    failure: SprintClientFailure | null;
    current: ProjectPlanning | Sprint | TaskPlanning | null;
    result: SprintClientResult | null;
  };
  recovery: { command: SprintClientCommand; key: string } | null;
}
/** Canonical server resources exist only in the composed Query projection. */
export type SprintControllerState = Omit<SprintClientState, 'resources'>;
export function emptySprintControllerState(): SprintControllerState {
  return {
    status: 'inactive',
    context: null,
    selection: { sprintId: null, taskId: null, targetId: null },
    destination: null,
    draft: null,
    needsReview: false,
    mutation: { status: 'idle', failure: null, current: null, result: null },
    recovery: null,
  };
}
export function emptySprintResource<T>(): SprintResource<T> {
  return { status: 'idle', data: null, stale: false, loadingMore: false, failure: null };
}
export function emptySprintState(): SprintClientState {
  return {
    ...emptySprintControllerState(),
    resources: {
      planning: emptySprintResource(),
      sprints: emptySprintResource(),
      sprint: emptySprintResource(),
      target: emptySprintResource(),
      task: emptySprintResource(),
      scope: emptySprintResource(),
      sprintHistory: emptySprintResource(),
      taskHistory: emptySprintResource(),
      preview: emptySprintResource(),
      closure: emptySprintResource(),
      outcomes: emptySprintResource(),
    },
  };
}
/** No page is spliced across revisions, preview bindings, or immutable closure identities. */
export function sprintPageBinding(page: SprintResources[SprintCollection]['data']): string {
  if (!page) return '';
  if ('previewHash' in page)
    return JSON.stringify([closeInput(page), page.total, page.pendingParticipants, page.totals]);
  if ('closureId' in page) return JSON.stringify([page.closureId, page.total]);
  if ('revision' in page) return JSON.stringify([page.revision, page.projectVersion, page.total]);
  return JSON.stringify([
    page.taskRevision,
    page.sprintRevision,
    page.total,
    ...('sprintVersion' in page
      ? [
          page.sprintVersion,
          page.currentTotals,
          page.startTotals,
          page.closingTotals,
          page.removed,
          page.transferred,
        ]
      : []),
  ]);
}
/** Project only the server-issued binding; never recompute totals or freshness policy. */
export function closeInput(preview: AdmittedClosePreview): CloseSprintInput {
  const {
    expectedVersion,
    expectedProjectVersion,
    expectedTaskRevision,
    expectedSprintRevision,
    expectedTargetVersion,
    destination,
    previewSchema,
    previewHash,
  } = preview;
  // Branch construction keeps the checked pair correlated after projection.
  const target =
    expectedTargetVersion === null
      ? { expectedTargetVersion, destination }
      : { expectedTargetVersion, destination };
  return {
    expectedVersion,
    expectedProjectVersion,
    expectedTaskRevision,
    expectedSprintRevision,
    ...target,
    previewSchema,
    previewHash,
  };
}
/** Immutable snapshots prevent a caller from changing the body retained for retry. */
export function freezeSprintValue<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeSprintValue(item);
    Object.freeze(value);
  }
  return value;
}
