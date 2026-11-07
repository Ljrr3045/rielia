import type {
  Page,
  WorkspaceCommand,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceSummary,
} from '@rielia/contracts';
import type { CommandType } from './strings';

export type WorkspaceStatus =
  'loading' | 'disabled' | 'signed-out' | 'ready' | 'empty' | 'forbidden' | 'error';

export type RetryTarget = { type: CommandType; workspaceId: string | null };

export type LoadMoreKind = 'workspaces' | 'members' | 'invitations';

export type SubjectKind = 'workspace' | 'member' | 'agent' | 'invitation';

export type LastAction = {
  type: CommandType;
  subject: { kind: SubjectKind; value: string } | null;
};

export function commandSubject(
  command: WorkspaceCommand,
  members: Page<WorkspaceMember> | null,
  invitations: Page<WorkspaceInvitation> | null,
): LastAction['subject'] {
  if (command.type === 'create-workspace') return { kind: 'workspace', value: command.name };
  if (command.type === 'invite') return { kind: 'invitation', value: command.recipientEmail };
  if (command.type === 'register-agent') return { kind: 'agent', value: command.name };
  if (command.type === 'revoke-invitation') {
    const invitation = invitations?.items.find((item) => item.id === command.invitationId);
    return invitation === undefined
      ? null
      : { kind: 'invitation', value: invitation.recipientEmail };
  }
  if (command.type === 'update-member' || command.type === 'manage-agent') {
    const member = members?.items.find((item) => item.principalId === command.principalId);
    return member === undefined
      ? null
      : { kind: command.type === 'update-member' ? 'member' : 'agent', value: member.name };
  }
  return null;
}

export function workspaceNameById(
  workspaces: Page<WorkspaceSummary> | null,
  workspaceId: string | null,
): string | null {
  if (workspaceId === null || workspaces === null) return null;
  return workspaces.items.find((workspace) => workspace.id === workspaceId)?.name ?? null;
}
