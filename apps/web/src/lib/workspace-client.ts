import {
  isPage,
  createdInvitationSchema,
  isWorkspaceInvitation,
  isWorkspaceMember,
  isWorkspaceSummary,
  workspaceErrorProjectionSchema,
  type Page,
  type WorkspaceCommand,
  type WorkspaceInvitation,
  type WorkspaceMember,
  type WorkspaceResult,
  type WorkspaceSummary,
} from '@rielia/contracts';
import { createContractRequest } from './api-contract-client.ts';
export class WorkspaceFailure extends Error {
  readonly status: number;
  readonly code: string | null;
  constructor(status: number, code: string | null = null) {
    super('Workspace request failed.');
    this.status = status;
    this.code = code;
  }
}
export interface WorkspaceTransport {
  workspaces(signal: AbortSignal, cursor?: string): Promise<Page<WorkspaceSummary>>;
  detail(workspaceId: string, signal: AbortSignal): Promise<WorkspaceSummary>;
  members(
    workspaceId: string,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<Page<WorkspaceMember>>;
  invitations(
    workspaceId: string,
    signal: AbortSignal,
    cursor?: string,
  ): Promise<Page<WorkspaceInvitation>>;
  mutate(command: WorkspaceCommand, key: string, signal: AbortSignal): Promise<WorkspaceResult>;
}
export function createWorkspaceTransport(
  options: { baseURL?: string; timeout?: number } = {},
): WorkspaceTransport {
  const send = createContractRequest(options);
  async function read(response: Response): Promise<unknown> {
    const value: unknown = await response.json();
    if (!response.ok) {
      const error = workspaceErrorProjectionSchema.safeParse(value);
      throw new WorkspaceFailure(response.status, error.success ? error.data.code : null);
    }
    return value;
  }
  async function collection<T>(response: Response, check: (value: unknown) => value is T) {
    const value = await read(response);
    if (!isPage(value, check)) throw new WorkspaceFailure(502);
    return value;
  }
  return {
    workspaces: async (signal, cursor) =>
      collection(
        await send('get', '/api/v1/workspaces', {
          signal,
          ...(cursor ? { query: { cursor } } : {}),
        }),
        isWorkspaceSummary,
      ),
    async detail(workspaceId, signal) {
      const value = await read(
        await send('get', '/api/v1/workspaces/{workspaceId}', {
          path: { workspaceId },
          signal,
        }),
      );
      if (!isWorkspaceSummary(value) || value.id !== workspaceId) throw new WorkspaceFailure(502);
      return value;
    },
    members: async (workspaceId, signal, cursor) =>
      collection(
        await send('get', '/api/v1/workspaces/{workspaceId}/members', {
          path: { workspaceId },
          signal,
          ...(cursor ? { query: { cursor } } : {}),
        }),
        isWorkspaceMember,
      ),
    invitations: async (workspaceId, signal, cursor) =>
      collection(
        await send('get', '/api/v1/workspaces/{workspaceId}/invitations', {
          path: { workspaceId },
          signal,
          ...(cursor ? { query: { cursor } } : {}),
        }),
        isWorkspaceInvitation,
      ),
    async mutate(command, key, signal) {
      let response: Response;
      switch (command.type) {
        case 'create-workspace':
          response = await send('post', '/api/v1/workspaces', {
            body: { name: command.name },
            key,
            signal,
          });
          break;
        case 'invite':
          response = await send('post', '/api/v1/workspaces/{workspaceId}/invitations', {
            path: { workspaceId: command.workspaceId },
            body: { recipientEmail: command.recipientEmail, role: command.role },
            key,
            signal,
          });
          break;
        case 'accept-invitation':
          response = await send('post', '/api/v1/workspace-invitations/accept', {
            body: { token: command.token },
            key,
            signal,
          });
          break;
        case 'revoke-invitation':
          response = await send(
            'post',
            '/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke',
            {
              path: { workspaceId: command.workspaceId, invitationId: command.invitationId },
              body: {},
              key,
              signal,
            },
          );
          break;
        case 'register-agent':
          response = await send('post', '/api/v1/workspaces/{workspaceId}/agents', {
            path: { workspaceId: command.workspaceId },
            body: {
              name: command.name,
              role: command.role,
              custodianPrincipalId: command.custodianPrincipalId,
            },
            key,
            signal,
          });
          break;
        case 'manage-agent':
          response = await send('post', '/api/v1/workspaces/{workspaceId}/agents/{principalId}', {
            path: { workspaceId: command.workspaceId, principalId: command.principalId },
            body: {
              version: command.version,
              ...(command.state !== undefined ? { state: command.state } : {}),
              ...(command.custodianPrincipalId !== undefined
                ? { custodianPrincipalId: command.custodianPrincipalId }
                : {}),
            },
            key,
            signal,
          });
          break;
        case 'update-member':
          response = await send('post', '/api/v1/workspaces/{workspaceId}/members/{principalId}', {
            path: { workspaceId: command.workspaceId, principalId: command.principalId },
            body: {
              version: command.version,
              ...(command.state !== undefined ? { state: command.state } : {}),
              ...(command.role !== undefined ? { role: command.role } : {}),
            },
            key,
            signal,
          });
          break;
      }
      const value = await read(response);
      if (command.type === 'create-workspace' || command.type === 'accept-invitation') {
        if (isWorkspaceSummary(value)) return value;
      } else if (command.type === 'invite') {
        const parsed = createdInvitationSchema.safeParse(value);
        if (parsed.success && parsed.data.invitation.workspaceId === command.workspaceId)
          return { invitation: parsed.data.invitation, token: parsed.data.token };
      } else if (command.type === 'revoke-invitation') {
        if (
          isWorkspaceInvitation(value) &&
          value.workspaceId === command.workspaceId &&
          value.id === command.invitationId
        )
          return value;
      } else if (
        isWorkspaceMember(value) &&
        (command.type === 'register-agent' || value.principalId === command.principalId)
      )
        return value;
      throw new WorkspaceFailure(502);
    },
  };
}
