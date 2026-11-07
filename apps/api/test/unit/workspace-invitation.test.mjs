import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { PrincipalService } from '../../dist/principals/principal.service.js';
import { WorkspaceService } from '../../dist/workspaces/workspace.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const key = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(43);
const headers = Object.freeze({ cookie: 'fictional-session' });
const status = (code, message) => (error) => {
  assert.equal(error.getStatus(), code);
  if (message) assert.equal(error.message, message);
  return true;
};

// PrincipalService owns session verification. This composition boundary supplies
// its current HumanActor on every call; it does not create or seed trusted DTOs.
// Scripted repository rows and attempted effects do not model SQL rollback.
function fixture(t) {
  t.mock.timers.enable({ apis: ['Date'], now });
  t.mock.method(crypto, 'randomUUID', () => '00000000-0000-4000-8000-000000000001');
  t.mock.method(crypto, 'randomBytes', () => Buffer.alloc(32, 7));
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  assert.deepEqual(Reflect.getMetadata('design:paramtypes', WorkspaceService), [PrincipalService]);
  const actor = {
    principalId: 'recipient',
    userId: 'recipient-user',
    email: ' Reader@Example.test ',
    emailVerified: true,
    context: null,
  };
  const workspace = {
    id: 'workspace',
    name: 'Current workspace',
    ownerPrincipalId: 'issuer',
    createdAt: new Date(now),
  };
  const state = {
    invitation: {
      id: 'invitation',
      workspaceId: 'workspace',
      issuerPrincipalId: 'issuer',
      recipientEmail: 'reader@example.test',
      role: 'member',
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      createdAt: new Date(now),
      expiresAt: new Date(now + 86400000),
      consumedAt: null,
      revokedAt: null,
    },
    issuer: { state: 'active', role: 'admin', principal: { kind: 'human', state: 'active' } },
    existing: null,
    membership: { workspaceId: 'workspace', state: 'active', role: 'member', workspace },
    receipt: null,
    receiptError: null,
  };
  const effects = { memberships: [], invitations: [], receipts: [], expired: [] };
  const calls = [];
  const tx = {
    workspaceOperation: {
      findUnique: async ({ where }) => {
        assert.equal(where.actorPrincipalId_key.actorPrincipalId, actor.principalId);
        return state.receipt;
      },
      create: async ({ data }) => {
        effects.receipts.push(data);
        if (state.receiptError) throw state.receiptError;
        state.receipt = data;
      },
    },
    invitation: {
      findUnique: async ({ where }) => {
        assert.equal(where.tokenHash, crypto.createHash('sha256').update(token).digest('hex'));
        return state.invitation;
      },
      update: async ({ data }) => {
        effects.invitations.push(data);
        return state.invitation;
      },
      updateMany: async (input) => {
        effects.expired.push(input);
        return { count: 0 };
      },
      create: async ({ data }) => {
        effects.invitations.push(data);
        return { ...data, createdAt: new Date(now), consumedAt: null, revokedAt: null };
      },
    },
    membership: {
      findFirst: async () => state.existing,
      findUnique: async ({ where, include }) => {
        assert.equal(where.workspaceId_principalId.workspaceId, 'workspace');
        if (include?.principal) {
          assert.equal(where.workspaceId_principalId.principalId, 'issuer');
          return state.issuer;
        }
        assert.equal(where.workspaceId_principalId.principalId, actor.principalId);
        return include?.workspace ? state.membership : state.existing;
      },
    },
  };
  const principals = {
    workspaceOperation: async (received, scope, operation, work) => {
      assert.equal(received, headers);
      calls.push({ scope, operation });
      return { data: await work(tx, actor), headers: new globalThis.Headers() };
    },
    createMembership: async (received, w, principalId, role) => {
      assert.equal(received, tx);
      effects.memberships.push({ w, principalId, role });
    },
  };
  const service = new WorkspaceService(principals);
  const accept = () => service.accept(headers, key, { token });
  const invite = (payload = { recipientEmail: actor.email, role: 'viewer' }) =>
    service.invite(headers, 'workspace', key, payload);
  return { service, actor, state, effects, calls, accept, invite };
}

test('accept creates the recipient membership, consumes the invitation and returns current summary before receipting', async (t) => {
  const f = fixture(t);
  const result = await f.accept();
  assert.deepEqual(result.data, {
    id: 'workspace',
    name: 'Current workspace',
    ownerPrincipalId: 'issuer',
    role: 'member',
    createdAt: new Date(now).toISOString(),
  });
  assert.deepEqual(f.effects.memberships, [
    { w: 'workspace', principalId: 'recipient', role: 'member' },
  ]);
  assert.deepEqual(f.effects.invitations, [{ consumedAt: new Date(now) }]);
  assert.equal(f.effects.receipts.length, 1);
  assert.equal(JSON.stringify(f.effects.receipts).includes(token), false);
  assert.deepEqual(f.calls, [{ scope: null, operation: 'read' }]);
});

for (const [name, change, code, message] of [
  [
    'missing invitation',
    (f) => {
      f.state.invitation = null;
    },
    403,
    'Invitation acceptance is denied.',
  ],
  [
    'unverified recipient',
    (f) => {
      f.actor.emailVerified = false;
    },
    403,
    'Invitation acceptance is denied.',
  ],
  [
    'different current recipient',
    (f) => {
      f.actor.email = 'other@example.test';
    },
    403,
    'Invitation acceptance is denied.',
  ],
  [
    'expired at the exact boundary',
    (f) => {
      f.state.invitation.expiresAt = new Date(now);
    },
    409,
    'Invitation is unavailable or expired.',
  ],
  [
    'revoked invitation',
    (f) => {
      f.state.invitation.revokedAt = new Date(now);
    },
    409,
    'Invitation is unavailable or expired.',
  ],
  [
    'consumed invitation',
    (f) => {
      f.state.invitation.consumedAt = new Date(now);
    },
    409,
    'Invitation is unavailable or expired.',
  ],
  [
    'missing issuer',
    (f) => {
      f.state.issuer = null;
    },
    403,
    'Invitation issuer is no longer authorized.',
  ],
  [
    'suspended issuer membership',
    (f) => {
      f.state.issuer.state = 'suspended';
    },
    403,
    'Invitation issuer is no longer authorized.',
  ],
  [
    'demoted issuer',
    (f) => {
      f.state.issuer.role = 'member';
    },
    403,
    'Invitation issuer is no longer authorized.',
  ],
  [
    'autonomous issuer',
    (f) => {
      f.state.issuer.principal.kind = 'agent';
    },
    403,
    'Invitation issuer is no longer authorized.',
  ],
  [
    'revoked issuer principal',
    (f) => {
      f.state.issuer.principal.state = 'revoked';
    },
    403,
    'Invitation issuer is no longer authorized.',
  ],
])
  test(`accept denies ${name} before membership, consumption or successful receipt`, async (t) => {
    const f = fixture(t);
    change(f);
    await assert.rejects(f.accept(), status(code, message));
    assert.deepEqual(f.effects, { memberships: [], invitations: [], receipts: [], expired: [] });
  });

for (const memberState of ['active', 'suspended', 'revoked'])
  test(`accept cannot rejoin an existing ${memberState} membership`, async (t) => {
    const f = fixture(t);
    f.state.existing = { state: memberState };
    await assert.rejects(
      f.accept(),
      status(409, 'Membership already exists. Rejoining is not supported.'),
    );
    assert.equal(
      f.effects.memberships.length + f.effects.invitations.length + f.effects.receipts.length,
      0,
    );
  });

test('same-key acceptance returns current membership data without another consumption', async (t) => {
  const f = fixture(t);
  await f.accept();
  const effects = globalThis.structuredClone(f.effects);
  f.state.invitation.consumedAt = new Date(now);
  f.state.membership.workspace.name = 'Renamed after acceptance';
  f.state.membership.role = 'viewer';
  const replay = await f.accept();
  assert.equal(replay.data.name, 'Renamed after acceptance');
  assert.equal(replay.data.role, 'viewer');
  assert.deepEqual(f.effects, effects);
  assert.equal(f.calls.length, 2);
});

for (const [name, change] of [
  [
    'recipient changed',
    (f) => {
      f.actor.email = 'another@example.test';
    },
  ],
  [
    'verification lost',
    (f) => {
      f.actor.emailVerified = false;
    },
  ],
  [
    'membership revoked',
    (f) => {
      f.state.membership.state = 'revoked';
    },
  ],
])
  test(`same-key acceptance rechecks current authority when ${name}`, async (t) => {
    const f = fixture(t);
    await f.accept();
    const effects = globalThis.structuredClone(f.effects);
    change(f);
    await assert.rejects(f.accept(), status(403));
    assert.deepEqual(f.effects, effects);
  });

test('invitation issuance normalizes recipient, stores only a hash and never recovers the secret on replay', async (t) => {
  const f = fixture(t);
  const result = await f.invite();
  const stored = f.effects.invitations[0];
  assert.equal(result.data.invitation.recipientEmail, 'reader@example.test');
  assert.equal(result.data.invitation.role, 'viewer');
  assert.equal(result.data.invitation.state, 'pending');
  assert.equal(
    stored.tokenHash,
    crypto.createHash('sha256').update(result.data.token).digest('hex'),
  );
  assert.equal(stored.expiresAt.getTime(), now + 7 * 86400000);
  assert.equal('token' in stored, false);
  assert.deepEqual(f.effects.receipts[0].response, { issued: true });
  await assert.rejects(f.invite(), (error) => {
    assert.equal(error.getStatus(), 409);
    assert.equal(error.getResponse().code, 'invitation-link-unavailable');
    return true;
  });
  await assert.rejects(
    f.invite({ recipientEmail: 'reader@example.test', role: 'member' }),
    status(409, 'Idempotency key belongs to another request.'),
  );
  assert.equal(f.effects.invitations.length, 1);
  assert.deepEqual(
    f.calls.map((call) => call.operation),
    ['admin', 'admin', 'admin'],
  );
});

test('inviting a terminal historic member cannot issue another link', async (t) => {
  const f = fixture(t);
  f.state.existing = { state: 'revoked' };
  await assert.rejects(
    f.invite(),
    status(409, 'Recipient already has a membership. Rejoining is not supported.'),
  );
  assert.equal(
    f.effects.invitations.length + f.effects.receipts.length + f.effects.expired.length,
    0,
  );
});

test('receipt collaborator failure rejects acceptance instead of reporting success', async (t) => {
  const f = fixture(t);
  const failure = new Error('receipt unavailable');
  f.state.receiptError = failure;
  await assert.rejects(f.accept(), (error) => error === failure);
  assert.equal(f.effects.memberships.length, 1);
  assert.equal(f.effects.invitations.length, 1);
  assert.equal(f.state.receipt, null);
});

test('malformed tokens and owner/forged invitation fields fail before entering current-actor composition', (t) => {
  const f = fixture(t);
  assert.throws(() => f.service.accept(headers, key, { token: 'short' }), status(400));
  assert.throws(
    () => f.invite({ recipientEmail: 'reader@example.test', role: 'owner' }),
    status(400),
  );
  assert.throws(
    () =>
      f.invite({
        recipientEmail: 'reader@example.test',
        role: 'viewer',
        issuerPrincipalId: 'forged',
      }),
    status(400),
  );
  assert.deepEqual(f.calls, []);
});
