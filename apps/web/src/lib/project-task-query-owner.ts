import { QueryClient } from '@tanstack/react-query';
import {
  taskStatuses,
  type ArchiveView,
  type Page,
  type WorkspaceSummary,
  type WorkspaceMember,
  type DomainPage,
  type Project,
  type Task,
  type TaskPage,
  type TaskView,
  type ProjectAccessPage,
  type ProjectAssigneePage,
  type TaskDiscoveryQuery,
  type TaskDiscoveryPage,
  type TaskRelations,
  type TaskParentCandidates,
  type TaskChecklist,
  type TaskComments,
  type TaskHistory,
  type TaskStatus,
  type TaskInvalidation,
  type TaskCollaborationPages,
} from '@rielia/contracts';
import { createClientQueryResource, type ClientQueryResource } from './client-query-resource.ts';
import { freezeSprintValue } from './sprint-client-state.ts';
import { ProjectTaskFailure, type ProjectTaskTransport } from './project-task-client.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import {
  workspacePages,
  memberPages,
  projectPages,
  taskPages,
  accessPages,
  assigneePages,
  discoveryPages,
  collaborationPages,
  canonicalDiscovery,
  sameDiscoveryRoot,
  admitPage,
} from './project-task-query-pages.ts';

export interface ProjectTaskQueryData {
  workspaces: Page<WorkspaceSummary>;
  workspace: WorkspaceSummary;
  members: Page<WorkspaceMember>;
  projects: DomainPage<Project>;
  project: Project;
  tasks: TaskPage;
  task: Task;
  projectAccess: ProjectAccessPage;
  assignees: ProjectAssigneePage;
  discovery: TaskDiscoveryPage;
  relations: TaskRelations;
  'parent-candidates': TaskParentCandidates;
  checklist: TaskChecklist;
  comments: TaskComments;
  history: TaskHistory;
}
export type ProjectTaskQueryName = keyof ProjectTaskQueryData;
export type ProjectTaskQueryResources = {
  [Name in ProjectTaskQueryName]: ClientQueryResource<ProjectTaskQueryData[Name]>;
} & { columns: Record<TaskStatus, ClientQueryResource<TaskPage>> };
export interface ProjectTaskQuerySelection {
  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
  views: { projects: ArchiveView; tasks: ArchiveView };
  taskView: TaskView;
  discovery: TaskDiscoveryQuery | null;
  parentCandidatesWanted: boolean;
}
export interface ProjectTaskInvalidation {
  resources: ProjectTaskQueryName[];
  columns: boolean;
}

/** One private route lifetime. DTOs live only in the actual Query observers. */
export function createProjectTaskQueryOwner(options: {
  workspaces: Pick<WorkspaceTransport, 'workspaces' | 'detail' | 'members'>;
  transport: ProjectTaskTransport;
  changed: () => void;
  authorized: () => boolean;
  denied: (reason: 'signed-out' | 'forbidden') => void;
  client?: QueryClient;
}) {
  const client =
    options.client ??
    new QueryClient({
      defaultOptions: { mutations: { retry: false, gcTime: 0, networkMode: 'always' } },
    });
  const slotOptions = {
    ...options,
    changed: notify,
    client,
    freeze: freezeSprintValue,
    failure: (error: unknown) =>
      error instanceof ProjectTaskFailure
        ? { status: error.status, code: error.code, requestId: error.requestId }
        : error instanceof WorkspaceFailure
          ? { status: error.status, code: error.code, requestId: null }
          : { status: 0, code: null, requestId: null },
    pageChanged: () => new ProjectTaskFailure(409, 'page-changed'),
    // Local malformed-response 502 is deliberately excluded: it is not evidence
    // of a retryable upstream failure. Only explicit same-chain append intent retries.
    explicitAppendRetry: (failure: { status: number; code: string | null }) =>
      failure.code !== 'page-changed' && [0, 408, 429, 500, 503, 504].includes(failure.status),
  };
  const slot = <Value>() => createClientQueryResource<Value>(slotOptions);
  const slots = {
    workspaces: slot<Page<WorkspaceSummary>>(),
    workspace: slot<WorkspaceSummary>(),
    members: slot<Page<WorkspaceMember>>(),
    projects: slot<DomainPage<Project>>(),
    project: slot<Project>(),
    tasks: slot<TaskPage>(),
    task: slot<Task>(),
    projectAccess: slot<ProjectAccessPage>(),
    assignees: slot<ProjectAssigneePage>(),
    discovery: slot<TaskDiscoveryPage>(),
    relations: slot<TaskRelations>(),
    'parent-candidates': slot<TaskParentCandidates>(),
    checklist: slot<TaskChecklist>(),
    comments: slot<TaskComments>(),
    history: slot<TaskHistory>(),
  };
  const columns = {
    backlog: slot<TaskPage>(),
    todo: slot<TaskPage>(),
    in_progress: slot<TaskPage>(),
    done: slot<TaskPage>(),
    canceled: slot<TaskPage>(),
  };
  let synchronizing = false;
  let observedTask = '';
  function notify() {
    if (!synchronizing) {
      synchronizing = true;
      try {
        const project = slots.project.resource().data;
        if (slots.projectAccess.resource().data && !project?.capabilities.canManageAccess)
          slots.projectAccess.clear();
        else if (
          slots.projectAccess.resource().data &&
          slots.projectAccess.resource().data?.projectVersion !== project?.version &&
          !slots.projectAccess.resource().stale
        )
          slots.projectAccess.invalidate();
        const task = slots.task.resource().data;
        const taskResource = slots.task.resource();
        const taskBinding =
          task && taskResource.status === 'ready' && !taskResource.stale
            ? JSON.stringify([
                task.workspaceId,
                task.projectId,
                task.id,
                task.version,
                task.orderVersion,
              ])
            : '';
        if (taskBinding && taskBinding !== observedTask) {
          observedTask = taskBinding;
          for (const chain of [slots.tasks, ...Object.values(columns)]) {
            const page = chain.resource();
            const row = page.data?.items.find((item) => item.id === task!.id);
            if (
              page.data &&
              !page.stale &&
              (page.data.orderVersion !== task!.orderVersion ||
                (row && row.version !== task!.version))
            )
              chain.invalidate();
          }
        }
        for (const name of [
          'relations',
          'parent-candidates',
          'checklist',
          'comments',
          'history',
        ] as const) {
          const resource = slots[name].resource();
          if (
            resource.data &&
            !resource.stale &&
            resource.data.revision !==
              (name === 'relations' || name === 'parent-candidates'
                ? task?.orderVersion
                : task?.version)
          )
            slots[name].invalidate();
        }
      } finally {
        synchronizing = false;
      }
    }
    options.changed();
  }
  let epoch: string | null = null;
  let selection: ProjectTaskQuerySelection | null = null;
  const all = () => [...Object.values(slots), ...Object.values(columns)];
  function clear() {
    epoch = null;
    selection = null;
    observedTask = '';
    all().forEach((value) => value.clear());
    client.clear();
    options.changed();
  }
  function key(
    name: string,
    w: string | null,
    p: string | null,
    t: string | null,
    selectors: unknown = null,
  ) {
    return ['project-task', epoch, w, p, t, name, selectors];
  }
  function bind(value: string) {
    if (epoch === value) return;
    clear();
    epoch = value;
    slots.workspaces.bind({
      key: key('workspaces', null, null, null),
      load: (signal, cursor) => options.workspaces.workspaces(signal, cursor),
      page: workspacePages(),
      admit: admitPage,
    });
  }
  function changed() {
    throw new ProjectTaskFailure(409, 'page-changed');
  }
  function select(value: ProjectTaskQuerySelection) {
    if (!epoch) return;
    selection = freezeSprintValue(structuredClone(value));
    const { workspaceId: w, projectId: p, taskId: t, views, taskView, discovery } = selection;
    const filters = Object.entries(taskView.filters).sort();
    slots.workspace.bind(
      w
        ? {
            key: key('workspace', w, null, null),
            load: (signal) => options.workspaces.detail(w, signal),
            admit: (record) => {
              if (record.id !== w) throw new WorkspaceFailure(502);
            },
          }
        : null,
    );
    slots.members.bind(
      w
        ? {
            key: key('members', w, null, null),
            load: (signal, cursor) => options.workspaces.members(w, signal, cursor),
            page: memberPages(),
            admit: admitPage,
          }
        : null,
    );
    slots.projects.bind(
      w
        ? {
            key: key('projects', w, null, null, views.projects),
            load: (signal, cursor) => options.transport.projects(w, views.projects, signal, cursor),
            page: projectPages(),
            admit(record) {
              admitPage(record);
              if (record.items.some((row) => row.workspaceId !== w))
                throw new ProjectTaskFailure(502);
            },
          }
        : null,
    );
    slots.project.bind(
      w && p
        ? {
            key: key('project', w, p, null),
            load: (signal) => options.transport.project(w, p, signal),
            admit(record) {
              if (record.workspaceId !== w || record.id !== p) throw new ProjectTaskFailure(502);
            },
          }
        : null,
    );
    slots.task.bind(
      w && p && t
        ? {
            key: key('task', w, p, t),
            load: (signal) => options.transport.task(w, p, t, signal),
            admit(record) {
              if (record.workspaceId !== w || record.projectId !== p || record.id !== t)
                throw new ProjectTaskFailure(502);
            },
          }
        : null,
    );
    function admitTasks(record: TaskPage) {
      admitPage(record);
      if (record.items.some((row) => row.workspaceId !== w || row.projectId !== p))
        throw new ProjectTaskFailure(502);
    }
    slots.tasks.bind(
      w && p && taskView.layout === 'list'
        ? {
            key: key('tasks', w, p, null, [views.tasks, filters]),
            load: (signal, cursor) =>
              options.transport.tasks(w, p, views.tasks, signal, cursor, taskView.filters),
            page: taskPages(),
            admit: admitTasks,
          }
        : null,
    );
    for (const status of taskStatuses)
      columns[status].bind(
        w && p && taskView.layout === 'board'
          ? {
              key: key('column', w, p, null, [views.tasks, filters, status]),
              load: (signal, cursor) =>
                options.transport.tasks(w, p, views.tasks, signal, cursor, {
                  ...taskView.filters,
                  status,
                }),
              page: taskPages(),
              admit: admitTasks,
            }
          : null,
      );
    slots.assignees.bind(
      w && p
        ? {
            key: key('assignees', w, p, null),
            load: (signal, cursor) => options.transport.assignees(w, p, signal, cursor),
            page: assigneePages(),
            admit(record) {
              admitPage(record);
              if (record.workspaceId !== w || record.projectId !== p)
                throw new ProjectTaskFailure(502);
            },
          }
        : null,
    );
    slots.discovery.bind(
      w && discovery
        ? {
            key: key('discovery', w, null, null, canonicalDiscovery({ query: discovery })),
            load: (signal, cursor) => options.transport.discover(w, discovery, signal, cursor),
            page: discoveryPages(),
            retainRoot: sameDiscoveryRoot,
            admit(record) {
              admitPage(record);
              if (
                record.workspaceId !== w ||
                JSON.stringify(canonicalDiscovery(record)) !==
                  JSON.stringify(canonicalDiscovery({ query: discovery }))
              )
                throw new ProjectTaskFailure(502);
            },
          }
        : null,
    );
    administer();
    bindCollaboration(slots['relations'], 'relations', collaborationPages<'relations'>());
    bindCollaboration(
      slots['parent-candidates'],
      'parent-candidates',
      collaborationPages<'parent-candidates'>(),
    );
    bindCollaboration(slots['checklist'], 'checklist', collaborationPages<'checklist'>());
    bindCollaboration(slots['comments'], 'comments', collaborationPages<'comments'>());
    bindCollaboration(slots['history'], 'history', collaborationPages<'history'>());
    options.changed();
  }
  function administer() {
    const w = selection?.workspaceId;
    const p = selection?.projectId;
    const project = slots.project.resource();
    slots.projectAccess.bind(
      w && p && project.data?.capabilities.canManageAccess
        ? {
            key: key('projectAccess', w, p, null),
            load: (signal, cursor) => options.transport.access(w, p, signal, cursor),
            page: accessPages(),
            admit(record) {
              admitPage(record);
              if (record.workspaceId !== w || record.projectId !== p)
                throw new ProjectTaskFailure(502);
              if (record.projectVersion !== slots.project.resource().data?.version) changed();
            },
          }
        : null,
    );
  }
  function bindCollaboration<
    K extends 'relations' | 'parent-candidates' | 'checklist' | 'comments' | 'history',
  >(
    target: ReturnType<typeof createClientQueryResource<TaskCollaborationPages[K]>>,
    name: K,
    page: ReturnType<typeof collaborationPages<K>>,
  ) {
    const w = selection?.workspaceId;
    const p = selection?.projectId;
    const t = selection?.taskId;
    const wanted = name !== 'parent-candidates' || selection?.parentCandidatesWanted;
    target.bind(
      w && p && t && wanted
        ? {
            key: key(name, w, p, t),
            load: (signal, cursor) =>
              options.transport.collaboration(w, p, t, name, signal, cursor),
            page,
            admit(record) {
              admitPage(record);
              if (record.workspaceId !== w || record.projectId !== p || record.taskId !== t)
                throw new ProjectTaskFailure(502);
              const task = slots.task.resource().data;
              if (
                !task ||
                record.revision !==
                  (name === 'relations' || name === 'parent-candidates'
                    ? task.orderVersion
                    : task.version)
              )
                changed();
            },
          }
        : null,
    );
  }
  function resources(): ProjectTaskQueryResources {
    return {
      workspaces: slots.workspaces.resource(),
      workspace: slots.workspace.resource(),
      members: slots.members.resource(),
      projects: slots.projects.resource(),
      project: slots.project.resource(),
      tasks: slots.tasks.resource(),
      task: slots.task.resource(),
      projectAccess: slots.projectAccess.resource(),
      assignees: slots.assignees.resource(),
      discovery: slots.discovery.resource(),
      relations: slots.relations.resource(),
      'parent-candidates': slots['parent-candidates'].resource(),
      checklist: slots.checklist.resource(),
      comments: slots.comments.resource(),
      history: slots.history.resource(),
      columns: {
        backlog: columns.backlog.resource(),
        todo: columns.todo.resource(),
        in_progress: columns.in_progress.resource(),
        done: columns.done.resource(),
        canceled: columns.canceled.resource(),
      },
    };
  }
  function invalidate(affected?: ProjectTaskInvalidation) {
    (affected ? affected.resources.map((name) => slots[name]) : Object.values(slots)).forEach(
      (value) => value.invalidate(),
    );
    if (!affected || affected.columns)
      Object.values(columns).forEach((value) => value.invalidate());
    options.changed();
  }
  function relevance(event: TaskInvalidation): ProjectTaskInvalidation {
    if (!selection || event.type !== 'invalidate') return { resources: [], columns: false };
    const selected = event.projectId === selection.projectId;
    const discovery = selection.discovery;
    const resources: ProjectTaskQueryName[] = [];
    if (discovery && (!discovery.projectId || discovery.projectId === event.projectId))
      resources.push('discovery');
    if (event.entity === 'project') resources.push('projects');
    if (selected) {
      resources.push(
        'tasks',
        'task',
        'relations',
        'parent-candidates',
        'checklist',
        'comments',
        'history',
      );
      if (event.entity === 'project') resources.push('project', 'projectAccess', 'assignees');
    }
    return { resources, columns: selected };
  }
  return {
    bind,
    select,
    clear,
    resources,
    invalidate,
    relevance,
    administer,
    cancel() {
      const capturedEpoch = epoch;
      const capturedSelection = selection;
      for (const value of all()) {
        if (epoch !== capturedEpoch || selection !== capturedSelection) return;
        value.cancel();
      }
    },
    read: (name: ProjectTaskQueryName, more = false, revalidate = false) => {
      if (
        name === 'discovery' &&
        more &&
        (slots.discovery.resource().data?.items.length ?? 0) >= 1000
      )
        return Promise.resolve();
      return slots[name].read(more, revalidate);
    },
    readColumn: (status: TaskStatus, more = false) => columns[status].read(more),
  };
}
