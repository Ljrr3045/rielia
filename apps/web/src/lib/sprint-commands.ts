import { isPlanningSettings, isSprintFields } from '@rielia/contracts';
import {
  closeInput,
  type SprintClientCommand,
  type SprintClientState,
  type SprintIntent,
  type SprintResource,
} from './sprint-client-state.ts';

export type SprintIntentResult =
  | 'ready'
  | 'busy'
  | 'unavailable'
  | 'forbidden'
  | 'stale'
  | 'review-required'
  | 'invalid'
  | 'preview-required';
const fresh = <T>(resource: SprintResource<T>): T | null =>
  resource.status === 'ready' && !resource.stale ? resource.data : null;

/** Capture only public versions and capabilities. Backend policy still decides every command. */
export function prepareSprintCommand(
  state: SprintClientState,
  intent: SprintIntent,
): SprintClientCommand | SprintIntentResult {
  if (state.status !== 'ready' || !state.context) return 'unavailable';
  const { workspaceId, projectId } = state.context;
  const scope = { workspaceId, projectId };
  const r = state.resources;
  const planning = fresh(r.planning);
  const sprint = fresh(r.sprint);
  const task = fresh(r.task);
  switch (intent.type) {
    case 'configure-planning':
      if (!planning) return 'stale';
      if (!planning.capabilities.canConfigurePlanning) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        settings: intent.settings,
        expectedVersion: planning.projectVersion,
      };
    case 'create-sprint':
      if (!planning) return 'stale';
      if (!planning.capabilities.canCreateSprint) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        fields: intent.fields,
        expectedProjectVersion: planning.projectVersion,
      };
    case 'edit-sprint':
      if (!sprint) return 'stale';
      if (!sprint.capabilities.canEdit) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        fields: intent.fields,
        sprintId: sprint.id,
        expectedVersion: sprint.version,
      };
    case 'estimate-task':
      if (!task) return 'stale';
      if (!task.capabilities.canEstimate) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        taskId: task.taskId,
        input: { expectedVersion: task.snapshot.version, estimatePoints: intent.estimatePoints },
      };
    case 'set-task-sprint': {
      if (!task) return 'stale';
      if (!task.capabilities.canChangeScope) return 'forbidden';
      const target = intent.targetSprintId === null ? null : fresh(r.target);
      if (intent.targetSprintId !== null && target?.id !== intent.targetSprintId) return 'stale';
      if (target && !target.capabilities.canChangeScope) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        taskId: task.taskId,
        input: {
          expectedTaskVersion: task.snapshot.version,
          expectedCurrentParticipationId: task.currentParticipation?.id ?? null,
          expectedSourceVersion: task.currentParticipation?.sprint.version ?? null,
          targetSprintId: intent.targetSprintId,
          expectedTargetVersion: target?.version ?? null,
        },
      };
    }
    case 'start-sprint': {
      const scopePage = fresh(r.scope);
      if (!planning || !sprint || !scopePage || scopePage.sprintVersion !== sprint.version)
        return 'stale';
      if (!sprint.capabilities.canStart) return 'forbidden';
      return {
        ...scope,
        type: intent.type,
        sprintId: sprint.id,
        input: {
          expectedVersion: sprint.version,
          expectedProjectVersion: planning.projectVersion,
          expectedTaskRevision: scopePage.taskRevision,
        },
      };
    }
    case 'close-sprint': {
      const preview = fresh(r.preview);
      if (!sprint) return 'stale';
      if (!sprint.capabilities.canClose) return 'forbidden';
      if (
        !preview ||
        preview.sprintId !== sprint.id ||
        preview.destination !== state.destination ||
        !preview.canClose
      )
        return 'preview-required';
      if (preview.expectedVersion !== sprint.version) return 'stale';
      return { ...scope, type: intent.type, sprintId: sprint.id, input: closeInput(preview) };
    }
  }
}
export function sprintCommandIntent(command: SprintClientCommand): SprintIntent {
  switch (command.type) {
    case 'configure-planning':
      return { type: command.type, settings: command.settings };
    case 'create-sprint':
    case 'edit-sprint':
      return { type: command.type, fields: command.fields };
    case 'estimate-task':
      return { type: command.type, estimatePoints: command.input.estimatePoints };
    case 'set-task-sprint':
      return { type: command.type, targetSprintId: command.input.targetSprintId };
    default:
      return { type: command.type };
  }
}
/** Editable values can change without replacing the captured concurrency preconditions. */
export function changeSprintCommand(
  command: SprintClientCommand,
  intent: SprintIntent,
  state: SprintClientState,
): SprintClientCommand | null {
  if (command.type === 'configure-planning' && intent.type === command.type)
    return { ...command, settings: intent.settings };
  if (
    (command.type === 'create-sprint' || command.type === 'edit-sprint') &&
    intent.type === command.type &&
    'fields' in intent
  )
    return { ...command, fields: intent.fields };
  if (command.type === 'estimate-task' && intent.type === command.type)
    return { ...command, input: { ...command.input, estimatePoints: intent.estimatePoints } };
  if (command.type === 'set-task-sprint' && intent.type === command.type) {
    const proposed = prepareSprintCommand(state, intent);
    if (typeof proposed === 'string' || proposed.type !== command.type) return null;
    return {
      ...command,
      input: {
        ...command.input,
        targetSprintId: proposed.input.targetSprintId,
        expectedTargetVersion: proposed.input.expectedTargetVersion,
      },
    };
  }
  return null;
}
export function normalizeSprintCommand(command: SprintClientCommand): SprintClientCommand | null {
  if (command.type === 'configure-planning')
    return isPlanningSettings(command.settings) ? command : null;
  if (command.type === 'create-sprint' || command.type === 'edit-sprint') {
    const fields = {
      ...command.fields,
      name: command.fields.name.trim(),
      goal: command.fields.goal.trim(),
    };
    return isSprintFields(fields) ? { ...command, fields } : null;
  }
  if (command.type === 'estimate-task') {
    const value = command.input.estimatePoints;
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 1000)) return null;
  }
  return command;
}
