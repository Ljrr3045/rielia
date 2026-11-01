import { isPage, isRecord, isProject, isTask, isTaskPage, isTaskFilters, type TaskFilters, type TaskPage, isProjectAccessMember, isDomainPerson, type ArchiveView, type DomainPage, type Project, type ProjectCommand, type ProjectTaskResult, type Task, type ProjectAccessPage, type ProjectAssigneePage, type ProjectAccessMember, type ProjectAccessReview } from '@rielia/contracts';
import { isCollaborationPage, isTaskComment, isCloseWarning, isCollaborationCommand, type CloseWarning, type CollaborationCollection, type TaskCollaborationPages, type TaskCommentReview } from '@rielia/contracts';
import { isTaskDiscoveryPage, isTaskDiscoveryQuery, type TaskDiscoveryQuery, type TaskDiscoveryPage } from '@rielia/contracts';

export class ProjectTaskFailure extends Error {
  readonly status: number; readonly code: string | null; readonly current: ProjectTaskResult | null; readonly requestId: string | null;
  readonly accessCurrent: ProjectAccessMember | null;
  readonly closeWarning: CloseWarning | null;
  constructor(status: number, code: string | null = null, current: ProjectTaskResult | null = null, requestId: string | null = null, accessCurrent: ProjectAccessMember | null = null, closeWarning: CloseWarning | null = null) {
    super('Project/task request failed.'); this.status = status; this.code = code; this.current = current; this.requestId = requestId; this.accessCurrent = accessCurrent; this.closeWarning = closeWarning;
  }
}
export interface ProjectTaskTransport {
  discover(workspaceId: string, query: TaskDiscoveryQuery, signal: AbortSignal, cursor?: string): Promise<TaskDiscoveryPage>;
  projects(workspaceId: string, view: ArchiveView, signal: AbortSignal, cursor?: string): Promise<DomainPage<Project>>;
  project(workspaceId: string, projectId: string, signal: AbortSignal): Promise<Project>;
  tasks(workspaceId: string, projectId: string, view: ArchiveView, signal: AbortSignal, cursor?: string, filters?: TaskFilters): Promise<TaskPage>;
  task(workspaceId: string, projectId: string, taskId: string, signal: AbortSignal): Promise<Task>;
  access(workspaceId: string, projectId: string, signal: AbortSignal, cursor?: string): Promise<ProjectAccessPage>;
  accessReview(workspaceId: string, projectId: string, principalId: string, signal: AbortSignal): Promise<ProjectAccessReview>;
  assignees(workspaceId: string, projectId: string, signal: AbortSignal, cursor?: string): Promise<ProjectAssigneePage>;
  mutate(command: ProjectCommand, key: string, signal: AbortSignal): Promise<ProjectTaskResult>;
  collaboration<K extends CollaborationCollection>(workspaceId: string, projectId: string, taskId: string, collection: K, signal: AbortSignal, cursor?: string): Promise<TaskCollaborationPages[K]>;
  commentReview(workspaceId: string, projectId: string, taskId: string, commentId: string, signal: AbortSignal): Promise<TaskCommentReview>;
}
const segment = encodeURIComponent;
export function createProjectTaskTransport(options: { baseURL?: string; timeout?: number } = {}): ProjectTaskTransport {
  async function request(path: string, signal: AbortSignal, body?: unknown, key?: string): Promise<unknown> {
    const response = await fetch(options.baseURL ? new URL(`/api/v1/${path}`, options.baseURL) : `/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(options.timeout ?? 15000)]),
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key! }, body: JSON.stringify(body) }),
    });
    let value: unknown;
    try { value = await response.json(); } catch { throw new ProjectTaskFailure(response.ok ? 502 : response.status, null, null, response.headers.get('x-request-id')); }
    if (!response.ok) throw new ProjectTaskFailure(response.status, isRecord(value) && typeof value['code'] === 'string' ? value['code'] : null,
      isRecord(value) && (isTask(value['current']) || isProject(value['current'])) ? value['current'] : null, response.headers.get('x-request-id'),
      isRecord(value) && isProjectAccessMember(value['accessCurrent']) ? value['accessCurrent'] : null,
      isRecord(value) && isCloseWarning(value['closeWarning']) ? value['closeWarning'] : null);
    return value;
  }
  const root = (w: string) => `workspaces/${segment(w)}/projects`;
  const projectPath = (w: string, p: string) => `${root(w)}/${segment(p)}`;
  function scoped(value: ProjectTaskResult, w: string, p?: string, t?: string) {
    return value.workspaceId === w && (p === undefined || ('projectId' in value ? value.projectId === p : value.id === p)) && (t === undefined || value.id === t);
  }
  async function collection<T>(path: string, signal: AbortSignal, check: (value: unknown) => value is T, view: ArchiveView, cursor?: string): Promise<DomainPage<T>> {
    const query = new URLSearchParams({ view }); if (cursor) query.set('cursor', cursor);
    const value = await request(`${path}?${query}`, signal);
    if (!isPage(value, check) || !isRecord(value) || !isRecord(value['capabilities']) || typeof value['capabilities']['canCreate'] !== 'boolean') throw new ProjectTaskFailure(502);
    return value as unknown as DomainPage<T>;
  }
  return {
    async discover(w, query, signal, cursor) {
      if (!isTaskDiscoveryQuery(query)) throw new ProjectTaskFailure(400);
      const params = new URLSearchParams({ scope: query.scope, q: query.q.trim(), view: query.view, ...query.filters });
      if (query.projectId) params.set('project', query.projectId); if (cursor) params.set('cursor', cursor);
      const value = await request(`workspaces/${segment(w)}/task-discovery?${params}`, signal);
      if (!isTaskDiscoveryPage(value) || value.workspaceId !== w || value.query.scope !== query.scope || value.query.q !== query.q.trim() || value.query.view !== query.view
        || value.query.projectId !== query.projectId || JSON.stringify(Object.entries(value.query.filters).sort()) !== JSON.stringify(Object.entries(query.filters).sort())
        || value.items.some(row => query.projectId && row.projectId !== query.projectId || query.filters.status && row.status !== query.filters.status
          || query.filters.priority && row.priority !== query.filters.priority || query.scope === 'mine' && row.assigneePrincipalId !== value.principalId
          || query.filters.assignee && row.assigneePrincipalId !== (query.filters.assignee === 'unassigned' ? null : query.filters.assignee)
          || query.view === 'active' && (row.archivedAt !== null || row.projectArchivedAt !== null)
          || query.view === 'archived' && row.archivedAt === null && row.projectArchivedAt === null)) throw new ProjectTaskFailure(502);
      return value;
    },
    async collaboration(w, p, t, collection, signal, cursor) {
      const value = await request(`${projectPath(w, p)}/tasks/${segment(t)}/${collection}${cursor ? `?cursor=${segment(cursor)}` : ''}`, signal);
      if (!isCollaborationPage(value, collection) || value.workspaceId !== w || value.projectId !== p || value.taskId !== t) throw new ProjectTaskFailure(502);
      return value;
    },
    async commentReview(w, p, t, commentId, signal) {
      const value = await request(`${projectPath(w, p)}/tasks/${segment(t)}/comments/${segment(commentId)}`, signal);
      if (!isRecord(value) || !isTask(value['task']) || !scoped(value['task'], w, p, t) || !isTaskComment(value['comment']) || value['comment'].id !== commentId) throw new ProjectTaskFailure(502);
      return value as unknown as TaskCommentReview;
    },
    projects: (w, view, signal, cursor) => collection(root(w), signal, (v): v is Project => isProject(v) && scoped(v, w), view, cursor),
    async project(w, p, signal) { const value = await request(projectPath(w, p), signal); if (!isProject(value) || !scoped(value, w, p)) throw new ProjectTaskFailure(502); return value; },
    async tasks(w, p, view, signal, cursor, filters = {}) {
      if (!isTaskFilters(filters)) throw new ProjectTaskFailure(400);
      const query = new URLSearchParams({ view, ...filters }); if (cursor) query.set('cursor', cursor);
      const value = await request(`${projectPath(w, p)}/tasks?${query}`, signal);
      if (!isTaskPage(value) || value.items.some(row => !scoped(row, w, p) || filters.status && row.status !== filters.status || filters.priority && row.priority !== filters.priority
        || filters.assignee && row.assigneePrincipalId !== (filters.assignee === 'unassigned' ? null : filters.assignee))
        || value.selectedAssignee !== null && value.selectedAssignee.principalId !== filters.assignee) throw new ProjectTaskFailure(502);
      return value;
    },
    async task(w, p, t, signal) { const value = await request(`${projectPath(w, p)}/tasks/${segment(t)}`, signal); if (!isTask(value) || !scoped(value, w, p, t)) throw new ProjectTaskFailure(502); return value; },
    async access(w, p, signal, cursor) {
      const value = await request(`${projectPath(w, p)}/access${cursor ? `?cursor=${segment(cursor)}` : ''}`, signal);
      if (!isPage(value, isProjectAccessMember) || !isRecord(value) || value['workspaceId'] !== w || value['projectId'] !== p || !Number.isSafeInteger(value['projectVersion']) || Number(value['projectVersion']) < 1) throw new ProjectTaskFailure(502);
      return value as unknown as ProjectAccessPage;
    },
    async assignees(w, p, signal, cursor) {
      const value = await request(`${projectPath(w, p)}/assignees${cursor ? `?cursor=${segment(cursor)}` : ''}`, signal);
      if (!isPage(value, isDomainPerson) || !isRecord(value) || value['workspaceId'] !== w || value['projectId'] !== p || value.items.some(row => !row.active)) throw new ProjectTaskFailure(502);
      return value as unknown as ProjectAssigneePage;
    },
    async accessReview(w, p, principalId, signal) {
      const value = await request(`${projectPath(w, p)}/access/${segment(principalId)}`, signal);
      if (!isRecord(value) || !isProject(value['project']) || !scoped(value['project'], w, p) || !isProjectAccessMember(value['member']) || value['member'].principalId !== principalId) throw new ProjectTaskFailure(502);
      return value as unknown as ProjectAccessReview;
    },
    async mutate(command, key, signal) {
      let path = root(command.workspaceId); let body: unknown;
      switch (command.type) {
        case 'create-project': body = { name: command.name, key: command.key, description: command.description ?? '', visibility: command.visibility ?? 'workspace' }; break;
        case 'change-visibility': path += `/${segment(command.projectId)}/visibility`; body = { expectedVersion: command.expectedVersion, visibility: command.visibility }; break;
        case 'change-access': path += `/${segment(command.projectId)}/access/${segment(command.principalId)}`; body = { expectedVersion: command.expectedVersion, state: command.state }; break;
        case 'edit-project': path += `/${segment(command.projectId)}`; body = { expectedVersion: command.expectedVersion, name: command.name, description: command.description }; break;
        case 'archive-project': case 'restore-project': path += `/${segment(command.projectId)}/${command.type === 'archive-project' ? 'archive' : 'restore'}`; body = { expectedVersion: command.expectedVersion }; break;
        case 'create-task': path += `/${segment(command.projectId)}/tasks`; body = command.fields; break;
        case 'edit-task': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}`; body = { ...command.fields, expectedVersion: command.expectedVersion, ...(command.acknowledgedChildrenVersion ? { acknowledgedChildrenVersion: command.acknowledgedChildrenVersion } : {}) }; break;
        case 'move-task': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/move`; body = { expectedVersion: command.expectedVersion, expectedOrderVersion: command.expectedOrderVersion, status: command.status, beforeTaskId: command.beforeTaskId, ...(command.acknowledgedChildrenVersion ? { acknowledgedChildrenVersion: command.acknowledgedChildrenVersion } : {}) }; break;
        case 'set-task-parent': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/parent`; body = { expectedVersion: command.expectedVersion, parentTaskId: command.parentTaskId, ...(command.expectedParentVersion ? { expectedParentVersion: command.expectedParentVersion } : {}) }; break;
        case 'add-checklist-item': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/checklist`; body = { expectedVersion: command.expectedVersion, text: command.text, beforeItemId: command.beforeItemId }; break;
        case 'edit-checklist-item': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/checklist/${segment(command.itemId)}`; body = { expectedVersion: command.expectedVersion, ...('text' in command ? { text: command.text } : {}), ...('completed' in command ? { completed: command.completed } : {}) }; break;
        case 'move-checklist-item': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/checklist/${segment(command.itemId)}/move`; body = { expectedVersion: command.expectedVersion, beforeItemId: command.beforeItemId }; break;
        case 'remove-checklist-item': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/checklist/${segment(command.itemId)}/remove`; body = { expectedVersion: command.expectedVersion }; break;
        case 'add-comment': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/comments`; body = { expectedVersion: command.expectedVersion, body: command.body }; break;
        case 'edit-comment': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/comments/${segment(command.commentId)}`; body = { expectedVersion: command.expectedVersion, expectedCommentVersion: command.expectedCommentVersion, body: command.body }; break;
        case 'archive-task': case 'restore-task': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/${command.type === 'archive-task' ? 'archive' : 'restore'}`; body = { expectedVersion: command.expectedVersion }; break;
      }
      let value: unknown;
      try { value = await request(path, signal, body, key); }
      catch (error) {
        if (error instanceof ProjectTaskFailure && error.current && !scoped(error.current, command.workspaceId,
          'projectId' in command ? command.projectId : undefined, 'taskId' in command ? command.taskId : undefined)) {
          throw new ProjectTaskFailure(error.status, error.code, null, error.requestId);
        }
        if (error instanceof ProjectTaskFailure && error.accessCurrent && (command.type !== 'change-access' || error.accessCurrent.principalId !== command.principalId)) throw new ProjectTaskFailure(error.status, error.code, error.current, error.requestId);
        throw error;
      }
      const taskCommand = command.type.endsWith('task') || isCollaborationCommand(command);
      if (!(taskCommand ? isTask(value) : isProject(value)) || !scoped(value as ProjectTaskResult, command.workspaceId,
        'projectId' in command ? command.projectId : undefined, 'taskId' in command ? command.taskId : undefined)) throw new ProjectTaskFailure(502);
      return value as ProjectTaskResult;
    },
  };
}
