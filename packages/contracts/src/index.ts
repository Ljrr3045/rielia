/** Process liveness only. This says nothing about DB, auth, or product readiness. */
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
