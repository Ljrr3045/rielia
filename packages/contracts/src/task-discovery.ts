import { isTask, isTaskFilters, type ArchiveView, type Task, type TaskFilters } from './project-tasks.js';
export type TaskScope = 'project' | 'mine' | 'search';
export interface TaskDiscoveryQuery { scope: 'mine' | 'search'; q: string; view: ArchiveView; filters: TaskFilters; projectId?: string }
export type TaskDiscoveryItem = Omit<Task, 'description'> & { projectName: string };
export interface TaskDiscoveryPage { workspaceId: string; query: TaskDiscoveryQuery; principalId: string; revision: string; items: TaskDiscoveryItem[]; total: number; nextCursor: string | null }
export type TaskInvalidation = { type: 'invalidate'; entity: 'task' | 'project'; projectId: string; id: string; version: number }
  | { type: 'reset' } | { type: 'heartbeat' } | { type: 'denied'; reason: 'signed-out' | 'forbidden' };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export const discoveryIdentifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function isTaskSearch(value: unknown): value is string { return typeof value === 'string' && value.length <= 100 && !Array.from(value).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127); }
export function isTaskDiscoveryQuery(value: unknown): value is TaskDiscoveryQuery {
  return record(value) && Object.keys(value).every(k => ['scope', 'q', 'view', 'filters', 'projectId'].includes(k))
    && typeof value['scope'] === 'string' && ['mine', 'search'].includes(value['scope']) && isTaskSearch(value['q']) && typeof value['view'] === 'string' && ['active', 'archived'].includes(value['view'])
    && isTaskFilters(value['filters']) && (value['scope'] !== 'mine' || !('assignee' in value['filters']))
    && (!('projectId' in value) || discoveryIdentifier(value['projectId']));
}
export function parseTaskDiscoveryQuery(params: Record<string, unknown>): TaskDiscoveryQuery | null {
  if (Object.keys(params).some(k => !['scope', 'q', 'view', 'project', 'status', 'assignee', 'priority', 'cursor'].includes(k))) return null;
  const query = { scope: params['scope'] ?? 'search', q: params['q'] ?? '', view: params['view'] ?? 'active',
    filters: Object.fromEntries(['status', 'assignee', 'priority'].filter(k => k in params).map(k => [k, params[k]])),
    ...('project' in params ? { projectId: params['project'] } : {}) };
  return isTaskDiscoveryQuery(query) ? query : null;
}
export function isTaskDiscoveryPage(value: unknown): value is TaskDiscoveryPage {
  return record(value) && discoveryIdentifier(value['workspaceId']) && discoveryIdentifier(value['principalId']) && isTaskDiscoveryQuery(value['query'])
    && typeof value['revision'] === 'string' && /^[a-f0-9]{64}$/.test(value['revision'])
    && Array.isArray(value['items']) && value['items'].length <= 100 && value['items'].every(row => record(row) && !('description' in row)
      && isTask({ ...row, description: '' }) && row['workspaceId'] === value['workspaceId'] && typeof row['projectName'] === 'string')
    && new Set(value['items'].map(row => row.id)).size === value['items'].length
    && Number.isSafeInteger(value['total']) && Number(value['total']) >= value['items'].length
    && (value['nextCursor'] === null || typeof value['nextCursor'] === 'string' && /^[A-Za-z0-9_-]{1,2048}$/.test(value['nextCursor']));
}
export function isTaskInvalidation(value: unknown): value is TaskInvalidation {
  if (!record(value)) return false;
  if (value['type'] === 'reset' || value['type'] === 'heartbeat') return Object.keys(value).length === 1;
  if (value['type'] === 'denied') return Object.keys(value).length === 2 && typeof value['reason'] === 'string' && ['signed-out', 'forbidden'].includes(value['reason']);
  return value['type'] === 'invalidate' && Object.keys(value).length === 5 && typeof value['entity'] === 'string' && ['task', 'project'].includes(value['entity'])
    && discoveryIdentifier(value['id']) && discoveryIdentifier(value['projectId']) && Number.isSafeInteger(value['version']) && Number(value['version']) > 0;
}
