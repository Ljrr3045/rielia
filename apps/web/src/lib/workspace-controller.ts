import type {
  Page,
  WorkspaceCommand,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceSummary,
  WorkspaceResult,
} from '@rielia/contracts';
import {
  parseIdentityConfiguration,
  parseIdentitySession,
  type IdentitySession,
  type IdentityTransport,
} from './identity-controller.ts';
import { WorkspaceFailure, type WorkspaceTransport } from './workspace-client.ts';
import {
  createWorkspaceQueryOwner,
  type WorkspaceQueryName,
  type WorkspaceQueryResources,
} from './workspace-query-owner.ts';
import { freezeSprintValue as freezeClientQueryValue } from './sprint-client-state.ts';

export interface WorkspaceState {
  /** Opaque browser lifetime, never a credential or a raw session identifier. */
  epoch: string | null;
  verified: boolean;
  commandReady: boolean;
  memoryExpiresAt: string | null;
  resources: WorkspaceQueryResources;
  status: 'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';
  session: IdentitySession | null;
  workspaces: Page<WorkspaceSummary> | null;
  selectedWorkspaceId: string | null;
  workspace: WorkspaceSummary | null;
  members: Page<WorkspaceMember> | null;
  invitations: Page<WorkspaceInvitation> | null;
  pending: WorkspaceCommand['type'] | null;
  outcome:
    | 'success'
    | 'invalid'
    | 'forbidden'
    | 'conflict'
    | 'error'
    | 'invitation-link-unavailable'
    | null;
  draft: WorkspaceCommand | null;
  retryTarget: { type: WorkspaceCommand['type']; workspaceId: string | null } | null;
  invitationLink: string | null;
  hasInvitation: boolean;
  capabilities: { canCreateWorkspace: boolean; canAdminister: boolean };
}
export interface WorkspaceSelectionStore {
  read(userId: string): string | null;
  write(userId: string, workspaceId: string | null): void;
}

type ControllerState = Omit<
  WorkspaceState,
  | 'workspaces'
  | 'workspace'
  | 'members'
  | 'invitations'
  | 'resources'
  | 'capabilities'
  | 'commandReady'
  | 'memoryExpiresAt'
  | 'hasInvitation'
>;
const noCapabilities = { canCreateWorkspace: false, canAdminister: false };
const admin = (workspace: WorkspaceSummary | null) =>
  workspace !== null && ['owner', 'admin'].includes(workspace.role);

/** Query owns canonical DTOs. This controller owns verification, captured writes and memory intent. */
export function createWorkspaceController(options: {
  identity: Pick<IdentityTransport, 'configuration' | 'session'>;
  transport: WorkspaceTransport;
  selection?: WorkspaceSelectionStore;
  key?: () => string;
  origin?: () => string;
}) {
  let state: ControllerState = {
    status: 'loading',
    session: null,
    epoch: null,
    verified: false,
    selectedWorkspaceId: null,
    pending: null,
    outcome: null,
    draft: null,
    retryTarget: null,
    invitationLink: null,
  };
  let lifetime: { userId: string; sessionId: string; epoch: string; expiresAt: number } | null =
    null;
  let memoryUntil: number | null = null;
  let inbound: { token: string; epoch: string | null } | null = null;
  let retry: { command: WorkspaceCommand; key: string } | null = null;
  let generation = 0;
  let abort = new AbortController();
  let readAllowed = false;
  let refreshWanted = false;
  const listeners = new Set<() => void>();
  const queries = createWorkspaceQueryOwner({
    transport: options.transport,
    authorized: () => readAllowed && fresh(),
    denied: (reason) => retire(reason),
    changed: () => notify(),
  });
  const fresh = () =>
    state.session !== null && Date.parse(state.session.session.expiresAt) > Date.now();
  const memoryExpired = () => memoryUntil !== null && memoryUntil <= Date.now();
  function compose(): WorkspaceState {
    const resources = queries.resources();
    const visible = state.verified && fresh() && !memoryExpired();
    const ready = (name: WorkspaceQueryName) =>
      resources[name].status === 'ready' && !resources[name].stale;
    const workspace = visible ? resources.workspace.data : null;
    const commandReady =
      visible &&
      ready('workspaces') &&
      (!state.selectedWorkspaceId ||
        (ready('workspace') && ready('members') && (!admin(workspace) || ready('invitations'))));
    return freezeClientQueryValue({
      ...state,
      session: visible ? state.session : null,
      draft: visible && state.draft?.type !== 'accept-invitation' ? state.draft : null,
      retryTarget: visible ? state.retryTarget : null,
      invitationLink: visible ? state.invitationLink : null,
      hasInvitation:
        inbound !== null && (inbound.epoch === null || (visible && inbound.epoch === state.epoch)),
      memoryExpiresAt: memoryUntil === null ? null : new Date(memoryUntil).toISOString(),
      commandReady,
      workspaces: visible ? resources.workspaces.data : null,
      workspace,
      members: visible ? resources.members.data : null,
      invitations: visible ? resources.invitations.data : null,
      resources: visible
        ? resources
        : {
            workspaces: { ...resources.workspaces, data: null },
            workspace: { ...resources.workspace, data: null },
            members: { ...resources.members, data: null },
            invitations: { ...resources.invitations, data: null },
          },
      capabilities: visible
        ? { canCreateWorkspace: true, canAdminister: commandReady && admin(workspace) }
        : noCapabilities,
    });
  }
  let snapshot = compose();
  function notify() {
    snapshot = compose();
    for (const listener of listeners) listener();
  }
  function publish(next: ControllerState) {
    state = next;
    notify();
  }
  function begin() {
    abort.abort();
    abort = new AbortController();
    generation++;
    queries.cancel();
    return { generation, signal: abort.signal };
  }
  const current = (request: { generation: number }) => request.generation === generation;
  function rememberMemory() {
    memoryUntil ??= state.session
      ? Date.parse(state.session.session.expiresAt)
      : (lifetime?.expiresAt ?? null);
  }
  function clearMemory() {
    retry = null;
    memoryUntil = null;
    if (inbound?.epoch !== null) inbound = null;
    state = { ...state, draft: null, retryTarget: null, invitationLink: null };
  }
  function retire(status: 'signed-out' | 'forbidden' | 'disabled' | 'error') {
    // Mask before native cancellation can revert a Query to an earlier successful DTO.
    readAllowed = false;
    lifetime = null;
    clearMemory();
    refreshWanted = false;
    publish({ ...state, status, session: null, epoch: null, verified: false, pending: null });
    queries.clear();
    begin();
  }
  function ensureFresh() {
    if (!fresh() || memoryExpired()) {
      retire('signed-out');
      return false;
    }
    return readAllowed;
  }
  function saveSelection(id: string | null) {
    if (!state.session) return;
    try {
      options.selection?.write(state.session.user.id, id);
    } catch {
      /* Optional storage. */
    }
  }
  function storedSelection(userId: string) {
    try {
      return options.selection?.read(userId) ?? null;
    } catch {
      return null;
    }
  }
  function failure(error: unknown): WorkspaceState['outcome'] {
    return error instanceof WorkspaceFailure
      ? error.code === 'invitation-link-unavailable'
        ? 'invitation-link-unavailable'
        : error.status === 409
          ? 'conflict'
          : error.status === 403
            ? 'forbidden'
            : error.status === 400
              ? 'invalid'
              : 'error'
      : 'error';
  }
  function readFailure(error: unknown) {
    if (error instanceof WorkspaceFailure && [401, 403].includes(error.status)) {
      retire(error.status === 401 ? 'signed-out' : 'forbidden');
      return;
    }
    if (!state.verified) {
      readAllowed = false;
      publish({ ...state, status: 'error', session: null });
      queries.clear();
    } else publish({ ...state, status: 'error', invitationLink: null });
  }
  async function read(name: WorkspaceQueryName, request: { generation: number }, more = false) {
    if (!current(request)) return false;
    await queries.read(name, more);
    if (!current(request)) return false;
    const resource = queries.resources()[name];
    if (resource.status !== 'ready' || resource.stale) {
      throw new WorkspaceFailure(resource.failure?.status ?? 0, resource.failure?.code ?? null);
    }
    return true;
  }
  async function loadSelected(workspaceId: string, request: { generation: number }) {
    queries.select(workspaceId);
    if (!(await read('workspace', request))) return false;
    const administer = admin(queries.resources().workspace.data);
    queries.administer(administer);
    const loaded = await Promise.all([
      read('members', request),
      administer ? read('invitations', request) : Promise.resolve(true),
    ]);
    return current(request) && loaded.every(Boolean);
  }
  async function refresh(): Promise<void> {
    if (state.pending) {
      refreshWanted = true;
      return;
    }
    refreshWanted = false;
    if (memoryExpired()) retire('signed-out');
    const previous = lifetime;
    const selected = state.selectedWorkspaceId;
    readAllowed = false;
    publish({ ...state, status: 'loading', verified: false, session: null, invitationLink: null });
    queries.clear();
    const request = begin();
    try {
      const config = parseIdentityConfiguration(await options.identity.configuration());
      if (!current(request)) return;
      const session = config.enabled
        ? parseIdentitySession(await options.identity.session())
        : null;
      if (!current(request)) return;
      if (!config.enabled || !session || Date.parse(session.session.expiresAt) <= Date.now()) {
        retire(config.enabled ? 'signed-out' : 'disabled');
        return;
      }
      const sameSession =
        previous?.userId === session.user.id && previous.sessionId === session.session.id;
      if (!sameSession) {
        clearMemory();
        state = { ...state, outcome: null };
        lifetime = {
          userId: session.user.id,
          sessionId: session.session.id,
          epoch: crypto.randomUUID(),
          expiresAt: Date.parse(session.session.expiresAt),
        };
      }
      // A failed verification can never extend the original captured memory expiry.
      if (memoryExpired()) {
        clearMemory();
        lifetime = {
          userId: session.user.id,
          sessionId: session.session.id,
          epoch: crypto.randomUUID(),
          expiresAt: Date.parse(session.session.expiresAt),
        };
      }
      lifetime!.expiresAt = Date.parse(session.session.expiresAt);
      const epoch = lifetime!.epoch;
      if (inbound?.epoch === null) {
        inbound = { ...inbound, epoch };
        memoryUntil ??= Date.parse(session.session.expiresAt);
      }
      state = { ...state, session, epoch };
      readAllowed = true;
      queries.bind(epoch);
      const id = (sameSession ? selected : null) ?? storedSelection(session.user.id);
      state = { ...state, selectedWorkspaceId: id };
      // After denial/reverification, selected-scope authority is checked before sibling collections.
      if (id && !(await loadSelected(id, request))) return;
      if (!(await read('workspaces', request))) return;
      const chosen = id ?? queries.resources().workspaces.data!.items[0]?.id ?? null;
      state = { ...state, selectedWorkspaceId: chosen };
      if (!id && chosen && !(await loadSelected(chosen, request))) return;
      if (!current(request)) return;
      publish({ ...state, status: chosen ? 'ready' : 'empty', verified: true });
      saveSelection(chosen);
    } catch (error) {
      if (current(request)) readFailure(error);
    }
  }
  async function selectWorkspace(workspaceId: string | null): Promise<void> {
    if (!readAllowed || !ensureFresh()) return;
    // Hide former scope before retiring its records or cancelling an in-flight command.
    publish({
      ...state,
      verified: false,
      status: workspaceId ? 'loading' : 'empty',
      selectedWorkspaceId: workspaceId,
      pending: null,
      outcome: null,
      invitationLink: null,
      retryTarget: retry
        ? {
            type: retry.command.type,
            workspaceId: 'workspaceId' in retry.command ? retry.command.workspaceId : null,
          }
        : null,
    });
    queries.select(workspaceId);
    const request = begin();
    saveSelection(workspaceId);
    if (!workspaceId) {
      publish({ ...state, verified: true });
      return;
    }
    try {
      if (await loadSelected(workspaceId, request))
        publish({ ...state, status: 'ready', verified: true });
    } catch (error) {
      if (current(request)) readFailure(error);
    }
  }
  function stage(command: WorkspaceCommand) {
    if (state.pending || !state.verified || !ensureFresh() || !snapshot.commandReady) return;
    if (retry) {
      publish({ ...state, outcome: 'invalid' });
      return;
    }
    rememberMemory();
    publish({
      ...state,
      draft: freezeClientQueryValue(structuredClone(command)),
      retryTarget: null,
      outcome: null,
      invitationLink: null,
    });
  }
  async function reloadAfterMutation(
    command: WorkspaceCommand,
    result: WorkspaceResult,
    request: { generation: number },
  ) {
    try {
      if (!(await read('workspaces', request))) return;
      const id =
        (command.type === 'create-workspace' || command.type === 'accept-invitation') &&
        'ownerPrincipalId' in result
          ? result.id
          : state.selectedWorkspaceId;
      state = { ...state, selectedWorkspaceId: id };
      if (id && !(await loadSelected(id, request))) return;
      if (current(request)) {
        publish({ ...state, status: id ? 'ready' : 'empty' });
        saveSelection(id);
      }
    } catch (error) {
      if (current(request)) readFailure(error);
    }
  }
  async function execute(command: WorkspaceCommand, key: string): Promise<void> {
    if (state.pending || !state.verified || !readAllowed || !ensureFresh()) return;
    if ('workspaceId' in command && command.workspaceId !== state.selectedWorkspaceId) {
      publish({ ...state, outcome: 'invalid' });
      return;
    }
    if (!snapshot.commandReady) return;
    const authority = lifetime;
    const request = begin();
    const active = () => {
      // Selector changes and transport cancellation advance this controller's generation.
      if (!current(request) || lifetime !== authority) return false;
      if (!fresh() || memoryExpired()) {
        retire('signed-out');
        return false;
      }
      return true;
    };
    rememberMemory();
    retry = { command: freezeClientQueryValue(structuredClone(command)), key };
    publish({
      ...state,
      pending: command.type,
      outcome: null,
      invitationLink: null,
      retryTarget: null,
    });
    try {
      if (!active()) return;
      const result = await options.transport.mutate(command, key, request.signal);
      if (!active()) return;
      let invitationLink: string | null = null;
      if (command.type === 'invite' && 'token' in result) {
        const origin = options.origin?.();
        if (origin) {
          const link = new URL('/workspaces', origin);
          link.hash = `invitation=${result.token}`;
          invitationLink = link.href;
        }
      }
      if (!active()) return;
      retry = null;
      if (command.type === 'accept-invitation' && inbound?.token === command.token) inbound = null;
      // Consume only the settled command's memory before any public callback can stage another intent.
      if (!inbound && !invitationLink) memoryUntil = null;
      state = { ...state, draft: null, retryTarget: null, invitationLink };
      // Invalidation notifies synchronously. Keep pending through it, and fence replacement lifetimes.
      queries.invalidate();
      if (!active()) return;
      publish({ ...state, pending: null, outcome: 'success' });
      if (!active()) return;
      if (refreshWanted) await refresh();
      else await reloadAfterMutation(command, result, request);
    } catch (error) {
      if (!active()) return;
      const outcome = failure(error);
      const status = error instanceof WorkspaceFailure ? error.status : 0;
      if (status === 401 || status === 403) {
        state = { ...state, outcome };
        retire(status === 401 ? 'signed-out' : 'forbidden');
        return;
      }
      const retryable =
        !(error instanceof WorkspaceFailure) || status >= 500 || status === 408 || status === 429;
      if (!retryable) retry = null;
      publish({
        ...state,
        pending: null,
        outcome,
        retryTarget: retry
          ? {
              type: command.type,
              workspaceId: 'workspaceId' in command ? command.workspaceId : null,
            }
          : null,
      });
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
    if (retry) await execute(structuredClone(retry.command), retry.key);
  }
  async function loadMore(collection: 'workspaces' | 'members' | 'invitations') {
    if (
      state.pending ||
      !state.verified ||
      !ensureFresh() ||
      !queries.resources()[collection].data?.nextCursor
    )
      return;
    const request = { generation };
    try {
      await read(collection, request, true);
    } catch (error) {
      if (current(request)) readFailure(error);
    }
  }
  return {
    getState: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
    selectWorkspace,
    stage,
    submit,
    retrySave,
    loadMore,
    captureInvitation(fragment: string) {
      const value = new URLSearchParams(fragment.replace(/^#/, '')).get('invitation');
      if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
      if (memoryExpired() || (state.session && !fresh())) retire('signed-out');
      inbound = { token: value, epoch: lifetime?.epoch ?? null };
      rememberMemory();
      notify();
      return true;
    },
    async acceptInvitation() {
      if (!inbound) return;
      if (retry) {
        if (retry.command.type === 'accept-invitation' && retry.command.token === inbound.token)
          await retrySave();
        else publish({ ...state, outcome: 'invalid' });
        return;
      }
      await execute(
        { type: 'accept-invitation', token: inbound.token },
        (options.key ?? (() => crypto.randomUUID()))(),
      );
    },
    clearGeneratedInvitationLink() {
      publish({ ...state, invitationLink: null });
    },
    clearInvitation() {
      inbound = null;
      publish({ ...state, invitationLink: null });
    },
    discardDraft() {
      if (!state.pending) {
        retry = null;
        publish({ ...state, draft: null, retryTarget: null, outcome: null });
      }
    },
    cancelPending() {
      if (memoryExpired() || (state.session && !fresh())) {
        retire('signed-out');
        return;
      }
      const pending = state.pending;
      begin();
      publish({
        ...state,
        status: state.status === 'loading' ? 'error' : state.status,
        pending: null,
        ...(pending ? { outcome: 'error' as const } : {}),
        retryTarget: retry
          ? {
              type: retry.command.type,
              workspaceId: 'workspaceId' in retry.command ? retry.command.workspaceId : null,
            }
          : null,
      });
    },
    dispose() {
      retire('error');
    },
    dismissOutcome() {
      publish({ ...state, outcome: null });
    },
  };
}
