import { z } from 'zod';
import type { KnownFields } from './schema-types.js';

export const principalKindSchema = z.enum(['human', 'agent', 'system']);
export const executionModeSchema = z.enum(['human', 'delegated', 'autonomous', 'system']);
export const membershipRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
export const limitedRoleSchema = membershipRoleSchema.exclude(['owner']);
export const memberStateSchema = z.enum(['active', 'suspended', 'revoked']);

/** Informational shape only. Parsing never establishes verified execution evidence. */
export const executionContextResponseSchema = z.looseObject({
  actorPrincipalId: z.string(),
  principalKind: principalKindSchema,
  workspaceId: z.string(),
  executionMode: executionModeSchema,
  source: z.enum(['web', 'mcp', 'internal']),
  role: membershipRoleSchema,
  grantId: z.string().nullable(),
});
export const creationAttributionSchema = z.looseObject({
  createdByPrincipalId: z.string(),
  authorPrincipalId: z.string(),
  assigneePrincipalId: z.string().nullable(),
  provenance: executionContextResponseSchema,
});

export type PrincipalKind = z.output<typeof principalKindSchema>;
export type ExecutionMode = z.output<typeof executionModeSchema>;
export type MembershipRole = z.output<typeof membershipRoleSchema>;
export type LimitedRole = z.output<typeof limitedRoleSchema>;
export type MemberState = z.output<typeof memberStateSchema>;
export type ExecutionContextResponse = Readonly<
  KnownFields<z.output<typeof executionContextResponseSchema>>
>;
export type CreationAttribution = Readonly<
  Omit<KnownFields<z.output<typeof creationAttributionSchema>>, 'provenance'> & {
    readonly provenance: ExecutionContextResponse;
  }
>;
