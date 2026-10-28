import { isPage, isRecord, isProject, isTask, type ArchiveView, type DomainPage, type Project, type ProjectTaskCommand, type ProjectTaskResult, type Task } from '@rielia/contracts';

export class ProjectTaskFailure extends Error {
  constructor(readonly status: number, readonly code: string | null = null, readonly current: ProjectTaskResult | null = null, readonly requestId: string | null = null) { super('Project/task request failed.'); }
}
export interface ProjectTaskTransport {
  projects(workspaceId: string, view: ArchiveView, signal: AbortSignal, cursor?: string): Promise<DomainPage<Project>>;
  project(workspaceId: string, projectId: string, signal: AbortSignal): Promise<Project>;
  tasks(workspaceId: string, projectId: string, view: ArchiveView, signal: AbortSignal, cursor?: string): Promise<DomainPage<Task>>;
  task(workspaceId: string, projectId: string, taskId: string, signal: AbortSignal): Promise<Task>;
  mutate(command: ProjectTaskCommand, key: string, signal: AbortSignal): Promise<ProjectTaskResult>;
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
      isRecord(value) && (isTask(value['current']) || isProject(value['current'])) ? value['current'] : null, response.headers.get('x-request-id'));
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
    projects: (w, view, signal, cursor) => collection(root(w), signal, (v): v is Project => isProject(v) && scoped(v, w), view, cursor),
    async project(w, p, signal) { const value = await request(projectPath(w, p), signal); if (!isProject(value) || !scoped(value, w, p)) throw new ProjectTaskFailure(502); return value; },
    tasks: (w, p, view, signal, cursor) => collection(`${projectPath(w, p)}/tasks`, signal, (v): v is Task => isTask(v) && scoped(v, w, p), view, cursor),
    async task(w, p, t, signal) { const value = await request(`${projectPath(w, p)}/tasks/${segment(t)}`, signal); if (!isTask(value) || !scoped(value, w, p, t)) throw new ProjectTaskFailure(502); return value; },
    async mutate(command, key, signal) {
      let path = root(command.workspaceId); let body: unknown;
      switch (command.type) {
        case 'create-project': body = { name: command.name, key: command.key, description: command.description ?? '' }; break;
        case 'edit-project': path += `/${segment(command.projectId)}`; body = { expectedVersion: command.expectedVersion, name: command.name, description: command.description }; break;
        case 'archive-project': case 'restore-project': path += `/${segment(command.projectId)}/${command.type === 'archive-project' ? 'archive' : 'restore'}`; body = { expectedVersion: command.expectedVersion }; break;
        case 'create-task': path += `/${segment(command.projectId)}/tasks`; body = command.fields; break;
        case 'edit-task': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}`; body = { ...command.fields, expectedVersion: command.expectedVersion }; break;
        case 'archive-task': case 'restore-task': path += `/${segment(command.projectId)}/tasks/${segment(command.taskId)}/${command.type === 'archive-task' ? 'archive' : 'restore'}`; body = { expectedVersion: command.expectedVersion }; break;
      }
      const value = await request(path, signal, body, key);
      const taskCommand = command.type.endsWith('task');
      if (!(taskCommand ? isTask(value) : isProject(value)) || !scoped(value as ProjectTaskResult, command.workspaceId,
        'projectId' in command ? command.projectId : undefined, 'taskId' in command ? command.taskId : undefined)) throw new ProjectTaskFailure(502);
      return value as ProjectTaskResult;
    },
  };
}
