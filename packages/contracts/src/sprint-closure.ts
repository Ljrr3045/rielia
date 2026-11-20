import { isRecord } from './index.js';
import { isSprint, type Sprint } from './sprints.js';
import {
  isPlanningSnapshot,
  isSprintTotals,
  type PlanningSnapshot,
  type SprintTotals,
} from './task-planning.js';

/** Null is an explicitly unselected destination; backlog means unscheduled, preserving Task state. */
export type SprintCloseDestination = string | null;
export type ClosingDisposition = 'done' | 'canceled' | 'backlog' | 'carried';
export interface ClosingConsequence {
  participationId: string;
  taskId: string;
  snapshot: PlanningSnapshot;
  disposition: ClosingDisposition | 'pending';
}
export interface CloseSprintInput {
  expectedVersion: number;
  expectedProjectVersion: number;
  expectedTaskRevision: number;
  expectedSprintRevision: number;
  expectedTargetVersion: number | null;
  destination: SprintCloseDestination;
  previewSchema: 1;
  previewHash: string;
}
export interface SprintClosePreview extends CloseSprintInput {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  total: number;
  pendingParticipants: number;
  totals: SprintTotals;
  items: ClosingConsequence[];
  nextCursor: string | null;
  canClose: boolean;
}
export interface SprintClosure {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string;
  destination: SprintCloseDestination;
  sourceOrdinal: number;
  targetOrdinal: number | null;
  closedAt: string;
  previewSchema: 1;
  previewHash: string;
  activityId: string;
  total: number;
  pendingParticipants: number;
  totals: SprintTotals;
}
export interface SprintClosingOutcome extends ClosingConsequence {
  id: string;
  closureId: string;
  disposition: ClosingDisposition;
  targetSprintId: string | null;
  targetParticipationId: string | null;
}
export interface SprintClosingOutcomePage {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  closureId: string;
  total: number;
  items: SprintClosingOutcome[];
  nextCursor: string | null;
}
export interface SprintCloseResult {
  operation: { type: 'close-sprint'; activityId: string; closureId: string; sprintId: string };
  closure: SprintClosure;
  current: Sprint;
}
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const positive = (v: unknown) => Number.isSafeInteger(v) && Number(v) > 0;
const destination = (v: unknown) => v === null || id(v);
const hash = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const cursor = (v: unknown) =>
  v === null || (typeof v === 'string' && /^[A-Za-z0-9_-]{1,2048}$/.test(v));
const scoped = (v: Record<string, unknown>) =>
  id(v['workspaceId']) && id(v['projectId']) && id(v['sprintId']);
function consequence(v: unknown): v is ClosingConsequence {
  if (
    !isRecord(v) ||
    !id(v['participationId']) ||
    !id(v['taskId']) ||
    !isPlanningSnapshot(v['snapshot'])
  )
    return false;
  const state = v['snapshot'].status;
  return state === 'done'
    ? v['disposition'] === 'done'
    : state === 'canceled'
      ? v['disposition'] === 'canceled'
      : ['pending', 'backlog', 'carried'].includes(String(v['disposition']));
}
export function isCloseSprintInput(v: unknown): v is CloseSprintInput {
  return (
    isRecord(v) &&
    positive(v['expectedVersion']) &&
    positive(v['expectedProjectVersion']) &&
    positive(v['expectedTaskRevision']) &&
    positive(v['expectedSprintRevision']) &&
    destination(v['destination']) &&
    (v['destination'] === null || v['destination'] === 'backlog'
      ? v['expectedTargetVersion'] === null
      : positive(v['expectedTargetVersion'])) &&
    v['previewSchema'] === 1 &&
    hash(v['previewHash'])
  );
}
export function isSprintClosePreview(v: unknown): v is SprintClosePreview {
  return (
    isRecord(v) &&
    isCloseSprintInput(v) &&
    scoped(v) &&
    count(v['total']) &&
    count(v['pendingParticipants']) &&
    Number(v['pendingParticipants']) <= Number(v['total']) &&
    isSprintTotals(v['totals']) &&
    Array.isArray(v['items']) &&
    v['items'].length <= 100 &&
    v['items'].length <= Number(v['total']) &&
    v['items'].every(consequence) &&
    new Set(v['items'].map((x) => x.participationId)).size === v['items'].length &&
    cursor(v['nextCursor']) &&
    typeof v['canClose'] === 'boolean' &&
    v['canClose'] === (v['pendingParticipants'] === 0 || v['destination'] !== null) &&
    v['items'].every(
      (x) =>
        x.disposition === 'done' ||
        x.disposition === 'canceled' ||
        x.disposition ===
          (v['destination'] === null
            ? 'pending'
            : v['destination'] === 'backlog'
              ? 'backlog'
              : 'carried'),
    )
  );
}
export function isSprintClosure(v: unknown): v is SprintClosure {
  return (
    isRecord(v) &&
    scoped(v) &&
    id(v['id']) &&
    destination(v['destination']) &&
    positive(v['sourceOrdinal']) &&
    (v['destination'] === null || v['destination'] === 'backlog'
      ? v['targetOrdinal'] === null
      : positive(v['targetOrdinal'])) &&
    typeof v['closedAt'] === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v['closedAt']) &&
    !v['closedAt'].startsWith('0000-') &&
    Number.isFinite(Date.parse(v['closedAt'])) &&
    new Date(v['closedAt']).toISOString() === v['closedAt'] &&
    v['previewSchema'] === 1 &&
    hash(v['previewHash']) &&
    id(v['activityId']) &&
    count(v['total']) &&
    count(v['pendingParticipants']) &&
    Number(v['pendingParticipants']) <= Number(v['total']) &&
    (v['pendingParticipants'] === 0 || v['destination'] !== null) &&
    isSprintTotals(v['totals'])
  );
}
export function isSprintClosingOutcomePage(v: unknown): v is SprintClosingOutcomePage {
  return (
    isRecord(v) &&
    scoped(v) &&
    id(v['closureId']) &&
    count(v['total']) &&
    Array.isArray(v['items']) &&
    v['items'].length <= 100 &&
    v['items'].length <= Number(v['total']) &&
    cursor(v['nextCursor']) &&
    v['items'].every(
      (x) =>
        isRecord(x) &&
        consequence(x) &&
        id(x['id']) &&
        x['closureId'] === v['closureId'] &&
        x['disposition'] !== 'pending' &&
        (x['disposition'] === 'carried'
          ? id(x['targetSprintId']) &&
            x['targetSprintId'] !== v['sprintId'] &&
            id(x['targetParticipationId'])
          : x['targetSprintId'] === null && x['targetParticipationId'] === null),
    ) &&
    new Set(v['items'].map((x) => x.id)).size === v['items'].length &&
    new Set(v['items'].map((x) => x.participationId)).size === v['items'].length
  );
}
export function isSprintCloseResult(v: unknown): v is SprintCloseResult {
  if (
    !isRecord(v) ||
    !isRecord(v['operation']) ||
    !isSprintClosure(v['closure']) ||
    !isSprint(v['current'])
  )
    return false;
  const op = v['operation'],
    c = v['closure'],
    s = v['current'];
  return (
    op['type'] === 'close-sprint' &&
    op['closureId'] === c.id &&
    op['activityId'] === c.activityId &&
    op['sprintId'] === c.sprintId &&
    s.id === c.sprintId &&
    s.workspaceId === c.workspaceId &&
    s.projectId === c.projectId &&
    s.state === 'closed' &&
    s.closedAt === c.closedAt &&
    s.version === c.sourceOrdinal
  );
}
