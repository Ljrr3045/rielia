/** Finite public DTO answers, not a permission, version, paging or persistence model. */
export function workspaceMember(principalId = 'member', overrides = {}) {
  return {
    principalId,
    kind: 'human',
    name: principalId === 'member' ? 'Ana Member' : `Person ${principalId}`,
    role: 'member',
    state: 'active',
    principalState: 'active',
    custodianPrincipalId: null,
    version: 4,
    ...overrides,
  };
}

export function workspaceInvitation(overrides = {}) {
  return {
    id: 'invite-1',
    workspaceId: 'a',
    recipientEmail: 'invitee@example.test',
    role: 'member',
    issuerPrincipalId: 'human',
    createdAt: '2026-11-06T12:00:00.000Z',
    expiresAt: '2026-11-13T12:00:00.000Z',
    state: 'pending',
    ...overrides,
  };
}
