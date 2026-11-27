import {
  isRecord,
  isProjectPage,
  isProjectAccessPage,
  isProjectAssigneePage,
  isProjectAccessReview,
  isProject,
  isTask,
  isTaskPage,
  isTaskFilters,
  type TaskFilters,
  type TaskPage,
  isProjectAccessMember,
  type ArchiveView,
  type DomainPage,
  type Project,
  type ProjectCommand,
  type ProjectTaskResult,
  type Task,
  type ProjectAccessPage,
  type ProjectAssigneePage,
  type ProjectAccessMember,
  type ProjectAccessReview,
} from '@rielia/contracts';

import { createContractRequest } from './api-contract-client.ts';
import {
  isCollaborationPage,
  isTaskCommentReview,
  isCloseWarning,
  isCollaborationCommand,
  type CloseWarning,
  type CollaborationCollection,
  type TaskCollaborationPages,
  type TaskCommentReview,
} from '@rielia/contracts';
import {
  isTaskDiscoveryPage,
  isTaskDiscoveryQuery,
  type TaskDiscoveryQuery,
  type TaskDiscoveryPage,
} from '@rielia/contracts';

export class ProjectTaskFailure extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly current: ProjectTaskResult | null;
  readonly requestId: string | null;
  readonly accessCurrent: ProjectAccessMember | null;
  readonly closeWarning: CloseWarning | null;
  constructor(
    status: number,
    code: string | null = null,
    current: ProjectTaskResult | null = null,
    requestId: string | null = null,
    accessCurrent: ProjectAccessMember | null = null,
    closeWarning: CloseWarning | null = null,
  ) {
    super('Project/task request failed.');
    this.status = status;
    this.code = code;
    this.current = current;
    this.requestId = requestId;
    this.accessCurrent = accessCurrent;
    this.closeWarning = closeWarning;
  }
}
export interface ProjectTaskTransport {
  discover(
    workspaceId: string,
    query: TaskDiscoveryQuery,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<TaskDiscoveryPage>;
  projects(
    workspaceId: string,
    view: ArchiveView,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<DomainPage<Project>>;
  project(workspaceId: string, projectId: string, signal: AbortSignal): Promise<Project>;
  tasks(
    workspaceId: string,
    projectId: string,
    view: ArchiveView,
    signal: AbortSignal,
    cursor?: string,
    filters?: TaskFilters,
  ): Promise<TaskPage>;
  task(workspaceId: string, projectId: string, taskId: string, signal: AbortSignal): Promise<Task>;
  access(
    workspaceId: string,
    projectId: string,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<ProjectAccessPage>;
  accessReview(
    workspaceId: string,
    projectId: string,
    principalId: string,
    signal: AbortSignal,
  ): Promise<ProjectAccessReview>;
  assignees(
    workspaceId: string,
    projectId: string,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<ProjectAssigneePage>;
  mutate(command: ProjectCommand, key: string, signal: AbortSignal): Promise<ProjectTaskResult>;
  collaboration<K extends CollaborationCollection>(
    workspaceId: string,
    projectId: string,
    taskId: string,
    collection: K,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<TaskCollaborationPages[K]>;
  commentReview(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    signal: AbortSignal,
  ): Promise<TaskCommentReview>;
}
const projectsPath = '/api/v1/workspaces/{workspaceId}/projects';
const projectPath = `${projectsPath}/{projectId}`;
const taskPath = `${projectPath}/tasks/{taskId}`;
export function createProjectTaskTransport(
  options: { baseURL?: string; timeout?: number } = {},
): ProjectTaskTransport {
  const send = createContractRequest(options);
  async function read(response: Response): Promise<unknown> {
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new ProjectTaskFailure(
        response.ok ? 502 : response.status,
        null,
        null,
        response.headers.get('x-request-id'),
      );
    }
    if (!response.ok)
      throw new ProjectTaskFailure(
        response.status,
        isRecord(value) && typeof value['code'] === 'string' ? value['code'] : null,
        isRecord(value) && (isTask(value['current']) || isProject(value['current']))
          ? value['current']
          : null,
        response.headers.get('x-request-id'),
        isRecord(value) && isProjectAccessMember(value['accessCurrent'])
          ? value['accessCurrent']
          : null,
        isRecord(value) && isCloseWarning(value['closeWarning']) ? value['closeWarning'] : null,
      );
    return value;
  }
  function scoped(value: ProjectTaskResult, w: string, p?: string, t?: string) {
    return (
      value.workspaceId === w &&
      (p === undefined || ('projectId' in value ? value.projectId === p : value.id === p)) &&
      (t === undefined || value.id === t)
    );
  }
  return {
    async discover(w, query, signal, cursor) {
      if (!isTaskDiscoveryQuery(query)) throw new ProjectTaskFailure(400);
      const params = {
        scope: query.scope,
        q: query.q.trim(),
        view: query.view,
        ...query.filters,
        ...(query.projectId ? { project: query.projectId } : {}),
        ...(cursor ? { cursor } : {}),
      };
      const value = await read(
        await send('get', '/api/v1/workspaces/{workspaceId}/task-discovery', {
          path: { workspaceId: w },
          query: params,
          signal,
        }),
      );
      if (
        !isTaskDiscoveryPage(value) ||
        value.workspaceId !== w ||
        value.query.scope !== query.scope ||
        value.query.q !== query.q.trim() ||
        value.query.view !== query.view ||
        value.query.projectId !== query.projectId ||
        JSON.stringify(Object.entries(value.query.filters).sort()) !==
          JSON.stringify(Object.entries(query.filters).sort()) ||
        value.items.some(
          (row) =>
            (query.projectId && row.projectId !== query.projectId) ||
            (query.filters.status && row.status !== query.filters.status) ||
            (query.filters.priority && row.priority !== query.filters.priority) ||
            (query.scope === 'mine' && row.assigneePrincipalId !== value.principalId) ||
            (query.filters.assignee &&
              row.assigneePrincipalId !==
                (query.filters.assignee === 'unassigned' ? null : query.filters.assignee)) ||
            (query.view === 'active' &&
              (row.archivedAt !== null || row.projectArchivedAt !== null)) ||
            (query.view === 'archived' &&
              row.archivedAt === null &&
              row.projectArchivedAt === null),
        )
      )
        throw new ProjectTaskFailure(502);
      return value;
    },
    async collaboration(w, p, t, collection, signal, cursor) {
      const input = {
        path: { workspaceId: w, projectId: p, taskId: t },
        signal,
        ...(cursor ? { query: { cursor } } : {}),
      };
      let response: Response;
      switch (collection) {
        case 'relations':
          response = await send('get', `${taskPath}/relations`, input);
          break;
        case 'parent-candidates':
          response = await send('get', `${taskPath}/parent-candidates`, input);
          break;
        case 'checklist':
          response = await send('get', `${taskPath}/checklist`, input);
          break;
        case 'comments':
          response = await send('get', `${taskPath}/comments`, input);
          break;
        case 'history':
          response = await send('get', `${taskPath}/history`, input);
          break;
      }
      const value = await read(response);
      if (
        !isCollaborationPage(value, collection) ||
        value.workspaceId !== w ||
        value.projectId !== p ||
        value.taskId !== t
      )
        throw new ProjectTaskFailure(502);
      return value;
    },
    async commentReview(w, p, t, commentId, signal) {
      const value = await read(
        await send('get', `${taskPath}/comments/{commentId}`, {
          path: { workspaceId: w, projectId: p, taskId: t, commentId },
          signal,
        }),
      );
      if (
        !isRecord(value) ||
        !isTask(value['task']) ||
        !scoped(value['task'], w, p, t) ||
        !isTaskCommentReview(value) ||
        value.comment.id !== commentId
      )
        throw new ProjectTaskFailure(502);
      return value;
    },
    async projects(w, view, signal, cursor) {
      const value = await read(
        await send('get', projectsPath, {
          path: { workspaceId: w },
          query: { view, ...(cursor ? { cursor } : {}) },
          signal,
        }),
      );
      if (!isProjectPage(value)) throw new ProjectTaskFailure(502);
      if (value.items.some((row) => !scoped(row, w))) throw new ProjectTaskFailure(502);
      return value;
    },
    async project(w, p, signal) {
      const value = await read(
        await send('get', projectPath, { path: { workspaceId: w, projectId: p }, signal }),
      );
      if (!isProject(value) || !scoped(value, w, p)) throw new ProjectTaskFailure(502);
      return value;
    },
    async tasks(w, p, view, signal, cursor, filters = {}) {
      if (!isTaskFilters(filters)) throw new ProjectTaskFailure(400);
      const value = await read(
        await send('get', `${projectPath}/tasks`, {
          path: { workspaceId: w, projectId: p },
          query: { view, ...filters, ...(cursor ? { cursor } : {}) },
          signal,
        }),
      );
      if (
        !isTaskPage(value) ||
        value.items.some(
          (row) =>
            !scoped(row, w, p) ||
            (filters.status && row.status !== filters.status) ||
            (filters.priority && row.priority !== filters.priority) ||
            (filters.assignee &&
              row.assigneePrincipalId !==
                (filters.assignee === 'unassigned' ? null : filters.assignee)),
        ) ||
        (value.selectedAssignee !== null && value.selectedAssignee.principalId !== filters.assignee)
      )
        throw new ProjectTaskFailure(502);
      return value;
    },
    async task(w, p, t, signal) {
      const value = await read(
        await send('get', taskPath, { path: { workspaceId: w, projectId: p, taskId: t }, signal }),
      );
      if (!isTask(value) || !scoped(value, w, p, t)) throw new ProjectTaskFailure(502);
      return value;
    },
    async access(w, p, signal, cursor) {
      const value = await read(
        await send('get', `${projectPath}/access`, {
          path: { workspaceId: w, projectId: p },
          signal,
          ...(cursor ? { query: { cursor } } : {}),
        }),
      );
      if (!isProjectAccessPage(value)) throw new ProjectTaskFailure(502);
      if (value.workspaceId !== w || value.projectId !== p) throw new ProjectTaskFailure(502);
      return value;
    },
    async assignees(w, p, signal, cursor) {
      const value = await read(
        await send('get', `${projectPath}/assignees`, {
          path: { workspaceId: w, projectId: p },
          signal,
          ...(cursor ? { query: { cursor } } : {}),
        }),
      );
      if (!isProjectAssigneePage(value)) throw new ProjectTaskFailure(502);
      if (value.workspaceId !== w || value.projectId !== p) throw new ProjectTaskFailure(502);
      return value;
    },
    async accessReview(w, p, principalId, signal) {
      const value = await read(
        await send('get', `${projectPath}/access/{principalId}`, {
          path: { workspaceId: w, projectId: p, principalId },
          signal,
        }),
      );
      if (!isProjectAccessReview(value)) throw new ProjectTaskFailure(502);
      if (!scoped(value.project, w, p) || value.member.principalId !== principalId)
        throw new ProjectTaskFailure(502);
      return value;
    },
    async mutate(command, key, signal) {
      let response: Response;
      switch (command.type) {
        case 'create-project':
          response = await send('post', projectsPath, {
            path: { workspaceId: command.workspaceId },
            body: {
              name: command.name,
              key: command.key,
              description: command.description ?? '',
              visibility: command.visibility ?? 'workspace',
            },
            key,
            signal,
          });
          break;
        case 'change-visibility':
          response = await send('post', `${projectPath}/visibility`, {
            path: { workspaceId: command.workspaceId, projectId: command.projectId },
            body: { expectedVersion: command.expectedVersion, visibility: command.visibility },
            key,
            signal,
          });
          break;
        case 'change-access':
          response = await send('post', `${projectPath}/access/{principalId}`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              principalId: command.principalId,
            },
            body: { expectedVersion: command.expectedVersion, state: command.state },
            key,
            signal,
          });
          break;
        case 'edit-project':
          response = await send('post', projectPath, {
            path: { workspaceId: command.workspaceId, projectId: command.projectId },
            body: {
              expectedVersion: command.expectedVersion,
              name: command.name,
              description: command.description,
            },
            key,
            signal,
          });
          break;
        case 'archive-project':
          response = await send('post', `${projectPath}/archive`, {
            path: { workspaceId: command.workspaceId, projectId: command.projectId },
            body: { expectedVersion: command.expectedVersion },
            key,
            signal,
          });
          break;
        case 'restore-project':
          response = await send('post', `${projectPath}/restore`, {
            path: { workspaceId: command.workspaceId, projectId: command.projectId },
            body: { expectedVersion: command.expectedVersion },
            key,
            signal,
          });
          break;
        case 'create-task':
          response = await send('post', `${projectPath}/tasks`, {
            path: { workspaceId: command.workspaceId, projectId: command.projectId },
            body: command.fields,
            key,
            signal,
          });
          break;
        case 'edit-task':
          response = await send('post', taskPath, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: {
              ...command.fields,
              expectedVersion: command.expectedVersion,
              ...(command.acknowledgedChildrenVersion
                ? { acknowledgedChildrenVersion: command.acknowledgedChildrenVersion }
                : {}),
            },
            key,
            signal,
          });
          break;
        case 'move-task':
          response = await send('post', `${taskPath}/move`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: {
              expectedVersion: command.expectedVersion,
              expectedOrderVersion: command.expectedOrderVersion,
              status: command.status,
              beforeTaskId: command.beforeTaskId,
              ...(command.acknowledgedChildrenVersion
                ? { acknowledgedChildrenVersion: command.acknowledgedChildrenVersion }
                : {}),
            },
            key,
            signal,
          });
          break;
        case 'set-task-parent':
          response = await send('post', `${taskPath}/parent`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body:
              command.parentTaskId === null
                ? {
                    expectedVersion: command.expectedVersion,
                    parentTaskId: null,
                    ...(command.expectedParentVersion
                      ? { expectedParentVersion: command.expectedParentVersion }
                      : {}),
                  }
                : {
                    expectedVersion: command.expectedVersion,
                    parentTaskId: command.parentTaskId,
                    ...(command.expectedParentVersion
                      ? { expectedParentVersion: command.expectedParentVersion }
                      : {}),
                  },
            key,
            signal,
          });
          break;
        case 'add-checklist-item':
          response = await send('post', `${taskPath}/checklist`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: {
              expectedVersion: command.expectedVersion,
              text: command.text,
              beforeItemId: command.beforeItemId,
            },
            key,
            signal,
          });
          break;
        case 'edit-checklist-item':
          response = await send('post', `${taskPath}/checklist/{itemId}`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
              itemId: command.itemId,
            },
            body: {
              expectedVersion: command.expectedVersion,
              ...('text' in command ? { text: command.text } : {}),
              ...('completed' in command ? { completed: command.completed } : {}),
            },
            key,
            signal,
          });
          break;
        case 'move-checklist-item':
          response = await send('post', `${taskPath}/checklist/{itemId}/move`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
              itemId: command.itemId,
            },
            body: { expectedVersion: command.expectedVersion, beforeItemId: command.beforeItemId },
            key,
            signal,
          });
          break;
        case 'remove-checklist-item':
          response = await send('post', `${taskPath}/checklist/{itemId}/remove`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
              itemId: command.itemId,
            },
            body: { expectedVersion: command.expectedVersion },
            key,
            signal,
          });
          break;
        case 'add-comment':
          response = await send('post', `${taskPath}/comments`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: { expectedVersion: command.expectedVersion, body: command.body },
            key,
            signal,
          });
          break;
        case 'edit-comment':
          response = await send('post', `${taskPath}/comments/{commentId}`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
              commentId: command.commentId,
            },
            body: {
              expectedVersion: command.expectedVersion,
              expectedCommentVersion: command.expectedCommentVersion,
              body: command.body,
            },
            key,
            signal,
          });
          break;
        case 'archive-task':
          response = await send('post', `${taskPath}/archive`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: { expectedVersion: command.expectedVersion },
            key,
            signal,
          });
          break;
        case 'restore-task':
          response = await send('post', `${taskPath}/restore`, {
            path: {
              workspaceId: command.workspaceId,
              projectId: command.projectId,
              taskId: command.taskId,
            },
            body: { expectedVersion: command.expectedVersion },
            key,
            signal,
          });
          break;
      }
      let value: unknown;
      try {
        value = await read(response);
      } catch (error) {
        if (
          error instanceof ProjectTaskFailure &&
          error.current &&
          !scoped(
            error.current,
            command.workspaceId,
            'projectId' in command ? command.projectId : undefined,
            'taskId' in command ? command.taskId : undefined,
          )
        ) {
          throw new ProjectTaskFailure(error.status, error.code, null, error.requestId);
        }
        if (
          error instanceof ProjectTaskFailure &&
          error.accessCurrent &&
          (command.type !== 'change-access' ||
            error.accessCurrent.principalId !== command.principalId)
        )
          throw new ProjectTaskFailure(error.status, error.code, error.current, error.requestId);
        throw error;
      }
      const taskCommand = command.type.endsWith('task') || isCollaborationCommand(command);
      if (
        !(taskCommand ? isTask(value) : isProject(value)) ||
        !scoped(
          value as ProjectTaskResult,
          command.workspaceId,
          'projectId' in command ? command.projectId : undefined,
          'taskId' in command ? command.taskId : undefined,
        )
      )
        throw new ProjectTaskFailure(502);
      return value as ProjectTaskResult;
    },
  };
}
