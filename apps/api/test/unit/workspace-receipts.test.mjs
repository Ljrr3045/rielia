import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { WorkspaceService } from '../../dist/workspaces/workspace.service.js';

const key = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(43);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const actor = { principalId: 'human', email: 'reader@example.test', emailVerified: true };
const member = {
  principalId: 'agent',
  kind: 'agent',
  name: 'Historical Agent',
  role: 'viewer',
  state: 'suspended',
  principalState: 'active',
  custodianPrincipalId: null,
  version: 2,
};
const invitation = {
  id: 'invitation',
  workspaceId: 'w',
  recipientEmail: 'reader@example.test',
  role: 'viewer',
  issuerPrincipalId: 'human',
  createdAt: '2026-01-01',
  expiresAt: '2026-01-08',
  state: 'revoked',
};
const cases = [
  {
    name: 'member update',
    route: 'member/w/member',
    input: { version: 1, state: 'suspended' },
    response: member,
    run: (s, input, k) => s.updateMember({}, 'w', 'member', k, input),
  },
  {
    name: 'agent registration',
    route: 'agent/w',
    input: { name: 'Agent', role: 'viewer', custodianPrincipalId: 'human' },
    response: member,
    run: (s, input, k) => s.registerAgent({}, 'w', k, input),
  },
  {
    name: 'agent management',
    route: 'agent/w/agent',
    input: { version: 1, state: 'suspended' },
    response: member,
    run: (s, input, k) => s.manageAgent({}, 'w', 'agent', k, input),
  },
  {
    name: 'invitation revocation',
    route: 'revoke/w/invitation',
    input: {},
    response: invitation,
    run: (s, input, k) => s.revokeInvitation({}, 'w', 'invitation', k, input),
  },
];
function fixture(route, input, response, options = {}) {
  const calls = [];
  const normalized = Object.fromEntries(
    Object.entries(input).sort(([a], [b]) => a.localeCompare(b)),
  );
  const tx = {
    workspaceOperation: {
      findUnique: async () => {
        calls.push('receipt');
        return {
          requestHash: options.wrongHash ? 'wrong' : digest(JSON.stringify([route, normalized])),
          response,
        };
      },
    },
    invitation: {
      findUnique: async () => {
        calls.push('recipient');
        return options.recipientMissing ? null : { recipientEmail: actor.email };
      },
    },
    membership: {
      findUnique: async ({ where }) => {
        calls.push(['summary', where.workspaceId_principalId.workspaceId]);
        return options.missing
          ? null
          : {
              workspaceId: 'w',
              role: 'viewer',
              state: 'active',
              workspace: {
                name: 'Current workspace',
                ownerPrincipalId: 'owner',
                createdAt: new Date('2026-01-01'),
              },
            };
      },
    },
  };
  const service = new WorkspaceService({
    workspaceOperation: async (headers, w, operation, work) => {
      calls.push(['authority', w, operation]);
      if (options.denied) throw new ForbiddenException();
      return { data: await work(tx, actor) };
    },
  });
  return { service, calls };
}
const status = (expected, message) => (error) => {
  assert.equal(error.getStatus(), expected);
  if (message) assert.equal(error.message, message);
  return true;
};
for (const c of cases) {
  test(`${c.name} replay returns the original validated historical object and extras`, async () => {
    const response = { ...c.response, extra: { retained: true } };
    const f = fixture(c.route, c.input, response);
    const result = await c.run(f.service, c.input, key);
    assert.equal(result.data, response);
    assert.deepEqual(f.calls, [['authority', 'w', 'admin'], 'receipt']);
  });
  test(`${c.name} rejects corrupted known fields only after authority and request hash`, async () => {
    for (const response of [
      null,
      [],
      { ...c.response, [c.name === 'invitation revocation' ? 'state' : 'custodianPrincipalId']: 3 },
    ]) {
      const f = fixture(c.route, c.input, response);
      await assert.rejects(
        c.run(f.service, c.input, key),
        status(503, 'Workspace receipt is unavailable.'),
      );
      assert.equal(f.calls.length, 2);
    }
    const denied = fixture(c.route, c.input, null, { denied: true });
    await assert.rejects(c.run(denied.service, c.input, key), status(403));
    assert.equal(denied.calls.length, 1);
    const changed = fixture(c.route, c.input, null, { wrongHash: true });
    await assert.rejects(
      c.run(changed.service, c.input, key),
      status(409, 'Idempotency key belongs to another request.'),
    );
  });
}
for (const accepting of [false, true]) {
  const route = accepting ? 'accept-invitation' : 'create-workspace';
  const payload = accepting ? { token } : { name: 'Workspace' };
  const input = accepting ? { tokenHash: digest(token) } : payload;
  const run = (f) =>
    accepting ? f.service.accept({}, key, payload) : f.service.create({}, key, payload);
  test(`${route} reads only the ordinary saved selector and returns current summary`, async () => {
    const f = fixture(route, input, { id: 'w', role: 'corrupt ignored history' });
    assert.equal((await run(f)).data.name, 'Current workspace');
    assert.deepEqual(f.calls.at(-1), ['summary', 'w']);
    for (const id of [' ', 'non/identifier']) {
      const absent = fixture(route, input, { id }, { missing: true });
      await assert.rejects(run(absent), status(403));
      assert.deepEqual(absent.calls.at(-1), ['summary', id]);
    }
  });
  test(`${route} maps unreadable references to controlled409 without a selector query`, async () => {
    for (const response of [
      null,
      [],
      1,
      'saved',
      {},
      { id: '' },
      { id: false },
      { id: { nested: true } },
    ]) {
      const f = fixture(route, input, response);
      await assert.rejects(run(f), status(409, 'Workspace receipt is unavailable.'));
      assert.equal(
        f.calls.some((c) => Array.isArray(c) && c[0] === 'summary'),
        false,
      );
    }
    if (accepting) {
      const f = fixture(route, input, null, { recipientMissing: true });
      await assert.rejects(run(f), status(403, 'Invitation acceptance is denied.'));
    }
    const f = fixture(route, input, null, { wrongHash: true });
    await assert.rejects(run(f), status(409, 'Idempotency key belongs to another request.'));
  });
}
