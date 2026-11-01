import { isTaskFilters, taskStatuses, projectURL, taskURL, type DomainPerson, type TaskStatus, type TaskView, type TaskFilters, type TaskPage, type ArchiveView, type DomainPage, type Page, type Project, type ProjectCommand, type ProjectTaskResult, type Task, type ProjectAccessPage, type ProjectAssigneePage, type ProjectAccessMember, type WorkspaceMember, type WorkspaceSummary } from '@rielia/contracts';
import { parseIdentityConfiguration, parseIdentitySession, type IdentitySession, type IdentityTransport } from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import { ProjectTaskFailure, type ProjectTaskTransport } from './project-task-client.ts';
import { collaborationCollections, isCollaborationCommand, type CollaborationCollection, type CloseWarning, type TaskComment, type TaskChecklist } from '@rielia/contracts';
import { emptyCollaboration, type CollaborationState } from './task-collaboration-state.ts';
import { isTaskSearch, type TaskScope, type TaskDiscoveryItem, type TaskDiscoveryPage, type TaskDiscoveryQuery } from '@rielia/contracts';
import type { TaskStreamStatus } from './task-events-client.ts';

export interface ProjectTaskSelection { workspaceId: string | null; projectId: string | null; taskId: string | null }
type PolicyCollection = 'projectAccess' | 'assignees';
interface PolicyPageFailure { requestId: string | null; reason?: 'changed' }
export type MoveEligibility = 'ready' | 'pending' | 'recovery' | 'draft' | 'changed' | 'unavailable' | 'forbidden' | 'invalid-destination' | 'different-detail';
export interface TaskSummary { status: 'loading' | 'ready' | 'partial' | 'changed'; total: number | null; orderVersion: number | null; canCreate: boolean }
export interface ProjectTaskState {
  workspaceNavigation: { workspaceId: string | null } | null;
  taskScope: TaskScope; searchQuery: string; discoveryProjectId: string | null;
  discovery: { status: 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'changed'; page: TaskDiscoveryPage | null; requestId: string | null };
  streamStatus: TaskStreamStatus; refreshRequired: boolean; refreshDeferred: boolean;
  discoveryFocusTaskId: string | null; discoveryContextLimitReached: boolean;
  parentCandidatesWanted: boolean;
  draftGuard: { kind: 'none' | 'draft' | 'pending' | 'recovery'; atTarget: boolean; canReturn: boolean; canDiscard: boolean; canStageNew: boolean };
  collaboration: CollaborationState; closeWarning: CloseWarning | null; commentConflict: TaskComment | null; checklistConflict: TaskChecklist | null;
  status: 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
  session: IdentitySession | null;
  workspaces: Page<WorkspaceSummary> | null; workspace: WorkspaceSummary | null; members: Page<WorkspaceMember> | null;
  projects: DomainPage<Project> | null; project: Project | null; tasks: TaskPage | null; task: Task | null;
  taskView: TaskView; taskColumns: Partial<Record<TaskStatus, TaskPage>>;
  taskColumnErrors: Partial<Record<TaskStatus, PolicyPageFailure>>; taskColumnsChanged: boolean;
  moveNeedsDestination: boolean;
  taskSummary: TaskSummary; selectedTaskAssignee: DomainPerson | null; taskFilterAssigneeStatus: 'none' | 'unassigned' | 'loading' | 'resolved' | 'unavailable';
  accessConflict: ProjectAccessMember | null; projectAccess: ProjectAccessPage | null; assignees: ProjectAssigneePage | null;
  policyPageErrors: Partial<Record<PolicyCollection, PolicyPageFailure>>;
  selection: ProjectTaskSelection; views: { projects: ArchiveView; tasks: ArchiveView }; url: string;
  draft: ProjectCommand | null; pending: ProjectCommand['type'] | null;
  outcome: 'success' | 'invalid' | 'forbidden' | 'conflict' | 'error' | null;
  retryTarget: ProjectCommand | null; conflict: ProjectTaskResult | null; result: ProjectTaskResult | null;
  requestId: string | null;
  pageError: { collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees'; requestId: string | null; reason?: 'changed' } | null;
}
const selectionEmpty: ProjectTaskSelection = { workspaceId: null, projectId: null, taskId: null };
const discoveryEmpty: ProjectTaskState['discovery'] = { status: 'idle', page: null, requestId: null };
const cleared = { discovery: discoveryEmpty, parentCandidatesWanted: false, collaboration: emptyCollaboration(), closeWarning: null, commentConflict: null, checklistConflict: null, taskColumns: {}, taskColumnErrors: {}, taskColumnsChanged: false, policyPageErrors: {}, accessConflict: null, projectAccess: null, assignees: null, workspace: null, members: null, projects: null, project: null, tasks: null, task: null, pageError: null };
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function urlFor(s: ProjectTaskSelection, views: ProjectTaskState['views'], taskView: TaskView, discovery: Pick<ProjectTaskState, 'taskScope' | 'searchQuery' | 'discoveryProjectId'>): string {
  const path = !s.workspaceId ? '/projects' : !s.projectId ? `/projects?workspace=${encodeURIComponent(s.workspaceId)}`
    : s.taskId ? taskURL(s.workspaceId, s.projectId, s.taskId) : projectURL(s.workspaceId, s.projectId);
  const url = new URL(path, 'https://location.invalid');
  if (views.projects === 'archived') url.searchParams.set('projectsView', 'archived');
  if (views.tasks === 'archived') url.searchParams.set('tasksView', 'archived');
  if (taskView.layout === 'board') url.searchParams.set('taskLayout', 'board');
  for (const [key, value] of Object.entries(taskView.filters)) url.searchParams.set(key, value);
  if (taskView.column !== 'backlog') url.searchParams.set('column', taskView.column);
  if (discovery.taskScope !== 'project') url.searchParams.set('taskScope', discovery.taskScope);
  if (discovery.searchQuery) url.searchParams.set('q', discovery.searchQuery);
  if (discovery.discoveryProjectId) url.searchParams.set('searchProject', discovery.discoveryProjectId);
  return url.pathname + url.search;
}
function sameTarget(a: ProjectCommand, b: ProjectCommand): boolean {
  return a.type === b.type && a.workspaceId === b.workspaceId && ('projectId' in a ? a.projectId : null) === ('projectId' in b ? b.projectId : null)
    && ('taskId' in a ? a.taskId : null) === ('taskId' in b ? b.taskId : null)
    && ('principalId' in a ? a.principalId : null) === ('principalId' in b ? b.principalId : null);
}

/** Memory-only drafts and keys. Public selectors choose scope; every request
 * reauthorizes at the server. Presentation renders state and invokes actions. */
export function createProjectTaskController(options: {
  identity: Pick<IdentityTransport, 'configuration' | 'session'>;
  workspaces: Pick<WorkspaceTransport, 'workspaces' | 'detail' | 'members'>;
  transport: ProjectTaskTransport; key?: () => string; navigate?: (url: string, replace?: boolean) => void;
}) {
  let state: ProjectTaskState = { status: 'loading', session: null, workspaces: null, ...cleared, selection: { ...selectionEmpty }, views: { projects: 'active', tasks: 'active' }, url: '/projects',
    workspaceNavigation: null, discoveryFocusTaskId: null, discoveryContextLimitReached: false, taskScope: 'project', searchQuery: '', discoveryProjectId: null, discovery: discoveryEmpty, streamStatus: 'idle', refreshRequired: false, refreshDeferred: false,
    draftGuard: { kind: 'none', atTarget: true, canReturn: false, canDiscard: false, canStageNew: true },
    taskView: { layout: 'list', filters: {}, column: 'backlog' }, moveNeedsDestination: false,
    taskSummary: { status: 'loading', total: null, orderVersion: null, canCreate: false }, selectedTaskAssignee: null, taskFilterAssigneeStatus: 'none',
    draft: null, pending: null, outcome: null, retryTarget: null, conflict: null, accessConflict: null, result: null, requestId: null };
  let generation = 0; let abort = new AbortController(); let owner: string | null = null; let sessionId: string | null = null; let backgroundPending = false;
  let backgroundEpoch = 0; let resetWanted = false; let backgroundTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let workspaceNavigation: (() => Promise<void>) | null = null;
  let discoveryContext: { key: string; page: TaskDiscoveryPage } | null = null;
  let retry: { command: ProjectCommand; key: string } | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: ProjectTaskState) => {
    const taskColumnsChanged = new Set(Object.values(next.taskColumns).map(page => page.orderVersion)).size > 1 || Object.values(next.taskColumnErrors).some(error => error.reason === 'changed');
    const statuses = next.taskView.filters.status ? [next.taskView.filters.status] : [...taskStatuses];
    const pages = next.taskView.layout === 'board' ? statuses.map(status => next.taskColumns[status]) : [next.tasks ?? undefined];
    const failed = next.taskView.layout === 'board' ? statuses.some(status => next.taskColumnErrors[status]) : next.pageError?.collection === 'tasks';
    const changed = next.taskView.layout === 'board' ? taskColumnsChanged : next.pageError?.collection === 'tasks' && next.pageError.reason === 'changed';
    const summaryStatus: TaskSummary['status'] = changed ? 'changed' : failed ? 'partial' : pages.some(page => !page) ? 'loading' : 'ready';
    const taskSummary: TaskSummary = { status: summaryStatus, total: summaryStatus === 'ready' ? pages.reduce((sum, page) => sum + page!.total, 0) : null,
      orderVersion: summaryStatus === 'ready' ? pages[0]!.orderVersion : null, canCreate: summaryStatus === 'ready' && pages.every(page => page!.capabilities.canCreate) };
    const metadata = next.taskView.layout === 'board' ? Object.values(next.taskColumns)[0] : next.tasks;
    const assignee = next.taskView.filters.assignee;
    const candidate = metadata?.selectedAssignee;
    const selectedTaskAssignee = candidate && candidate.principalId === assignee ? candidate : null;
    const command = next.retryTarget ?? next.draft;
    const atTarget = !command || command.workspaceId === next.selection.workspaceId && (!('projectId' in command) || command.projectId === next.selection.projectId)
      && (!('taskId' in command) || command.taskId === next.selection.taskId || command.type === 'move-task' && next.selection.taskId === null);
    const kind = next.pending ? 'pending' : next.retryTarget ? 'recovery' : next.draft ? 'draft' : 'none';
    const releaseRefresh = next.refreshRequired && next.refreshDeferred && kind === 'none' && !next.conflict && !next.closeWarning && !next.commentConflict && !next.checklistConflict && !next.accessConflict;
    state = { ...next, ...(releaseRefresh ? { refreshDeferred: false } : {}), discoveryContextLimitReached: (next.discovery.page?.items.length ?? 0) >= 1000 && !!next.discovery.page?.nextCursor,
      taskColumnsChanged, taskSummary, selectedTaskAssignee, draftGuard: { kind, atTarget, canReturn: !!command && !atTarget && !next.pending, canDiscard: !!command && !next.pending, canStageNew: !command && !next.pending },
      taskFilterAssigneeStatus: !assignee ? 'none' : assignee === 'unassigned' ? 'unassigned' : !metadata ? 'loading' : selectedTaskAssignee ? 'resolved' : 'unavailable',
      moveNeedsDestination: next.draft?.type === 'move-task' && next.outcome === 'conflict' };
    for (const listener of listeners) listener();
    if (releaseRefresh) { clearTimeout(backgroundTimer); backgroundTimer = setTimeout(() => { void backgroundRefresh(); }, 100); }
  };
  const begin = () => { abort.abort(); abort = new AbortController(); return { generation: ++generation, signal: abort.signal }; };
  const current = (request: { generation: number }) => generation === request.generation;
  const fresh = () => state.session !== null && Date.parse(state.session.session.expiresAt) > Date.now();
  function guardWorkspace(workspaceId: string | null, navigate: () => Promise<void>) {
    if (state.selection.workspaceId === null || state.selection.workspaceId === workspaceId || !(state.draft || retry || state.pending)) return false;
    workspaceNavigation = navigate; publish({ ...state, workspaceNavigation: { workspaceId } }); return true;
  }
  function select(selection: ProjectTaskSelection, navigate = true) {
    const sameScope = selection.workspaceId === state.selection.workspaceId && selection.projectId === state.selection.projectId && selection.taskId === state.selection.taskId;
    const url = urlFor(selection, state.views, state.taskView, state); publish({ ...state, selection: { ...selection }, url, parentCandidatesWanted: sameScope && state.parentCandidatesWanted });
    if (navigate) options.navigate?.(url);
  }
  function expire() { discoveryContext = null; begin(); publish({ ...state, ...cleared, discoveryFocusTaskId: null, discovery: discoveryEmpty, refreshRequired: false, refreshDeferred: false, streamStatus: 'signed-out', status: 'signed-out', session: null, workspaces: null, pending: null, retryTarget: retry ? structuredClone(retry.command) : null, result: null, conflict: null }); }
  function readFailure(error: unknown) {
    discoveryContext = null;
    if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 401) { expire(); return; }
    if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403) begin();
    publish({ ...state, ...cleared, discovery: discoveryEmpty, status: (error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403 ? 'forbidden' : 'error',
      conflict: null, accessConflict: null, ...((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403 ? { result: null } : {}), requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
  }
  function policyFailure(collection: PolicyCollection, failure: PolicyPageFailure) {
    const incumbent = state.pageError;
    const pageError: ProjectTaskState['pageError'] = incumbent === null || incumbent.collection === 'projectAccess' || incumbent.collection === 'assignees' ? { collection, ...failure } : incumbent;
    publish({ ...state, policyPageErrors: { ...state.policyPageErrors, [collection]: failure }, pageError });
  }
  function withoutPolicyFailure(collection: PolicyCollection): Pick<ProjectTaskState, 'policyPageErrors' | 'pageError'> {
    const errors = { ...state.policyPageErrors }; delete errors[collection];
    const other: PolicyCollection = collection === 'assignees' ? 'projectAccess' : 'assignees';
    return { policyPageErrors: errors, pageError: state.pageError?.collection === collection ? errors[other] ? { collection: other, ...errors[other] } : null : state.pageError };
  }
  async function fetchTaskColumn(status: TaskStatus, request: { generation: number; signal: AbortSignal }, previous?: TaskPage) {
    const { workspaceId: w, projectId: p } = state.selection;
    // Board status filtering selects visible columns; every column still has an
    // independently authorized revision for an explicit cross-column move.
    if (!w || !p) return;
    const errors = { ...state.taskColumnErrors }; delete errors[status]; publish({ ...state, taskColumnErrors: errors });
    try {
      const next = await options.transport.tasks(w, p, state.views.tasks, request.signal, previous?.nextCursor ?? undefined, { ...state.taskView.filters, status });
      if (!current(request) || state.taskColumns[status] !== previous) return;
      if (previous && previous.orderVersion !== next.orderVersion) {
        publish({ ...state, taskColumnErrors: { ...state.taskColumnErrors, [status]: { requestId: null, reason: 'changed' } } }); return;
      }
      const latestErrors = { ...state.taskColumnErrors }; delete latestErrors[status];
      publish({ ...state, taskColumnErrors: latestErrors, taskColumns: { ...state.taskColumns, [status]: { ...next, items: [...(previous?.items ?? []), ...next.items] } } });
    } catch (error) {
      if (!current(request) || state.taskColumns[status] !== previous) return;
      if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && [401, 403].includes(error.status)) readFailure(error);
      else publish({ ...state, taskColumnErrors: { ...state.taskColumnErrors, [status]: { requestId: error instanceof ProjectTaskFailure ? error.requestId : null, ...(error instanceof ProjectTaskFailure && error.code === 'page-changed' ? { reason: 'changed' as const } : {}) } } });
    }
  }
  async function loadTaskColumn(status: TaskStatus) {
    if (!taskStatuses.includes(status) || state.pending || !fresh() || state.taskColumnErrors[status]?.reason === 'changed' || state.taskColumnsChanged) return;
    const previous = state.taskColumns[status];
    if (previous && !previous.nextCursor) return;
    await fetchTaskColumn(status, { generation, signal: abort.signal }, previous);
  }
  function discoveryQuery(): TaskDiscoveryQuery {
    return { scope: state.taskScope === 'mine' ? 'mine' : 'search', q: state.searchQuery, view: state.views.tasks,
      filters: { ...state.taskView.filters }, ...(state.discoveryProjectId ? { projectId: state.discoveryProjectId } : {}) };
  }
  async function fetchDiscovery(request: { generation: number; signal: AbortSignal }, append = false) {
    const w = state.selection.workspaceId; if (!w || state.taskScope === 'project') return;
    const previous = state.discovery;
    if (append && (previous.status === 'loading' || previous.status === 'changed' || previous.page && (!previous.page.nextCursor || previous.page.items.length >= 1000))) return;
    const query = discoveryQuery(); const key = JSON.stringify([owner, sessionId, w, query.scope, query.q, query.view, query.projectId, Object.entries(query.filters).sort()]);
    const loading = { ...previous, status: 'loading' as const, requestId: null }; publish({ ...state, discovery: loading });
    try {
      const next = await options.transport.discover(w, query, request.signal, append ? previous.page?.nextCursor ?? undefined : undefined);
      if (!current(request) || state.discovery !== loading) return;
      if (append && previous.page && previous.page.revision !== next.revision) { publish({ ...state, discovery: { ...previous, status: 'changed' } }); return; }
      const cached = !append && discoveryContext?.key === key && discoveryContext.page.revision === next.revision && discoveryContext.page.total === next.total ? discoveryContext.page : null;
      const page = cached ?? { ...next, items: [...(append ? previous.page?.items ?? [] : []), ...next.items] };
      discoveryContext = { key, page };
      publish({ ...state, discoveryFocusTaskId: page.items.some(row => row.id === state.discoveryFocusTaskId) ? state.discoveryFocusTaskId : null, discovery: { status: page.total ? 'ready' : 'empty', page, requestId: null } });
    } catch (error) {
      if (!current(request) || state.discovery !== loading) return;
      if (error instanceof ProjectTaskFailure && [401, 403].includes(error.status)) readFailure(error);
      else publish({ ...state, discovery: { ...previous, status: error instanceof ProjectTaskFailure && error.code === 'page-changed' ? 'changed' : 'error', requestId: error instanceof ProjectTaskFailure ? error.requestId : null } });
    }
  }
  async function fetchCollaboration(collection: CollaborationCollection, request: { generation: number; signal: AbortSignal }, append = false) {
    const { workspaceId: w, projectId: p, taskId: t } = state.selection;
    if (!w || !p || !t || collection === 'parent-candidates' && !state.parentCandidatesWanted) return;
    const previous = state.collaboration[collection];
    if (append && (previous.status === 'loading' || previous.status === 'changed' || previous.data && !previous.data.nextCursor)) return;
    const loading = { ...previous, status: 'loading' as const, requestId: null };
    publish({ ...state, collaboration: { ...state.collaboration, [collection]: loading } });
    try {
      const next = await options.transport.collaboration(w, p, t, collection, request.signal, append ? previous.data?.nextCursor ?? undefined : undefined);
      if (!current(request) || state.collaboration[collection] !== loading) return;
      const changed = append && previous.data && previous.data.revision !== next.revision;
      const detailChanged = collection === 'relations' || collection === 'parent-candidates' ? next.revision !== state.task?.orderVersion : next.revision !== state.task?.version;
      const data = changed ? previous.data : { ...next, items: [...(append ? previous.data?.items ?? [] : []), ...next.items] };
      publish({ ...state, collaboration: { ...state.collaboration, [collection]: { status: changed || detailChanged ? 'changed' : 'ready', data, requestId: null } } });
    } catch (error) {
      if (!current(request) || state.collaboration[collection] !== loading) return;
      if (error instanceof ProjectTaskFailure && [401, 403].includes(error.status)) readFailure(error);
      else publish({ ...state, collaboration: { ...state.collaboration, [collection]: { ...previous, status: error instanceof ProjectTaskFailure && error.code === 'page-changed' ? 'changed' : 'error', requestId: error instanceof ProjectTaskFailure ? error.requestId : null } } });
    }
  }
  async function load(request: { generation: number; signal: AbortSignal }) {
    const s = { ...state.selection }; const views = { ...state.views };
    if (!s.workspaceId) { publish({ ...state, ...cleared, status: 'empty' }); return; }
    const w = s.workspaceId;
    const [workspace, members, projects] = await Promise.all([options.workspaces.detail(w, request.signal), options.workspaces.members(w, request.signal), options.transport.projects(w, views.projects, request.signal)]);
    if (!current(request)) return;
    if (state.taskScope !== 'project') await fetchDiscovery(request);
    if (!current(request)) return;
    const projectId = s.projectId ?? (state.taskScope === 'project' ? projects.items[0]?.id : null) ?? null;
    select({ workspaceId: w, projectId, taskId: s.taskId }, false);
    publish({ ...state, workspace, members, projects, status: projectId ? 'loading' : state.taskScope === 'project' ? 'empty' : 'ready' });
    if (!projectId) return;
    const [project, tasks, task] = await Promise.all([options.transport.project(w, projectId, request.signal), state.taskView.layout === 'list' ? options.transport.tasks(w, projectId, views.tasks, request.signal, undefined, state.taskView.filters) : Promise.resolve(null),
      s.taskId ? options.transport.task(w, projectId, s.taskId, request.signal) : Promise.resolve(null)]);
    if (!current(request)) return;
    publish({ ...state, project, tasks, task, collaboration: emptyCollaboration(), taskColumns: {}, taskColumnErrors: {}, projectAccess: null, assignees: null, policyPageErrors: {}, pageError: null, status: 'ready' });
    // Eligibility/management pages are independently recoverable. Auth denial
    // still clears content and invalidates a late sibling's completion.
    async function auxiliary(collection: 'projectAccess' | 'assignees') {
      try {
        const value = collection === 'projectAccess' ? await options.transport.access(w, projectId!, request.signal) : await options.transport.assignees(w, projectId!, request.signal);
        if (current(request)) publish({ ...state, ...withoutPolicyFailure(collection), [collection]: value });
      } catch (error) {
        if (!current(request)) return;
        if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && [401, 403].includes(error.status)) readFailure(error);
        else policyFailure(collection, { requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
      }
    }
    await Promise.all([project.capabilities.canManageAccess ? auxiliary('projectAccess') : Promise.resolve(), auxiliary('assignees'),
      ...(task ? collaborationCollections.filter(collection => collection !== 'parent-candidates' || state.parentCandidatesWanted).map(collection => fetchCollaboration(collection, request)) : []),
      ...(state.taskView.layout === 'board' ? taskStatuses.map(status => fetchTaskColumn(status, request)) : [])]);
  }
  async function refresh(): Promise<void> {
    if (state.pending) return;
    const request = begin(); publish({ ...state, ...cleared, discovery: discoveryEmpty, refreshRequired: false, refreshDeferred: false, parentCandidatesWanted: state.parentCandidatesWanted, status: 'loading', session: null, workspaces: null });
    try {
      const config = parseIdentityConfiguration(await options.identity.configuration());
      const session = config.enabled ? parseIdentitySession(await options.identity.session()) : null;
      if (!current(request)) return;
      if (!config.enabled || !session || Date.parse(session.session.expiresAt) <= Date.now()) {
        publish({ ...state, parentCandidatesWanted: false, status: config.enabled ? 'signed-out' : 'disabled', session: null, result: null, conflict: null }); return;
      }
      if (owner !== null && (owner !== session.user.id || sessionId !== session.session.id)) {
        discoveryContext = null;
        workspaceNavigation = null;
        retry = null; publish({ ...state, workspaceNavigation: null, discovery: discoveryEmpty, searchQuery: '', discoveryProjectId: null, parentCandidatesWanted: false, selection: { ...selectionEmpty }, taskView: { layout: 'list', filters: {}, column: 'backlog' }, url: '/projects', draft: null, retryTarget: null, outcome: null, result: null, conflict: null, accessConflict: null, requestId: null });
      }
      owner = session.user.id; sessionId = session.session.id; publish({ ...state, session });
      const workspaces = await options.workspaces.workspaces(request.signal);
      if (!current(request)) return;
      publish({ ...state, workspaces });
      if (!state.selection.workspaceId) select({ workspaceId: workspaces.items[0]?.id ?? null, projectId: null, taskId: null }, false);
      await load(request);
    } catch (error) { if (current(request)) readFailure(error); }
  }
  async function changeSelection(selection: ProjectTaskSelection) {
    if (guardWorkspace(selection.workspaceId, () => changeSelection(selection))) return;
    if (state.selection.workspaceId !== null && selection.workspaceId !== state.selection.workspaceId) {
      discoveryContext = null;
      retry = null; publish({ ...state, draft: null, retryTarget: null, conflict: null, result: null, outcome: null, searchQuery: '', discoveryProjectId: null, taskView: { ...state.taskView, filters: {} }, refreshRequired: false, refreshDeferred: false });
    }
    const request = begin(); select(selection);
    publish({ ...state, ...cleared, discovery: discoveryEmpty, parentCandidatesWanted: state.parentCandidatesWanted, status: 'loading', pending: null, retryTarget: retry ? structuredClone(retry.command) : null });
    if (!fresh()) { await refresh(); return; }
    try { await load(request); } catch (error) { if (current(request)) readFailure(error); }
  }
  async function backgroundRefresh(reset = false): Promise<void> {
    if (disposed) return;
    const epoch = ++backgroundEpoch; resetWanted ||= reset;
    publish({ ...state, refreshRequired: true });
    if (backgroundPending || state.status === 'loading') return;
    if (!fresh()) { expire(); return; }
    backgroundPending = true;
    const shouldReset = resetWanted; resetWanted = false;
    let request = { generation, signal: abort.signal };
    try {
      const session = parseIdentitySession(await options.identity.session());
      if (!current(request)) return;
      if (!session || Date.parse(session.session.expiresAt) <= Date.now()) { expire(); return; }
      if (session.user.id !== owner || session.session.id !== sessionId) { begin(); retry = null; publish({ ...state, pending: null, draft: null, retryTarget: null, conflict: null, result: null }); await refresh(); return; }
      publish({ ...state, session });
      // A reset can mean lost private access. Discard cached cross-project
      // collections immediately and verify selected detail before deferring.
      // The one bounded return context remains private until a fresh first page
      // proves the same authorized revision; it is never rendered while reset.
      if (shouldReset) publish({ ...state, projects: null, discovery: discoveryEmpty });
      const { workspaceId: w, projectId: p, taskId: t } = state.selection;
      if (w && p) { if (t) await options.transport.task(w, p, t, request.signal); else await options.transport.project(w, p, request.signal); }
      else if (w) await options.workspaces.detail(w, request.signal);
      if (!current(request)) return;
      if (state.pending || state.draft || retry || state.conflict || state.closeWarning || state.commentConflict || state.checklistConflict) {
        publish({ ...state, refreshRequired: true, refreshDeferred: true }); return;
      }
      request = begin();
      await load(request);
      if (current(request)) publish({ ...state, refreshRequired: backgroundEpoch !== epoch, refreshDeferred: false });
    } catch (error) {
      if (!current(request)) return;
      if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && [401, 403].includes(error.status)) readFailure(error);
      else publish({ ...state, refreshRequired: true });
    } finally {
      backgroundPending = false;
      if (!disposed && backgroundEpoch !== epoch && fresh() && !['forbidden', 'signed-out', 'error'].includes(state.status)) {
        clearTimeout(backgroundTimer); backgroundTimer = setTimeout(() => { void backgroundRefresh(); }, 100);
      }
    }
  }
  function stage(command: ProjectCommand) {
    if (state.pending) return;
    if (retry) { publish({ ...state, outcome: 'invalid' }); return; }
    const draft = structuredClone(command);
    if (state.draft && (isCollaborationCommand(state.draft) || isCollaborationCommand(draft)) && (!sameTarget(state.draft, draft)
      || ('itemId' in state.draft ? state.draft.itemId : null) !== ('itemId' in draft ? draft.itemId : null)
      || ('commentId' in state.draft ? state.draft.commentId : null) !== ('commentId' in draft ? draft.commentId : null))) { publish({ ...state, outcome: 'invalid' }); return; }
    // Same form edits retain the version captured when it was opened, even if
    // a refresh replaces the visible record in the meantime.
    const sameItem = state.draft && ('itemId' in state.draft ? state.draft.itemId : null) === ('itemId' in draft ? draft.itemId : null)
      && ('commentId' in state.draft ? state.draft.commentId : null) === ('commentId' in draft ? draft.commentId : null);
    if (state.draft && sameTarget(state.draft, draft) && sameItem && 'expectedVersion' in state.draft && 'expectedVersion' in draft) draft.expectedVersion = state.draft.expectedVersion;
    if (state.draft?.type === 'edit-comment' && draft.type === 'edit-comment' && sameTarget(state.draft, draft) && sameItem) draft.expectedCommentVersion = state.draft.expectedCommentVersion;
    if (state.draft?.type === 'create-task' && draft.type === 'create-task' && sameTarget(state.draft, draft) && state.draft.fields.parentTaskId === draft.fields.parentTaskId && state.draft.fields.expectedParentVersion !== undefined) draft.fields.expectedParentVersion = state.draft.fields.expectedParentVersion;
    if (state.draft?.type === 'move-task' && draft.type === 'move-task' && sameTarget(state.draft, draft)) draft.expectedOrderVersion = state.draft.expectedOrderVersion;
    publish({ ...state, draft, closeWarning: null, commentConflict: null, checklistConflict: null, outcome: null, conflict: null, accessConflict: null, requestId: null });
  }
  function moveEvidence(taskId: string, status: TaskStatus, beforeTaskId: string | null): { eligibility: MoveEligibility; source?: Task; orderVersion?: number } {
    if (state.pending) return { eligibility: 'pending' };
    if (retry) return { eligibility: 'recovery' };
    if (state.draft) return { eligibility: 'draft' };
    if (state.selection.taskId !== null && state.selection.taskId !== taskId) return { eligibility: 'different-detail' };
    if (state.taskColumnsChanged || state.pageError?.collection === 'tasks' && state.pageError.reason === 'changed') return { eligibility: 'changed' };
    if (!taskStatuses.includes(status) || (beforeTaskId !== null && (!id(beforeTaskId) || beforeTaskId === taskId))) return { eligibility: 'invalid-destination' };
    const pages = state.taskView.layout === 'board' ? Object.values(state.taskColumns) : state.tasks ? [state.tasks] : [];
    const source = pages.flatMap(page => page.items).find(row => row.id === taskId);
    const sourcePage = pages.find(page => page.items.some(row => row.id === taskId));
    const destination = state.taskView.layout === 'board' ? state.taskColumns[status] : sourcePage;
    if (!source || !sourcePage || !destination || state.taskColumnErrors[source.status] || state.taskColumnErrors[status] || state.pageError?.collection === 'tasks') return { eligibility: 'unavailable' };
    if (!source.capabilities.canEdit) return { eligibility: 'forbidden' };
    if (source.orderVersion !== sourcePage.orderVersion || destination.orderVersion !== sourcePage.orderVersion) return { eligibility: 'changed' };
    if (beforeTaskId !== null && !destination.items.some(row => row.id === beforeTaskId && row.status === status && row.orderVersion === sourcePage.orderVersion)) return { eligibility: 'invalid-destination' };
    return { eligibility: 'ready', source, orderVersion: sourcePage.orderVersion };
  }
  function stageMove(taskId: string, status: TaskStatus, beforeTaskId: string | null): MoveEligibility {
    const evidence = moveEvidence(taskId, status, beforeTaskId);
    if (evidence.eligibility !== 'ready') return evidence.eligibility;
    const source = evidence.source!;
    stage({ type: 'move-task', workspaceId: source.workspaceId, projectId: source.projectId, taskId, expectedVersion: source.version, expectedOrderVersion: evidence.orderVersion!, status, beforeTaskId });
    return 'ready';
  }
  async function execute(command: ProjectCommand, key: string): Promise<void> {
    if (state.pending) return;
    if (!fresh()) { expire(); return; }
    if (command.workspaceId !== state.selection.workspaceId || ('projectId' in command && command.projectId !== state.selection.projectId)
      || ('taskId' in command && command.taskId !== state.selection.taskId && !(command.type === 'move-task' && state.selection.taskId === null))) { publish({ ...state, outcome: 'invalid' }); return; }
    const request = begin(); retry = { command: structuredClone(command), key };
    publish({ ...state, pending: command.type, retryTarget: structuredClone(command), outcome: null, conflict: null, accessConflict: null, requestId: null, pageError: null });
    try {
      const result = await options.transport.mutate(command, key, request.signal);
      if (!current(request)) return;
      retry = null;
      if (command.type !== 'move-task') select({ workspaceId: command.workspaceId, projectId: 'projectId' in result ? result.projectId : result.id, taskId: 'projectId' in result ? result.id : null });
      publish({ ...state, pending: null, outcome: 'success', result, draft: null, retryTarget: null, conflict: null });
      // Success is retained independently of a failed follow-up read.
      try { await load(request); } catch (error) { if (current(request)) readFailure(error); }
    } catch (error) {
      if (!current(request)) return;
      const status = error instanceof ProjectTaskFailure ? error.status : 0;
      if (status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429) retry = null;
      const outcome = status === 409 ? 'conflict' : status === 403 ? 'forbidden' : status === 400 ? 'invalid' : 'error';
      publish({ ...state, pending: null, outcome, retryTarget: retry ? structuredClone(command) : null, closeWarning: error instanceof ProjectTaskFailure && error.current && status === 409 ? error.closeWarning : null, commentConflict: null, checklistConflict: null,
        conflict: status === 409 && error instanceof ProjectTaskFailure ? error.current : null, accessConflict: status === 409 && error instanceof ProjectTaskFailure ? error.accessCurrent : null, requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
      if (status === 401) expire();
      else if (status === 403) readFailure(error);
    }
  }
  async function submit() { if (retry) { await retrySave(); return; } if (state.draft) await execute(structuredClone(state.draft), (options.key ?? (() => crypto.randomUUID()))()); }
  async function retrySave() { if (retry) await execute(structuredClone(retry.command), retry.key); }
  async function loadMore(collection: 'workspaces' | 'members' | 'projects' | 'tasks' | 'projectAccess' | 'assignees') {
    if (collection === 'tasks' && state.pageError?.collection === 'tasks' && state.pageError.reason === 'changed') return;
    const previous = state[collection]; const initialPolicy = (collection === 'projectAccess' || collection === 'assignees') && previous === null && state.project !== null;
    if ((!initialPolicy && !previous?.nextCursor) || state.pending || !fresh() || (collection === 'projectAccess' && !state.project?.capabilities.canManageAccess)) return;
    const request = { generation, signal: abort.signal }; const s = { ...state.selection };
    if (collection === 'projectAccess' || collection === 'assignees') publish({ ...state, ...withoutPolicyFailure(collection) });
    else if (state.pageError?.collection === collection) publish({ ...state, pageError: null });
    try {
      const cursor = previous?.nextCursor ?? undefined;
      const next = collection === 'workspaces' ? await options.workspaces.workspaces(request.signal, cursor)
        : collection === 'members' && s.workspaceId ? await options.workspaces.members(s.workspaceId, request.signal, cursor)
        : collection === 'projects' && s.workspaceId ? await options.transport.projects(s.workspaceId, state.views.projects, request.signal, cursor)
        : collection === 'tasks' && s.workspaceId && s.projectId ? await options.transport.tasks(s.workspaceId, s.projectId, state.views.tasks, request.signal, cursor, state.taskView.filters)
        : collection === 'projectAccess' && s.workspaceId && s.projectId ? await options.transport.access(s.workspaceId, s.projectId, request.signal, cursor)
        : collection === 'assignees' && s.workspaceId && s.projectId ? await options.transport.assignees(s.workspaceId, s.projectId, request.signal, cursor) : null;
      if (!current(request) || state[collection] !== previous || !next) return;
      if (collection === 'tasks' && previous && 'orderVersion' in previous && 'orderVersion' in next && previous.orderVersion !== next.orderVersion) {
        publish({ ...state, pageError: { collection, requestId: null, reason: 'changed' } }); return;
      }
      if (collection === 'projectAccess' && previous && 'projectVersion' in previous && 'projectVersion' in next && previous.projectVersion !== next.projectVersion) {
        policyFailure(collection, { requestId: null, reason: 'changed' }); return;
      }
      const rows = [...(previous?.items ?? []), ...next.items];
      const seen = new Set<string>();
      const items = rows.filter(row => { const key = 'principalId' in row ? row.principalId : row.id; if (seen.has(key)) return false; seen.add(key); return true; });
      publish({ ...state, [collection]: { ...next, items } });
    } catch (error) {
      if (!current(request) || state[collection] !== previous) return;
      if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && [401, 403].includes(error.status)) readFailure(error);
      else if (collection === 'projectAccess' || collection === 'assignees') policyFailure(collection, { requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
      else publish({ ...state, pageError: { collection, requestId: error instanceof ProjectTaskFailure ? error.requestId : null, ...(error instanceof ProjectTaskFailure && error.code === 'page-changed' ? { reason: 'changed' as const } : {}) } });
    }
  }
  async function reloadConflict() {
    const draft = state.draft; if (!draft || state.pending || !('projectId' in draft) || !fresh()) return;
    const request = begin();
    try {
      if (isCollaborationCommand(draft) && draft.type.includes('checklist')) {
        const [record, checklist] = await Promise.all([options.transport.task(draft.workspaceId, draft.projectId, draft.taskId, request.signal), options.transport.collaboration(draft.workspaceId, draft.projectId, draft.taskId, 'checklist', request.signal)]);
        if (current(request) && state.draft === draft) publish({ ...state, conflict: record, checklistConflict: checklist.revision === record.version ? checklist : null, outcome: 'conflict' });
        return;
      }
      if (draft.type === 'edit-comment') {
        const review = await options.transport.commentReview(draft.workspaceId, draft.projectId, draft.taskId, draft.commentId, request.signal);
        if (current(request) && state.draft === draft) publish({ ...state, conflict: review.task, commentConflict: review.comment, outcome: 'conflict' });
        return;
      }
      if (draft.type === 'change-access') {
        const review = await options.transport.accessReview(draft.workspaceId, draft.projectId, draft.principalId, request.signal);
        if (current(request) && state.draft === draft) publish({ ...state, conflict: review.project, accessConflict: review.member, outcome: 'conflict' });
        return;
      }
      const record = 'taskId' in draft ? await options.transport.task(draft.workspaceId, draft.projectId, draft.taskId, request.signal) : await options.transport.project(draft.workspaceId, draft.projectId, request.signal);
      if (current(request) && state.draft === draft) publish({ ...state, conflict: record, outcome: 'conflict' });
    } catch (error) { if (current(request)) readFailure(error); }
  }
  function rebaseDraft() {
    const { draft, conflict } = state;
    // A task/version alone cannot validate its former destination or anchor.
    // Moves require discard, refreshed columns and an explicit new destination.
    if (draft?.type === 'move-task') return;
    if (draft?.type === 'set-task-parent' || draft?.type === 'move-checklist-item' || state.closeWarning) return;
    if (draft && isCollaborationCommand(draft) && draft.type.includes('checklist') && (!state.checklistConflict || !state.checklistConflict.capabilities.canEdit || state.checklistConflict.revision !== conflict?.version
      || 'itemId' in draft && !state.checklistConflict.items.some(row => row.id === draft.itemId) || draft.type === 'add-checklist-item' && !state.checklistConflict.capabilities.canCreate)) return;
    if (draft?.type === 'edit-comment' && (!state.commentConflict?.capabilities.canEdit || state.commentConflict.id !== draft.commentId)) return;
    if (draft?.type === 'change-access' && (!state.accessConflict || state.accessConflict.principalId !== draft.principalId)) return;
    if (!draft || !conflict || retry || state.pending || !('expectedVersion' in draft) || !('projectId' in draft) || draft.workspaceId !== conflict.workspaceId
      || ('taskId' in draft ? !('projectId' in conflict) || draft.taskId !== conflict.id || draft.projectId !== conflict.projectId : 'projectId' in conflict || draft.projectId !== conflict.id)) return;
    publish({ ...state, draft: { ...draft, expectedVersion: conflict.version, ...(draft.type === 'edit-comment' ? { expectedCommentVersion: state.commentConflict!.version } : {}) }, conflict: null, accessConflict: null, commentConflict: null, checklistConflict: null, outcome: null });
  }
  return { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { disposed = true; clearTimeout(backgroundTimer); begin(); },
    async resolveWorkspaceNavigation(choice: 'stay' | 'discard') {
      if (choice === 'stay') { workspaceNavigation = null; publish({ ...state, workspaceNavigation: null }); return; }
      if (choice !== 'discard' || state.pending || !workspaceNavigation) return;
      const navigate = workspaceNavigation; workspaceNavigation = null; retry = null;
      publish({ ...state, workspaceNavigation: null, draft: null, retryTarget: null, conflict: null, closeWarning: null, accessConflict: null, commentConflict: null, checklistConflict: null, outcome: null });
      await navigate?.();
    },
    backgroundRefresh,
    setStreamStatus(streamStatus: TaskStreamStatus) { publish({ ...state, streamStatus }); },
    streamDenied(reason: 'signed-out' | 'forbidden') { if (reason === 'signed-out') expire(); else { readFailure(new ProjectTaskFailure(403)); publish({ ...state, streamStatus: 'forbidden' }); } },
    loadDiscoveryMore: () => !state.pending && fresh() ? fetchDiscovery({ generation, signal: abort.signal }, true) : Promise.resolve(),
    async setTaskScope(taskScope: TaskScope) {
      if (!['project', 'mine', 'search'].includes(taskScope) || state.pending) return;
      const filters = { ...state.taskView.filters }; if (taskScope === 'mine') delete filters.assignee;
      publish({ ...state, taskScope, taskView: { ...state.taskView, filters } });
      await changeSelection({ ...state.selection, projectId: null, taskId: null });
    },
    async setSearchQuery(searchQuery: string) {
      if (!isTaskSearch(searchQuery) || state.pending) return;
      publish({ ...state, searchQuery: searchQuery.trim(), taskScope: state.taskScope === 'project' ? 'search' : state.taskScope });
      await changeSelection({ ...state.selection, projectId: null, taskId: null });
    },
    async setDiscoveryProject(projectId: string | null) {
      if (projectId !== null && !id(projectId) || state.pending) return;
      publish({ ...state, discoveryProjectId: projectId }); await changeSelection({ ...state.selection, projectId: null, taskId: null });
    },
    openDiscoveryTask(item: TaskDiscoveryItem) {
      if (state.pending || item.workspaceId !== state.selection.workspaceId || !state.discovery.page?.items.some(row => row.id === item.id && row.projectId === item.projectId)) return Promise.resolve();
      publish({ ...state, discoveryFocusTaskId: item.id }); return changeSelection({ workspaceId: item.workspaceId, projectId: item.projectId, taskId: item.id });
    },
    returnToDiscovery: () => state.taskScope !== 'project' ? changeSelection({ ...state.selection, projectId: null, taskId: null }) : Promise.resolve(),
    refresh, stage, stageMove, moveEligibility: (taskId: string, status: TaskStatus, beforeTaskId: string | null) => moveEvidence(taskId, status, beforeTaskId).eligibility, submit, retrySave, loadMore, loadTaskColumn, reloadConflict, rebaseDraft,
    loadCollaborationMore: (collection: CollaborationCollection) => !state.pending && fresh() ? fetchCollaboration(collection, { generation, signal: abort.signal }, true) : Promise.resolve(),
    async setParentCandidatesWanted(wanted: boolean) {
      if (!wanted) { publish({ ...state, parentCandidatesWanted: false, collaboration: { ...state.collaboration, 'parent-candidates': emptyCollaboration()['parent-candidates'] } }); return; }
      if (state.pending || !fresh() || !state.task) return;
      publish({ ...state, parentCandidatesWanted: true });
      const slot = state.collaboration['parent-candidates'];
      if (slot.status !== 'loading' && slot.status !== 'ready' && slot.status !== 'changed') await fetchCollaboration('parent-candidates', { generation, signal: abort.signal });
    },
    acknowledgeClose() {
      const { draft, conflict, closeWarning } = state;
      if (!draft || !conflict || !('projectId' in conflict) || !closeWarning || retry || state.pending || !['edit-task', 'move-task'].includes(draft.type)) return;
      if (draft.type === 'edit-task' || draft.type === 'move-task') publish({ ...state, draft: { ...draft, expectedVersion: conflict.version, acknowledgedChildrenVersion: closeWarning.childrenVersion,
        ...(draft.type === 'move-task' ? { expectedOrderVersion: conflict.orderVersion } : {}) }, closeWarning: null, conflict: null, outcome: null });
    },
    async setTaskLayout(layout: TaskView['layout']) {
      if (!['list', 'board'].includes(layout) || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, layout } }); await changeSelection({ ...state.selection });
    },
    async setTaskFilters(filters: TaskFilters) {
      if (!isTaskFilters(filters) || state.taskScope === 'mine' && filters.assignee !== undefined || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, filters: { ...filters }, column: filters.status ?? state.taskView.column } }); await changeSelection({ ...state.selection });
    },
    async setTaskColumn(column: TaskStatus) {
      if (!taskStatuses.includes(column) || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, column } }); await changeSelection({ ...state.selection });
    },
    selectWorkspace: (workspaceId: string | null) => changeSelection({ workspaceId, projectId: null, taskId: null }),
    selectProject: (projectId: string | null) => { publish({ ...state, taskScope: 'project' }); return changeSelection({ ...state.selection, projectId, taskId: null }); },
    selectTask: (taskId: string | null) => changeSelection({ ...state.selection, taskId }),
    async setView(collection: 'projects' | 'tasks', view: ArchiveView) {
      if (!['active', 'archived'].includes(view)) return;
      publish({ ...state, views: { ...state.views, [collection]: view } });
      await changeSelection(collection === 'projects' ? { ...state.selection, projectId: null, taskId: null } : { ...state.selection, taskId: null });
    },
    async openLocation(search: string, restoreHistoryTarget = false) {
      disposed = false;
      const query = new URLSearchParams(search); const w = query.get('workspace'); const p = query.get('project'); const t = query.get('task');
      const projectsView = query.get('projectsView') ?? 'active'; const tasksView = query.get('tasksView') ?? 'active';
      const layout = query.get('taskLayout') ?? 'list'; const column = query.get('column') ?? 'backlog';
      const taskScope = query.get('taskScope') ?? 'project'; const searchQuery = query.get('q') ?? ''; const searchProject = query.get('searchProject');
      const filters = Object.fromEntries(['status', 'assignee', 'priority'].filter(key => query.has(key)).map(key => [key, query.get(key)]));
      if ((w !== null && !id(w)) || (p !== null && (!id(p) || !w)) || (t !== null && (!id(t) || !p))
        || !['active', 'archived'].includes(projectsView) || !['active', 'archived'].includes(tasksView)
        || !['list', 'board'].includes(layout) || !taskStatuses.includes(column as TaskStatus) || !isTaskFilters(filters)
        || !['project', 'mine', 'search'].includes(taskScope) || !isTaskSearch(searchQuery) || searchProject !== null && !id(searchProject) || taskScope === 'mine' && filters.assignee !== undefined
        || ['workspace', 'project', 'task', 'projectsView', 'tasksView', 'taskLayout', 'status', 'assignee', 'priority', 'column', 'taskScope', 'q', 'searchProject'].some(key => query.getAll(key).length > 1)) { begin(); publish({ ...state, ...cleared, discovery: discoveryEmpty, status: 'error' }); return; }
      if (guardWorkspace(w, () => this.openLocation(search, true))) { options.navigate?.(state.url, true); return; }
      if (state.selection.workspaceId !== null && state.selection.workspaceId !== w) { discoveryContext = null; retry = null; publish({ ...state, draft: null, retryTarget: null, conflict: null, result: null, outcome: null }); }
      begin(); publish({ ...state, taskScope: taskScope as TaskScope, searchQuery: searchQuery.trim(), discoveryProjectId: searchProject, views: { projects: projectsView as ArchiveView, tasks: tasksView as ArchiveView }, taskView: { layout: layout as TaskView['layout'], filters, column: column as TaskStatus } });
      select({ workspaceId: w, projectId: p, taskId: t }, false);
      // A guarded popstate restored the previous URL. Replace that entry with
      // the accepted target before reads, including a denied destination.
      if (restoreHistoryTarget) options.navigate?.(state.url, true);
      publish({ ...state, pending: null, retryTarget: retry ? structuredClone(retry.command) : null }); await refresh();
    },
    async returnToDraft() {
      const command = retry?.command ?? state.draft; if (!command) return;
      await changeSelection({ workspaceId: command.workspaceId, projectId: 'projectId' in command ? command.projectId : null, taskId: 'taskId' in command ? command.taskId : null });
    },
    discardDraft() { if (!state.pending) { retry = null; publish({ ...state, draft: null, retryTarget: null, conflict: null, closeWarning: null, commentConflict: null, checklistConflict: null, accessConflict: null, outcome: null }); } },
    cancelPending() { begin(); publish({ ...state, pending: null, status: state.status === 'loading' ? 'error' : state.status, retryTarget: retry ? structuredClone(retry.command) : null }); },
    dismissOutcome() { publish({ ...state, outcome: null }); },
    dismissPageError() { publish({ ...state, pageError: null }); },
  };
}
