/** T06 bounded workspace-visible domain. No configurable workflow is implied. */
export const taskStatuses = ['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const;
export const taskTypes = ['task', 'bug', 'feature'] as const;
export const taskPriorities = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export type TaskStatus = typeof taskStatuses[number];
export type TaskType = typeof taskTypes[number];
export type TaskPriority = typeof taskPriorities[number];
export interface DomainPerson { principalId: string; name: string; kind: 'human' | 'agent'; active: boolean }
export interface DomainProvenance { actorPrincipalId: string; executionMode: 'human' | 'delegated' | 'autonomous'; source: 'web' | 'mcp'; grantId: string | null }
export interface DomainCapabilities { canEdit: boolean; canArchive: boolean; canRestore: boolean }
export interface Project {
  id: string; workspaceId: string; key: string; name: string; description: string; visibility: 'workspace';
  version: number; archivedAt: string | null; createdAt: string; updatedAt: string;
  creator: DomainPerson; provenance: DomainProvenance; capabilities: DomainCapabilities; url: string;
}
export interface TaskFields { title: string; description: string; type: TaskType; priority: TaskPriority; status: TaskStatus; assigneePrincipalId: string | null; dueDate: string | null }
export interface Task extends TaskFields {
  id: string; workspaceId: string; projectId: string; projectKey: string; number: number; key: string;
  version: number; archivedAt: string | null; projectArchivedAt: string | null; createdAt: string; updatedAt: string;
  creator: DomainPerson; assignee: DomainPerson | null; provenance: DomainProvenance; capabilities: DomainCapabilities; url: string;
}
export type ProjectTaskCommand =
  | { type: 'create-project'; workspaceId: string; name: string; key: string; description?: string }
  | { type: 'edit-project'; workspaceId: string; projectId: string; expectedVersion: number; name: string; description: string }
  | { type: 'archive-project' | 'restore-project'; workspaceId: string; projectId: string; expectedVersion: number }
  | { type: 'create-task'; workspaceId: string; projectId: string; fields: Pick<TaskFields, 'title'> & Partial<Omit<TaskFields, 'title'>> }
  | { type: 'edit-task'; workspaceId: string; projectId: string; taskId: string; expectedVersion: number; fields: Partial<TaskFields> }
  | { type: 'archive-task' | 'restore-task'; workspaceId: string; projectId: string; taskId: string; expectedVersion: number };
export type ProjectTaskResult = Project | Task;
export type ArchiveView = 'active' | 'archived';
export interface DomainConflict { code: 'version-conflict' | 'archived'; message: string; current: ProjectTaskResult }
export function projectURL(workspaceId: string, projectId: string): string {
  return `/projects?workspace=${encodeURIComponent(workspaceId)}&project=${encodeURIComponent(projectId)}`;
}
export function taskURL(workspaceId: string, projectId: string, taskId: string): string {
  return `${projectURL(workspaceId, projectId)}&task=${encodeURIComponent(taskId)}`;
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown): value is string => typeof value === 'string';
const date = (value: unknown) => str(value) && Number.isFinite(Date.parse(value));
const positive = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
export function isDomainPerson(value: unknown): value is DomainPerson {
  return record(value) && str(value['principalId']) && str(value['name']) && ['human', 'agent'].includes(String(value['kind'])) && typeof value['active'] === 'boolean';
}
function common(value: Record<string, unknown>) {
  const p = value['provenance']; const c = value['capabilities'];
  return str(value['id']) && str(value['workspaceId']) && positive(value['version']) && (value['archivedAt'] === null || date(value['archivedAt']))
    && date(value['createdAt']) && date(value['updatedAt']) && isDomainPerson(value['creator']) && str(value['url'])
    && record(p) && p['actorPrincipalId'] === value['creator'].principalId && ['human', 'delegated', 'autonomous'].includes(String(p['executionMode']))
    && ['web', 'mcp'].includes(String(p['source'])) && (p['grantId'] === null || str(p['grantId']))
    && record(c) && ['canEdit', 'canArchive', 'canRestore'].every(k => typeof c[k] === 'boolean');
}
export function isProject(value: unknown): value is Project {
  return record(value) && common(value) && str(value['name']) && str(value['description']) && str(value['key']) && value['visibility'] === 'workspace';
}
export function isTask(value: unknown): value is Task {
  return record(value) && common(value) && str(value['projectId']) && str(value['projectKey']) && positive(value['number']) && str(value['key'])
    && str(value['title']) && str(value['description']) && taskTypes.includes(value['type'] as TaskType) && taskPriorities.includes(value['priority'] as TaskPriority)
    && taskStatuses.includes(value['status'] as TaskStatus) && (value['assigneePrincipalId'] === null || str(value['assigneePrincipalId']))
    && (value['assignee'] === null || isDomainPerson(value['assignee'])) && (value['projectArchivedAt'] === null || date(value['projectArchivedAt']))
    && (value['dueDate'] === null || (str(value['dueDate']) && /^\d{4}-\d{2}-\d{2}$/.test(value['dueDate'])));
}
