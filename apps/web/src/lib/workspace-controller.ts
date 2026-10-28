import type { Page, WorkspaceCommand, WorkspaceInvitation, WorkspaceMember, WorkspaceResult, WorkspaceSummary } from '@rielia/contracts';
import { parseIdentityConfiguration, parseIdentitySession, type IdentitySession, type IdentityTransport } from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';

export interface WorkspaceState {
  status: 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
  session: IdentitySession | null;
  workspaces: Page<WorkspaceSummary> | null;
  selectedWorkspaceId: string | null;
  workspace: WorkspaceSummary | null;
  members: Page<WorkspaceMember> | null;
  invitations: Page<WorkspaceInvitation> | null;
  pending: WorkspaceCommand['type'] | null;
  outcome: 'success' | 'invalid' | 'forbidden' | 'conflict' | 'error' | 'invitation-link-unavailable' | null;
  draft: WorkspaceCommand | null;
  retryTarget: { type: WorkspaceCommand['type']; workspaceId: string | null } | null;
  invitationLink: string | null;
  hasInvitation: boolean;
  capabilities: { canCreateWorkspace: boolean; canAdminister: boolean };
}
export interface WorkspaceSelectionStore { read(userId: string): string | null; write(userId: string, workspaceId: string | null): void }
const cleared = { workspace: null, members: null, invitations: null, invitationLink: null };
const noCapabilities = { canCreateWorkspace: false, canAdminister: false };

/** All drafts/recovery/tokens are memory-only. Selection storage contains only an
 * untrusted workspace ID, reauthorized on every load. UI renders this contract. */
export function createWorkspaceController(options: {
  identity: Pick<IdentityTransport, 'configuration' | 'session'>; transport: WorkspaceTransport;
  selection?: WorkspaceSelectionStore; key?: () => string; origin?: () => string;
}) {
  let state: WorkspaceState = { status: 'loading', session: null, workspaces: null, selectedWorkspaceId: null, ...cleared,
    pending: null, outcome: null, draft: null, retryTarget: null, hasInvitation: false, capabilities: noCapabilities };
  let generation = 0; let abort = new AbortController(); let owner: string | null = null;
  let retry: { command: WorkspaceCommand; key: string } | null = null;
  let inbound: string | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: WorkspaceState) => { state = next; for (const listener of listeners) listener(); };
  const begin = () => { abort.abort(); abort = new AbortController(); return { generation: ++generation, signal: abort.signal }; };
  const current = (request: { generation: number }) => request.generation === generation;
  const admin = (workspace: WorkspaceSummary | null) => workspace !== null && ['owner', 'admin'].includes(workspace.role);
  const fresh = () => state.session !== null && Date.parse(state.session.session.expiresAt) > Date.now();
  function saveSelection(id: string | null) { if (state.session) { try { options.selection?.write(state.session.user.id, id); } catch { /* Storage is optional. */ } } }
  function expire() { begin(); publish({ ...state, status: 'signed-out', session: null, workspaces: null, selectedWorkspaceId: null, ...cleared, pending: null, capabilities: noCapabilities }); }
  function failure(error: unknown): WorkspaceState['outcome'] {
    return error instanceof WorkspaceFailure ? error.code === 'invitation-link-unavailable' ? 'invitation-link-unavailable' : error.status === 409 ? 'conflict' : error.status === 403 ? 'forbidden' : error.status === 400 ? 'invalid' : 'error' : 'error';
  }
  async function loadSelected(workspaceId: string, request: { generation: number; signal: AbortSignal }) {
    const workspace = await options.transport.detail(workspaceId, request.signal);
    const [members, invitations] = await Promise.all([options.transport.members(workspaceId, request.signal), admin(workspace) ? options.transport.invitations(workspaceId, request.signal) : Promise.resolve(null)]);
    if (!current(request)) return;
    publish({ ...state, status: 'ready', workspace, members, invitations, capabilities: { canCreateWorkspace: true, canAdminister: admin(workspace) } });
    saveSelection(workspaceId);
  }
  async function refresh(): Promise<void> {
    if (state.pending) return;
    const selected = state.selectedWorkspaceId; const request = begin();
    publish({ ...state, status: 'loading', session: null, workspaces: null, ...cleared, capabilities: noCapabilities });
    try {
      const config = parseIdentityConfiguration(await options.identity.configuration());
      const session = config.enabled ? parseIdentitySession(await options.identity.session()) : null;
      if (!current(request)) return;
      if (!config.enabled || !session || Date.parse(session.session.expiresAt) <= Date.now()) {
        publish({ ...state, status: config.enabled ? 'signed-out' : 'disabled', selectedWorkspaceId: null, session: null, capabilities: noCapabilities }); return;
      }
      if (owner !== null && owner !== session.user.id) { retry = null; inbound = null; publish({ ...state, draft: null, retryTarget: null, hasInvitation: false, outcome: null }); }
      const sameUser = owner === session.user.id; owner = session.user.id;
      publish({ ...state, session });
      const workspaces = await options.transport.workspaces(request.signal);
      if (!current(request)) return;
      let stored: string | null = null;
      try { stored = options.selection?.read(session.user.id) ?? null; } catch { /* Optional selection. */ }
      const id = (sameUser ? selected : null) ?? stored ?? workspaces.items[0]?.id ?? null;
      publish({ ...state, workspaces, selectedWorkspaceId: id, capabilities: { canCreateWorkspace: true, canAdminister: false }, status: id ? 'loading' : 'empty' });
      if (id) await loadSelected(id, request);
    } catch (error) { if (current(request)) readFailure(error); }
  }
  function readFailure(error: unknown) {
    if (error instanceof WorkspaceFailure && error.status === 401) { expire(); return; }
    publish({ ...state, ...cleared, status: error instanceof WorkspaceFailure && error.status === 403 ? 'forbidden' : 'error', capabilities: { canCreateWorkspace: fresh(), canAdminister: false } });
  }
  async function selectWorkspace(workspaceId: string | null): Promise<void> {
    if (!fresh()) { expire(); return; }
    const request = begin();
    publish({ ...state, ...cleared, selectedWorkspaceId: workspaceId, pending: null, outcome: null,
      retryTarget: retry ? { type: retry.command.type, workspaceId: 'workspaceId' in retry.command ? retry.command.workspaceId : null } : state.retryTarget,
      status: workspaceId ? 'loading' : 'empty', capabilities: { canCreateWorkspace: true, canAdminister: false } });
    saveSelection(workspaceId);
    if (!workspaceId) return;
    try { await loadSelected(workspaceId, request); } catch (error) { if (current(request)) readFailure(error); }
  }
  function stage(command: WorkspaceCommand): void {
    if (state.pending) return;
    if (retry) { publish({ ...state, outcome: 'invalid' }); return; }
    // Copy input so a caller cannot retarget a captured recovery after submission.
    const draft = structuredClone(command);
    retry = null; publish({ ...state, draft, retryTarget: null, outcome: null, invitationLink: null });
  }
  async function execute(command: WorkspaceCommand, key: string): Promise<void> {
    if (state.pending) return;
    if (!fresh()) { expire(); return; }
    if ('workspaceId' in command && command.workspaceId !== state.selectedWorkspaceId) { publish({ ...state, outcome: 'invalid' }); return; }
    const request = begin();
    retry = { command: structuredClone(command), key };
    publish({ ...state, pending: command.type, outcome: null, invitationLink: null, retryTarget: null });
    try {
      const result = await options.transport.mutate(command, key, request.signal);
      if (!current(request)) return;
      retry = null;
      if (command.type === 'accept-invitation') inbound = null;
      let invitationLink: string | null = null;
      if (command.type === 'invite' && 'token' in result) {
        const origin = options.origin?.();
        if (origin) { const link = new URL('/workspaces', origin); link.hash = `invitation=${result.token}`; invitationLink = link.href; }
      }
      publish({ ...state, pending: null, outcome: 'success', draft: null, retryTarget: null, invitationLink, hasInvitation: inbound !== null });
      // A committed mutation stays successful even if its subsequent read fails.
      await reloadAfterMutation(command, result, request);
    } catch (error) {
      if (!current(request)) return;
      const outcome = failure(error);
      const retryable = !(error instanceof WorkspaceFailure) || error.status >= 500 || error.status === 401;
      if (!retryable) retry = null;
      publish({ ...state, pending: null, outcome, retryTarget: retry ? { type: command.type, workspaceId: 'workspaceId' in command ? command.workspaceId : null } : null });
      if (error instanceof WorkspaceFailure && error.status === 401) expire();
      else if (outcome === 'forbidden') publish({ ...state, ...cleared, status: 'forbidden', capabilities: { canCreateWorkspace: true, canAdminister: false } });
    }
  }
  async function reloadAfterMutation(command: WorkspaceCommand, result: WorkspaceResult, request: { generation: number; signal: AbortSignal }) {
    try {
      const workspaces = await options.transport.workspaces(request.signal);
      if (!current(request)) return;
      const id = (command.type === 'create-workspace' || command.type === 'accept-invitation') && 'ownerPrincipalId' in result ? result.id : state.selectedWorkspaceId;
      publish({ ...state, workspaces, selectedWorkspaceId: id });
      if (id) await loadSelected(id, request);
    } catch (error) { if (current(request)) readFailure(error); }
  }
  async function submit() {
    if (retry) { await retrySave(); return; }
    if (state.draft) await execute(structuredClone(state.draft), (options.key ?? (() => crypto.randomUUID()))());
  }
  async function retrySave() { if (retry) await execute(structuredClone(retry.command), retry.key); }
  async function loadMore(collection: 'workspaces' | 'members' | 'invitations') {
    const previous = state[collection]; if (!previous?.nextCursor || state.pending || !fresh()) return;
    const request = { generation, signal: abort.signal }; const workspaceId = state.selectedWorkspaceId;
    try {
      const next = collection === 'workspaces' ? await options.transport.workspaces(request.signal, previous.nextCursor)
        : collection === 'members' && workspaceId ? await options.transport.members(workspaceId, request.signal, previous.nextCursor)
          : collection === 'invitations' && workspaceId ? await options.transport.invitations(workspaceId, request.signal, previous.nextCursor) : null;
      if (!current(request) || !next || state[collection] !== previous) return;
      // Each page is scoped by the server. Requests from an earlier selection
      // cannot merge into the current workspace or duplicate an overlapping page.
      const items = [...previous.items, ...next.items];
      publish({ ...state, [collection]: { ...next, items } });
    } catch (error) { if (current(request)) readFailure(error); }
  }
  function captureInvitation(fragment: string): boolean {
    const value = new URLSearchParams(fragment.replace(/^#/, '')).get('invitation');
    if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
    inbound = value; publish({ ...state, hasInvitation: true }); return true;
  }
  return { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, selectWorkspace, stage, submit, retrySave, loadMore, captureInvitation,
    async acceptInvitation() { if (inbound) await execute({ type: 'accept-invitation', token: inbound }, (options.key ?? (() => crypto.randomUUID()))()); },
    clearInvitation() { inbound = null; publish({ ...state, hasInvitation: false, invitationLink: null }); },
    discardDraft() { if (!state.pending) { retry = null; publish({ ...state, draft: null, retryTarget: null, outcome: null }); } },
    cancelPending() { begin(); publish({ ...state, status: state.status === 'loading' ? 'error' : state.status, pending: null, retryTarget: retry ? { type: retry.command.type, workspaceId: 'workspaceId' in retry.command ? retry.command.workspaceId : null } : null }); },
    dismissOutcome() { publish({ ...state, outcome: null }); },
  };
}
