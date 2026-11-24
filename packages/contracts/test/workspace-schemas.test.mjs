import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acceptWorkspaceInvitationInputSchema,
  createWorkspaceInputSchema,
  createdInvitationSchema,
  creationAttributionSchema,
  executionContextResponseSchema,
  healthResponseSchema,
  identityConfigurationSchema,
  identitySessionSchema,
  inviteWorkspaceMemberInputSchema,
  isHealthResponse,
  isPage,
  isWorkspaceInvitation,
  isWorkspaceMember,
  isWorkspaceSummary,
  manageWorkspaceAgentInputSchema,
  pageSchema,
  readinessResponseSchema,
  registerWorkspaceAgentInputSchema,
  revokeWorkspaceInvitationInputSchema,
  updateWorkspaceMemberInputSchema,
  workspaceErrorProjectionSchema,
  workspaceInvitationPageSchema,
  workspaceMemberPageSchema,
  workspaceRecipientEmailInputSchema,
  workspaceSummaryPageSchema,
} from '../dist/index.js';

const summary = {
  id: 'arbitrary ID / response',
  name: ' ',
  ownerPrincipalId: 'human',
  role: 'owner',
  createdAt: 'January 1, 2026',
  extra: 'retained',
};
const member = {
  principalId: 'human',
  kind: 'human',
  name: 'Member',
  role: 'admin',
  state: 'active',
  principalState: 'suspended',
  custodianPrincipalId: null,
  version: Number.MAX_SAFE_INTEGER,
};
const invitation = {
  id: 'invite',
  workspaceId: 'workspace',
  recipientEmail: 'not-an-email',
  role: 'viewer',
  issuerPrincipalId: 'human',
  createdAt: '2026-02-01',
  expiresAt: '2026-01-01',
  state: 'expired',
};
const context = {
  actorPrincipalId: 'human',
  principalKind: 'human',
  workspaceId: 'workspace',
  executionMode: 'human',
  source: 'web',
  role: 'owner',
  grantId: null,
};
const rejects = (schema, values) => {
  for (const value of values) assert.equal(schema.safeParse(value).success, false);
};

test('workspace outputs preserve broad strings/dates, null fields, extra keys and scalar enums', () => {
  assert.ok(isWorkspaceSummary(summary));
  assert.ok(isWorkspaceMember(member));
  assert.ok(isWorkspaceInvitation(invitation));
  assert.equal(
    workspaceSummaryPageSchema.parse({ items: [summary], total: 1, nextCursor: 'a / b' }).items[0]
      .extra,
    'retained',
  );
  assert.ok(
    workspaceMemberPageSchema.safeParse({ items: [member], total: 1, nextCursor: null }).success,
  );
  assert.ok(
    workspaceInvitationPageSchema.safeParse({ items: [invitation], total: 1, nextCursor: null })
      .success,
  );
  assert.equal(isWorkspaceSummary({ ...summary, createdAt: 'invalid' }), false);
  assert.equal(isWorkspaceMember({ ...member, custodianPrincipalId: undefined }), false);
  assert.equal(isWorkspaceInvitation({ ...invitation, role: ['viewer'] }), false);
  for (const version of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1'])
    assert.equal(isWorkspaceMember({ ...member, version }), false);
  assert.ok(
    isWorkspaceMember({ ...member, kind: 'agent', role: 'owner', custodianPrincipalId: ' ' }),
  );
});

test('generic pages retain predicate semantics, duplicate/unbounded items and raw extra keys', () => {
  const item = (value) => typeof value === 'string';
  const value = { items: Array(101).fill('same'), total: 101, nextCursor: ' ', extra: true };
  assert.ok(isPage(value, item));
  assert.equal(
    pageSchema(healthResponseSchema).parse({ items: [], total: 0, nextCursor: null, extra: 1 })
      .extra,
    1,
  );
  for (const patch of [
    { total: 100 },
    { total: 1.5 },
    { total: Number.MAX_SAFE_INTEGER + 1 },
    { nextCursor: '' },
    { items: [3] },
  ])
    assert.equal(isPage({ ...value, ...patch }, item), false);
  assert.equal(
    isPage({ items: Array(1), total: 1, nextCursor: null }, () => true),
    false,
  );
  assert.equal(
    isPage({ items: [undefined], total: 1, nextCursor: null }, () => true),
    true,
  );
});

test('strict workspace inputs preserve UTF16 trim, raw email length, token and optional patch presence', () => {
  assert.deepEqual(createWorkspaceInputSchema.parse({ name: '  A\n\0B  ' }), { name: 'A\n\0B' });
  assert.ok(createWorkspaceInputSchema.safeParse({ name: '😀'.repeat(100) }).success);
  rejects(createWorkspaceInputSchema, [
    null,
    [],
    {},
    { name: ' ' },
    { name: '😀'.repeat(101) },
    { name: 'ok', source: 'web' },
  ]);
  assert.deepEqual(
    inviteWorkspaceMemberInputSchema.parse({ recipientEmail: ' A@EXAMPLE.TEST ', role: 'admin' }),
    { recipientEmail: 'a@example.test', role: 'admin' },
  );
  const address = 'a'.repeat(248) + '@b.co';
  assert.equal(address.length, 253);
  assert.ok(workspaceRecipientEmailInputSchema.safeParse(' ' + address).success);
  rejects(workspaceRecipientEmailInputSchema, ['  ' + address, 'missing', 'a @b.co', null]);
  assert.deepEqual(revokeWorkspaceInvitationInputSchema.parse({}), {});
  rejects(revokeWorkspaceInvitationInputSchema, [null, [], { version: 1 }]);
  assert.deepEqual(acceptWorkspaceInvitationInputSchema.parse({ token: 'a'.repeat(43) }), {
    token: 'a'.repeat(43),
  });
  rejects(acceptWorkspaceInvitationInputSchema, [
    { token: 'a'.repeat(42) },
    { token: '+'.repeat(43) },
    { token: null },
  ]);
  for (const schema of [updateWorkspaceMemberInputSchema, manageWorkspaceAgentInputSchema]) {
    assert.deepEqual(schema.parse({ version: 1, state: 'active' }), {
      version: 1,
      state: 'active',
    });
    assert.equal('role' in schema.parse({ version: 1, state: 'active' }), false);
    rejects(schema, [
      { version: 1 },
      { version: '1', state: 'active' },
      { version: 0, state: 'active' },
      { version: 1, state: null },
      { version: 1, state: undefined },
      { version: 1, state: ['active'] },
      { version: 1, state: 'active', mode: 'human' },
    ]);
  }
  assert.ok(updateWorkspaceMemberInputSchema.safeParse({ version: 1, role: 'viewer' }).success);
  rejects(updateWorkspaceMemberInputSchema, [
    { version: 1, role: 'owner' },
    { version: 1, role: undefined },
  ]);
  assert.ok(
    manageWorkspaceAgentInputSchema.safeParse({ version: 1, custodianPrincipalId: 'human' })
      .success,
  );
  rejects(manageWorkspaceAgentInputSchema, [
    { version: 1, custodianPrincipalId: null },
    { version: 1, custodianPrincipalId: 'bad/id' },
  ]);
  assert.deepEqual(
    registerWorkspaceAgentInputSchema.parse({
      name: ' Agent ',
      role: 'member',
      custodianPrincipalId: 'human',
    }),
    { name: 'Agent', role: 'member', custodianPrincipalId: 'human' },
  );
  rejects(registerWorkspaceAgentInputSchema, [
    { name: 'Agent', role: 'admin', custodianPrincipalId: 'human' },
    { name: 'Agent', role: 'viewer', custodianPrincipalId: '' },
  ]);
});

test('identity schemas project extras, deduplicate providers and retain permissive string/date fields', () => {
  assert.deepEqual(
    identityConfigurationSchema.parse({
      enabled: true,
      providers: ['github', 'google', 'github'],
      extra: 1,
    }),
    { enabled: true, providers: ['github', 'google'] },
  );
  rejects(identityConfigurationSchema, [
    null,
    { enabled: 1, providers: [] },
    { enabled: true, providers: ['other'] },
    { enabled: true, providers: Array(1) },
  ]);
  const session = {
    user: { id: '', name: '', email: '', emailVerified: false, secret: 'omit' },
    session: { id: '', expiresAt: 'January 1, 2026', secret: 'omit' },
    secret: 'omit',
  };
  assert.deepEqual(identitySessionSchema.parse(session), {
    user: { id: '', name: '', email: '', emailVerified: false },
    session: { id: '', expiresAt: 'January 1, 2026' },
  });
  assert.equal(identitySessionSchema.parse(null), null);
  rejects(identitySessionSchema, [
    {},
    [],
    { ...session, user: { ...session.user, emailVerified: 'true' } },
    { ...session, session: { ...session.session, expiresAt: 'invalid' } },
  ]);
  rejects(identityConfigurationSchema, [Object.assign([], { enabled: true, providers: [] })]);
  rejects(identitySessionSchema, [
    Object.assign([], session),
    { ...session, user: Object.assign([], session.user) },
    { ...session, session: Object.assign([], session.session) },
  ]);
});

test('health/readiness, invitation and permissive error-code envelopes have independent policies', () => {
  assert.ok(isHealthResponse({ status: 'ok', service: 'rielia-api', extra: true }));
  assert.equal(isHealthResponse(Object.assign([], { status: 'ok', service: 'rielia-api' })), false);
  rejects(healthResponseSchema, [null, {}, { status: 'ready', service: 'rielia-api' }]);
  assert.ok(readinessResponseSchema.safeParse({ status: 'ready', extra: 1 }).success);
  rejects(readinessResponseSchema, [{ status: 'ok' }]);
  assert.ok(
    createdInvitationSchema.safeParse({ invitation, token: 'a'.repeat(43), extra: true }).success,
  );
  rejects(createdInvitationSchema, [
    { invitation, token: 'short' },
    { invitation: null, token: 'a'.repeat(43) },
  ]);
  assert.equal(workspaceErrorProjectionSchema.parse({ code: '', other: 1 }).code, '');
  rejects(workspaceErrorProjectionSchema, [{}, null, { code: ['denied'] }]);
});

test('informational context/attribution validates scalar shape without granting policy or freezing objects', () => {
  const parsed = executionContextResponseSchema.parse({ ...context, extra: true });
  assert.equal(Object.isFrozen(parsed), false);
  assert.equal(parsed.extra, true);
  assert.ok(
    executionContextResponseSchema.safeParse({
      ...context,
      principalKind: 'system',
      executionMode: 'system',
      source: 'internal',
      grantId: '',
    }).success,
  );
  rejects(executionContextResponseSchema, [
    null,
    {},
    { ...context, principalKind: ['human'] },
    { ...context, executionMode: 'other' },
    { ...context, grantId: undefined },
  ]);
  assert.ok(
    creationAttributionSchema.safeParse({
      createdByPrincipalId: 'human',
      authorPrincipalId: 'human',
      assigneePrincipalId: null,
      provenance: context,
    }).success,
  );
  rejects(creationAttributionSchema, [
    {
      createdByPrincipalId: 'human',
      authorPrincipalId: 'human',
      assigneePrincipalId: 1,
      provenance: context,
    },
  ]);
});
