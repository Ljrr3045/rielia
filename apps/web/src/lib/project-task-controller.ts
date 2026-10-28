import { projectURL, taskURL, type ArchiveView, type DomainPage, type Page, type Project, type ProjectTaskCommand, type ProjectTaskResult, type Task, type WorkspaceMember, type WorkspaceSummary } from '@rielia/contracts';
import { parseIdentityConfiguration, parseIdentitySession, type IdentitySession, type IdentityTransport } from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import { ProjectTaskFailure, type ProjectTaskTransport } from './project-task-client.ts';

export interface ProjectTaskSelection { workspaceId: string | null; projectId: string | null; taskId: string | null }
export interface ProjectTaskState {
  status: 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
  session: IdentitySession | null;
  workspaces: Page<WorkspaceSummary> | null; workspace: WorkspaceSummary | null; members: Page<WorkspaceMember> | null;
  projects: DomainPage<Project> | null; project: Project | null; tasks: DomainPage<Task> | null; task: Task | null;
  selection: ProjectTaskSelection; views: { projects: ArchiveView; tasks: ArchiveView }; url: string;
  draft: ProjectTaskCommand | null; pending: ProjectTaskCommand['type'] | null;
  outcome: 'success' | 'invalid' | 'forbidden' | 'conflict' | 'error' | null;
  retryTarget: ProjectTaskCommand | null; conflict: ProjectTaskResult | null; result: ProjectTaskResult | null;
  requestId: string | null;
}
const selectionEmpty: ProjectTaskSelection = { workspaceId: null, projectId: null, taskId: null };
const cleared = { workspace: null, members: null, projects: null, project: null, tasks: null, task: null };
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function urlFor(s: ProjectTaskSelection): string {
  if (!s.workspaceId) return '/projects';
  if (!s.projectId) return `/projects?workspace=${encodeURIComponent(s.workspaceId)}`;
  return s.taskId ? taskURL(s.workspaceId, s.projectId, s.taskId) : projectURL(s.workspaceId, s.projectId);
}
function sameTarget(a: ProjectTaskCommand, b: ProjectTaskCommand): boolean {
  return a.type === b.type && a.workspaceId === b.workspaceId && ('projectId' in a ? a.projectId : null) === ('projectId' in b ? b.projectId : null)
    && ('taskId' in a ? a.taskId : null) === ('taskId' in b ? b.taskId : null);
}

/** Memory-only drafts and keys. Public selectors choose scope; every request
 * reauthorizes at the server. Presentation renders state and invokes actions. */
export function createProjectTaskController(options: {
  identity: Pick<IdentityTransport, 'configuration' | 'session'>;
  workspaces: Pick<WorkspaceTransport, 'workspaces' | 'detail' | 'members'>;
  transport: ProjectTaskTransport; key?: () => string; navigate?: (url: string) => void;
}) {
  let state: ProjectTaskState = { status: 'loading', session: null, workspaces: null, ...cleared, selection: { ...selectionEmpty }, views: { projects: 'active', tasks: 'active' }, url: '/projects',
    draft: null, pending: null, outcome: null, retryTarget: null, conflict: null, result: null, requestId: null };
  let generation = 0; let abort = new AbortController(); let owner: string | null = null;
  let retry: { command: ProjectTaskCommand; key: string } | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: ProjectTaskState) => { state = next; for (const listener of listeners) listener(); };
  const begin = () => { abort.abort(); abort = new AbortController(); return { generation: ++generation, signal: abort.signal }; };
  const current = (request: { generation: number }) => generation === request.generation;
  const fresh = () => state.session !== null && Date.parse(state.session.session.expiresAt) > Date.now();
  function select(selection: ProjectTaskSelection, navigate = true) {
    const url = urlFor(selection); publish({ ...state, selection: { ...selection }, url });
    if (navigate) options.navigate?.(url);
  }
  function expire() { begin(); publish({ ...state, ...cleared, status: 'signed-out', session: null, workspaces: null, pending: null, retryTarget: retry ? structuredClone(retry.command) : null, result: null, conflict: null }); }
  function readFailure(error: unknown) {
    if ((error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 401) { expire(); return; }
    publish({ ...state, ...cleared, status: (error instanceof ProjectTaskFailure || error instanceof WorkspaceFailure) && error.status === 403 ? 'forbidden' : 'error',
      conflict: null, requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
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
    const [project, tasks, task] = await Promise.all([options.transport.project(w, projectId, request.signal), options.transport.tasks(w, projectId, views.tasks, request.signal),
      s.taskId ? options.transport.task(w, projectId, s.taskId, request.signal) : Promise.resolve(null)]);
    if (!current(request)) return;
    publish({ ...state, project, tasks, task, status: 'ready' });
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
        retry = null; publish({ ...state, selection: { ...selectionEmpty }, url: '/projects', draft: null, retryTarget: null, outcome: null, result: null, conflict: null, requestId: null });
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
  function stage(command: ProjectTaskCommand) {
    if (state.pending) return;
    if (retry) { publish({ ...state, outcome: 'invalid' }); return; }
    const draft = structuredClone(command);
    // Same form edits retain the version captured when it was opened, even if
    // a refresh replaces the visible record in the meantime.
    if (state.draft && sameTarget(state.draft, draft) && 'expectedVersion' in state.draft && 'expectedVersion' in draft) draft.expectedVersion = state.draft.expectedVersion;
    publish({ ...state, draft, outcome: null, conflict: null, requestId: null });
  }
  async function execute(command: ProjectTaskCommand, key: string): Promise<void> {
    if (state.pending) return;
    if (!fresh()) { expire(); return; }
    if (command.workspaceId !== state.selection.workspaceId || ('projectId' in command && command.projectId !== state.selection.projectId)) { publish({ ...state, outcome: 'invalid' }); return; }
    const request = begin(); retry = { command: structuredClone(command), key };
    publish({ ...state, pending: command.type, retryTarget: structuredClone(command), outcome: null, conflict: null, requestId: null });
    try {
      const result = await options.transport.mutate(command, key, request.signal);
      if (!current(request)) return;
      retry = null;
      select({ workspaceId: command.workspaceId, projectId: 'projectId' in result ? result.projectId : result.id, taskId: 'projectId' in result ? result.id : null });
      publish({ ...state, pending: null, outcome: 'success', result, draft: null, retryTarget: null, conflict: null });
      // Success is retained independently of a failed follow-up read.
      try { await load(request); } catch (error) { if (current(request)) readFailure(error); }
    } catch (error) {
      if (!current(request)) return;
      const status = error instanceof ProjectTaskFailure ? error.status : 0;
      if (status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429) retry = null;
      const outcome = status === 409 ? 'conflict' : status === 403 ? 'forbidden' : status === 400 ? 'invalid' : 'error';
      publish({ ...state, pending: null, outcome, retryTarget: retry ? structuredClone(command) : null,
        conflict: status === 409 && error instanceof ProjectTaskFailure ? error.current : null, requestId: error instanceof ProjectTaskFailure ? error.requestId : null });
      if (status === 401) expire();
      else if (status === 403) publish({ ...state, ...cleared, status: 'forbidden', conflict: null, result: null });
    }
  }
  async function submit() { if (retry) { await retrySave(); return; } if (state.draft) await execute(structuredClone(state.draft), (options.key ?? (() => crypto.randomUUID()))()); }
  async function retrySave() { if (retry) await execute(structuredClone(retry.command), retry.key); }
  async function loadMore(collection: 'workspaces' | 'members' | 'projects' | 'tasks') {
    const previous = state[collection]; if (!previous?.nextCursor || state.pending || !fresh()) return;
    const request = { generation, signal: abort.signal }; const s = { ...state.selection };
    try {
      const next = collection === 'workspaces' ? await options.workspaces.workspaces(request.signal, previous.nextCursor)
        : collection === 'members' && s.workspaceId ? await options.workspaces.members(s.workspaceId, request.signal, previous.nextCursor)
        : collection === 'projects' && s.workspaceId ? await options.transport.projects(s.workspaceId, state.views.projects, request.signal, previous.nextCursor)
        : collection === 'tasks' && s.workspaceId && s.projectId ? await options.transport.tasks(s.workspaceId, s.projectId, state.views.tasks, request.signal, previous.nextCursor) : null;
      if (!current(request) || state[collection] !== previous || !next) return;
      const rows = [...previous.items, ...next.items];
      const seen = new Set<string>();
      const items = rows.filter(row => { const key = 'principalId' in row ? row.principalId : row.id; if (seen.has(key)) return false; seen.add(key); return true; });
      publish({ ...state, [collection]: { ...next, items } });
    } catch (error) { if (current(request)) readFailure(error); }
  }
  async function reloadConflict() {
    const draft = state.draft; if (!draft || state.pending || !('projectId' in draft) || !fresh()) return;
    const request = begin();
    try {
      const record = 'taskId' in draft ? await options.transport.task(draft.workspaceId, draft.projectId, draft.taskId, request.signal) : await options.transport.project(draft.workspaceId, draft.projectId, request.signal);
      if (current(request) && state.draft === draft) publish({ ...state, conflict: record, outcome: 'conflict' });
    } catch (error) { if (current(request)) readFailure(error); }
  }
  function rebaseDraft() {
    const { draft, conflict } = state;
    if (!draft || !conflict || retry || state.pending || !('expectedVersion' in draft) || !('projectId' in draft) || draft.workspaceId !== conflict.workspaceId
      || ('taskId' in draft ? !('projectId' in conflict) || draft.taskId !== conflict.id || draft.projectId !== conflict.projectId : 'projectId' in conflict || draft.projectId !== conflict.id)) return;
    publish({ ...state, draft: { ...draft, expectedVersion: conflict.version }, conflict: null, outcome: null });
  }
  return { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, stage, submit, retrySave, loadMore, reloadConflict, rebaseDraft,
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
      if ((w !== null && !id(w)) || (p !== null && (!id(p) || !w)) || (t !== null && (!id(t) || !p))) { begin(); publish({ ...state, ...cleared, status: 'error' }); return; }
      begin(); select({ workspaceId: w, projectId: p, taskId: t }, false); publish({ ...state, pending: null, retryTarget: retry ? structuredClone(retry.command) : null }); await refresh();
    },
    discardDraft() { if (!state.pending) { retry = null; publish({ ...state, draft: null, retryTarget: null, conflict: null, outcome: null }); } },
    cancelPending() { begin(); publish({ ...state, pending: null, status: state.status === 'loading' ? 'error' : state.status, retryTarget: retry ? structuredClone(retry.command) : null }); },
    dismissOutcome() { publish({ ...state, outcome: null }); },
  };
}
