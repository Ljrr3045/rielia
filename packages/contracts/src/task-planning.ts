const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
import {
  taskStatuses,
  isDomainPerson,
  type DomainPerson,
  type DomainProvenance,
  type TaskStatus,
} from './project-tasks.js';
import { isSprint, type Sprint } from './sprints.js';

export interface PlanningSnapshot {
  version: number;
  status: TaskStatus;
  estimatePoints: number | null;
  parentTaskId: string | null;
  archivedAt: string | null;
}
export interface TaskPlanning {
  workspaceId: string;
  projectId: string;
  taskId: string;
  taskRevision: number;
  sprintRevision: number;
  snapshot: PlanningSnapshot;
  currentParticipation: { id: string; sprint: Sprint } | null;
  capabilities: { canEstimate: boolean; canChangeScope: boolean };
}
export interface SprintVisit {
  id: string;
  taskId: string;
  enteredAt: string;
  enteredOrdinal: number;
  entry: PlanningSnapshot;
  exitedAt: string | null;
  exitedOrdinal: number | null;
  exitReason: 'removed' | 'transferred' | 'closed' | null;
  exit: PlanningSnapshot | null;
  current: PlanningSnapshot;
  start: PlanningSnapshot | null;
}
export interface SprintTotals {
  done: number;
  canceled: number;
  pending: number;
  donePoints: number;
  canceledPoints: number;
  pendingPoints: number;
  unestimated: number;
  children: number;
  archived: number;
}
export interface PlanningHistoryItem {
  id: string;
  sprintId: string | null;
  taskId: string | null;
  participationId: string | null;
  ordinal: number;
  kind:
    | 'entry'
    | 'exit'
    | 'task-change'
    | 'metadata'
    | 'start'
    | 'estimate'
    | 'close'
    | 'carryover'
    | 'outcome';
  action: string;
  occurredAt: string;
  before: PlanningSnapshot | null;
  after: PlanningSnapshot | null;
  actor: DomainPerson;
  provenance: DomainProvenance;
  closureId?: string;
  disposition?: 'done' | 'canceled' | 'backlog' | 'carried';
  targetSprintId?: string | null;
  targetParticipationId?: string | null;
}
interface PlanningPage {
  workspaceId: string;
  projectId: string;
  taskRevision: number;
  sprintRevision: number;
  total: number;
  nextCursor: string | null;
}
export interface SprintScopePage extends PlanningPage {
  sprintId: string;
  sprintVersion: number;
  items: SprintVisit[];
  currentTotals: SprintTotals;
  startTotals: SprintTotals;
  removed: number;
  transferred?: number;
  closingTotals?: SprintTotals | null;
}
export interface PlanningHistoryPage extends PlanningPage {
  sprintId: string | null;
  taskId: string | null;
  items: PlanningHistoryItem[];
}
export interface SprintTransitionResult {
  operation: {
    activityId: string;
    type: 'start-sprint' | 'set-task-sprint';
    sprintId: string | null;
    enteredVisitId: string | null;
    exitedVisitId: string | null;
  };
  current: Sprint | TaskPlanning;
}
export interface StartSprintInput {
  expectedVersion: number;
  expectedProjectVersion: number;
  expectedTaskRevision: number;
}
export interface SetTaskSprintInput {
  expectedTaskVersion: number;
  expectedCurrentParticipationId: string | null;
  expectedSourceVersion: number | null;
  targetSprintId: string | null;
  expectedTargetVersion: number | null;
}
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const instant = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  !v.startsWith('0000-') &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const historyActions = [
  'close-sprint',
  'create-sprint',
  'edit-sprint',
  'start-sprint',
  'set-task-sprint',
  'estimate-task',
  'edit-task',
  'move-task',
  'set-task-parent',
  'archive-task',
  'restore-task',
];
export function isPlanningSnapshot(v: unknown): v is PlanningSnapshot {
  return (
    isRecord(v) &&
    Object.keys(v).length === 5 &&
    positive(v['version']) &&
    taskStatuses.includes(v['status'] as TaskStatus) &&
    (v['estimatePoints'] === null ||
      (Number.isInteger(v['estimatePoints']) &&
        Number(v['estimatePoints']) >= 0 &&
        Number(v['estimatePoints']) <= 1000)) &&
    (v['parentTaskId'] === null || id(v['parentTaskId'])) &&
    (v['archivedAt'] === null || instant(v['archivedAt']))
  );
}
export function isTaskPlanning(v: unknown): v is TaskPlanning {
  if (!isRecord(v)) return false;
  const visit = v['currentParticipation'];
  return (
    id(v['workspaceId']) &&
    id(v['projectId']) &&
    id(v['taskId']) &&
    positive(v['taskRevision']) &&
    positive(v['sprintRevision']) &&
    isPlanningSnapshot(v['snapshot']) &&
    (visit === null ||
      (isRecord(visit) &&
        id(visit['id']) &&
        isSprint(visit['sprint']) &&
        visit['sprint'].workspaceId === v['workspaceId'] &&
        visit['sprint'].projectId === v['projectId'])) &&
    isRecord(v['capabilities']) &&
    typeof v['capabilities']['canEstimate'] === 'boolean' &&
    typeof v['capabilities']['canChangeScope'] === 'boolean'
  );
}
function isVisit(v: unknown): v is SprintVisit {
  return (
    isRecord(v) &&
    id(v['id']) &&
    id(v['taskId']) &&
    instant(v['enteredAt']) &&
    positive(v['enteredOrdinal']) &&
    isPlanningSnapshot(v['entry']) &&
    isPlanningSnapshot(v['current']) &&
    (v['start'] === null || isPlanningSnapshot(v['start'])) &&
    ((v['exitedAt'] === null &&
      v['exitedOrdinal'] === null &&
      v['exitReason'] === null &&
      v['exit'] === null) ||
      (instant(v['exitedAt']) &&
        positive(v['exitedOrdinal']) &&
        v['exitedOrdinal'] > v['enteredOrdinal'] &&
        ['removed', 'transferred', 'closed'].includes(String(v['exitReason'])) &&
        isPlanningSnapshot(v['exit'])))
  );
}
function page(v: unknown): v is PlanningPage & { items: unknown[] } {
  return (
    isRecord(v) &&
    id(v['workspaceId']) &&
    id(v['projectId']) &&
    positive(v['taskRevision']) &&
    positive(v['sprintRevision']) &&
    Array.isArray(v['items']) &&
    v['items'].length <= 100 &&
    count(v['total']) &&
    Number(v['total']) >= v['items'].length &&
    (v['nextCursor'] === null ||
      (typeof v['nextCursor'] === 'string' && /^[A-Za-z0-9_-]{1,2048}$/.test(v['nextCursor'])))
  );
}
export function isSprintTotals(v: unknown): v is SprintTotals {
  return (
    isRecord(v) &&
    [
      'done',
      'canceled',
      'pending',
      'donePoints',
      'canceledPoints',
      'pendingPoints',
      'unestimated',
      'children',
      'archived',
    ].every((k) => count(v[k]))
  );
}
export function isSprintScopePage(v: unknown): v is SprintScopePage {
  return (
    page(v) &&
    isRecord(v) &&
    id(v['sprintId']) &&
    positive(v['sprintVersion']) &&
    v.items.every(isVisit) &&
    new Set(v.items.map((x) => x.id)).size === v.items.length &&
    isSprintTotals(v['currentTotals']) &&
    isSprintTotals(v['startTotals']) &&
    (v['closingTotals'] === undefined ||
      v['closingTotals'] === null ||
      isSprintTotals(v['closingTotals'])) &&
    (v['transferred'] === undefined || count(v['transferred'])) &&
    count(v['removed'])
  );
}
function historyItem(v: unknown): v is PlanningHistoryItem {
  if (!isRecord(v) || !isDomainPerson(v['actor']) || !isRecord(v['provenance'])) return false;
  const p = v['provenance'];
  return (
    id(v['id']) &&
    (v['sprintId'] === null || id(v['sprintId'])) &&
    (v['taskId'] === null || id(v['taskId'])) &&
    (v['participationId'] === null || id(v['participationId'])) &&
    positive(v['ordinal']) &&
    typeof v['kind'] === 'string' &&
    [
      'entry',
      'exit',
      'task-change',
      'metadata',
      'start',
      'estimate',
      'close',
      'carryover',
      'outcome',
    ].includes(v['kind']) &&
    historyActions.includes(String(v['action'])) &&
    (v['kind'] !== 'outcome' ||
      (id(v['closureId']) &&
        typeof v['disposition'] === 'string' &&
        ['done', 'canceled', 'backlog', 'carried'].includes(v['disposition']) &&
        (v['disposition'] === 'carried'
          ? id(v['targetSprintId']) && id(v['targetParticipationId'])
          : v['targetSprintId'] === null && v['targetParticipationId'] === null))) &&
    instant(v['occurredAt']) &&
    (v['before'] === null || isPlanningSnapshot(v['before'])) &&
    (v['after'] === null || isPlanningSnapshot(v['after'])) &&
    p['actorPrincipalId'] === v['actor'].principalId &&
    ((p['executionMode'] === 'human' && p['source'] === 'web' && p['grantId'] === null) ||
      (['delegated', 'autonomous'].includes(String(p['executionMode'])) &&
        p['source'] === 'mcp' &&
        id(p['grantId'])))
  );
}
export function isPlanningHistoryPage(v: unknown): v is PlanningHistoryPage {
  return (
    page(v) &&
    isRecord(v) &&
    (v['sprintId'] === null || id(v['sprintId'])) &&
    (v['taskId'] === null || id(v['taskId'])) &&
    (v['sprintId'] === null) !== (v['taskId'] === null) &&
    v.items.every(
      (item): item is PlanningHistoryItem =>
        historyItem(item) &&
        (v['sprintId'] === null || item.sprintId === v['sprintId']) &&
        (v['taskId'] === null || item.taskId === v['taskId']),
    ) &&
    new Set(v.items.map((x) => x.id)).size === v.items.length
  );
}
export function isSprintTransitionResult(v: unknown): v is SprintTransitionResult {
  if (
    !isRecord(v) ||
    !isRecord(v['operation']) ||
    !(isSprint(v['current']) || isTaskPlanning(v['current']))
  )
    return false;
  const op = v['operation'];
  return (
    id(op['activityId']) &&
    ['start-sprint', 'set-task-sprint'].includes(String(op['type'])) &&
    (op['sprintId'] === null || id(op['sprintId'])) &&
    (op['enteredVisitId'] === null || id(op['enteredVisitId'])) &&
    (op['exitedVisitId'] === null || id(op['exitedVisitId'])) &&
    (op['type'] === 'start-sprint'
      ? isSprint(v['current']) &&
        (v['current'].state === 'active' || v['current'].state === 'closed') &&
        op['sprintId'] === v['current'].id &&
        op['enteredVisitId'] === null &&
        op['exitedVisitId'] === null
      : isTaskPlanning(v['current']) &&
        id(op['sprintId']) &&
        (op['enteredVisitId'] !== null || op['exitedVisitId'] !== null))
  );
}
