import { isDomainPerson, type DomainPerson, type DomainProvenance } from './project-tasks.js';

export const defaultPointScale = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export interface PlanningSettings {
  mode: 'kanban' | 'scrum';
  timeZone: string;
  pointScale: number[];
}
export interface ProjectPlanning extends PlanningSettings {
  workspaceId: string;
  projectId: string;
  projectVersion: number;
  sprintRevision: number;
  archivedAt: string | null;
  capabilities: { canConfigurePlanning: boolean; canCreateSprint: boolean };
}
export interface SprintFields {
  name: string;
  goal: string;
  startDate: string;
  endDateExclusive: string;
}
/** Only planned sprints are implemented in T11.1. */
export interface PlannedSprint extends SprintFields {
  id: string;
  workspaceId: string;
  projectId: string;
  state: 'planned';
  version: number;
  timeZone: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  creator: DomainPerson;
  provenance: DomainProvenance;
  capabilities: { canEdit: boolean };
  url: string;
}
export interface SprintPage {
  workspaceId: string;
  projectId: string;
  revision: number;
  projectVersion: number;
  items: PlannedSprint[];
  total: number;
  nextCursor: string | null;
  capabilities: { canCreate: boolean };
}
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
export type SprintPlanningResult = ProjectPlanning | PlannedSprint;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const positive = (v: unknown) => Number.isSafeInteger(v) && Number(v) > 0;
const instant = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  !v.startsWith('0000-') &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
export function isPlanningTimeZone(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 100 || !/^[A-Za-z][A-Za-z0-9_+./-]*$/.test(v))
    return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: v }).format(0);
    return true;
  } catch {
    return false;
  }
}
export function isPlanningSettings(v: unknown): v is PlanningSettings {
  return (
    record(v) &&
    Object.keys(v).every((k) => ['mode', 'timeZone', 'pointScale'].includes(k)) &&
    (v['mode'] === 'kanban' || v['mode'] === 'scrum') &&
    isPlanningTimeZone(v['timeZone']) &&
    Array.isArray(v['pointScale']) &&
    v['pointScale'].length > 0 &&
    v['pointScale'].length <= 32 &&
    v['pointScale'].every(
      (n, i, a) => Number.isInteger(n) && n >= 0 && n <= 1000 && (i === 0 || n > a[i - 1]),
    )
  );
}
export function isSprintDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v.startsWith('0000')) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export function isSprintFields(v: unknown): v is SprintFields {
  return (
    record(v) &&
    Object.keys(v).every((k) => ['name', 'goal', 'startDate', 'endDateExclusive'].includes(k)) &&
    typeof v['name'] === 'string' &&
    v['name'].length > 0 &&
    v['name'].length <= 200 &&
    v['name'] === v['name'].trim() &&
    !/[\r\n\t\0]/.test(v['name']) &&
    typeof v['goal'] === 'string' &&
    v['goal'].length > 0 &&
    v['goal'].length <= 2000 &&
    v['goal'] === v['goal'].trim() &&
    !v['goal'].includes('\0') &&
    isSprintDate(v['startDate']) &&
    isSprintDate(v['endDateExclusive']) &&
    v['startDate'] < v['endDateExclusive']
  );
}
export function isProjectPlanning(v: unknown): v is ProjectPlanning {
  return (
    record(v) &&
    isPlanningSettings({ mode: v['mode'], timeZone: v['timeZone'], pointScale: v['pointScale'] }) &&
    id(v['workspaceId']) &&
    id(v['projectId']) &&
    positive(v['projectVersion']) &&
    positive(v['sprintRevision']) &&
    (v['archivedAt'] === null || instant(v['archivedAt'])) &&
    record(v['capabilities']) &&
    typeof v['capabilities']['canConfigurePlanning'] === 'boolean' &&
    typeof v['capabilities']['canCreateSprint'] === 'boolean'
  );
}
export function isPlannedSprint(v: unknown): v is PlannedSprint {
  if (
    !record(v) ||
    !isSprintFields({
      name: v['name'],
      goal: v['goal'],
      startDate: v['startDate'],
      endDateExclusive: v['endDateExclusive'],
    })
  )
    return false;
  const p = v['provenance'];
  return (
    id(v['id']) &&
    id(v['workspaceId']) &&
    id(v['projectId']) &&
    v['state'] === 'planned' &&
    positive(v['version']) &&
    isPlanningTimeZone(v['timeZone']) &&
    instant(v['startsAt']) &&
    instant(v['endsAt']) &&
    v['startsAt'] < v['endsAt'] &&
    instant(v['createdAt']) &&
    instant(v['updatedAt']) &&
    isDomainPerson(v['creator']) &&
    record(p) &&
    p['actorPrincipalId'] === v['creator'].principalId &&
    ((p['executionMode'] === 'human' && p['source'] === 'web' && p['grantId'] === null) ||
      (['delegated', 'autonomous'].includes(String(p['executionMode'])) &&
        p['source'] === 'mcp' &&
        id(p['grantId']))) &&
    record(v['capabilities']) &&
    typeof v['capabilities']['canEdit'] === 'boolean' &&
    typeof v['url'] === 'string'
  );
}
export function isSprintPage(v: unknown): v is SprintPage {
  return (
    record(v) &&
    id(v['workspaceId']) &&
    id(v['projectId']) &&
    positive(v['revision']) &&
    positive(v['projectVersion']) &&
    Array.isArray(v['items']) &&
    v['items'].length <= 100 &&
    v['items'].every(
      (row) =>
        isPlannedSprint(row) &&
        row.workspaceId === v['workspaceId'] &&
        row.projectId === v['projectId'],
    ) &&
    new Set(v['items'].map((row) => row.id)).size === v['items'].length &&
    Number.isSafeInteger(v['total']) &&
    Number(v['total']) >= v['items'].length &&
    (v['nextCursor'] === null ||
      (typeof v['nextCursor'] === 'string' && /^[A-Za-z0-9_-]{1,2048}$/.test(v['nextCursor']))) &&
    record(v['capabilities']) &&
    typeof v['capabilities']['canCreate'] === 'boolean'
  );
}
