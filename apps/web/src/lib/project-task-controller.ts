import { isTaskFilters, taskStatuses, projectURL, taskURL, type DomainPerson, type TaskStatus, type TaskView, type TaskFilters, type TaskPage, type ArchiveView, type DomainPage, type Page, type Project, type ProjectCommand, type ProjectTaskResult, type Task, type ProjectAccessPage, type ProjectAssigneePage, type ProjectAccessMember, type WorkspaceMember, type WorkspaceSummary } from '@rielia/contracts';
import { parseIdentityConfiguration, parseIdentitySession, type IdentitySession, type IdentityTransport } from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import { ProjectTaskFailure, type ProjectTaskTransport } from './project-task-client.ts';

export interface ProjectTaskSelection { workspaceId: string | null; projectId: string | null; taskId: string | null }
type PolicyCollection = 'projectAccess' | 'assignees';
interface PolicyPageFailure { requestId: string | null; reason?: 'changed' }
export type MoveEligibility = 'ready' | 'pending' | 'recovery' | 'draft' | 'changed' | 'unavailable' | 'forbidden' | 'invalid-destination' | 'different-detail';
export interface TaskSummary { status: 'loading' | 'ready' | 'partial' | 'changed'; total: number | null; orderVersion: number | null; canCreate: boolean }
export interface ProjectTaskState {
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
const cleared = { taskColumns: {}, taskColumnErrors: {}, taskColumnsChanged: false, policyPageErrors: {}, accessConflict: null, projectAccess: null, assignees: null, workspace: null, members: null, projects: null, project: null, tasks: null, task: null, pageError: null };
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function urlFor(s: ProjectTaskSelection, views: ProjectTaskState['views'], taskView: TaskView): string {
  const path = !s.workspaceId ? '/projects' : !s.projectId ? `/projects?workspace=${encodeURIComponent(s.workspaceId)}`
    : s.taskId ? taskURL(s.workspaceId, s.projectId, s.taskId) : projectURL(s.workspaceId, s.projectId);
  const url = new URL(path, 'https://location.invalid');
  if (views.projects === 'archived') url.searchParams.set('projectsView', 'archived');
  if (views.tasks === 'archived') url.searchParams.set('tasksView', 'archived');
  if (taskView.layout === 'board') url.searchParams.set('taskLayout', 'board');
  for (const [key, value] of Object.entries(taskView.filters)) url.searchParams.set(key, value);
  if (taskView.column !== 'backlog') url.searchParams.set('column', taskView.column);
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
  transport: ProjectTaskTransport; key?: () => string; navigate?: (url: string) => void;
}) {
  let state: ProjectTaskState = { status: 'loading', session: null, workspaces: null, ...cleared, selection: { ...selectionEmpty }, views: { projects: 'active', tasks: 'active' }, url: '/projects',
    taskView: { layout: 'list', filters: {}, column: 'backlog' }, moveNeedsDestination: false,
    taskSummary: { status: 'loading', total: null, orderVersion: null, canCreate: false }, selectedTaskAssignee: null, taskFilterAssigneeStatus: 'none',
    draft: null, pending: null, outcome: null, retryTarget: null, conflict: null, accessConflict: null, result: null, requestId: null };
  let generation = 0; let abort = new AbortController(); let owner: string | null = null;
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
    state = { ...next, taskColumnsChanged, taskSummary, selectedTaskAssignee,
      taskFilterAssigneeStatus: !assignee ? 'none' : assignee === 'unassigned' ? 'unassigned' : !metadata ? 'loading' : selectedTaskAssignee ? 'resolved' : 'unavailable',
      moveNeedsDestination: next.draft?.type === 'move-task' && next.outcome === 'conflict' };
    for (const listener of listeners) listener();
  };
  const begin = () => { abort.abort(); abort = new AbortController(); return { generation: ++generation, signal: abort.signal }; };
  const current = (request: { generation: number }) => generation === request.generation;
  const fresh = () => state.session !== null && Date.parse(state.session.session.expiresAt) > Date.now();
  function select(selection: ProjectTaskSelection, navigate = true) {
    const url = urlFor(selection, state.views, state.taskView); publish({ ...state, selection: { ...selection }, url });
    if (navigate) options.navigate?.(url);
  }
  function expire() { begin(); publish({ ...state, ...cleared, status: 'signed-out', session: null, workspaces: null, pending: null, retryTarget: retry ? structuredClone(retry.command) : null, result: null, conflict: null }); }
  function readFailure(error: unknown) {
    if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 401) { expire(); return; }
    if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403) begin();
    publish({ ...state, ...cleared, status: (error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403 ? 'forbidden' : 'error',
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
  async function load(request: { generation: number; signal: AbortSignal }) {
    const s = { ...state.selection }; const views = { ...state.views };
    if (!s.workspaceId) { publish({ ...state, ...cleared, status: 'empty' }); return; }
    const w = s.workspaceId;
    const [workspace, members, projects] = await Promise.all([options.workspaces.detail(w, request.signal), options.workspaces.members(w, request.signal), options.transport.projects(w, views.projects, request.signal)]);
    if (!current(request)) return;
    const projectId = s.projectId ?? projects.items[0]?.id ?? null;
    select({ workspaceId: w, projectId, taskId: s.taskId }, false);
    publish({ ...state, workspace, members, projects, status: projectId ? 'loading' : 'empty' });
    if (!projectId) return;
    const [project, tasks, task] = await Promise.all([options.transport.project(w, projectId, request.signal), state.taskView.layout === 'list' ? options.transport.tasks(w, projectId, views.tasks, request.signal, undefined, state.taskView.filters) : Promise.resolve(null),
      s.taskId ? options.transport.task(w, projectId, s.taskId, request.signal) : Promise.resolve(null)]);
    if (!current(request)) return;
    publish({ ...state, project, tasks, task, taskColumns: {}, taskColumnErrors: {}, projectAccess: null, assignees: null, policyPageErrors: {}, pageError: null, status: 'ready' });
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
      ...(state.taskView.layout === 'board' ? taskStatuses.map(status => fetchTaskColumn(status, request)) : [])]);
  }
  async function refresh(): Promise<void> {
    if (state.pending) return;
    const request = begin(); publish({ ...state, ...cleared, status: 'loading', session: null, workspaces: null });
    try {
      const config = parseIdentityConfiguration(await options.identity.configuration());
      const session = config.enabled ? parseIdentitySession(await options.identity.session()) : null;
      if (!current(request)) return;
      if (!config.enabled || !session || Date.parse(session.session.expiresAt) <= Date.now()) {
        publish({ ...state, status: config.enabled ? 'signed-out' : 'disabled', session: null, result: null, conflict: null }); return;
      }
      if (owner !== null && owner !== session.user.id) {
        retry = null; publish({ ...state, selection: { ...selectionEmpty }, taskView: { layout: 'list', filters: {}, column: 'backlog' }, url: '/projects', draft: null, retryTarget: null, outcome: null, result: null, conflict: null, accessConflict: null, requestId: null });
      }
      owner = session.user.id; publish({ ...state, session });
      const workspaces = await options.workspaces.workspaces(request.signal);
      if (!current(request)) return;
      publish({ ...state, workspaces });
      if (!state.selection.workspaceId) select({ workspaceId: workspaces.items[0]?.id ?? null, projectId: null, taskId: null }, false);
      await load(request);
    } catch (error) { if (current(request)) readFailure(error); }
  }
  async function changeSelection(selection: ProjectTaskSelection) {
    const request = begin(); select(selection);
    publish({ ...state, ...cleared, status: 'loading', pending: null, retryTarget: retry ? structuredClone(retry.command) : null });
    if (!fresh()) { await refresh(); return; }
    try { await load(request); } catch (error) { if (current(request)) readFailure(error); }
  }
  function stage(command: ProjectCommand) {
    if (state.pending) return;
    if (retry) { publish({ ...state, outcome: 'invalid' }); return; }
    const draft = structuredClone(command);
    // Same form edits retain the version captured when it was opened, even if
    // a refresh replaces the visible record in the meantime.
    if (state.draft && sameTarget(state.draft, draft) && 'expectedVersion' in state.draft && 'expectedVersion' in draft) draft.expectedVersion = state.draft.expectedVersion;
    if (state.draft?.type === 'move-task' && draft.type === 'move-task' && sameTarget(state.draft, draft)) draft.expectedOrderVersion = state.draft.expectedOrderVersion;
    publish({ ...state, draft, outcome: null, conflict: null, accessConflict: null, requestId: null });
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
      publish({ ...state, pending: null, outcome, retryTarget: retry ? structuredClone(command) : null,
        conflict: status === 409 && error instanceof ProjectTaskFailure ? error.current : null, accessConflict: status === 409 && error instanceof ProjectTaskFailure ? error.accessCurrent : null, requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
      if (status === 401) expire();
      else if (status === 403) publish({ ...state, ...cleared, status: 'forbidden', conflict: null, accessConflict: null, result: null });
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
    if (draft?.type === 'change-access' && (!state.accessConflict || state.accessConflict.principalId !== draft.principalId)) return;
    if (!draft || !conflict || retry || state.pending || !('expectedVersion' in draft) || !('projectId' in draft) || draft.workspaceId !== conflict.workspaceId
      || ('taskId' in draft ? !('projectId' in conflict) || draft.taskId !== conflict.id || draft.projectId !== conflict.projectId : 'projectId' in conflict || draft.projectId !== conflict.id)) return;
    publish({ ...state, draft: { ...draft, expectedVersion: conflict.version }, conflict: null, accessConflict: null, outcome: null });
  }
  return { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, stage, stageMove, moveEligibility: (taskId: string, status: TaskStatus, beforeTaskId: string | null) => moveEvidence(taskId, status, beforeTaskId).eligibility, submit, retrySave, loadMore, loadTaskColumn, reloadConflict, rebaseDraft,
    async setTaskLayout(layout: TaskView['layout']) {
      if (!['list', 'board'].includes(layout) || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, layout } }); await changeSelection({ ...state.selection });
    },
    async setTaskFilters(filters: TaskFilters) {
      if (!isTaskFilters(filters) || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, filters: { ...filters }, column: filters.status ?? state.taskView.column } }); await changeSelection({ ...state.selection });
    },
    async setTaskColumn(column: TaskStatus) {
      if (!taskStatuses.includes(column) || state.pending) return;
      publish({ ...state, taskView: { ...state.taskView, column } }); await changeSelection({ ...state.selection });
    },
    selectWorkspace: (workspaceId: string | null) => changeSelection({ workspaceId, projectId: null, taskId: null }),
    selectProject: (projectId: string | null) => changeSelection({ ...state.selection, projectId, taskId: null }),
    selectTask: (taskId: string | null) => changeSelection({ ...state.selection, taskId }),
    async setView(collection: 'projects' | 'tasks', view: ArchiveView) {
      if (!['active', 'archived'].includes(view)) return;
      publish({ ...state, views: { ...state.views, [collection]: view } });
      await changeSelection(collection === 'projects' ? { ...state.selection, projectId: null, taskId: null } : { ...state.selection, taskId: null });
    },
    async openLocation(search: string) {
      const query = new URLSearchParams(search); const w = query.get('workspace'); const p = query.get('project'); const t = query.get('task');
      const projectsView = query.get('projectsView') ?? 'active'; const tasksView = query.get('tasksView') ?? 'active';
      const layout = query.get('taskLayout') ?? 'list'; const column = query.get('column') ?? 'backlog';
      const filters = Object.fromEntries(['status', 'assignee', 'priority'].filter(key => query.has(key)).map(key => [key, query.get(key)]));
      if ((w !== null && !id(w)) || (p !== null && (!id(p) || !w)) || (t !== null && (!id(t) || !p))
        || !['active', 'archived'].includes(projectsView) || !['active', 'archived'].includes(tasksView)
        || !['list', 'board'].includes(layout) || !taskStatuses.includes(column as TaskStatus) || !isTaskFilters(filters)
        || ['workspace', 'project', 'task', 'projectsView', 'tasksView', 'taskLayout', 'status', 'assignee', 'priority', 'column'].some(key => query.getAll(key).length > 1)) { begin(); publish({ ...state, ...cleared, status: 'error' }); return; }
      begin(); publish({ ...state, views: { projects: projectsView as ArchiveView, tasks: tasksView as ArchiveView }, taskView: { layout: layout as TaskView['layout'], filters, column: column as TaskStatus } });
      select({ workspaceId: w, projectId: p, taskId: t }, false); publish({ ...state, pending: null, retryTarget: retry ? structuredClone(retry.command) : null }); await refresh();
    },
    async returnToDraft() {
      const command = retry?.command ?? state.draft; if (!command) return;
      await changeSelection({ workspaceId: command.workspaceId, projectId: 'projectId' in command ? command.projectId : null, taskId: 'taskId' in command ? command.taskId : null });
    },
    discardDraft() { if (!state.pending) { retry = null; publish({ ...state, draft: null, retryTarget: null, conflict: null, accessConflict: null, outcome: null }); } },
    cancelPending() { begin(); publish({ ...state, pending: null, status: state.status === 'loading' ? 'error' : state.status, retryTarget: retry ? structuredClone(retry.command) : null }); },
    dismissOutcome() { publish({ ...state, outcome: null }); },
    dismissPageError() { publish({ ...state, pageError: null }); },
  };
}
