import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WorkspaceService } from '../../dist/workspaces/workspace.service.js';
import {
  acceptWorkspaceInvitationInput,
  createWorkspaceInput,
  inviteWorkspaceMemberInput,
  manageWorkspaceAgentInput,
  registerWorkspaceAgentInput,
  revokeWorkspaceInvitationInput,
  updateWorkspaceMemberInput,
  workspaceRecipientEmail,
} from '../../dist/workspaces/workspace-input.js';

const invalid = (message) => (error) => {
  assert.equal(error.getStatus(), 400);
  assert.equal(error.message, message);
  return true;
};
const parsers = [
  [createWorkspaceInput, { name: ' A ' }, { name: 'A' }],
  [
    inviteWorkspaceMemberInput,
    { recipientEmail: ' A@EXAMPLE.TEST ', role: 'member' },
    { recipientEmail: 'a@example.test', role: 'member' },
  ],
  [revokeWorkspaceInvitationInput, {}, {}],
  [acceptWorkspaceInvitationInput, { token: 'a'.repeat(43) }, { token: 'a'.repeat(43) }],
  [updateWorkspaceMemberInput, { version: 1, role: 'viewer' }, { version: 1, role: 'viewer' }],
  [
    registerWorkspaceAgentInput,
    { name: ' A ', role: 'viewer', custodianPrincipalId: 'human' },
    { name: 'A', role: 'viewer', custodianPrincipalId: 'human' },
  ],
  [
    manageWorkspaceAgentInput,
    { version: 1, custodianPrincipalId: 'human' },
    { version: 1, custodianPrincipalId: 'human' },
  ],
];
test('all seven body parsers retain normalized returned objects and outer error precedence', () => {
  for (const [parse, input, expected] of parsers) {
    assert.deepEqual(parse(input), expected);
    for (const bad of [null, [], { ...input, actorPrincipalId: 'forged' }])
      assert.throws(() => parse(bad), invalid('Invalid workspace request.'));
    if (Object.keys(input).length) {
      const missing = { ...input };
      delete missing[Object.keys(input)[0]];
      assert.throws(() => parse(missing), invalid('Invalid workspace request.'));
    }
  }
});
test('name/email normalization and field-specific messages keep their exact order', () => {
  assert.deepEqual(createWorkspaceInput({ name: ' \0\nA ' }), { name: '\0\nA' });
  assert.deepEqual(createWorkspaceInput({ name: '😀'.repeat(100) }), { name: '😀'.repeat(100) });
  for (const name of ['', null, undefined, '😀'.repeat(101)]) {
    assert.throws(
      () => createWorkspaceInput({ name }),
      invalid('Name must contain 1 to 200 characters.'),
    );
    assert.throws(
      () => registerWorkspaceAgentInput({ name, role: 'admin', custodianPrincipalId: null }),
      invalid('Name must contain 1 to 200 characters.'),
    );
  }
  assert.equal(workspaceRecipientEmail(' A@EXAMPLE.TEST '), 'a@example.test');
  for (const recipientEmail of [null, undefined, 'bad', ' ' + ('a'.repeat(249) + '@b.co') + ' '])
    assert.throws(
      () => inviteWorkspaceMemberInput({ recipientEmail, role: 'owner' }),
      invalid('A recipient email is required.'),
    );
  assert.throws(
    () => inviteWorkspaceMemberInput({ recipientEmail: 'a@b.co', role: 'owner' }),
    invalid('Invalid invitation role.'),
  );
  for (const token of [null, undefined, 'short', '+'.repeat(43)])
    assert.throws(
      () => acceptWorkspaceInvitationInput({ token }),
      invalid('Invalid invitation token.'),
    );
  assert.throws(
    () =>
      registerWorkspaceAgentInput({ name: 'Agent', role: 'admin', custodianPrincipalId: 'human' }),
    invalid('Invalid agent registration.'),
  );
});
test('member/agent patches retain optional presence, safe integers and exact scalar rejection', () => {
  for (const [parse, message] of [
    [updateWorkspaceMemberInput, 'Invalid member change.'],
    [manageWorkspaceAgentInput, 'Invalid agent change.'],
  ]) {
    for (const bad of [
      { version: 1 },
      { version: 0, state: 'active' },
      { version: 1.5, state: 'active' },
      { version: Number.MAX_SAFE_INTEGER + 1, state: 'active' },
      { version: 1, state: undefined },
      { version: 1, state: null },
      { version: 1, state: ['active'] },
    ])
      assert.throws(() => parse(bad), invalid(message));
    assert.deepEqual(parse({ version: Number.MAX_SAFE_INTEGER, state: 'suspended' }), {
      version: Number.MAX_SAFE_INTEGER,
      state: 'suspended',
    });
  }
  assert.throws(
    () => updateWorkspaceMemberInput({ version: 1, role: undefined }),
    invalid('Invalid member change.'),
  );
  assert.throws(
    () => manageWorkspaceAgentInput({ version: 1, custodianPrincipalId: 'bad/id' }),
    invalid('Invalid agent change.'),
  );
  assert.deepEqual(updateWorkspaceMemberInput({ version: 1, role: 'admin', state: 'active' }), {
    version: 1,
    role: 'admin',
    state: 'active',
  });
  assert.deepEqual(
    manageWorkspaceAgentInput({ version: 1, state: 'active', custodianPrincipalId: 'human' }),
    { version: 1, state: 'active', custodianPrincipalId: 'human' },
  );
});
test('malformed service bodies fail before authentication or transaction composition', () => {
  let calls = 0;
  const service = new WorkspaceService({
    workspaceOperation: () => {
      calls++;
    },
  });
  const invoke = [
    () => service.create({}, 'key', { name: '' }),
    () => service.invite({}, 'workspace', 'key', { recipientEmail: 'bad', role: 'viewer' }),
    () => service.revokeInvitation({}, 'workspace', 'invitation', 'key', { unexpected: true }),
    () => service.accept({}, 'key', { token: 'bad' }),
    () => service.updateMember({}, 'workspace', 'human', 'key', { version: 1 }),
    () =>
      service.registerAgent({}, 'workspace', 'key', {
        name: 'Agent',
        role: 'owner',
        custodianPrincipalId: 'human',
      }),
    () => service.manageAgent({}, 'workspace', 'agent', 'key', { version: 1, state: null }),
  ];
  for (const call of invoke) assert.throws(call, (error) => error.getStatus() === 400);
  assert.equal(calls, 0);
});
