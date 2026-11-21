import {
  isPlanningSettings,
  isPlanningTimeZone,
  isSprintDate,
  isSprintFields,
  type SprintFields,
} from '@rielia/contracts';
import type { SprintIntentResult } from './sprint-commands.ts';
import type { SprintClientState, SprintIntent } from './sprint-client-state.ts';

export type SprintFormKind =
  'configure-planning' | 'create-sprint' | 'edit-sprint' | 'estimate-task' | 'set-task-sprint';
export type SprintFormError = 'required' | 'invalid' | 'too-long' | 'end-after-start';
export type SprintFormErrors = Partial<
  Record<
    keyof SprintFields | 'mode' | 'timeZone' | 'pointScale' | 'estimate' | 'destination',
    SprintFormError
  >
>;
export type SprintForm = {
  identity: string;
  timeZone: string;
} & (
  | { type: 'create-sprint' | 'edit-sprint'; fields: SprintFields }
  | { type: 'configure-planning'; fields: { mode: string; timeZone: string; pointScale: string } }
  | { type: 'estimate-task'; fields: { estimate: string } }
  | { type: 'set-task-sprint'; fields: { destination: string } }
);
export interface SprintFormOwner {
  stage: (intent: SprintIntent) => SprintIntentResult;
  changeDraft: (intent: SprintIntent) => SprintIntentResult;
  submit: () => Promise<SprintIntentResult>;
}
const emptyFields: SprintFields = { name: '', goal: '', startDate: '', endDateExclusive: '' };
export function sprintFormIdentity(state: SprintClientState): string | null {
  const c = state.context;
  return c
    ? JSON.stringify([
        c.userId,
        c.sessionId,
        c.workspaceId,
        c.projectId,
        state.selection.sprintId,
        state.selection.taskId,
      ])
    : null;
}

/** Stage at form opening, before any editable value or later read can replace versions. */
export function beginSprintForm(
  owner: SprintFormOwner,
  state: SprintClientState,
  type: SprintFormKind,
): { form: SprintForm; reason: 'ready' } | { form: null; reason: SprintIntentResult } {
  const identity = sprintFormIdentity(state);
  if (state.status !== 'ready' || !identity) return { form: null, reason: 'unavailable' };
  const planning = state.resources.planning.data;
  const sprint = state.resources.sprint.data;
  const task = state.resources.task.data;
  const base = { identity, timeZone: planning?.timeZone ?? '' };
  let form: SprintForm;
  switch (type) {
    case 'configure-planning':
      if (!planning) return { form: null, reason: 'unavailable' };
      form = {
        ...base,
        type,
        fields: {
          mode: planning.mode,
          timeZone: planning.timeZone,
          pointScale: planning.pointScale.join(', '),
        },
      };
      break;
    case 'create-sprint':
      form = { ...base, type, fields: { ...emptyFields } };
      break;
    case 'edit-sprint':
      if (!sprint || sprint.id !== state.selection.sprintId)
        return { form: null, reason: 'unavailable' };
      form = {
        ...base,
        type,
        timeZone: sprint.timeZone,
        fields: {
          name: sprint.name,
          goal: sprint.goal,
          startDate: sprint.startDate,
          endDateExclusive: sprint.endDateExclusive,
        },
      };
      break;
    case 'estimate-task':
    case 'set-task-sprint':
      if (!task || task.taskId !== state.selection.taskId)
        return { form: null, reason: 'unavailable' };
      form =
        type === 'estimate-task'
          ? { ...base, type, fields: { estimate: task.snapshot.estimatePoints?.toString() ?? '' } }
          : {
              ...base,
              type,
              fields: { destination: task.currentParticipation?.sprint.id ?? '' },
            };
      break;
  }
  // A source-only scope draft captures the original visit and Task/source versions.
  // The selected target is read explicitly, then changeDraft captures its version.
  const initial =
    type === 'set-task-sprint'
      ? ({ type, targetSprintId: null } as const)
      : parseSprintForm(form).intent;
  // Empty create fields are intentionally staged before field validation.
  const intent = initial ?? (type === 'create-sprint' ? { type, fields: emptyFields } : null);
  if (!intent) return { form: null, reason: 'invalid' };
  const reason = owner.stage(intent);
  return reason === 'ready' ? { form, reason } : { form: null, reason };
}

export function parseSprintForm(form: SprintForm): {
  intent: SprintIntent | null;
  errors: SprintFormErrors;
} {
  const errors: SprintFormErrors = {};
  let intent: SprintIntent | null = null;
  switch (form.type) {
    case 'configure-planning': {
      const fields = form.fields;
      const parts = fields.pointScale.split(',').map((part) => part.trim());
      const pointScale = parts.every((part) => /^\d+$/.test(part)) ? parts.map(Number) : [];
      const settings = { mode: fields.mode, timeZone: fields.timeZone.trim(), pointScale };
      if (!['kanban', 'scrum'].includes(fields.mode)) errors.mode = 'invalid';
      if (!isPlanningTimeZone(settings.timeZone)) errors.timeZone = 'invalid';
      if (!isPlanningSettings({ ...settings, mode: 'kanban', timeZone: 'UTC' }))
        errors.pointScale = 'invalid';
      if (isPlanningSettings(settings)) intent = { type: form.type, settings };
      break;
    }
    case 'create-sprint':
    case 'edit-sprint': {
      const fields = {
        ...form.fields,
        name: form.fields.name.trim(),
        goal: form.fields.goal.trim(),
      };
      if (!fields.name) errors.name = 'required';
      else if (fields.name.length > 200) errors.name = 'too-long';
      else if (/[\r\n\t\0]/.test(fields.name)) errors.name = 'invalid';
      if (!fields.goal) errors.goal = 'required';
      else if (fields.goal.length > 2000) errors.goal = 'too-long';
      else if (fields.goal.includes('\0')) errors.goal = 'invalid';
      if (!isSprintDate(fields.startDate)) errors.startDate = 'invalid';
      if (!isSprintDate(fields.endDateExclusive)) errors.endDateExclusive = 'invalid';
      else if (!errors.startDate && fields.endDateExclusive <= fields.startDate)
        errors.endDateExclusive = 'end-after-start';
      if (isSprintFields(fields)) intent = { type: form.type, fields };
      break;
    }
    case 'estimate-task': {
      const raw = form.fields.estimate;
      const estimatePoints = raw === '' ? null : /^\d+$/.test(raw) ? Number(raw) : NaN;
      if (estimatePoints !== null && (!Number.isInteger(estimatePoints) || estimatePoints > 1000))
        errors.estimate = 'invalid';
      else intent = { type: form.type, estimatePoints };
      break;
    }
    case 'set-task-sprint': {
      const raw = form.fields.destination;
      if (raw !== '' && !/^[A-Za-z0-9_-]{1,128}$/.test(raw)) errors.destination = 'invalid';
      else intent = { type: form.type, targetSprintId: raw || null };
      break;
    }
  }
  return { intent, errors };
}

/** Only a deliberate submit event calls this; retry/rebase are separate owner actions. */
export async function submitSprintForm(
  owner: SprintFormOwner,
  state: SprintClientState,
  form: SprintForm,
): Promise<{ reason: SprintIntentResult; errors: SprintFormErrors }> {
  if (
    state.status !== 'ready' ||
    sprintFormIdentity(state) !== form.identity ||
    state.draft?.type !== form.type
  )
    return { reason: 'unavailable', errors: {} };
  const parsed = parseSprintForm(form);
  if (!parsed.intent) return { reason: 'invalid', errors: parsed.errors };
  const reason = owner.changeDraft(parsed.intent);
  return { reason: reason === 'ready' ? await owner.submit() : reason, errors: {} };
}

/** Preserve null, zero and the canonical retained off-scale estimate as distinct options. */
export function sprintEstimateOptions(scale: readonly number[], current: number | null): string[] {
  return [...new Set([...scale, ...(current === null ? [] : [current])])]
    .sort((a, b) => a - b)
    .map(String);
}
