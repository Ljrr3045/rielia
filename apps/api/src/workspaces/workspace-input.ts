import { BadRequestException } from '@nestjs/common';
import {
  acceptWorkspaceInvitationInputSchema,
  createWorkspaceInputSchema,
  inviteWorkspaceMemberInputSchema,
  isRecord,
  manageWorkspaceAgentInputSchema,
  registerWorkspaceAgentInputSchema,
  revokeWorkspaceInvitationInputSchema,
  updateWorkspaceMemberInputSchema,
  workspaceNameInputSchema,
  workspaceRecipientEmailInputSchema,
} from '@rielia/contracts';

function admit(payload: unknown, allowed: string[], required = allowed) {
  if (
    !isRecord(payload) ||
    Object.keys(payload).some((key) => !allowed.includes(key)) ||
    required.some((key) => !(key in payload))
  )
    throw new BadRequestException('Invalid workspace request.');
  return payload;
}
function name(value: unknown) {
  const parsed = workspaceNameInputSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('Name must contain 1 to 200 characters.');
  return parsed.data;
}
export function workspaceRecipientEmail(value: unknown) {
  const parsed = workspaceRecipientEmailInputSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('A recipient email is required.');
  return parsed.data;
}
export function createWorkspaceInput(payload: unknown) {
  const input = admit(payload, Object.keys(createWorkspaceInputSchema.shape));
  name(input['name']);
  return createWorkspaceInputSchema.parse(input);
}
export function inviteWorkspaceMemberInput(payload: unknown) {
  const input = admit(payload, Object.keys(inviteWorkspaceMemberInputSchema.shape));
  workspaceRecipientEmail(input['recipientEmail']);
  const parsed = inviteWorkspaceMemberInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('Invalid invitation role.');
  return parsed.data;
}
export function revokeWorkspaceInvitationInput(payload: unknown) {
  const input = admit(payload, Object.keys(revokeWorkspaceInvitationInputSchema.shape));
  return revokeWorkspaceInvitationInputSchema.parse(input);
}
export function acceptWorkspaceInvitationInput(payload: unknown) {
  const input = admit(payload, Object.keys(acceptWorkspaceInvitationInputSchema.shape));
  const parsed = acceptWorkspaceInvitationInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('Invalid invitation token.');
  return parsed.data;
}
export function updateWorkspaceMemberInput(payload: unknown) {
  const input = admit(payload, Object.keys(updateWorkspaceMemberInputSchema.shape), ['version']);
  const parsed = updateWorkspaceMemberInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('Invalid member change.');
  return parsed.data;
}
export function registerWorkspaceAgentInput(payload: unknown) {
  const input = admit(payload, Object.keys(registerWorkspaceAgentInputSchema.shape));
  name(input['name']);
  const parsed = registerWorkspaceAgentInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('Invalid agent registration.');
  return parsed.data;
}
export function manageWorkspaceAgentInput(payload: unknown) {
  const input = admit(payload, Object.keys(manageWorkspaceAgentInputSchema.shape), ['version']);
  const parsed = manageWorkspaceAgentInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('Invalid agent change.');
  return parsed.data;
}
