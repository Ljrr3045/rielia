import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';
import { limitedRoleSchema, memberStateSchema, membershipRoleSchema } from './principal-schemas.js';
import type { KnownFields } from './schema-types.js';

const textSchema = z.string().refine((value) => value.length > 0);
const dateSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)));
const versionSchema = z.number().int().positive();
const identifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const workspaceNameInputSchema = z
  .string()
  .refine((value) => value.trim().length > 0 && value.trim().length <= 200)
  .transform((value) => value.trim());
export const workspaceRecipientEmailInputSchema = z
  .string()
  .refine((value) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
  .transform((value) => value.trim().toLowerCase());

export const createWorkspaceInputSchema = z.strictObject({ name: workspaceNameInputSchema });
export const inviteWorkspaceMemberInputSchema = z.strictObject({
  recipientEmail: workspaceRecipientEmailInputSchema,
  role: limitedRoleSchema,
});
export const revokeWorkspaceInvitationInputSchema = z.strictObject({});
export const acceptWorkspaceInvitationInputSchema = z.strictObject({
  token: invitationTokenSchema,
});
export const updateWorkspaceMemberInputSchema = z
  .strictObject({
    version: versionSchema,
    role: limitedRoleSchema.exactOptional(),
    state: memberStateSchema.exactOptional(),
  })
  .refine((value) => 'role' in value || 'state' in value);
export const registerWorkspaceAgentInputSchema = z.strictObject({
  name: workspaceNameInputSchema,
  role: z.enum(['member', 'viewer']),
  custodianPrincipalId: identifierSchema,
});
export const manageWorkspaceAgentInputSchema = z
  .strictObject({
    version: versionSchema,
    state: memberStateSchema.exactOptional(),
    custodianPrincipalId: identifierSchema.exactOptional(),
  })
  .refine((value) => 'state' in value || 'custodianPrincipalId' in value);

export const workspaceSummarySchema = z.looseObject({
  id: textSchema,
  name: textSchema,
  ownerPrincipalId: textSchema,
  role: membershipRoleSchema,
  createdAt: dateSchema,
});
export const workspaceMemberSchema = z.looseObject({
  principalId: textSchema,
  kind: z.enum(['human', 'agent']),
  name: textSchema,
  role: membershipRoleSchema,
  state: memberStateSchema,
  principalState: memberStateSchema,
  custodianPrincipalId: textSchema.nullable(),
  version: versionSchema,
});
export const workspaceInvitationSchema = z.looseObject({
  id: textSchema,
  workspaceId: textSchema,
  recipientEmail: textSchema,
  role: limitedRoleSchema,
  issuerPrincipalId: textSchema,
  createdAt: dateSchema,
  expiresAt: dateSchema,
  state: z.enum(['pending', 'expired', 'accepted', 'revoked']),
});
export const createdInvitationSchema = z.looseObject({
  invitation: workspaceInvitationSchema,
  token: invitationTokenSchema,
});
/** Existing predicate-based pages retain their unbounded, duplicate-tolerant policy. */
export function pageSchema<Item extends z.ZodType>(item: Item) {
  return z
    .looseObject({
      items: denseArraySchema(item),
      total: z.number().int(),
      nextCursor: textSchema.nullable(),
    })
    .refine((value) => value.total >= value.items.length);
}
export const workspaceSummaryPageSchema = pageSchema(workspaceSummarySchema);
export const workspaceMemberPageSchema = pageSchema(workspaceMemberSchema);
export const workspaceInvitationPageSchema = pageSchema(workspaceInvitationSchema);
// An error code remains any string; it is not a closed business-error enum.
export const workspaceErrorProjectionSchema = z.looseObject({ code: z.string() });

export type WorkspaceSummary = KnownFields<z.output<typeof workspaceSummarySchema>>;
export type WorkspaceMember = KnownFields<z.output<typeof workspaceMemberSchema>>;
export type WorkspaceInvitation = KnownFields<z.output<typeof workspaceInvitationSchema>>;
export type CreatedInvitation = KnownFields<z.output<typeof createdInvitationSchema>>;
// Keep the original interface semantics for chained isPage/isRecord narrowing.
export interface Page<T> extends Pick<
  z.output<ReturnType<typeof pageSchema>>,
  'total' | 'nextCursor'
> {
  items: z.output<ReturnType<typeof pageSchema<z.ZodType<T>>>>['items'];
}
export type CreateWorkspaceInput = z.input<typeof createWorkspaceInputSchema>;
export type InviteWorkspaceMemberInput = z.input<typeof inviteWorkspaceMemberInputSchema>;
export type RevokeWorkspaceInvitationInput = z.input<typeof revokeWorkspaceInvitationInputSchema>;
export type AcceptWorkspaceInvitationInput = z.input<typeof acceptWorkspaceInvitationInputSchema>;
export type UpdateWorkspaceMemberInput = z.input<typeof updateWorkspaceMemberInputSchema>;
export type RegisterWorkspaceAgentInput = z.input<typeof registerWorkspaceAgentInputSchema>;
export type ManageWorkspaceAgentInput = z.input<typeof manageWorkspaceAgentInputSchema>;
export type WorkspaceCommand =
  | ({ type: 'create-workspace' } & CreateWorkspaceInput)
  | ({ type: 'invite'; workspaceId: string } & InviteWorkspaceMemberInput)
  | { type: 'revoke-invitation'; workspaceId: string; invitationId: string }
  | ({ type: 'accept-invitation' } & AcceptWorkspaceInvitationInput)
  | ({
      type: 'update-member';
      workspaceId: string;
      principalId: string;
    } & UpdateWorkspaceMemberInput)
  | ({ type: 'register-agent'; workspaceId: string } & RegisterWorkspaceAgentInput)
  | ({
      type: 'manage-agent';
      workspaceId: string;
      principalId: string;
    } & ManageWorkspaceAgentInput);
export type WorkspaceResult =
  WorkspaceSummary | WorkspaceMember | WorkspaceInvitation | CreatedInvitation;
