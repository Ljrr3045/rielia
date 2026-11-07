import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrincipalService } from '../../dist/principals/principal.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const workspaceId = 'workspace-unit';
const humanId = 'human-unit';
const agentId = 'agent-unit';
const freeze = (value) => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const copy = (value) => freeze(globalThis.structuredClone(value));

// Only identity/session and repository boundaries used by public verification and
// administration exist here. This does not emulate SQL, locks or rollback.
function fixture(
  t,
  { mode = 'human', role = 'member', allowedOperations = ['read', 'write'] } = {},
) {
  t.mock.timers.enable({ apis: ['Date'], now });
  const state = {
    session: { id: 'session-unit', userId: 'user-unit', expiresAt: new Date(now + 60_000) },
    human: { id: humanId, userId: 'user-unit', kind: 'human', state: 'active', workspaceId: null },
    agent: { id: agentId, kind: 'agent', state: 'active', workspaceId },
    member: {
      workspaceId,
      principalId: mode === 'autonomous' ? agentId : humanId,
      state: 'active',
      role,
    },
    grant: {
      id: 'grant-unit',
      workspaceId,
      subjectPrincipalId: mode === 'autonomous' ? agentId : humanId,
      mode,
      allowedOperations: [...allowedOperations],
      revokedAt: null,
      expiresAt: new Date(now + 60_000),
    },
    storageFailure: null,
    authenticated: true,
  };
  const calls = {
    transactions: 0,
    work: 0,
    identity: 0,
    principalCreates: [],
    membershipCreates: [],
  };
  const tx = {
    $queryRaw: async () => [{ singleton: true }],
    $executeRaw: async () => 1,
    session: {
      findUnique: async ({ where }) => {
        assert.equal(where.id, 'session-unit');
        return copy(state.session);
      },
    },
    principal: {
      create: async ({ data }) => {
        calls.principalCreates.push(data);
        return { id: 'created-agent', ...data };
      },
      findUnique: async ({ where }) => {
        if (where.userId !== undefined) {
          assert.ok(['user-unit', 'new-user'].includes(where.userId));
          return copy(
            where.userId === 'new-user'
              ? { ...state.human, id: 'new-human', userId: 'new-user' }
              : state.human,
          );
        }
        assert.ok([humanId, agentId].includes(where.id), 'unexpected principal lookup');
        return copy(where.id === humanId ? state.human : state.agent);
      },
    },
    membership: {
      create: async ({ data }) => {
        calls.membershipCreates.push(data);
        return data;
      },
      findUnique: async ({ where }) => {
        const scope = where.workspaceId_principalId;
        assert.equal(scope.workspaceId, workspaceId);
        return scope.principalId === state.member?.principalId ? copy(state.member) : null;
      },
    },
    executionGrant: {
      findUnique: async ({ where }) => {
        assert.equal(where.id, 'grant-unit');
        return copy(state.grant);
      },
    },
  };
  const renewal = new globalThis.Headers({ 'set-cookie': 'fictional-renewal=value; HttpOnly' });
  const identity = {
    runtime: {
      prisma: {
        $transaction: async (work) => {
          calls.transactions++;
          if (state.storageFailure) throw state.storageFailure;
          return work(tx);
        },
      },
    },
    session: async (headers) => {
      calls.identity++;
      assert.equal(headers.cookie, 'fictional-session');
      return {
        headers: renewal,
        data: state.authenticated
          ? { session: { id: 'session-unit' }, user: { id: 'user-unit' } }
          : null,
      };
    },
  };
  const service = new PrincipalService(identity);
  const verify = async () =>
    mode === 'human'
      ? (await service.webContext({ cookie: 'fictional-session' }, workspaceId)).context
      : service.internalGrantContext('grant-unit', workspaceId);
  const work = async (receivedTx, current, canWrite) => {
    calls.work++;
    assert.equal(receivedTx, tx);
    return { current, canWrite };
  };
  return { service, state, calls, tx, renewal, verify, work };
}

const status = (code, message) => (error) => {
  assert.equal(error.getStatus(), code);
  if (message) assert.equal(error.message, message);
  return true;
};

test(
  'verified human context forwards renewal and resolves a writable current actor',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const { context, headers } = await f.service.webContext(
      { cookie: 'fictional-session' },
      workspaceId,
    );
    assert.equal(headers, f.renewal);
    assert.equal(Object.isFrozen(context), true);
    const result = await f.service.domainOperation(context, workspaceId, 'write', f.work);
    assert.deepEqual(result, {
      current: {
        actorPrincipalId: humanId,
        principalKind: 'human',
        workspaceId,
        executionMode: 'human',
        source: 'web',
        role: 'member',
        grantId: null,
      },
      canWrite: true,
    });
    assert.equal(f.calls.work, 1);
  },
);

test(
  'copied and foreign-workspace DTOs fail before opening domain work',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const context = await f.verify();
    const transactions = f.calls.transactions;
    await assert.rejects(
      f.service.domainOperation({ ...context }, workspaceId, 'write', f.work),
      status(401),
    );
    await assert.rejects(
      f.service.domainOperation(context, 'foreign-workspace', 'read', f.work),
      status(401),
    );
    assert.equal(f.calls.transactions, transactions);
    assert.equal(f.calls.work, 0);
  },
);

test('missing authentication never opens a principal transaction', { timeout: 5000 }, async (t) => {
  const f = fixture(t);
  f.state.authenticated = false;
  await assert.rejects(f.verify(), status(401, 'Authentication is required.'));
  assert.equal(f.calls.transactions, 0);
});

test(
  'verified human context rechecks current authority before domain work',
  { timeout: 5000 },
  async (t) => {
    // Each change occurs after public verification. A cached DTO must not authorize.
    for (const [name, change, code] of [
      [
        'suspended membership',
        (f) => {
          f.state.member.state = 'suspended';
        },
        403,
      ],
      [
        'revoked membership',
        (f) => {
          f.state.member.state = 'revoked';
        },
        403,
      ],
      [
        'removed membership',
        (f) => {
          f.state.member = null;
        },
        403,
      ],
      [
        'suspended principal',
        (f) => {
          f.state.human.state = 'suspended';
        },
        403,
      ],
      [
        'removed session',
        (f) => {
          f.state.session = null;
        },
        401,
      ],
      [
        'expired session',
        (f) => {
          f.state.session.expiresAt = new Date(now);
        },
        401,
      ],
      [
        'different session user',
        (f) => {
          f.state.session.userId = 'other-user';
        },
        401,
      ],
    ]) {
      await t.test(name, async (child) => {
        const f = fixture(child);
        const context = await f.verify();
        change(f);
        await assert.rejects(
          f.service.domainOperation(context, workspaceId, 'write', f.work),
          status(code),
        );
        assert.equal(f.calls.work, 0);
      });
    }
  },
);

test(
  'human admin control reaches actual principal and membership collaborators',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { role: 'admin' });
    const context = await f.verify();
    assert.equal(
      await f.service.registerAgent(context, {
        name: 'Unit Agent',
        custodianPrincipalId: humanId,
        role: 'member',
      }),
      'created-agent',
    );
    assert.equal(await f.service.addHumanMember(context, 'new-user', 'member'), 'new-human');
    assert.deepEqual(f.calls.principalCreates, [
      { kind: 'agent', displayName: 'Unit Agent', workspaceId, custodianPrincipalId: humanId },
    ]);
    assert.deepEqual(f.calls.membershipCreates, [
      { workspaceId, principalId: 'created-agent', role: 'member' },
      { workspaceId, principalId: 'new-human', role: 'member' },
    ]);
  },
);

test(
  'current role demotion is reflected on reads and blocks viewer writes',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const context = await f.verify();
    f.state.member.role = 'viewer';
    assert.deepEqual(await f.service.domainOperation(context, workspaceId, 'read', f.work), {
      current: { ...context, role: 'viewer' },
      canWrite: false,
    });
    await assert.rejects(
      f.service.domainOperation(context, workspaceId, 'write', f.work),
      status(403, 'Workspace is read-only.'),
    );
    assert.equal(f.calls.work, 1);
  },
);

test(
  'delegated human and autonomous agent controls keep their own actor and grant',
  { timeout: 5000 },
  async (t) => {
    for (const mode of ['delegated', 'autonomous']) {
      await t.test(mode, async (child) => {
        const f = fixture(child, { mode });
        const context = await f.verify();
        const result = await f.service.domainOperation(context, workspaceId, 'write', f.work);
        assert.deepEqual(result, {
          current: {
            actorPrincipalId: mode === 'autonomous' ? agentId : humanId,
            principalKind: mode === 'autonomous' ? 'agent' : 'human',
            workspaceId,
            executionMode: mode,
            source: 'mcp',
            role: 'member',
            grantId: 'grant-unit',
          },
          canWrite: true,
        });
        assert.equal(f.calls.identity, 0);
        assert.equal(f.calls.work, 1);
      });
    }
  },
);

test(
  'read-only grant remains read-only even for a human administrator',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { mode: 'delegated', role: 'admin', allowedOperations: ['read'] });
    const context = await f.verify();
    assert.equal(
      (await f.service.domainOperation(context, workspaceId, 'read', f.work)).canWrite,
      false,
    );
    await assert.rejects(
      f.service.domainOperation(context, workspaceId, 'write', f.work),
      status(403, 'Operation is not granted.'),
    );
    assert.equal(f.calls.work, 1);
  },
);

test(
  'verified grants recheck revocation, expiry, scope and membership',
  { timeout: 5000 },
  async (t) => {
    for (const [name, change, code] of [
      [
        'revoked grant',
        (f) => {
          f.state.grant.revokedAt = new Date(now);
        },
        401,
      ],
      [
        'expired grant',
        (f) => {
          f.state.grant.expiresAt = new Date(now);
        },
        401,
      ],
      [
        'removed grant',
        (f) => {
          f.state.grant = null;
        },
        401,
      ],
      [
        'foreign grant workspace',
        (f) => {
          f.state.grant.workspaceId = 'foreign-workspace';
        },
        401,
      ],
      [
        'revoked subject membership',
        (f) => {
          f.state.member.state = 'revoked';
        },
        403,
      ],
      [
        'write permission removed',
        (f) => {
          f.state.grant.allowedOperations = ['read'];
        },
        403,
      ],
    ]) {
      await t.test(name, async (child) => {
        const f = fixture(child, { mode: 'delegated' });
        const context = await f.verify();
        change(f);
        await assert.rejects(
          f.service.domainOperation(context, workspaceId, 'write', f.work),
          status(code),
        );
        assert.equal(f.calls.work, 0);
      });
    }
  },
);

test(
  'autonomous execution cannot borrow a foreign agent workspace',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { mode: 'autonomous' });
    const context = await f.verify();
    f.state.agent.workspaceId = 'foreign-workspace';
    await assert.rejects(
      f.service.domainOperation(context, workspaceId, 'read', f.work),
      status(403),
    );
    assert.equal(f.calls.work, 0);
  },
);

test(
  'delegated human admin and autonomous execution cannot administer human membership or agents',
  { timeout: 5000 },
  async (t) => {
    for (const mode of ['delegated', 'autonomous']) {
      await t.test(mode, async (child) => {
        const f = fixture(child, { mode, role: mode === 'delegated' ? 'admin' : 'member' });
        const context = await f.verify();
        await assert.rejects(
          f.service.registerAgent(context, {
            name: 'Unit Agent',
            custodianPrincipalId: humanId,
            role: 'member',
          }),
          status(403, 'Operation is not granted.'),
        );
        await assert.rejects(
          f.service.addHumanMember(context, 'new-user', 'member'),
          status(403, 'Operation is not granted.'),
        );
        assert.deepEqual(f.calls.principalCreates, []);
        assert.deepEqual(f.calls.membershipCreates, []);
      });
    }
  },
);

test(
  'unknown storage failures produce a sanitized unavailable response',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const context = await f.verify();
    f.state.storageFailure = new Error('private SQL with postgres://user:secret@db/private');
    await assert.rejects(
      f.service.domainOperation(context, workspaceId, 'write', f.work),
      (error) => {
        assert.equal(error.getStatus(), 503);
        assert.deepEqual(error.getResponse(), {
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Principal operation is unavailable.',
        });
        assert.equal(JSON.stringify(error.getResponse()).includes('private'), false);
        return true;
      },
    );
    assert.equal(f.calls.work, 0);
  },
);
