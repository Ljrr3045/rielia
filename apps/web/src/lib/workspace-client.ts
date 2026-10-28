import { isPage, isRecord, isWorkspaceInvitation, isWorkspaceMember, isWorkspaceSummary, type Page, type WorkspaceCommand, type WorkspaceInvitation, type WorkspaceMember, type WorkspaceResult, type WorkspaceSummary } from '@rielia/contracts';
export class WorkspaceFailure extends Error {
  readonly status: number;
  readonly code: string | null;
  constructor(status: number, code: string | null = null) { super('Workspace request failed.'); this.status = status; this.code = code; }
}
export interface WorkspaceTransport {
  workspaces(signal: AbortSignal, cursor?: string): Promise<Page<WorkspaceSummary>>;
  detail(workspaceId: string, signal: AbortSignal): Promise<WorkspaceSummary>;
  members(workspaceId: string, signal: AbortSignal, cursor?: string): Promise<Page<WorkspaceMember>>;
  invitations(workspaceId: string, signal: AbortSignal, cursor?: string): Promise<Page<WorkspaceInvitation>>;
  mutate(command: WorkspaceCommand, key: string, signal: AbortSignal): Promise<WorkspaceResult>;
}
export function createWorkspaceTransport(options: { baseURL?: string; timeout?: number } = {}): WorkspaceTransport {
  const segment = (value: string) => encodeURIComponent(value);
  async function request(path: string, signal: AbortSignal, body?: unknown, key?: string): Promise<unknown> {
    const response = await fetch(options.baseURL ? new URL(`/api/v1/${path}`, options.baseURL) : `/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(options.timeout ?? 15000)]),
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key! }, body: JSON.stringify(body) }),
    });
    const value: unknown = await response.json();
    if (!response.ok) throw new WorkspaceFailure(response.status, isRecord(value) && typeof value['code'] === 'string' ? value['code'] : null);
    return value;
  }
  async function collection<T>(path: string, signal: AbortSignal, check: (value: unknown) => value is T, cursor?: string) {
    const value = await request(`${path}${cursor ? `?cursor=${segment(cursor)}` : ''}`, signal);
    if (!isPage(value, check)) throw new WorkspaceFailure(502);
    return value;
  }
  return {
    workspaces: (signal, cursor) => collection('workspaces', signal, isWorkspaceSummary, cursor),
    async detail(workspaceId, signal) {
      const value = await request(`workspaces/${segment(workspaceId)}`, signal);
      if (!isWorkspaceSummary(value) || value.id !== workspaceId) throw new WorkspaceFailure(502); return value;
    },
    members: (workspaceId, signal, cursor) => collection(`workspaces/${segment(workspaceId)}/members`, signal, isWorkspaceMember, cursor),
    invitations: (workspaceId, signal, cursor) => collection(`workspaces/${segment(workspaceId)}/invitations`, signal, isWorkspaceInvitation, cursor),
    async mutate(command, key, signal) {
      const scope = 'workspaceId' in command ? `workspaces/${segment(command.workspaceId)}` : '';
      let path: string; let body: unknown;
      switch (command.type) {
        case 'create-workspace': path = 'workspaces'; body = { name: command.name }; break;
        case 'invite': path = `${scope}/invitations`; body = { recipientEmail: command.recipientEmail, role: command.role }; break;
        case 'accept-invitation': path = 'workspace-invitations/accept'; body = { token: command.token }; break;
        case 'revoke-invitation': path = `${scope}/invitations/${segment(command.invitationId)}/revoke`; body = {}; break;
        case 'register-agent': path = `${scope}/agents`; body = { name: command.name, role: command.role, custodianPrincipalId: command.custodianPrincipalId }; break;
        case 'manage-agent': path = `${scope}/agents/${segment(command.principalId)}`; body = { version: command.version, ...(command.state !== undefined ? { state: command.state } : {}), ...(command.custodianPrincipalId !== undefined ? { custodianPrincipalId: command.custodianPrincipalId } : {}) }; break;
        case 'update-member': path = `${scope}/members/${segment(command.principalId)}`; body = { version: command.version, ...(command.state !== undefined ? { state: command.state } : {}), ...(command.role !== undefined ? { role: command.role } : {}) }; break;
      }
      const value = await request(path, signal, body, key);
      if (command.type === 'create-workspace' || command.type === 'accept-invitation') {
        if (isWorkspaceSummary(value)) return value;
      } else if (command.type === 'invite') {
        if (isRecord(value) && isWorkspaceInvitation(value['invitation']) && value['invitation'].workspaceId === command.workspaceId && typeof value['token'] === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value['token'])) return { invitation: value['invitation'], token: value['token'] };
      } else if (command.type === 'revoke-invitation') {
        if (isWorkspaceInvitation(value) && value.workspaceId === command.workspaceId && value.id === command.invitationId) return value;
      } else if (isWorkspaceMember(value) && (command.type === 'register-agent' || value.principalId === command.principalId)) return value;
      throw new WorkspaceFailure(502);
    },
  };
}
