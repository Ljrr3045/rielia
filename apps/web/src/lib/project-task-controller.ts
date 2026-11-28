import {
  isTaskFilters,
  taskStatuses,
  projectURL,
  taskURL,
  type DomainPerson,
  type TaskStatus,
  type TaskInvalidation,
  type TaskView,
  type TaskFilters,
  type TaskPage,
  type ArchiveView,
  type DomainPage,
  type Page,
  type Project,
  type ProjectCommand,
  type ProjectTaskResult,
  type Task,
  type ProjectAccessPage,
  type ProjectAssigneePage,
  type ProjectAccessMember,
  type WorkspaceMember,
  type WorkspaceSummary,
} from '@rielia/contracts';
import {
  parseIdentityConfiguration,
  parseIdentitySession,
  type IdentitySession,
  type IdentityTransport,
} from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import { ProjectTaskFailure, type ProjectTaskTransport } from './project-task-client.ts';
import {
  collaborationCollections,
  isCollaborationCommand,
  type CollaborationCollection,
  type CloseWarning,
  type TaskComment,
  type TaskChecklist,
} from '@rielia/contracts';
import { emptyCollaboration, type CollaborationState } from './task-collaboration-state.ts';
import {
  isTaskSearch,
  type TaskScope,
  type TaskDiscoveryItem,
  type TaskDiscoveryPage,
  type TaskDiscoveryQuery,
} from '@rielia/contracts';
import {
  createProjectTaskQueryOwner,
  type ProjectTaskQueryResources,
  type ProjectTaskQueryName,
  type ProjectTaskInvalidation,
} from './project-task-query-owner.ts';
import { freezeSprintValue } from './sprint-client-state.ts';
import type { TaskStreamStatus } from './task-events-client.ts';
import {
  readProjectSprintLocation,
  writeProjectSprintLocation,
  type ProjectSprintLocation,
} from './project-sprint-location.ts';

export interface ProjectNavigationBlocker {
  getGuard: () => 'none' | 'draft' | 'pending' | 'recovery';
  discard: () => boolean;
}

export interface ProjectTaskSelection {
  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
}
type PolicyCollection = 'projectAccess' | 'assignees';
interface PolicyPageFailure {
  requestId: string | null;
  reason?: 'changed';
}
export type MoveEligibility =
  | 'ready'
  | 'pending'
  | 'recovery'
  | 'draft'
  | 'changed'
  | 'unavailable'
  | 'forbidden'
  | 'invalid-destination'
  | 'different-detail';
export interface TaskSummary {
  status: 'loading' | 'ready' | 'partial' | 'changed';
  total: number | null;
  orderVersion: number | null;
  canCreate: boolean;
}
export interface ProjectTaskState {
  resources: ProjectTaskQueryResources | null;
  privateLifetime: { epoch: string; expiresAt: string; verified: boolean } | null;
  sprintLocation: ProjectSprintLocation;
  integratedNavigation: { url: string } | null;
  workspaceNavigation: { workspaceId: string | null } | null;
  taskScope: TaskScope;
  searchQuery: string;
  discoveryProjectId: string | null;
  discovery: {
    status: 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'changed';
    page: TaskDiscoveryPage | null;
    requestId: string | null;
  };
  streamStatus: TaskStreamStatus;
  refreshRequired: boolean;
  refreshDeferred: boolean;
  discoveryFocusTaskId: string | null;
  discoveryContextLimitReached: boolean;
  parentCandidatesWanted: boolean;
  draftGuard: {
    kind: 'none' | 'draft' | 'pending' | 'recovery';
    atTarget: boolean;
    canReturn: boolean;
    canDiscard: boolean;
    canStageNew: boolean;
  };
  collaboration: CollaborationState;
  closeWarning: CloseWarning | null;
  commentConflict: TaskComment | null;
  checklistConflict: TaskChecklist | null;
  status: 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
  session: IdentitySession | null;
  workspaces: Page<WorkspaceSummary> | null;
  workspace: WorkspaceSummary | null;
  members: Page<WorkspaceMember> | null;
  projects: DomainPage<Project> | null;
  project: Project | null;
  tasks: TaskPage | null;
  task: Task | null;
  taskView: TaskView;
  taskColumns: Partial<Record<TaskStatus, TaskPage>>;
  taskColumnErrors: Partial<Record<TaskStatus, PolicyPageFailure>>;
  taskColumnsChanged: boolean;
  moveNeedsDestination: boolean;
  taskSummary: TaskSummary;
  selectedTaskAssignee: DomainPerson | null;
  taskFilterAssigneeStatus: 'none' | 'unassigned' | 'loading' | 'resolved' | 'unavailable';
  accessConflict: ProjectAccessMember | null;
  projectAccess: ProjectAccessPage | null;
  assignees: ProjectAssigneePage | null;
  policyPageErrors: Partial<Record<PolicyCollection, PolicyPageFailure>>;
  selection: ProjectTaskSelection;
  views: { projects: ArchiveView; tasks: ArchiveView };
  url: string;
  draft: ProjectCommand | null;
  pending: ProjectCommand['type'] | null;
  outcome: 'success' | 'invalid' | 'forbidden' | 'conflict' | 'error' | null;
  retryTarget: ProjectCommand | null;
  conflict: ProjectTaskResult | null;
  result: ProjectTaskResult | null;
  requestId: string | null;
  pageError: {
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees';
    requestId: string | null;
    reason?: 'changed';
  } | null;
}
const selectionEmpty: ProjectTaskSelection = { workspaceId: null, projectId: null, taskId: null };
const discoveryEmpty: ProjectTaskState['discovery'] = {
  status: 'idle',
  page: null,
  requestId: null,
};
const cleared = {
  parentCandidatesWanted: false,
  closeWarning: null,
  commentConflict: null,
  checklistConflict: null,
  taskColumnErrors: {},
  policyPageErrors: {},
  accessConflict: null,
  pageError: null,
};
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function urlFor(
  s: ProjectTaskSelection,
  views: ProjectTaskState['views'],
  taskView: TaskView,
  discovery: Pick<
    ProjectTaskState,
    'taskScope' | 'searchQuery' | 'discoveryProjectId' | 'sprintLocation'
  >,
): string {
  const path = !s.workspaceId
    ? '/projects'
    : !s.projectId
      ? `/projects?workspace=${encodeURIComponent(s.workspaceId)}`
      : s.taskId
        ? taskURL(s.workspaceId, s.projectId, s.taskId)
        : projectURL(s.workspaceId, s.projectId);
  const url = new URL(path, 'https://location.invalid');
  if (views.projects === 'archived') url.searchParams.set('projectsView', 'archived');
  if (views.tasks === 'archived') url.searchParams.set('tasksView', 'archived');
  if (taskView.layout === 'board') url.searchParams.set('taskLayout', 'board');
  for (const [key, value] of Object.entries(taskView.filters)) url.searchParams.set(key, value);
  if (taskView.column !== 'backlog') url.searchParams.set('column', taskView.column);
  if (discovery.taskScope !== 'project') url.searchParams.set('taskScope', discovery.taskScope);
  if (discovery.searchQuery) url.searchParams.set('q', discovery.searchQuery);
  if (discovery.discoveryProjectId)
    url.searchParams.set('searchProject', discovery.discoveryProjectId);
  return (
    writeProjectSprintLocation(url.pathname + url.search, discovery.sprintLocation) ??
    url.pathname + url.search
  );
}
function sameTarget(a: ProjectCommand, b: ProjectCommand): boolean {
  return (
    a.type === b.type &&
    a.workspaceId === b.workspaceId &&
    ('projectId' in a ? a.projectId : null) === ('projectId' in b ? b.projectId : null) &&
    ('taskId' in a ? a.taskId : null) === ('taskId' in b ? b.taskId : null) &&
    ('principalId' in a ? a.principalId : null) === ('principalId' in b ? b.principalId : null)
  );
}

/** Memory-only drafts and keys. Public selectors choose scope; every request
 * reauthorizes at the server. Presentation renders state and invokes actions. */
export function createProjectTaskController(options: {
  identity: Pick<IdentityTransport, 'configuration' | 'session'>;
  workspaces: Pick<WorkspaceTransport, 'workspaces' | 'detail' | 'members'>;
  transport: ProjectTaskTransport;
  key?: () => string;
  navigate?: (url: string, replace?: boolean) => void;
}) {
  let state: ProjectTaskState = {
    resources: null,
    privateLifetime: null,
    sprintLocation: { view: 'tasks', sprintId: null },
    integratedNavigation: null,
    status: 'loading',
    session: null,
    workspaces: null,
    workspace: null,
    members: null,
    projects: null,
    project: null,
    tasks: null,
    task: null,
    projectAccess: null,
    assignees: null,
    taskColumns: {},
    collaboration: emptyCollaboration(),
    taskColumnsChanged: false,
    ...cleared,
    selection: { ...selectionEmpty },
    views: { projects: 'active', tasks: 'active' },
    url: '/projects',
    workspaceNavigation: null,
    discoveryFocusTaskId: null,
    discoveryContextLimitReached: false,
    taskScope: 'project',
    searchQuery: '',
    discoveryProjectId: null,
    discovery: discoveryEmpty,
    streamStatus: 'idle',
    refreshRequired: false,
    refreshDeferred: false,
    draftGuard: {
      kind: 'none',
      atTarget: true,
      canReturn: false,
      canDiscard: false,
      canStageNew: true,
    },
    taskView: { layout: 'list', filters: {}, column: 'backlog' },
    moveNeedsDestination: false,
    taskSummary: { status: 'loading', total: null, orderVersion: null, canCreate: false },
    selectedTaskAssignee: null,
    taskFilterAssigneeStatus: 'none',
    draft: null,
    pending: null,
    outcome: null,
    retryTarget: null,
    conflict: null,
    accessConflict: null,
    result: null,
    requestId: null,
  };
  let generation = 0;
  let abort = new AbortController();
  let owner: string | null = null;
  let sessionId: string | null = null;
  let backgroundPending = false;
  let backgroundEpoch = 0;
  let resetWanted = false;
  let backgroundTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let workspaceNavigation: (() => Promise<void>) | null = null;
  let navigationBlocker: ProjectNavigationBlocker | null = null;
  let deferredNavigation: { url: string; run: () => Promise<void> } | null = null;
  let navigationScheduled = false;
  let verified = false;
  let scopeVerifying = false;
  let epoch: string | null = null;
  let originalExpiry = 0;
  let memoryExpiry = 0;
  type ReceiptLease = {
    command: ProjectCommand;
    epoch: string;
    generation: number;
    expiresAt: number;
  };
  let reviewLease: ReceiptLease | null = null;
  let resultLease: ReceiptLease | null = null;
  function receiptLease(
    command: ProjectCommand,
    request: { generation: number },
  ): ReceiptLease | null {
    return epoch
      ? { command, epoch, generation: request.generation, expiresAt: originalExpiry }
      : null;
  }
  function validLease(value: ReceiptLease | null) {
    return value !== null && value.epoch === epoch && value.expiresAt > Date.now();
  }
  function validReview(command: ProjectCommand) {
    return validLease(reviewLease) && reviewLease?.command === command;
  }

  const pendingResources = new Set<ProjectTaskQueryName>();
  let pendingColumns = false;
  const maskedResources = new Set<ProjectTaskQueryName>();
  let retry: { command: ProjectCommand; key: string } | null = null;
  const listeners = new Set<() => void>();
  type Control = Omit<
    ProjectTaskState,
    | 'resources'
    | 'privateLifetime'
    | 'workspaces'
    | 'workspace'
    | 'members'
    | 'projects'
    | 'project'
    | 'tasks'
    | 'task'
    | 'taskColumns'
    | 'collaboration'
    | 'discovery'
    | 'draftGuard'
    | 'discoveryContextLimitReached'
    | 'taskSummary'
    | 'selectedTaskAssignee'
    | 'taskFilterAssigneeStatus'
    | 'taskColumnsChanged'
    | 'projectAccess'
    | 'assignees'
  >;
  const controlOf = (next: Control): Control => ({
    sprintLocation: next.sprintLocation,
    integratedNavigation: next.integratedNavigation,
    workspaceNavigation: next.workspaceNavigation,
    taskScope: next.taskScope,
    searchQuery: next.searchQuery,
    discoveryProjectId: next.discoveryProjectId,
    streamStatus: next.streamStatus,
    refreshRequired: next.refreshRequired,
    refreshDeferred: next.refreshDeferred,
    discoveryFocusTaskId: next.discoveryFocusTaskId,
    parentCandidatesWanted: next.parentCandidatesWanted,
    closeWarning: next.closeWarning,
    commentConflict: next.commentConflict,
    checklistConflict: next.checklistConflict,
    status: next.status,
    session: next.session,
    taskView: next.taskView,
    moveNeedsDestination: next.moveNeedsDestination,
    accessConflict: next.accessConflict,
    policyPageErrors: next.policyPageErrors,
    selection: next.selection,
    views: next.views,
    url: next.url,
    draft: next.draft,
    pending: next.pending,
    outcome: next.outcome,
    retryTarget: next.retryTarget,
    conflict: next.conflict,
    result: next.result,
    requestId: next.requestId,
    pageError: next.pageError,
    taskColumnErrors: next.taskColumnErrors,
  });
  let control = controlOf(state);
  const query = createProjectTaskQueryOwner({
    workspaces: options.workspaces,
    transport: options.transport,
    authorized: () => verified && !disposed && originalExpiry > Date.now(),
    denied: (reason) => readFailure(new ProjectTaskFailure(reason === 'signed-out' ? 401 : 403)),
    changed: () => publish(control),
  });
  function collaborationProjection<Value>(resource: {
    status: 'idle' | 'loading' | 'ready' | 'error' | 'changed';
    data: Value | null;
    stale: boolean;
    failure: { requestId: string | null } | null;
  }) {
    return {
      status: resource.status,
      data: resource.data,
      stale: resource.stale,
      requestId: resource.failure?.requestId ?? null,
    };
  }
  const publish = (nextControl: Control) => {
    control = controlOf(nextControl);
    const resources = query.resources();
    const privateVisible = verified && !scopeVerifying && originalExpiry > Date.now();
    const reviewVisible = privateVisible && control.draft !== null && validReview(control.draft);
    const visible = privateVisible && (control.status === 'ready' || control.status === 'empty');
    const next: ProjectTaskState = {
      ...control,
      ...(!privateVisible
        ? {
            session: null,
            draft: null,
            retryTarget: null,
            conflict: null,
            accessConflict: null,
            commentConflict: null,
            checklistConflict: null,
            closeWarning: null,
            result: null,
            integratedNavigation: null,
            workspaceNavigation: null,
          }
        : {}),
      ...(!reviewVisible
        ? {
            conflict: null,
            accessConflict: null,
            commentConflict: null,
            checklistConflict: null,
            closeWarning: null,
          }
        : {}),
      result: privateVisible && validLease(resultLease) ? control.result : null,
      resources: privateVisible ? resources : null,
      privateLifetime: epoch
        ? { epoch, expiresAt: new Date(originalExpiry).toISOString(), verified: privateVisible }
        : null,
      workspaces: visible ? resources.workspaces.data : null,
      workspace: visible ? resources.workspace.data : null,
      members: visible ? resources.members.data : null,
      projects: visible && !maskedResources.has('projects') ? resources.projects.data : null,
      project: visible ? resources.project.data : null,
      tasks: visible ? resources.tasks.data : null,
      task: visible ? resources.task.data : null,
      projectAccess: visible ? resources.projectAccess.data : null,
      assignees: visible ? resources.assignees.data : null,
      taskColumns: visible
        ? Object.fromEntries(
            Object.entries(resources.columns).flatMap(([name, resource]) =>
              resource.data ? [[name, resource.data]] : [],
            ),
          )
        : {},
      discovery: {
        status:
          resources.discovery.status === 'ready'
            ? resources.discovery.data?.total
              ? 'ready'
              : 'empty'
            : resources.discovery.status,
        page: visible && !maskedResources.has('discovery') ? resources.discovery.data : null,
        requestId: resources.discovery.failure?.requestId ?? null,
      },
      collaboration: visible
        ? {
            relations: collaborationProjection(resources.relations),
            'parent-candidates': control.parentCandidatesWanted
              ? collaborationProjection(resources['parent-candidates'])
              : emptyCollaboration()['parent-candidates'],
            checklist: collaborationProjection(resources.checklist),
            comments: collaborationProjection(resources.comments),
            history: collaborationProjection(resources.history),
          }
        : emptyCollaboration(),
      taskColumnsChanged: false,
      discoveryContextLimitReached: false,
      taskSummary: { status: 'loading', total: null, orderVersion: null, canCreate: false },
      selectedTaskAssignee: null,
      taskFilterAssigneeStatus: 'none',
      draftGuard: {
        kind: 'none',
        atTarget: true,
        canReturn: false,
        canDiscard: false,
        canStageNew: false,
      },
    };

    const taskColumnsChanged =
      new Set(Object.values(next.taskColumns).map((page) => page.orderVersion)).size > 1 ||
      Object.values(next.taskColumnErrors).some((error) => error.reason === 'changed') ||
      (next.taskView.layout === 'board' &&
        Object.values(resources.columns).some(
          (resource) => resource.stale && resource.status !== 'error' && resource.data !== null,
        ));
    const statuses = next.taskView.filters.status
      ? [next.taskView.filters.status]
      : [...taskStatuses];
    const pages =
      next.taskView.layout === 'board'
        ? statuses.map((status) => next.taskColumns[status])
        : [next.tasks ?? undefined];
    const failed =
      next.taskView.layout === 'board'
        ? statuses.some((status) => next.taskColumnErrors[status])
        : next.pageError?.collection === 'tasks';
    const changed =
      next.taskView.layout === 'board'
        ? taskColumnsChanged
        : (resources.tasks.stale && resources.tasks.data !== null) ||
          (next.pageError?.collection === 'tasks' && next.pageError.reason === 'changed');
    const summaryStatus: TaskSummary['status'] = changed
      ? 'changed'
      : failed
        ? 'partial'
        : pages.some((page) => !page)
          ? 'loading'
          : 'ready';
    const taskSummary: TaskSummary = {
      status: summaryStatus,
      total: summaryStatus === 'ready' ? pages.reduce((sum, page) => sum + page!.total, 0) : null,
      orderVersion: summaryStatus === 'ready' ? pages[0]!.orderVersion : null,
      canCreate: summaryStatus === 'ready' && pages.every((page) => page!.capabilities.canCreate),
    };
    const metadata =
      next.taskView.layout === 'board' ? Object.values(next.taskColumns)[0] : next.tasks;
    const assignee = next.taskView.filters.assignee;
    const candidate = metadata?.selectedAssignee;
    const selectedTaskAssignee = candidate && candidate.principalId === assignee ? candidate : null;
    const command = next.retryTarget ?? next.draft;
    const atTarget =
      !command ||
      (command.workspaceId === next.selection.workspaceId &&
        (!('projectId' in command) || command.projectId === next.selection.projectId) &&
        (!('taskId' in command) ||
          command.taskId === next.selection.taskId ||
          (command.type === 'move-task' && next.selection.taskId === null)));
    const kind = next.pending
      ? 'pending'
      : next.retryTarget
        ? 'recovery'
        : next.draft
          ? 'draft'
          : 'none';
    const releaseRefresh =
      next.refreshRequired &&
      next.refreshDeferred &&
      kind === 'none' &&
      !control.draft &&
      !control.pending &&
      !retry &&
      !next.conflict &&
      !next.closeWarning &&
      !next.commentConflict &&
      !next.checklistConflict &&
      !next.accessConflict;
    state = freezeSprintValue({
      ...next,
      ...(releaseRefresh ? { refreshDeferred: false } : {}),
      discoveryContextLimitReached:
        (next.discovery.page?.items.length ?? 0) >= 1000 && !!next.discovery.page?.nextCursor,
      taskColumnsChanged,
      taskSummary,
      selectedTaskAssignee,
      draftGuard: {
        kind,
        atTarget,
        canReturn: !!command && !atTarget && !next.pending,
        canDiscard: !!command && !next.pending,
        canStageNew: !command && !next.pending,
      },
      taskFilterAssigneeStatus: !assignee
        ? 'none'
        : assignee === 'unassigned'
          ? 'unassigned'
          : !metadata
            ? 'loading'
            : selectedTaskAssignee
              ? 'resolved'
              : 'unavailable',
      moveNeedsDestination: next.draft?.type === 'move-task' && next.outcome === 'conflict',
    });
    for (const listener of listeners) listener();
    if (
      deferredNavigation &&
      !navigationScheduled &&
      state.status === 'ready' &&
      !navigationProtected()
    ) {
      navigationScheduled = true;
      queueMicrotask(() => {
        navigationScheduled = false;
        void resumeNavigation();
      });
    }
    if (releaseRefresh) {
      clearTimeout(backgroundTimer);
      backgroundTimer = setTimeout(() => {
        void flushBackgroundRefresh();
      }, 100);
    }
  };
  function cancelReads() {
    query.cancel();
  }
  function retireReads() {
    query.clear();
  }
  const begin = () => {
    const obsolete = abort;
    abort = new AbortController();
    const request = { generation: ++generation, signal: abort.signal };
    query.cancel();
    obsolete.abort();
    return request;
  };
  const current = (request: { generation: number }) => generation === request.generation;
  const fresh = () => verified && control.session !== null && originalExpiry > Date.now();
  function navigationProtected() {
    return !!(
      control.pending ||
      control.draft ||
      retry ||
      (navigationBlocker && navigationBlocker.getGuard() !== 'none')
    );
  }
  function clearNavigationDecision() {
    deferredNavigation = null;
    workspaceNavigation = null;
    if (state.integratedNavigation || state.workspaceNavigation)
      publish({ ...control, integratedNavigation: null, workspaceNavigation: null });
  }
  function guardNavigation(url: string, run: () => Promise<void>, restoreHistory = false) {
    if (!navigationBlocker || !navigationProtected()) return false;
    const destination = new URL(url, 'https://location.invalid');
    // T37 keeps task drafts/recovery reachable while browsing tasks in the same workspace.
    // Preserve that memory-only journey; entering sprint views or leaving the workspace still guards it.
    if (
      !state.pending &&
      navigationBlocker.getGuard() === 'none' &&
      destination.origin === 'https://location.invalid' &&
      destination.pathname === '/projects' &&
      destination.searchParams.get('workspace') !== state.selection.workspaceId
    ) {
      clearNavigationDecision();
      return false; // The existing task-only workspace guard owns its original return/focus contract.
    }
    if (
      !state.pending &&
      navigationBlocker.getGuard() === 'none' &&
      state.sprintLocation.view === 'tasks' &&
      destination.origin === 'https://location.invalid' &&
      destination.pathname === '/projects' &&
      destination.searchParams.get('workspace') === state.selection.workspaceId &&
      readProjectSprintLocation(destination.search)?.view === 'tasks'
    ) {
      clearNavigationDecision();
      return false;
    }
    deferredNavigation = { url, run };
    workspaceNavigation = null;
    publish({ ...control, workspaceNavigation: null, integratedNavigation: { url } });
    if (restoreHistory) options.navigate?.(state.url, true);
    return true;
  }
  async function resumeNavigation() {
    if (!deferredNavigation || navigationProtected() || !fresh() || state.status !== 'ready')
      return;
    const next = deferredNavigation;
    deferredNavigation = null;
    publish({ ...control, integratedNavigation: null });
    await next.run();
  }
  type NavigationState = Pick<
    ProjectTaskState,
    | 'selection'
    | 'views'
    | 'taskView'
    | 'taskScope'
    | 'searchQuery'
    | 'discoveryProjectId'
    | 'sprintLocation'
  >;
  async function go(change: Partial<NavigationState>, reload = true): Promise<void> {
    const next: NavigationState = {
      selection: state.selection,
      views: state.views,
      taskView: state.taskView,
      taskScope: state.taskScope,
      searchQuery: state.searchQuery,
      discoveryProjectId: state.discoveryProjectId,
      sprintLocation: state.sprintLocation,
      ...change,
    };
    const url = urlFor(next.selection, next.views, next.taskView, next);
    if (guardNavigation(url, () => go(next, reload))) return;
    const { selection, ...metadata } = next;
    if (reload) await changeSelection(selection, metadata);
    else {
      publish({ ...control, ...metadata });
      select(selection);
    }
  }
  function guardWorkspace(workspaceId: string | null, navigate: () => Promise<void>) {
    if (
      state.selection.workspaceId === null ||
      state.selection.workspaceId === workspaceId ||
      !(control.draft || retry || control.pending)
    )
      return false;
    workspaceNavigation = navigate;
    publish({ ...control, workspaceNavigation: { workspaceId } });
    return true;
  }
  function select(selection: ProjectTaskSelection, navigate = true) {
    const selectedGeneration = generation;
    const selectedEpoch = epoch;
    const sameScope =
      selection.workspaceId === state.selection.workspaceId &&
      selection.projectId === state.selection.projectId &&
      selection.taskId === state.selection.taskId;
    const url = urlFor(selection, state.views, state.taskView, state);
    publish({
      ...control,
      selection: { ...selection },
      ...(!sameScope && state.outcome === 'success' ? { outcome: null, result: null } : {}),
      url,
      parentCandidatesWanted: sameScope && state.parentCandidatesWanted,
      ...(!sameScope ? { status: 'loading' as const } : {}),
    });
    if (navigate && generation === selectedGeneration && epoch === selectedEpoch)
      options.navigate?.(url);
  }
  function erase(status: 'signed-out' | 'disabled' | 'forbidden') {
    verified = false;
    scopeVerifying = false;
    epoch = null;
    originalExpiry = 0;
    memoryExpiry = 0;
    retry = null;
    reviewLease = null;
    resultLease = null;
    deferredNavigation = null;
    workspaceNavigation = null;
    pendingResources.clear();
    pendingColumns = false;
    publish({
      ...control,
      ...cleared,
      status,
      session: null,
      draft: null,
      retryTarget: null,
      pending: null,
      result: null,
      conflict: null,
      integratedNavigation: null,
      workspaceNavigation: null,
      discoveryFocusTaskId: null,
      refreshRequired: false,
      refreshDeferred: false,
      outcome: status === 'forbidden' ? control.outcome : null,
      streamStatus: status === 'forbidden' ? 'forbidden' : 'signed-out',
    });
    query.clear();
    begin();
  }
  function expire() {
    erase('signed-out');
  }
  function readFailure(error: unknown) {
    const status =
      error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure ? error.status : 0;
    if (status === 401 || status === 403) {
      erase(status === 401 ? 'signed-out' : 'forbidden');
      return;
    }
    publish({
      ...control,
      status: 'error',
      requestId: error instanceof ProjectTaskFailure ? error.requestId : null,
    });
  }
  function policyFailure(collection: PolicyCollection, failure: PolicyPageFailure) {
    const incumbent = state.pageError;
    const pageError: ProjectTaskState['pageError'] =
      incumbent === null ||
      incumbent.collection === 'projectAccess' ||
      incumbent.collection === 'assignees'
        ? { collection, ...failure }
        : incumbent;
    publish({
      ...control,
      policyPageErrors: { ...state.policyPageErrors, [collection]: failure },
      pageError,
    });
  }
  function withoutPolicyFailure(
    collection: PolicyCollection,
  ): Pick<ProjectTaskState, 'policyPageErrors' | 'pageError'> {
    const errors = { ...state.policyPageErrors };
    delete errors[collection];
    const other: PolicyCollection = collection === 'assignees' ? 'projectAccess' : 'assignees';
    return {
      policyPageErrors: errors,
      pageError:
        state.pageError?.collection === collection
          ? errors[other]
            ? { collection: other, ...errors[other] }
            : null
          : state.pageError,
    };
  }
  function bindResources() {
    if (!epoch) return;
    query.bind(epoch);
    query.select({
      ...state.selection,
      views: state.views,
      taskView: state.taskView,
      discovery: state.taskScope === 'project' ? null : discoveryQuery(),
      parentCandidatesWanted: state.parentCandidatesWanted,
    });
  }
  function discoveryQuery(): TaskDiscoveryQuery {
    return {
      scope: state.taskScope === 'mine' ? 'mine' : 'search',
      q: state.searchQuery.trim(),
      view: state.views.tasks,
      filters: { ...state.taskView.filters },
      ...(state.discoveryProjectId ? { projectId: state.discoveryProjectId } : {}),
    };
  }
  async function required(name: ProjectTaskQueryName, request: { generation: number }) {
    await query.read(name);
    if (!current(request)) return false;
    const resource = query.resources()[name];
    if (resource.status !== 'ready')
      throw new ProjectTaskFailure(
        resource.failure?.status ?? 0,
        resource.failure?.code ?? null,
        null,
        resource.failure?.requestId ?? null,
      );
    maskedResources.delete(name);
    return true;
  }
  async function fetchTaskColumn(
    status: TaskStatus,
    request: { generation: number; signal?: AbortSignal },
    mode: 'root' | 'next' = 'root',
  ) {
    if (mode === 'next') await query.readColumnNext(status);
    else await query.readColumn(status);
    if (!current(request)) return;
    const resource = query.resources().columns[status];
    const errors = { ...state.taskColumnErrors };
    if (resource.failure)
      errors[status] = {
        requestId: resource.failure.requestId,
        ...(resource.status === 'changed' ? { reason: 'changed' as const } : {}),
      };
    else delete errors[status];
    publish({ ...control, taskColumnErrors: errors });
  }
  async function loadTaskColumn(status: TaskStatus) {
    if (!taskStatuses.includes(status) || state.pending || !fresh() || state.taskColumnsChanged)
      return;
    await fetchTaskColumn(status, { generation }, 'next');
  }
  async function fetchDiscovery(
    request: { generation: number; signal?: AbortSignal },
    append = false,
  ) {
    if (!fresh() || state.taskScope === 'project') return;
    bindResources();
    await query.read('discovery', append && query.resources().discovery.data !== null, !append);
    if (!current(request)) return;
    const resource = query.resources().discovery;
    if (resource.status === 'ready' && !resource.stale) maskedResources.delete('discovery');
    const data = resource.data;
    publish({
      ...control,
      discoveryFocusTaskId: data?.items.some((row) => row.id === state.discoveryFocusTaskId)
        ? state.discoveryFocusTaskId
        : null,
    });
  }
  async function fetchCollaboration(
    collection: CollaborationCollection,
    request: { generation: number; signal?: AbortSignal },
    append = false,
  ) {
    if (!fresh() || !state.selection.taskId) return;
    bindResources();
    await query.read(collection, append && query.resources()[collection].data !== null);
    if (current(request)) publish(control);
  }
  async function load(request: { generation: number; signal: AbortSignal }) {
    const s = { ...state.selection };
    bindResources();
    if (!s.workspaceId) {
      scopeVerifying = false;
      publish({ ...control, status: 'empty' });
      return;
    }
    if (!(await required('workspace', request))) return;
    await Promise.all([required('members', request), required('projects', request)]);
    if (!current(request) || !fresh()) return;
    if (state.taskScope !== 'project') await fetchDiscovery(request);
    if (!current(request) || !fresh()) return;
    const projectId =
      s.projectId ??
      (state.taskScope === 'project' ? query.resources().projects.data?.items[0]?.id : null) ??
      null;
    select({ ...s, projectId }, false);
    bindResources();
    if (!projectId) {
      scopeVerifying = false;
      publish({ ...control, status: state.taskScope === 'project' ? 'empty' : 'ready' });
      return;
    }
    if (!(await required('project', request))) return;
    await Promise.all([
      state.taskView.layout === 'list' ? required('tasks', request) : Promise.resolve(),
      s.taskId ? required('task', request) : Promise.resolve(),
    ]);
    if (!current(request) || !fresh()) return;
    query.administer();
    scopeVerifying = false;
    publish({
      ...control,
      status: 'ready',
      taskColumnErrors: {},
      policyPageErrors: {},
      pageError: null,
    });
    async function auxiliary(name: 'projectAccess' | 'assignees') {
      await query.read(name);
      if (!current(request) || !fresh()) return;
      const resource = query.resources()[name];
      if (resource.failure)
        policyFailure(name, {
          requestId: resource.failure.requestId,
          ...(resource.status === 'changed' ? { reason: 'changed' as const } : {}),
        });
      else publish({ ...control, ...withoutPolicyFailure(name) });
    }
    await Promise.all([
      query.resources().project.data?.capabilities.canManageAccess
        ? auxiliary('projectAccess')
        : Promise.resolve(),
      auxiliary('assignees'),
      ...(s.taskId
        ? collaborationCollections
            .filter((name) => name !== 'parent-candidates' || state.parentCandidatesWanted)
            .map((name) => fetchCollaboration(name, request))
        : []),
      ...(state.taskView.layout === 'board'
        ? taskStatuses.map((status) => fetchTaskColumn(status, request))
        : []),
    ]);
  }
  async function refresh(): Promise<void> {
    if (control.pending) return;
    // This full read covers the existing debt. Hints received after this
    // boundary stay in their own pending set and must not be acknowledged here.
    const capturedResources = new Set(pendingResources);
    const capturedColumns = pendingColumns;
    const capturedReset = resetWanted;
    const capturedEpoch = epoch;
    pendingResources.clear();
    pendingColumns = false;
    resetWanted = false;
    verified = false;
    scopeVerifying = true;
    publish({
      ...control,
      status: 'loading',
      session: null,
      refreshRequired: false,
      refreshDeferred: false,
    });
    const request = begin();
    try {
      const config = parseIdentityConfiguration(await options.identity.configuration());
      const session = config.enabled
        ? parseIdentitySession(await options.identity.session())
        : null;
      if (!current(request)) return;
      if (!config.enabled || !session || Date.parse(session.session.expiresAt) <= Date.now()) {
        erase(config.enabled ? 'signed-out' : 'disabled');
        return;
      }
      const replacement =
        owner !== null && (owner !== session.user.id || sessionId !== session.session.id);
      const expired = originalExpiry !== 0 && originalExpiry <= Date.now();
      if (
        replacement ||
        expired ||
        (!epoch && owner !== null) ||
        (memoryExpiry !== 0 && memoryExpiry <= Date.now())
      ) {
        retry = null;
        reviewLease = null;
        resultLease = null;
        memoryExpiry = 0;
        deferredNavigation = null;
        workspaceNavigation = null;
        publish({
          ...control,
          ...cleared,
          draft: null,
          retryTarget: null,
          result: null,
          conflict: null,
          outcome: null,
          workspaceNavigation: null,
          integratedNavigation: null,
          ...(replacement
            ? {
                sprintLocation: { view: 'tasks' as const, sprintId: null },
                selection: { ...selectionEmpty },
                searchQuery: '',
                discoveryProjectId: null,
                taskView: { layout: 'list' as const, filters: {}, column: 'backlog' as const },
                url: '/projects',
              }
            : {}),
        });
      }
      if (!epoch || replacement || expired) {
        epoch = crypto.randomUUID();
        originalExpiry = Date.parse(session.session.expiresAt);
        query.clear();
      }
      if (replacement) options.navigate?.(control.url, true);
      originalExpiry = Math.min(originalExpiry, Date.parse(session.session.expiresAt));
      owner = session.user.id;
      sessionId = session.session.id;
      verified = true;
      publish({ ...control, session });
      bindResources();
      if (!(await required('workspaces', request))) return;
      const workspaces = query.resources().workspaces.data!;
      if (!state.selection.workspaceId)
        select(
          { workspaceId: workspaces.items[0]?.id ?? null, projectId: null, taskId: null },
          false,
        );
      if (replacement) options.navigate?.(state.url, true);
      await load(request);
      if (current(request) && fresh()) {
        const remaining = pendingResources.size > 0 || pendingColumns || resetWanted;
        publish({
          ...control,
          refreshRequired: remaining,
          refreshDeferred: remaining && guarded(),
        });
      }
    } catch (error) {
      if (!current(request)) return;
      if (!verified) {
        scopeVerifying = true;
        publish({ ...control, session: null, status: 'error' });
        query.invalidate();
      } else readFailure(error);
      if (current(request) && epoch === capturedEpoch && originalExpiry > Date.now()) {
        capturedResources.forEach((name) => pendingResources.add(name));
        pendingColumns ||= capturedColumns;
        resetWanted ||= capturedReset;
        const remaining = pendingResources.size > 0 || pendingColumns || resetWanted;
        publish({
          ...control,
          refreshRequired: remaining,
          refreshDeferred: remaining && guarded(),
        });
      }
    }
  }
  async function changeSelection(
    selection: ProjectTaskSelection,
    metadata: Partial<NavigationState> = {},
  ) {
    if (guardWorkspace(selection.workspaceId, () => changeSelection(selection, metadata))) return;
    if (
      state.selection.workspaceId !== null &&
      selection.workspaceId !== state.selection.workspaceId
    ) {
      metadata = {
        ...metadata,
        searchQuery: '',
        discoveryProjectId: null,
        taskView: { ...(metadata.taskView ?? state.taskView), filters: {} },
      };

      retry = null;
      publish({
        ...control,
        draft: null,
        retryTarget: null,
        conflict: null,
        result: null,
        outcome: null,
        searchQuery: '',
        discoveryProjectId: null,
        taskView: { ...state.taskView, filters: {} },
        refreshRequired: false,
        refreshDeferred: false,
      });
    }
    const request = begin();
    const sameTarget =
      selection.workspaceId === state.selection.workspaceId &&
      selection.projectId === state.selection.projectId &&
      selection.taskId === state.selection.taskId;
    publish({
      ...control,
      ...metadata,
      ...cleared,
      selection: { ...selection },
      parentCandidatesWanted: sameTarget && state.parentCandidatesWanted,
      status: 'loading',
      pending: null,
      retryTarget: retry ? structuredClone(retry.command) : null,
      ...(!sameTarget && state.outcome === 'success' ? { outcome: null, result: null } : {}),
    });
    select(selection);
    if (!fresh()) {
      await refresh();
      return;
    }
    try {
      await load(request);
    } catch (error) {
      if (current(request)) readFailure(error);
    }
  }
  const names: ProjectTaskQueryName[] = [
    'workspaces',
    'workspace',
    'members',
    'projects',
    'project',
    'tasks',
    'task',
    'projectAccess',
    'assignees',
    'discovery',
    'relations',
    'parent-candidates',
    'checklist',
    'comments',
    'history',
  ];
  function guarded() {
    return !!(
      control.pending ||
      control.draft ||
      retry ||
      control.conflict ||
      control.closeWarning ||
      control.commentConflict ||
      control.checklistConflict ||
      control.accessConflict
    );
  }
  function recordInvalidation(affected: ProjectTaskInvalidation) {
    affected.resources.forEach((name) => pendingResources.add(name));
    pendingColumns ||= affected.columns;
    if (control.status !== 'loading') query.invalidate(affected);
  }
  async function handleInvalidation(event: TaskInvalidation) {
    if (disposed || event.type === 'heartbeat') return;
    if (event.type === 'denied') {
      readFailure(new ProjectTaskFailure(event.reason === 'signed-out' ? 401 : 403));
      return;
    }
    if (event.type === 'reset') {
      await backgroundRefresh(true);
      return;
    }
    const affected = query.relevance(event);
    if (!affected.resources.length && !affected.columns) return;
    recordInvalidation(affected);
    backgroundEpoch++;
    publish({ ...control, refreshRequired: true });
    await flushBackgroundRefresh();
  }
  async function backgroundRefresh(reset = false): Promise<void> {
    if (disposed || !verified || !epoch) return;
    backgroundEpoch++;
    resetWanted ||= reset;
    recordInvalidation({ resources: names, columns: true });
    publish({ ...control, refreshRequired: true });
    await flushBackgroundRefresh();
  }
  async function flushBackgroundRefresh(): Promise<void> {
    if (disposed || !control.refreshRequired || backgroundPending || control.status === 'loading')
      return;
    if (originalExpiry <= Date.now()) {
      expire();
      return;
    }
    if (!verified) return;
    const captured = backgroundEpoch;
    const batch = new Set(pendingResources);
    pendingResources.clear();
    const columns = pendingColumns;
    pendingColumns = false;
    const reset = resetWanted;
    resetWanted = false;
    const request = { generation, signal: abort.signal };
    backgroundPending = true;
    try {
      if (reset) {
        maskedResources.add('projects');
        maskedResources.add('discovery');
        verified = false;
        scopeVerifying = true;
        publish({ ...control, session: null, status: 'loading' });
        const session = parseIdentitySession(await options.identity.session());
        if (!current(request)) return;
        if (!session || Date.parse(session.session.expiresAt) <= Date.now()) {
          expire();
          return;
        }
        if (session.user.id !== owner || session.session.id !== sessionId) {
          retry = null;
          publish({ ...control, pending: null });
          await refresh();
          return;
        }
        originalExpiry = Math.min(originalExpiry, Date.parse(session.session.expiresAt));
        verified = true;
        publish({ ...control, session, status: 'loading' });
      }
      const selectedAffected =
        reset ||
        columns ||
        [...batch].some(
          (name) => !['discovery', 'projects', 'workspaces', 'members'].includes(name),
        );
      if (selectedAffected) {
        const probe = state.selection.taskId
          ? 'task'
          : state.selection.projectId
            ? 'project'
            : state.selection.workspaceId
              ? 'workspace'
              : null;
        if (probe) {
          await required(probe, request);
          batch.delete(probe);
        }
      }
      if (!current(request) || !fresh()) return;
      scopeVerifying = false;
      publish({
        ...control,
        status: !state.selection.projectId && state.taskScope === 'project' ? 'empty' : 'ready',
      });
      if (guarded()) {
        batch.forEach((name) => pendingResources.add(name));
        pendingColumns ||= columns;
        publish({ ...control, refreshRequired: true, refreshDeferred: true });
        return;
      }
      if (state.selection.projectId && batch.has('project')) {
        await required('project', request);
        batch.delete('project');
      }
      query.administer();
      if (state.selection.taskId && batch.has('task')) {
        await required('task', request);
        batch.delete('task');
      }
      await Promise.all(
        [...batch].map(async (name) => {
          if (name === 'discovery') await fetchDiscovery(request);
          else {
            await query.read(name);
            const resource = query.resources()[name];
            if (resource.status === 'ready' && !resource.stale) maskedResources.delete(name);
            if (
              resource.failure &&
              [
                'workspaces',
                'workspace',
                'members',
                'projects',
                'project',
                'tasks',
                'task',
              ].includes(name)
            )
              throw new ProjectTaskFailure(
                resource.failure.status,
                resource.failure.code,
                null,
                resource.failure.requestId,
              );
            if (name === 'projectAccess' || name === 'assignees') {
              if (resource.failure)
                policyFailure(name, {
                  requestId: resource.failure.requestId,
                  ...(resource.status === 'changed' ? { reason: 'changed' as const } : {}),
                });
              else publish({ ...control, ...withoutPolicyFailure(name) });
            }
          }
        }),
      );
      if (columns)
        await Promise.all(taskStatuses.map((status) => fetchTaskColumn(status, request)));
      if (current(request) && fresh())
        publish({
          ...control,
          status: !state.selection.projectId && state.taskScope === 'project' ? 'empty' : 'ready',
          refreshRequired:
            backgroundEpoch !== captured || pendingResources.size > 0 || pendingColumns,
          refreshDeferred: false,
        });
    } catch (error) {
      if (!current(request)) return;
      if (error instanceof ProjectTaskFailure && (error.status === 401 || error.status === 403))
        readFailure(error);
      else {
        if (!verified) publish({ ...control, session: null, status: 'error' });
        else readFailure(error);
        batch.forEach((name) => pendingResources.add(name));
        pendingColumns ||= columns;
        publish({ ...control, refreshRequired: true });
      }
    } finally {
      backgroundPending = false;
      if (
        !disposed &&
        current(request) &&
        backgroundEpoch !== captured &&
        fresh() &&
        (resetWanted || !control.refreshDeferred)
      ) {
        clearTimeout(backgroundTimer);
        backgroundTimer = setTimeout(() => {
          void flushBackgroundRefresh();
        }, 100);
      }
    }
  }
  function commandAtTarget(command: ProjectCommand) {
    return (
      command.workspaceId === state.selection.workspaceId &&
      (!('projectId' in command) || command.projectId === state.selection.projectId) &&
      (!('taskId' in command) ||
        command.taskId === state.selection.taskId ||
        (command.type === 'move-task' && state.selection.taskId === null))
    );
  }
  function actionReady(command: ProjectCommand, recovery = false) {
    if (!commandAtTarget(command)) return false;
    if (!fresh() || !['ready', 'empty'].includes(control.status)) return false;
    const taskDetailWrite =
      command.type === 'edit-task' ||
      command.type === 'archive-task' ||
      command.type === 'restore-task';
    // These writes still require the fresh matching workspace/project/task below.
    // Deferred independent chains cannot supply their authority; moves continue
    // to require global ordering readiness and pending-debt clearance.
    if (!recovery && !taskDetailWrite && (pendingResources.size > 0 || pendingColumns))
      return false;
    const resources = query.resources();
    const ready = (name: ProjectTaskQueryName) =>
      resources[name].status === 'ready' && !resources[name].stale && resources[name].data !== null;
    if (!ready('workspace')) return false;
    if (command.type === 'create-project')
      return ready('projects') && resources.projects.data?.capabilities.canCreate === true;
    if (!ready('project')) return false;
    if (command.type === 'change-access' || command.type === 'change-visibility')
      return (
        resources.project.data?.capabilities.canManageAccess === true &&
        (recovery || ready('projectAccess'))
      );
    if (
      command.type === 'edit-project' ||
      command.type === 'archive-project' ||
      command.type === 'restore-project'
    )
      return true;
    if (command.type === 'create-task') return recovery || state.taskSummary.canCreate;
    if ('taskId' in command && state.selection.taskId === command.taskId && !ready('task'))
      return false;
    if (isCollaborationCommand(command)) {
      const name =
        command.type === 'set-task-parent'
          ? 'relations'
          : command.type.includes('checklist')
            ? 'checklist'
            : command.type.includes('comment')
              ? 'comments'
              : 'relations';
      return recovery || ready(name);
    }
    if (command.type === 'move-task') return state.taskSummary.status === 'ready';
    return (
      state.selection.taskId !== null ||
      (state.taskView.layout === 'list' ? ready('tasks') : state.taskSummary.status === 'ready')
    );
  }
  function stage(command: ProjectCommand) {
    if (navigationBlocker && navigationBlocker.getGuard() !== 'none') return;
    if (state.pending) return;
    if (retry) {
      publish({ ...control, outcome: 'invalid' });
      return;
    }
    if (!fresh() || !['ready', 'empty'].includes(state.status)) return;
    if (!memoryExpiry) memoryExpiry = originalExpiry;
    const draft = structuredClone(command);
    if (
      state.draft &&
      (isCollaborationCommand(state.draft) || isCollaborationCommand(draft)) &&
      (!sameTarget(state.draft, draft) ||
        ('itemId' in state.draft ? state.draft.itemId : null) !==
          ('itemId' in draft ? draft.itemId : null) ||
        ('commentId' in state.draft ? state.draft.commentId : null) !==
          ('commentId' in draft ? draft.commentId : null))
    ) {
      publish({ ...control, outcome: 'invalid' });
      return;
    }
    // Same form edits retain the version captured when it was opened, even if
    // a refresh replaces the visible record in the meantime.
    const sameItem =
      state.draft &&
      ('itemId' in state.draft ? state.draft.itemId : null) ===
        ('itemId' in draft ? draft.itemId : null) &&
      ('commentId' in state.draft ? state.draft.commentId : null) ===
        ('commentId' in draft ? draft.commentId : null);
    if (
      state.draft &&
      sameTarget(state.draft, draft) &&
      sameItem &&
      'expectedVersion' in state.draft &&
      'expectedVersion' in draft
    )
      draft.expectedVersion = state.draft.expectedVersion;
    if (
      state.draft?.type === 'edit-comment' &&
      draft.type === 'edit-comment' &&
      sameTarget(state.draft, draft) &&
      sameItem
    )
      draft.expectedCommentVersion = state.draft.expectedCommentVersion;
    if (
      state.draft?.type === 'create-task' &&
      draft.type === 'create-task' &&
      sameTarget(state.draft, draft) &&
      state.draft.fields.parentTaskId === draft.fields.parentTaskId &&
      state.draft.fields.expectedParentVersion !== undefined
    )
      draft.fields.expectedParentVersion = state.draft.fields.expectedParentVersion;
    if (
      state.draft?.type === 'move-task' &&
      draft.type === 'move-task' &&
      sameTarget(state.draft, draft)
    )
      draft.expectedOrderVersion = state.draft.expectedOrderVersion;
    reviewLease = null;
    publish({
      ...control,
      draft,
      closeWarning: null,
      commentConflict: null,
      checklistConflict: null,
      outcome: null,
      conflict: null,
      accessConflict: null,
      requestId: null,
    });
  }
  function moveEvidence(
    taskId: string,
    status: TaskStatus,
    beforeTaskId: string | null,
  ): { eligibility: MoveEligibility; source?: Task; orderVersion?: number } {
    if (state.pending) return { eligibility: 'pending' };
    if (retry) return { eligibility: 'recovery' };
    if (state.draft) return { eligibility: 'draft' };
    if (state.selection.taskId !== null && state.selection.taskId !== taskId)
      return { eligibility: 'different-detail' };
    if (
      state.taskColumnsChanged ||
      (state.pageError?.collection === 'tasks' && state.pageError.reason === 'changed')
    )
      return { eligibility: 'changed' };
    if (pendingResources.size > 0 || pendingColumns || state.taskSummary.status !== 'ready')
      return { eligibility: 'unavailable' };
    if (
      !taskStatuses.includes(status) ||
      (beforeTaskId !== null && (!id(beforeTaskId) || beforeTaskId === taskId))
    )
      return { eligibility: 'invalid-destination' };
    const pages =
      state.taskView.layout === 'board'
        ? Object.values(state.taskColumns)
        : state.tasks
          ? [state.tasks]
          : [];
    const source = pages.flatMap((page) => page.items).find((row) => row.id === taskId);
    const sourcePage = pages.find((page) => page.items.some((row) => row.id === taskId));
    const destination = state.taskView.layout === 'board' ? state.taskColumns[status] : sourcePage;
    if (
      !source ||
      !sourcePage ||
      !destination ||
      state.taskColumnErrors[source.status] ||
      state.taskColumnErrors[status] ||
      state.pageError?.collection === 'tasks'
    )
      return { eligibility: 'unavailable' };
    if (!source.capabilities.canEdit) return { eligibility: 'forbidden' };
    if (
      source.orderVersion !== sourcePage.orderVersion ||
      destination.orderVersion !== sourcePage.orderVersion
    )
      return { eligibility: 'changed' };
    if (
      beforeTaskId !== null &&
      !destination.items.some(
        (row) =>
          row.id === beforeTaskId &&
          row.status === status &&
          row.orderVersion === sourcePage.orderVersion,
      )
    )
      return { eligibility: 'invalid-destination' };
    return { eligibility: 'ready', source, orderVersion: sourcePage.orderVersion };
  }
  function stageMove(
    taskId: string,
    status: TaskStatus,
    beforeTaskId: string | null,
  ): MoveEligibility {
    const evidence = moveEvidence(taskId, status, beforeTaskId);
    if (evidence.eligibility !== 'ready') return evidence.eligibility;
    const source = evidence.source!;
    stage({
      type: 'move-task',
      workspaceId: source.workspaceId,
      projectId: source.projectId,
      taskId,
      expectedVersion: source.version,
      expectedOrderVersion: evidence.orderVersion!,
      status,
      beforeTaskId,
    });
    return 'ready';
  }
  async function execute(command: ProjectCommand, key: string): Promise<void> {
    const commandEpoch = epoch;
    if (!commandEpoch) return;
    if (state.pending) return;
    if (!fresh() || (memoryExpiry !== 0 && memoryExpiry <= Date.now())) {
      expire();
      return;
    }
    if (
      command.workspaceId !== state.selection.workspaceId ||
      ('projectId' in command && command.projectId !== state.selection.projectId) ||
      ('taskId' in command &&
        command.taskId !== state.selection.taskId &&
        !(command.type === 'move-task' && state.selection.taskId === null))
    ) {
      publish({ ...control, outcome: 'invalid' });
      return;
    }
    if (!actionReady(command, retry !== null)) return;
    const request = begin();
    if (!current(request) || epoch !== commandEpoch || !fresh()) return;
    reviewLease = null;
    retry = { command: structuredClone(command), key };
    publish({
      ...control,
      pending: command.type,
      retryTarget: structuredClone(command),
      outcome: null,
      conflict: null,
      accessConflict: null,
      requestId: null,
      pageError: null,
    });
    try {
      const result = await options.transport.mutate(command, key, request.signal);
      if (!current(request) || epoch !== commandEpoch || !fresh()) return;
      retry = null;
      memoryExpiry = 0;
      const confirmedEpoch = epoch;
      if (command.type !== 'move-task')
        select({
          workspaceId: command.workspaceId,
          projectId: 'projectId' in result ? result.projectId : result.id,
          taskId: 'projectId' in result ? result.id : null,
        });
      if (!current(request) || epoch !== commandEpoch || !fresh()) return;
      resultLease = receiptLease(command, request);
      publish({
        ...control,
        pending: null,
        outcome: 'success',
        result,
        draft: null,
        retryTarget: null,
        conflict: null,
      });
      if (
        !current(request) ||
        epoch !== confirmedEpoch ||
        !fresh() ||
        control.draft ||
        control.pending
      )
        return;
      pendingResources.clear();
      pendingColumns = false;
      resetWanted = false;
      clearTimeout(backgroundTimer);
      publish({ ...control, refreshRequired: false, refreshDeferred: false });
      // Success is retained independently of a failed follow-up read.
      try {
        await load(request);
      } catch (error) {
        if (current(request)) readFailure(error);
      }
    } catch (error) {
      if (!current(request) || epoch !== commandEpoch || !fresh()) return;
      const status = error instanceof ProjectTaskFailure ? error.status : 0;
      if (status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429)
        retry = null;
      reviewLease = status === 409 && control.draft ? receiptLease(control.draft, request) : null;
      const outcome =
        status === 409
          ? 'conflict'
          : status === 403
            ? 'forbidden'
            : status === 400
              ? 'invalid'
              : 'error';
      publish({
        ...control,
        pending: null,
        outcome,
        retryTarget: retry ? structuredClone(command) : null,
        closeWarning:
          error instanceof ProjectTaskFailure && error.current && status === 409
            ? error.closeWarning
            : null,
        commentConflict: null,
        checklistConflict: null,
        conflict: status === 409 && error instanceof ProjectTaskFailure ? error.current : null,
        accessConflict:
          status === 409 && error instanceof ProjectTaskFailure ? error.accessCurrent : null,
        requestId: error instanceof ProjectTaskFailure ? error.requestId : null,
      });
      if (status === 401) expire();
      else if (status === 403) readFailure(error);
    }
  }
  async function submit() {
    if (retry) {
      await retrySave();
      return;
    }
    if (state.draft)
      await execute(structuredClone(state.draft), (options.key ?? (() => crypto.randomUUID()))());
  }
  async function retrySave() {
    const captured = retry;
    if (!captured || !fresh() || !commandAtTarget(captured.command)) return;
    const request = { generation };
    try {
      if (!(await required('workspace', request)) || retry !== captured || !current(request))
        return;
      if (
        'projectId' in captured.command &&
        (!(await required('project', request)) || retry !== captured || !current(request))
      )
        return;
      const probe =
        'taskId' in captured.command && state.selection.taskId === captured.command.taskId
          ? 'task'
          : 'projectId' in captured.command
            ? 'project'
            : 'workspace';
      if (!(await required(probe, request)) || retry !== captured || !current(request)) return;
      await execute(structuredClone(captured.command), captured.key);
    } catch (error) {
      // Terminal reads retire the lifetime in the owner. Only the still-current
      // captured recovery may report an ordinary failed authority probe.
      if (!current(request) || retry !== captured || !fresh()) return;
      publish({
        ...control,
        outcome: 'error',
        requestId: error instanceof ProjectTaskFailure ? error.requestId : null,
      });
    }
  }
  async function loadMore(
    collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees',
  ) {
    if (state.pending || !fresh() || !['ready', 'empty'].includes(state.status)) return;
    const request = { generation };
    if (collection === 'projectAccess' || collection === 'assignees')
      publish({ ...control, ...withoutPolicyFailure(collection) });
    await query.readNext(collection);
    if (!current(request) || !fresh()) return;
    const resource = query.resources()[collection];
    if (collection === 'projectAccess' || collection === 'assignees') {
      if (resource.failure)
        policyFailure(collection, {
          requestId: resource.failure.requestId,
          ...(resource.status === 'changed' ? { reason: 'changed' as const } : {}),
        });
      else publish({ ...control, ...withoutPolicyFailure(collection) });
    } else
      publish({
        ...control,
        pageError: resource.failure
          ? {
              collection,
              requestId: resource.failure.requestId,
              ...(resource.status === 'changed' ? { reason: 'changed' as const } : {}),
            }
          : null,
      });
  }
  async function reloadConflict() {
    const draft = state.draft;
    if (!draft || state.pending || !('projectId' in draft) || !fresh() || !commandAtTarget(draft))
      return;
    const request = begin();
    const reviewEpoch = epoch;
    const reviewCurrent = () =>
      current(request) && fresh() && epoch === reviewEpoch && control.draft === draft;
    try {
      const probe = 'taskId' in draft ? 'task' : 'project';
      if (!(await required(probe, request)) || !reviewCurrent()) return;
      if (isCollaborationCommand(draft) && draft.type.includes('checklist')) {
        const [record, checklist] = await Promise.all([
          options.transport.task(draft.workspaceId, draft.projectId, draft.taskId, request.signal),
          options.transport.collaboration(
            draft.workspaceId,
            draft.projectId,
            draft.taskId,
            'checklist',
            request.signal,
          ),
        ]);
        if (reviewCurrent()) {
          reviewLease = receiptLease(draft, request);
          publish({
            ...state,
            conflict: record,
            checklistConflict: checklist.revision === record.version ? checklist : null,
            outcome: 'conflict',
          });
        }
        return;
      }
      if (draft.type === 'edit-comment') {
        const review = await options.transport.commentReview(
          draft.workspaceId,
          draft.projectId,
          draft.taskId,
          draft.commentId,
          request.signal,
        );
        if (reviewCurrent()) {
          reviewLease = receiptLease(draft, request);
          publish({
            ...state,
            conflict: review.task,
            commentConflict: review.comment,
            outcome: 'conflict',
          });
        }
        return;
      }
      if (draft.type === 'change-access') {
        const review = await options.transport.accessReview(
          draft.workspaceId,
          draft.projectId,
          draft.principalId,
          request.signal,
        );
        if (reviewCurrent()) {
          reviewLease = receiptLease(draft, request);
          publish({
            ...state,
            conflict: review.project,
            accessConflict: review.member,
            outcome: 'conflict',
          });
        }
        return;
      }
      const record =
        'taskId' in draft
          ? await options.transport.task(
              draft.workspaceId,
              draft.projectId,
              draft.taskId,
              request.signal,
            )
          : await options.transport.project(draft.workspaceId, draft.projectId, request.signal);
      if (reviewCurrent()) {
        reviewLease = receiptLease(draft, request);
        publish({ ...control, conflict: record, outcome: 'conflict' });
      }
    } catch (error) {
      if (reviewCurrent()) readFailure(error);
    }
  }
  function rebaseDraft() {
    const { draft, conflict } = state;
    if (!draft || !validReview(draft) || !actionReady(draft, true)) return;
    // A task/version alone cannot validate its former destination or anchor.
    // Moves require discard, refreshed columns and an explicit new destination.
    if (draft?.type === 'move-task') return;
    if (
      draft?.type === 'set-task-parent' ||
      draft?.type === 'move-checklist-item' ||
      state.closeWarning
    )
      return;
    if (
      draft &&
      isCollaborationCommand(draft) &&
      draft.type.includes('checklist') &&
      (!state.checklistConflict ||
        !state.checklistConflict.capabilities.canEdit ||
        state.checklistConflict.revision !== conflict?.version ||
        ('itemId' in draft &&
          !state.checklistConflict.items.some((row) => row.id === draft.itemId)) ||
        (draft.type === 'add-checklist-item' && !state.checklistConflict.capabilities.canCreate))
    )
      return;
    if (
      draft?.type === 'edit-comment' &&
      (!state.commentConflict?.capabilities.canEdit || state.commentConflict.id !== draft.commentId)
    )
      return;
    if (
      draft?.type === 'change-access' &&
      (!state.accessConflict || state.accessConflict.principalId !== draft.principalId)
    )
      return;
    if (
      !draft ||
      !conflict ||
      retry ||
      state.pending ||
      !('expectedVersion' in draft) ||
      !('projectId' in draft) ||
      draft.workspaceId !== conflict.workspaceId ||
      ('taskId' in draft
        ? !('projectId' in conflict) ||
          draft.taskId !== conflict.id ||
          draft.projectId !== conflict.projectId
        : 'projectId' in conflict || draft.projectId !== conflict.id)
    )
      return;
    publish({
      ...control,
      draft: {
        ...draft,
        expectedVersion: conflict.version,
        ...(draft.type === 'edit-comment'
          ? { expectedCommentVersion: state.commentConflict!.version }
          : {}),
      },
      conflict: null,
      accessConflict: null,
      commentConflict: null,
      checklistConflict: null,
      outcome: null,
    });
  }
  return {
    getState: () => state,
    expire,
    getVisibleState() {
      if (!state.privateLifetime || originalExpiry > Date.now()) return state;
      return {
        ...state,
        resources: null,
        privateLifetime: { ...state.privateLifetime, verified: false },
        session: null,
        workspaces: null,
        workspace: null,
        members: null,
        projects: null,
        project: null,
        tasks: null,
        task: null,
        taskColumns: {},
        projectAccess: null,
        assignees: null,
        collaboration: emptyCollaboration(),
        discovery: discoveryEmpty,
        draft: null,
        retryTarget: null,
        conflict: null,
        result: null,
        accessConflict: null,
        commentConflict: null,
        checklistConflict: null,
        closeWarning: null,
        integratedNavigation: null,
        workspaceNavigation: null,
        selectedTaskAssignee: null,
        taskSummary: {
          status: 'loading' as const,
          total: null,
          orderVersion: null,
          canCreate: false,
        },
        taskFilterAssigneeStatus: 'none' as const,
        discoveryFocusTaskId: null,
        draftGuard: {
          kind: 'none' as const,
          atTarget: true,
          canReturn: false,
          canDiscard: false,
          canStageNew: false,
        },
        status: 'signed-out' as const,
      };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      disposed = true;
      clearTimeout(backgroundTimer);
      verified = false;
      epoch = null;
      query.clear();
      begin();
    },
    registerNavigationBlocker(blocker: ProjectNavigationBlocker) {
      navigationBlocker = blocker;
      return () => {
        if (navigationBlocker === blocker) navigationBlocker = null;
      };
    },
    navigationProtected,
    resumeNavigation,
    async resolveIntegratedNavigation(choice: 'stay' | 'discard') {
      if (choice === 'stay') {
        deferredNavigation = null;
        publish({ ...control, integratedNavigation: null });
        return;
      }
      if (!deferredNavigation || state.pending || navigationBlocker?.getGuard() === 'pending')
        return;
      if (navigationBlocker && !navigationBlocker.discard()) return;
      retry = null;
      publish({
        ...control,
        draft: null,
        retryTarget: null,
        conflict: null,
        closeWarning: null,
        accessConflict: null,
        commentConflict: null,
        checklistConflict: null,
        outcome: null,
      });
      await resumeNavigation();
    },
    async navigateAway(url: string, navigate: () => void) {
      const run = async () => {
        navigate();
      };
      if (!guardNavigation(url, run)) await run();
    },
    setSprintLocation(sprintLocation: ProjectSprintLocation) {
      const url = writeProjectSprintLocation(state.url, sprintLocation);
      return url ? go({ sprintLocation }, false) : Promise.resolve();
    },
    async resolveWorkspaceNavigation(choice: 'stay' | 'discard') {
      if (choice === 'stay') {
        workspaceNavigation = null;
        publish({ ...control, workspaceNavigation: null });
        return;
      }
      if (choice !== 'discard' || state.pending || !workspaceNavigation) return;
      const navigate = workspaceNavigation;
      workspaceNavigation = null;
      retry = null;
      publish({
        ...control,
        workspaceNavigation: null,
        draft: null,
        retryTarget: null,
        conflict: null,
        closeWarning: null,
        accessConflict: null,
        commentConflict: null,
        checklistConflict: null,
        outcome: null,
      });
      await navigate?.();
    },
    backgroundRefresh,
    handleInvalidation,
    flushBackgroundRefresh,
    setStreamStatus(streamStatus: TaskStreamStatus) {
      publish({ ...control, streamStatus });
    },
    streamDenied(reason: 'signed-out' | 'forbidden') {
      if (reason === 'signed-out') expire();
      else {
        readFailure(new ProjectTaskFailure(403));
        publish({ ...control, streamStatus: 'forbidden' });
      }
    },
    loadDiscoveryMore: () =>
      !state.pending && fresh()
        ? fetchDiscovery({ generation, signal: abort.signal }, true)
        : Promise.resolve(),
    async setTaskScope(taskScope: TaskScope) {
      if (
        !['project', 'mine', 'search'].includes(taskScope) ||
        (state.pending && !navigationBlocker)
      )
        return;
      const filters = { ...state.taskView.filters };
      if (taskScope === 'mine') delete filters.assignee;
      await go({
        taskScope,
        taskView: { ...state.taskView, filters },
        selection: { ...state.selection, projectId: null, taskId: null },
        sprintLocation: { view: 'tasks', sprintId: null },
      });
    },
    async setSearchQuery(searchQuery: string) {
      if (!isTaskSearch(searchQuery) || (state.pending && !navigationBlocker)) return;
      await go({
        searchQuery: searchQuery.trim(),
        taskScope: state.taskScope === 'project' ? 'search' : state.taskScope,
        selection: { ...state.selection, projectId: null, taskId: null },
        sprintLocation: { view: 'tasks', sprintId: null },
      });
    },
    async setDiscoveryProject(projectId: string | null) {
      if ((projectId !== null && !id(projectId)) || (state.pending && !navigationBlocker)) return;
      await go({
        discoveryProjectId: projectId,
        selection: { ...state.selection, projectId: null, taskId: null },
        sprintLocation: { view: 'tasks', sprintId: null },
      });
    },
    openDiscoveryTask(item: TaskDiscoveryItem) {
      if (
        state.pending ||
        item.workspaceId !== state.selection.workspaceId ||
        !state.discovery.page?.items.some(
          (row) => row.id === item.id && row.projectId === item.projectId,
        )
      )
        return Promise.resolve();
      publish({ ...control, discoveryFocusTaskId: item.id });
      return go({
        selection: {
          workspaceId: item.workspaceId,
          projectId: item.projectId,
          taskId: item.id,
        },
        sprintLocation: { view: 'tasks', sprintId: null },
      });
    },
    returnToDiscovery: () =>
      state.taskScope !== 'project'
        ? go({ selection: { ...state.selection, projectId: null, taskId: null } })
        : Promise.resolve(),
    refresh,
    stage,
    stageMove,
    moveEligibility: (taskId: string, status: TaskStatus, beforeTaskId: string | null) =>
      moveEvidence(taskId, status, beforeTaskId).eligibility,
    submit,
    retrySave,
    loadMore,
    loadTaskColumn,
    reloadConflict,
    rebaseDraft,
    loadCollaborationMore: (collection: CollaborationCollection) =>
      !state.pending && fresh()
        ? fetchCollaboration(collection, { generation, signal: abort.signal }, true)
        : Promise.resolve(),
    async setParentCandidatesWanted(wanted: boolean) {
      if (!wanted) {
        publish({ ...control, parentCandidatesWanted: false });
        bindResources();
        return;
      }
      if (state.pending || !fresh() || !state.task) return;
      publish({ ...control, parentCandidatesWanted: true });
      bindResources();
      const slot = state.collaboration['parent-candidates'];
      if (slot.status !== 'loading' && slot.status !== 'ready' && slot.status !== 'changed')
        await fetchCollaboration('parent-candidates', { generation, signal: abort.signal });
    },
    acknowledgeClose() {
      const { draft, conflict, closeWarning } = state;
      if (
        !draft ||
        !validReview(draft) ||
        !conflict ||
        !('projectId' in conflict) ||
        !closeWarning ||
        retry ||
        state.pending ||
        !['edit-task', 'move-task'].includes(draft.type)
      )
        return;
      if (draft.type === 'edit-task' || draft.type === 'move-task')
        publish({
          ...control,
          draft: {
            ...draft,
            expectedVersion: conflict.version,
            acknowledgedChildrenVersion: closeWarning.childrenVersion,
            ...(draft.type === 'move-task' ? { expectedOrderVersion: conflict.orderVersion } : {}),
          },
          closeWarning: null,
          conflict: null,
          outcome: null,
        });
    },
    async setTaskLayout(layout: TaskView['layout']) {
      if (!['list', 'board'].includes(layout) || (state.pending && !navigationBlocker)) return;
      await go({ taskView: { ...state.taskView, layout } });
    },
    async setTaskFilters(filters: TaskFilters) {
      if (
        !isTaskFilters(filters) ||
        (state.taskScope === 'mine' && filters.assignee !== undefined) ||
        (state.pending && !navigationBlocker)
      )
        return;
      await go({
        taskView: {
          ...state.taskView,
          filters: { ...filters },
          column: filters.status ?? state.taskView.column,
        },
      });
    },
    async setTaskColumn(column: TaskStatus) {
      if (!taskStatuses.includes(column) || (state.pending && !navigationBlocker)) return;
      await go({ taskView: { ...state.taskView, column } });
    },
    selectWorkspace: (workspaceId: string | null) =>
      go({
        selection: { workspaceId, projectId: null, taskId: null },
        sprintLocation: { view: 'tasks', sprintId: null },
      }),
    selectProject: (projectId: string | null) => {
      return go({
        taskScope: 'project',
        selection: { ...state.selection, projectId, taskId: null },
        sprintLocation: { view: 'tasks', sprintId: null },
      });
    },
    selectTask: (taskId: string | null) => go({ selection: { ...state.selection, taskId } }),
    async setView(collection: 'projects' | 'tasks', view: ArchiveView) {
      if (!['active', 'archived'].includes(view)) return;
      await go({
        views: { ...state.views, [collection]: view },
        selection:
          collection === 'projects'
            ? { ...state.selection, projectId: null, taskId: null }
            : { ...state.selection, taskId: null },
        ...(collection === 'projects'
          ? { sprintLocation: { view: 'tasks', sprintId: null } as const }
          : {}),
      });
    },
    async openLocation(search: string, restoreHistoryTarget = false) {
      disposed = false;
      if (
        `/projects${search}` !== state.url &&
        guardNavigation(`/projects${search}`, () => this.openLocation(search, true), true)
      )
        return;
      const query = new URLSearchParams(search);
      const sprintLocation = readProjectSprintLocation(search);
      const w = query.get('workspace');
      const p = query.get('project');
      const t = query.get('task');
      const projectsView = query.get('projectsView') ?? 'active';
      const tasksView = query.get('tasksView') ?? 'active';
      const layout = query.get('taskLayout') ?? 'list';
      const column = query.get('column') ?? 'backlog';
      const taskScope = query.get('taskScope') ?? 'project';
      const searchQuery = query.get('q') ?? '';
      const searchProject = query.get('searchProject');
      const filters = Object.fromEntries(
        ['status', 'assignee', 'priority']
          .filter((key) => query.has(key))
          .map((key) => [key, query.get(key)]),
      );
      if (
        sprintLocation === null ||
        (w !== null && !id(w)) ||
        (p !== null && (!id(p) || !w)) ||
        (t !== null && (!id(t) || !p)) ||
        !['active', 'archived'].includes(projectsView) ||
        !['active', 'archived'].includes(tasksView) ||
        !['list', 'board'].includes(layout) ||
        !taskStatuses.includes(column as TaskStatus) ||
        !isTaskFilters(filters) ||
        !['project', 'mine', 'search'].includes(taskScope) ||
        !isTaskSearch(searchQuery) ||
        (searchProject !== null && !id(searchProject)) ||
        (taskScope === 'mine' && filters.assignee !== undefined) ||
        [
          'workspace',
          'project',
          'task',
          'projectsView',
          'tasksView',
          'taskLayout',
          'status',
          'assignee',
          'priority',
          'column',
          'taskScope',
          'q',
          'searchProject',
        ].some((key) => query.getAll(key).length > 1)
      ) {
        begin();
        verified = false;
        epoch = null;
        retireReads();
        cancelReads();
        publish({ ...control, ...cleared, status: 'error', session: null });
        return;
      }
      if (guardWorkspace(w, () => this.openLocation(search, true))) {
        options.navigate?.(state.url, true);
        return;
      }
      if (state.selection.workspaceId !== null && state.selection.workspaceId !== w) {
        retry = null;
        memoryExpiry = 0;
        publish({
          ...control,
          draft: null,
          retryTarget: null,
          conflict: null,
          result: null,
          outcome: null,
        });
      }
      begin();
      publish({
        ...control,
        ...cleared,
        status: 'loading',
        sprintLocation,
        taskScope: taskScope as TaskScope,
        searchQuery: searchQuery.trim(),
        discoveryProjectId: searchProject,
        views: { projects: projectsView as ArchiveView, tasks: tasksView as ArchiveView },
        taskView: { layout: layout as TaskView['layout'], filters, column: column as TaskStatus },
      });
      select({ workspaceId: w, projectId: p, taskId: t }, false);
      // A guarded popstate restored the previous URL. Replace that entry with
      // the accepted target before reads, including a denied destination.
      if (restoreHistoryTarget) options.navigate?.(state.url, true);
      publish({
        ...control,
        pending: null,
        retryTarget: retry ? structuredClone(retry.command) : null,
      });
      await refresh();
    },
    async returnToDraft() {
      const command = retry?.command ?? state.draft;
      if (!command) return;
      await changeSelection({
        workspaceId: command.workspaceId,
        projectId: 'projectId' in command ? command.projectId : null,
        taskId: 'taskId' in command ? command.taskId : null,
      });
    },
    discardDraft() {
      if (!state.pending) {
        retry = null;
        memoryExpiry = 0;
        publish({
          ...control,
          draft: null,
          retryTarget: null,
          conflict: null,
          closeWarning: null,
          commentConflict: null,
          checklistConflict: null,
          accessConflict: null,
          outcome: null,
        });
      }
    },
    cancelPending() {
      begin();
      publish({
        ...control,
        pending: null,
        status: state.status === 'loading' ? 'error' : state.status,
        retryTarget: retry ? structuredClone(retry.command) : null,
      });
    },
    dismissOutcome() {
      publish({ ...control, outcome: null });
    },
    dismissPageError() {
      publish({ ...control, pageError: null });
    },
  };
}
