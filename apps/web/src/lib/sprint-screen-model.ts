import type { PlanningHistoryPage, SprintClosePreview, SprintTotals } from '@rielia/contracts';
import type { ProjectTaskState } from './project-task-controller.ts';
import { prepareSprintCommand, sprintCommandIntent } from './sprint-commands.ts';
import { emptySprintResource } from './sprint-client-state.ts';
import type {
  SprintClientCommand,
  SprintClientState,
  SprintResource,
} from './sprint-client-state.ts';

export type SprintScreenParent = Pick<
  ProjectTaskState,
  'session' | 'status' | 'selection' | 'project' | 'task' | 'draftGuard' | 'sprintLocation'
>;
export interface SprintHistoryPort {
  resource: SprintResource<PlanningHistoryPage>;
  onReload: () => void;
  onLoadMore: (() => void) | null;
}
export interface SprintStartReview {
  command: Extract<SprintClientCommand, { type: 'start-sprint' }>;
  name: string;
  goal: string;
  startDate: string;
  endDateExclusive: string;
  timeZone: string;
  totals: SprintTotals;
}
export interface SprintConflictReview {
  draft: SprintClientCommand;
  current: NonNullable<SprintClientState['mutation']['current']>;
  canRebase: boolean;
}
export interface SprintCloseReviewBinding {
  preview: SprintClosePreview;
  reviewedDestination: string | null;
  canConfirm: boolean;
}
/** Navigation interception stays SOL-owned; presentation renders this explicit decision. */
export interface SprintNavigationReviewPort {
  destinationURL: string;
  taskGuard: ProjectTaskState['draftGuard']['kind'];
  sprintGuard: ReturnType<typeof sprintNavigationGuard>;
  onStay: () => void;
  // Pending work cannot be discarded; recovery abandonment must explain unknown server outcome.
  onDiscard: (() => void) | null;
}

export function sprintNavigationGuard(state: SprintClientState) {
  return state.mutation.status === 'pending'
    ? 'pending'
    : state.recovery
      ? 'recovery'
      : state.draft
        ? 'draft'
        : 'none';
}

/** Project only an exact, verified execution lifetime; callers must not mount hidden data. */
export function sprintScreenModel(
  state: SprintClientState,
  parent: SprintScreenParent,
  now = Date.now(),
) {
  const session = parent.session;
  const context = state.context;
  const visible =
    state.status === 'ready' &&
    parent.status === 'ready' &&
    session !== null &&
    Date.parse(session.session.expiresAt) > now &&
    context !== null &&
    Date.parse(context.expiresAt) > now &&
    context.userId === session.user.id &&
    context.sessionId === session.session.id &&
    context.workspaceId === parent.selection.workspaceId &&
    context.projectId === parent.selection.projectId &&
    state.selection.taskId === parent.selection.taskId &&
    state.selection.sprintId === parent.sprintLocation.sprintId &&
    parent.project?.workspaceId === context.workspaceId &&
    parent.project.id === context.projectId;
  const guard = visible ? sprintNavigationGuard(state) : 'none';
  const parentBlocked = parent.draftGuard.kind !== 'none';
  const canBegin = visible && !parentBlocked && guard === 'none';
  const taskMatches =
    parent.task !== null &&
    parent.task.id === parent.selection.taskId &&
    parent.task.workspaceId === context?.workspaceId &&
    parent.task.projectId === context?.projectId &&
    state.selection.taskId === parent.selection.taskId;
  const resources = visible
    ? {
        ...state.resources,
        ...(!taskMatches
          ? {
              task: emptySprintResource<
                NonNullable<SprintClientState['resources']['task']['data']>
              >(),
              taskHistory: emptySprintResource<PlanningHistoryPage>(),
            }
          : {}),
      }
    : null;
  const fresh = <T>(resource: SprintResource<T> | undefined): T | null =>
    resource?.status === 'ready' && !resource.stale ? resource.data : null;
  const planning = fresh(resources?.planning);
  const sprint = fresh(resources?.sprint);
  const task = fresh(resources?.task);
  const scope = fresh(resources?.scope);
  const selectedSprint = sprint?.id === state.selection.sprintId ? sprint : null;
  const selectedTask =
    task?.taskId === parent.selection.taskId &&
    parent.task?.id === task?.taskId &&
    parent.task?.projectId === context?.projectId &&
    state.selection.taskId === task?.taskId
      ? task
      : null;
  const start =
    visible && !parentBlocked ? prepareSprintCommand(state, { type: 'start-sprint' }) : null;
  const startReview: SprintStartReview | null =
    start && typeof start !== 'string' && start.type === 'start-sprint' && selectedSprint && scope
      ? {
          command: start,
          name: selectedSprint.name,
          goal: selectedSprint.goal,
          startDate: selectedSprint.startDate,
          endDateExclusive: selectedSprint.endDateExclusive,
          timeZone: selectedSprint.timeZone,
          totals: scope.currentTotals,
        }
      : null;
  const preview = resources?.preview.data;
  const close = canBegin ? prepareSprintCommand(state, { type: 'close-sprint' }) : null;
  const closeReview: SprintCloseReviewBinding | null =
    preview && preview.sprintId === state.selection.sprintId
      ? {
          preview,
          // This remains bound to the reviewed response even if a raw select changes.
          reviewedDestination: preview.destination,
          canConfirm: !!close && typeof close !== 'string',
        }
      : null;
  const conflictReview: SprintConflictReview | null =
    visible && state.draft && state.mutation.current
      ? {
          draft: state.draft,
          current: state.mutation.current,
          canRebase:
            !parentBlocked &&
            guard === 'draft' &&
            state.draft.type !== 'close-sprint' &&
            typeof prepareSprintCommand(state, sprintCommandIntent(state.draft)) !== 'string',
        }
      : null;
  return {
    visible,
    resources,
    guard,
    parentBlocked,
    planning,
    sprint: selectedSprint,
    task: selectedTask,
    actions: {
      configure: canBegin && planning?.capabilities.canConfigurePlanning === true,
      create: canBegin && planning?.capabilities.canCreateSprint === true,
      edit: canBegin && selectedSprint?.capabilities.canEdit === true,
      start: canBegin && startReview !== null,
      close: canBegin && selectedSprint?.capabilities.canClose === true,
      estimate: canBegin && selectedTask?.capabilities.canEstimate === true,
      participation: canBegin && selectedTask?.capabilities.canChangeScope === true,
    },
    startReview,
    closeReview,
    conflictReview,
    recovery: visible ? state.recovery : null,
    mutation: visible ? state.mutation : null,
    recoveryAction:
      state.status === 'signed-out' || parent.status === 'signed-out'
        ? ('verify-parent' as const)
        : state.status === 'forbidden' || parent.status === 'forbidden'
          ? ('recheck-access' as const)
          : null,
  };
}
