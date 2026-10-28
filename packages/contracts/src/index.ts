/** Process liveness only. This says nothing about DB, auth, or product readiness. */
export * from './project-tasks.js';
export interface HealthResponse {
  status: 'ok';
  service: 'rielia-api';
}

export function isHealthResponse(value: unknown): value is HealthResponse {
  return typeof value === 'object' && value !== null
    && 'status' in value && value.status === 'ok'
    && 'service' in value && value.service === 'rielia-api';
}

export type PrincipalKind = 'human' | 'agent' | 'system';
export type ExecutionMode = 'human' | 'delegated' | 'autonomous' | 'system';
export type MembershipRole = 'owner' | 'admin' | 'member' | 'viewer';

/** Informational projection only. Sending this object never authenticates a call. */
export interface ExecutionContextResponse {
  readonly actorPrincipalId: string;
  readonly principalKind: PrincipalKind;
  readonly workspaceId: string;
  readonly executionMode: ExecutionMode;
  readonly source: 'web' | 'mcp' | 'internal';
  readonly role: MembershipRole;
  readonly grantId: string | null;
}

/** Future T06 records must persist this alongside the mutation, not trust a DTO. */
export interface CreationAttribution {
  readonly createdByPrincipalId: string;
  readonly authorPrincipalId: string;
  readonly assigneePrincipalId: string | null;
  readonly provenance: ExecutionContextResponse;
}

export type MemberState = 'active' | 'suspended' | 'revoked';
export type LimitedRole = Exclude<MembershipRole, 'owner'>;
export interface WorkspaceSummary { id: string; name: string; ownerPrincipalId: string; role: MembershipRole; createdAt: string }
export interface WorkspaceMember {
  principalId: string; kind: 'human' | 'agent'; name: string; role: MembershipRole;
  state: MemberState; principalState: MemberState; custodianPrincipalId: string | null; version: number;
}
export interface WorkspaceInvitation {
  id: string; workspaceId: string; recipientEmail: string; role: LimitedRole; issuerPrincipalId: string;
  createdAt: string; expiresAt: string; state: 'pending' | 'expired' | 'accepted' | 'revoked';
}
export interface Page<T> { items: T[]; total: number; nextCursor: string | null }
export interface CreatedInvitation { invitation: WorkspaceInvitation; token: string }
export type WorkspaceCommand =
  | { type: 'create-workspace'; name: string }
  | { type: 'invite'; workspaceId: string; recipientEmail: string; role: LimitedRole }
  | { type: 'revoke-invitation'; workspaceId: string; invitationId: string }
  | { type: 'accept-invitation'; token: string }
  | { type: 'update-member'; workspaceId: string; principalId: string; version: number; role?: LimitedRole; state?: MemberState }
  | { type: 'register-agent'; workspaceId: string; name: string; role: 'member' | 'viewer'; custodianPrincipalId: string }
  | { type: 'manage-agent'; workspaceId: string; principalId: string; version: number; state?: MemberState; custodianPrincipalId?: string };
export type WorkspaceResult = WorkspaceSummary | WorkspaceMember | WorkspaceInvitation | CreatedInvitation;

export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const oneOf = (value: unknown, values: string[]) => typeof value === 'string' && values.includes(value);
const role = (value: unknown) => oneOf(value, ['owner', 'admin', 'member', 'viewer']);
const memberState = (value: unknown) => oneOf(value, ['active', 'suspended', 'revoked']);
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function isWorkspaceSummary(value: unknown): value is WorkspaceSummary {
  return isRecord(value) && text(value['id']) && text(value['name']) && text(value['ownerPrincipalId']) && role(value['role']) && date(value['createdAt']);
}
export function isWorkspaceMember(value: unknown): value is WorkspaceMember {
  return isRecord(value) && text(value['principalId']) && oneOf(value['kind'], ['human', 'agent']) && text(value['name'])
    && role(value['role']) && memberState(value['state']) && memberState(value['principalState'])
    && (value['custodianPrincipalId'] === null || text(value['custodianPrincipalId'])) && Number.isSafeInteger(value['version']) && Number(value['version']) > 0;
}
export function isWorkspaceInvitation(value: unknown): value is WorkspaceInvitation {
  return isRecord(value) && text(value['id']) && text(value['workspaceId']) && text(value['recipientEmail']) && text(value['issuerPrincipalId'])
    && oneOf(value['role'], ['admin', 'member', 'viewer']) && date(value['createdAt']) && date(value['expiresAt'])
    && oneOf(value['state'], ['pending', 'expired', 'accepted', 'revoked']);
}
export function isPage<T>(value: unknown, item: (value: unknown) => value is T): value is Page<T> {
  return isRecord(value) && Array.isArray(value['items']) && value['items'].every(item) && Number.isSafeInteger(value['total'])
    && Number(value['total']) >= value['items'].length && (value['nextCursor'] === null || text(value['nextCursor']));
}
