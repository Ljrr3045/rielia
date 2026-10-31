import { isDomainPerson, taskStatuses, taskTypes, taskPriorities, type DomainPerson, type DomainProvenance, type TaskFields, type TaskStatus, type Task } from './project-tasks.js';

export const collaborationCollections = ['relations', 'parent-candidates', 'checklist', 'comments', 'history'] as const;
export type CollaborationCollection = typeof collaborationCollections[number];
export interface TaskReference { id: string; key: string; title: string; status: TaskStatus; archivedAt: string | null; version: number; url: string }
export interface CollaborationPage<T> { workspaceId: string; projectId: string; taskId: string; revision: number; items: T[]; total: number; nextCursor: string | null }
export interface TaskRelations extends CollaborationPage<TaskReference> {
  parent: TaskReference | null; open: number; archivedOpen: number;
  capabilities: { canCreate: boolean; canLink: boolean; canUnlink: boolean };
}
export interface TaskParentCandidates extends CollaborationPage<TaskReference> { capabilities: { canSelect: boolean } }
export interface ChecklistItem { id: string; text: string; completed: boolean; position: number; version: number; moveUpBeforeItemId: string | null; moveDownBeforeItemId: string | null; capabilities: { canEdit: boolean; canRemove: boolean; canMoveUp: boolean; canMoveDown: boolean } }
export interface TaskChecklist extends CollaborationPage<ChecklistItem> { capabilities: { canCreate: boolean; canEdit: boolean } }
export interface TaskComment { id: string; body: string; version: number; author: DomainPerson; provenance: DomainProvenance; createdAt: string; updatedAt: string; editedAt: string | null; capabilities: { canEdit: boolean } }
export interface TaskComments extends CollaborationPage<TaskComment> { capabilities: { canCreate: boolean } }
export interface TaskCommentReview { task: Task; comment: TaskComment }
export const taskActivityActions = ['create-task', 'edit-task', 'archive-task', 'restore-task', 'move-task', 'set-task-parent', 'add-checklist-item', 'edit-checklist-item', 'move-checklist-item', 'remove-checklist-item', 'add-comment', 'edit-comment'] as const;
export const taskActivityFields = ['title', 'description', 'type', 'priority', 'status', 'assigneePrincipalId', 'dueDate', 'rank', 'parentTaskId', 'checklist', 'comment'] as const;
export type ActivityChange = { field: 'status' | 'type' | 'priority' | 'dueDate'; before: string | null; after: string | null };
export interface TaskActivity {
  id: string; action: typeof taskActivityActions[number]; fields: Array<typeof taskActivityFields[number]>;
  actor: DomainPerson | { principalId: string; name: string; kind: 'system'; active: boolean };
  provenance: { actorPrincipalId: string; executionMode: 'human' | 'delegated' | 'autonomous' | 'system'; source: 'web' | 'mcp' | 'internal'; grantId: string | null };
  entityVersion: number; createdAt: string; changes: ActivityChange[];
}
export type TaskHistory = CollaborationPage<TaskActivity>;
export interface TaskCollaborationPages { relations: TaskRelations; 'parent-candidates': TaskParentCandidates; checklist: TaskChecklist; comments: TaskComments; history: TaskHistory }
export interface CloseWarning { open: number; archivedOpen: number; childrenVersion: number }
export interface CreateTaskFields extends Pick<TaskFields, 'title'>, Partial<Omit<TaskFields, 'title'>> { parentTaskId?: string; expectedParentVersion?: number }
interface CollaborationTarget { workspaceId: string; projectId: string; taskId: string; expectedVersion: number }
export type TaskCollaborationCommand = CollaborationTarget & (
  | { type: 'set-task-parent'; parentTaskId: string | null; expectedParentVersion?: number }
  | { type: 'add-checklist-item'; text: string; beforeItemId: string | null }
  | { type: 'edit-checklist-item'; itemId: string; text?: string; completed?: boolean }
  | { type: 'move-checklist-item'; itemId: string; beforeItemId: string | null }
  | { type: 'remove-checklist-item'; itemId: string }
  | { type: 'add-comment'; body: string }
  | { type: 'edit-comment'; commentId: string; expectedCommentVersion: number; body: string }
);
export function isCollaborationCommand(value: { type: string } | null): value is TaskCollaborationCommand {
  return value !== null && ['set-task-parent', 'add-checklist-item', 'edit-checklist-item', 'move-checklist-item', 'remove-checklist-item', 'add-comment', 'edit-comment'].includes(value.type);
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const positive = (v: unknown) => Number.isSafeInteger(v) && Number(v) > 0;
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
function reference(v: unknown): v is TaskReference {
  return record(v) && id(v['id']) && typeof v['title'] === 'string' && typeof v['key'] === 'string' && typeof v['url'] === 'string' && positive(v['version'])
    && taskStatuses.includes(v['status'] as TaskStatus) && (v['archivedAt'] === null || date(v['archivedAt']));
}
function provenance(v: unknown, actorId: string, system = false) {
  return record(v) && v['actorPrincipalId'] === actorId && (v['grantId'] === null || id(v['grantId']))
    && (v['executionMode'] === 'human' && v['source'] === 'web' && v['grantId'] === null
      || ['delegated', 'autonomous'].includes(String(v['executionMode'])) && v['source'] === 'mcp' && id(v['grantId'])
      || system && v['executionMode'] === 'system' && v['source'] === 'internal' && v['grantId'] === null);
}
export function isCloseWarning(v: unknown): v is CloseWarning {
  return record(v) && positive(v['open']) && count(v['archivedOpen']) && Number(v['archivedOpen']) <= Number(v['open']) && positive(v['childrenVersion']);
}
export function isActivityChange(v: unknown): v is ActivityChange {
  if (!record(v) || Object.keys(v).some(key => !['field', 'before', 'after'].includes(key))) return false;
  const choices = v['field'] === 'status' ? taskStatuses : v['field'] === 'type' ? taskTypes : v['field'] === 'priority' ? taskPriorities : null;
  return choices ? [v['before'], v['after']].every(value => typeof value === 'string' && (choices as readonly string[]).includes(value))
    : v['field'] === 'dueDate' && [v['before'], v['after']].every(value => value === null || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
export function isTaskComment(row: unknown): row is TaskComment {
  return record(row) && id(row['id']) && typeof row['body'] === 'string' && row['body'].length <= 10000 && positive(row['version'])
    && isDomainPerson(row['author']) && provenance(row['provenance'], row['author'].principalId) && date(row['createdAt']) && date(row['updatedAt']) && (row['editedAt'] === null || date(row['editedAt'])) && record(row['capabilities']) && typeof row['capabilities']['canEdit'] === 'boolean';
}
export function isCollaborationPage<K extends CollaborationCollection>(v: unknown, collection: K): v is TaskCollaborationPages[K] {
  if (!record(v) || !id(v['workspaceId']) || !id(v['projectId']) || !id(v['taskId']) || !positive(v['revision']) || !count(v['total']) || !Array.isArray(v['items']) || v['items'].length > 100
    || Number(v['total']) < v['items'].length || !(v['nextCursor'] === null || typeof v['nextCursor'] === 'string' && /^[A-Za-z0-9_-]{1,2048}$/.test(v['nextCursor']))) return false;
  const capabilities = v['capabilities'];
  if (collection === 'parent-candidates') return v['items'].every(reference) && record(capabilities) && typeof capabilities['canSelect'] === 'boolean';
  if (collection === 'relations') return v['items'].every(reference) && (v['parent'] === null || reference(v['parent'])) && count(v['open']) && count(v['archivedOpen']) && Number(v['archivedOpen']) <= Number(v['open']) && Number(v['open']) <= Number(v['total'])
    && record(capabilities) && ['canCreate', 'canLink', 'canUnlink'].every(key => typeof capabilities[key] === 'boolean');
  if (collection === 'checklist') return v['items'].every(row => record(row) && id(row['id']) && typeof row['text'] === 'string' && row['text'].length <= 500 && typeof row['completed'] === 'boolean' && positive(row['position']) && positive(row['version'])
    && (row['moveUpBeforeItemId'] === null || id(row['moveUpBeforeItemId'])) && (row['moveDownBeforeItemId'] === null || id(row['moveDownBeforeItemId'])) && record(row['capabilities']) && ['canEdit', 'canRemove', 'canMoveUp', 'canMoveDown'].every(key => typeof (row['capabilities'] as Record<string, unknown>)[key] === 'boolean'))
    && record(capabilities) && typeof capabilities['canCreate'] === 'boolean' && typeof capabilities['canEdit'] === 'boolean';
  if (collection === 'comments') return v['items'].every(isTaskComment)
    && record(capabilities) && typeof capabilities['canCreate'] === 'boolean';
  return v['items'].every(row => record(row) && id(row['id']) && taskActivityActions.includes(row['action'] as TaskActivity['action']) && Array.isArray(row['fields'])
    && row['fields'].every(field => taskActivityFields.includes(field as typeof taskActivityFields[number])) && record(row['actor'])
    && (isDomainPerson(row['actor']) || row['actor']['kind'] === 'system' && id(row['actor']['principalId']) && typeof row['actor']['name'] === 'string' && typeof row['actor']['active'] === 'boolean')
    && provenance(row['provenance'], String(row['actor']['principalId']), true) && positive(row['entityVersion']) && date(row['createdAt']) && Array.isArray(row['changes']) && row['changes'].length <= 4 && row['changes'].every(isActivityChange));
}
