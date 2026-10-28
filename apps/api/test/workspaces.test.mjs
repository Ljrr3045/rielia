import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { WorkspaceService } from '../dist/workspaces/workspace.service.js';

test('T05.0 PostgreSQL and HTTP workspace workflows', async t => {
  const app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false });
  configureApplication(app); await app.listen(0, '127.0.0.1');
  const url = await app.getUrl(); const identity = app.get(IdentityService); const prisma = identity.runtime.prisma;
  const principals = app.get(PrincipalService); const service = app.get(WorkspaceService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  t.after(async () => { await pool.end(); await app.close(); });
  async function human(verified = true) {
    const id = randomUUID(); await prisma.user.create({ data: { id, name: 'Workflow Human', email: `${id}@example.test`, emailVerified: verified } });
    const principal = await prisma.principal.findUniqueOrThrow({ where: { userId: id } });
    const token = randomUUID(); const sessionId = randomUUID();
    await prisma.session.create({ data: { id: sessionId, token, userId: id, expiresAt: new Date(Date.now() + 3600000) } });
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}`;
    return { id, principalId: principal.id, email: `${id}@example.test`, sessionId, cookie };
  }
  async function request(user, path = 'workspaces', body, key = randomUUID(), extra = {}) {
    const response = await fetch(`${url}/api/v1/${path}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { ...(user ? { cookie: user.cookie } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', origin: identity.config.origin, 'idempotency-key': key }), ...extra },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  async function ok(user, path, body, key) { const result = await request(user, path, body, key); assert.ok(result.status >= 200 && result.status < 300, JSON.stringify(result.data)); return result.data; }
  async function fixture() { const owner = await human(); const workspace = await ok(owner, 'workspaces', { name: 'Tenant' }); return { owner, workspace, path: `workspaces/${workspace.id}` }; }
  async function invite(f, recipient, role = 'member', user = f.owner) { return ok(user, `${f.path}/invitations`, { recipientEmail: recipient.email.toUpperCase(), role }); }
  async function join(f, recipient, role = 'member') { const created = await invite(f, recipient, role); await ok(recipient, 'workspace-invitations/accept', { token: created.token }); return recipient; }
  async function member(f, person) { return (await ok(f.owner, `${f.path}/members`)).items.find(row => row.principalId === person.principalId); }

  await t.test('human create/list/select persist, receipt avoids duplicate, owner plus two tenants isolated on every route', async () => {
    const owner = await human(); const key = randomUUID();
    const a = await ok(owner, 'workspaces', { name: 'Personal' }, key);
    assert.deepEqual(await ok(owner, 'workspaces', { name: 'Personal' }, key), a);
    assert.equal((await request(owner, 'workspaces', { name: 'Different' }, key)).status, 409);
    const b = await fixture(); const list = await ok(owner, 'workspaces');
    assert.equal(list.total, 1); assert.deepEqual(list.items.map(row => row.id), [a.id]);
    assert.equal((await ok(owner, `workspaces/${a.id}`)).role, 'owner');
    for (const suffix of ['', '/members', '/invitations', '/execution-context']) assert.equal((await request(owner, `${b.path}${suffix}`)).status, 403);
    for (const [path, body] of [[`${b.path}/invitations`, { recipientEmail: owner.email, role: 'member' }], [`${b.path}/members/${b.owner.principalId}`, { version: 1, role: 'viewer' }], [`${b.path}/agents`, { name: 'Agent', role: 'viewer', custodianPrincipalId: b.owner.principalId }], [`${b.path}/agents/${b.owner.principalId}`, { version: 1, state: 'suspended' }], [`${b.path}/invitations/${randomUUID()}/revoke`, {}]]) assert.equal((await request(owner, path, body)).status, 403);
    assert.equal((await request(owner, `workspaces/${a.id}/members/${b.owner.principalId}`, { version: 1, role: 'viewer' })).status, 403);
    assert.equal((await request(owner, `workspaces/${a.id}/members/${owner.principalId}`, { version: 1, role: 'viewer' })).status, 403);
    assert.equal((await ok(b.owner, `${b.path}/members`)).total, 1);
  });

  await t.test('session/origin/JSON and server-derived actor deny forged and unsafe mutations', async () => {
    const f = await fixture();
    assert.equal((await request(null)).status, 401);
    for (const origin of ['', 'https://evil.example', `${identity.config.origin}.evil.example`]) assert.equal((await request(f.owner, 'workspaces', { name: 'Denied' }, randomUUID(), { origin })).status, 403);
    assert.equal((await request(f.owner, 'workspaces', { name: 'Denied' }, randomUUID(), { 'sec-fetch-site': 'cross-site' })).status, 403);
    assert.equal((await request(f.owner, 'workspaces', { name: 'Denied' }, randomUUID(), { 'content-type': 'text/plain' })).status, 400);
    for (const field of ['actorPrincipalId', 'subjectPrincipalId', 'mode', 'source', 'grantId']) {
      assert.equal((await request(f.owner, 'workspaces', { name: 'Denied', [field]: f.owner.principalId })).status, 400);
      assert.equal((await request(f.owner, f.path, undefined, undefined, { [`x-rielia-${field}`]: 'forged' })).status, 400);
    }
    assert.equal((await request(f.owner, `${f.path}?workspaceId=forged`)).status, 400);
    assert.equal((await request(f.owner, 'workspaces', { name: 'Denied' }, 'not-a-key')).status, 400);
    assert.equal((await request(f.owner, 'workspaces', { name: '' })).status, 400);
    for (const role of [['admin'], { value: 'admin' }, null, 1]) assert.equal((await request(f.owner, `${f.path}/invitations`, { recipientEmail: f.owner.email, role })).status, 400);
    assert.equal((await ok(f.owner, 'workspaces')).total, 1);
  });

  await t.test('invite hash-only, verified recipient, single-use concurrent acceptance, atomic receipt and terminal no-rejoin', async () => {
    const f = await fixture(); const recipient = await human(false); const wrong = await human();
    const key = randomUUID(); const issued = await ok(f.owner, `${f.path}/invitations`, { recipientEmail: recipient.email, role: 'viewer' }, key);
    const stored = await prisma.invitation.findUniqueOrThrow({ where: { id: issued.invitation.id } });
    assert.equal(stored.tokenHash, createHash('sha256').update(issued.token).digest('hex'));
    assert.ok(!JSON.stringify(stored).includes(issued.token));
    const receipts = await prisma.workspaceOperation.findMany({ where: { actorPrincipalId: f.owner.principalId } });
    assert.ok(!JSON.stringify(receipts).includes(issued.token));
    const replay = await request(f.owner, `${f.path}/invitations`, { recipientEmail: recipient.email, role: 'viewer' }, key);
    assert.equal(replay.status, 409); assert.equal(replay.data.code, 'invitation-link-unavailable');
    const visible = await ok(f.owner, `${f.path}/invitations`); assert.equal(visible.total, 1); assert.ok(!JSON.stringify(visible).includes('tokenHash')); assert.ok(!JSON.stringify(visible).includes(issued.token));
    assert.equal((await request(wrong, 'workspace-invitations/accept', { token: issued.token })).status, 403);
    assert.equal((await request(recipient, 'workspace-invitations/accept', { token: issued.token })).status, 403);
    await prisma.user.update({ where: { id: recipient.id }, data: { emailVerified: true } });
    const results = await Promise.all([request(recipient, 'workspace-invitations/accept', { token: issued.token }), request(recipient, 'workspace-invitations/accept', { token: issued.token })]);
    assert.deepEqual(results.map(row => row.status).sort(), [201, 409]);
    assert.equal(await prisma.membership.count({ where: { workspaceId: f.workspace.id, principalId: recipient.principalId } }), 1);
    const joined = await member(f, recipient); assert.equal(joined.role, 'viewer');
    await ok(f.owner, `${f.path}/members/${recipient.principalId}`, { version: joined.version, state: 'revoked' });
    assert.equal((await request(recipient, f.path)).status, 403);
    assert.equal((await request(f.owner, `${f.path}/invitations`, { recipientEmail: recipient.email, role: 'member' })).status, 409);
    assert.equal((await request(f.owner, `${f.path}/members/${recipient.principalId}`, { version: joined.version + 1, state: 'active' })).status, 409);
  });

  await t.test('expired/revoked/wrong-workspace invitation, current issuer rights and role ceilings', async () => {
    const f = await fixture(); const b = await fixture(); const viewer = await join(f, await human(), 'viewer');
    const admin = await join(f, await human(), 'admin'); const recipient = await human();
    for (const user of [viewer]) {
      assert.equal((await request(user, `${f.path}/invitations`)).status, 403);
      assert.equal((await request(user, `${f.path}/invitations`, { recipientEmail: recipient.email, role: 'member' })).status, 403);
      assert.equal((await request(user, `${f.path}/members/${admin.principalId}`, { version: 1, role: 'viewer' })).status, 403);
    }
    assert.equal((await request(admin, `${f.path}/invitations`, { recipientEmail: recipient.email, role: 'owner' })).status, 400);
    const issued = await invite(f, recipient, 'member', admin);
    assert.equal((await request(b.owner, `${b.path}/invitations/${issued.invitation.id}/revoke`, {})).status, 403);
    await ok(f.owner, `${f.path}/members/${admin.principalId}`, { version: 1, role: 'member' });
    assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: issued.invitation.id } })).revokedAt instanceof Date, true);
    assert.equal((await request(recipient, 'workspace-invitations/accept', { token: issued.token })).status, 409);
    const replacement = await invite(f, recipient);
    await ok(f.owner, `${f.path}/invitations/${replacement.invitation.id}/revoke`, {});
    assert.equal((await request(recipient, 'workspace-invitations/accept', { token: replacement.token })).status, 409);
    // Expiry is immutable in ordinary DML; create an already old issued fixture.
    const token = 'x'.repeat(43);
    await pool.query(`INSERT INTO invitation(id,"workspaceId","issuerPrincipalId","recipientEmail",role,"tokenHash","createdAt","expiresAt") VALUES ($1,$2,$3,$4,'viewer',$5,now()-interval '2 days',now()-interval '1 day')`, [randomUUID(), f.workspace.id, f.owner.principalId, recipient.email, createHash('sha256').update(token).digest('hex')]);
    assert.equal((await request(recipient, 'workspace-invitations/accept', { token })).status, 409);
    const fresh = await invite(f, recipient); assert.equal(fresh.invitation.state, 'pending');
    assert.equal((await ok(viewer, `${f.path}/members`)).total, 3);
  });

  await t.test('version conflict, scoped agents/custodian transfer, terminal grant revocation and rollback', async () => {
    const f = await fixture(); const b = await fixture(); const admin = await join(f, await human(), 'admin');
    const context = (await principals.webContext({ cookie: admin.cookie }, f.workspace.id)).context;
    const agent = await ok(admin, `${f.path}/agents`, { name: 'Builder', role: 'member', custodianPrincipalId: admin.principalId });
    assert.equal(agent.kind, 'agent'); assert.equal(agent.version, 1);
    assert.equal((await request(f.owner, `${f.path}/members/${admin.principalId}`, { version: 1, role: 'member' })).status, 403);
    assert.equal((await member(f, admin)).version, 1);
    assert.equal((await request(f.owner, `${f.path}/agents/${agent.principalId}`, { version: 1, custodianPrincipalId: b.owner.principalId })).status, 403);
    const managed = await ok(f.owner, `${f.path}/agents/${agent.principalId}`, { version: 1, custodianPrincipalId: f.owner.principalId });
    assert.equal(managed.version, 2);
    assert.equal((await request(f.owner, `${f.path}/agents/${agent.principalId}`, { version: 1, state: 'suspended' })).status, 409);
    assert.equal((await request(f.owner, `${f.path}/members/${agent.principalId}`, { version: 2, role: 'admin' })).status, 403);
    const grant = await principals.recordInternalGrant(context, { subjectPrincipalId: admin.principalId, mode: 'delegated', allowedOperations: ['read', 'write'], expiresAt: new Date(Date.now() + 3600000) });
    const verified = await principals.internalGrantContext(grant, f.workspace.id);
    await ok(f.owner, `${f.path}/members/${admin.principalId}`, { version: 1, role: 'viewer' });
    await assert.rejects(principals.creationAttribution(verified, {}), error => error.getStatus() === 401);
    await ok(f.owner, `${f.path}/members/${admin.principalId}`, { version: 2, state: 'revoked' });
    assert.ok((await prisma.executionGrant.findUniqueOrThrow({ where: { id: grant } })).revokedAt);
    assert.equal((await request(admin, `${f.path}/members`)).status, 403);
    const before = await prisma.workspace.count(); const receipts = await prisma.workspaceOperation.count();
    // A deferred failure after the workspace and receipt insert must roll back both.
    await pool.query(`CREATE FUNCTION fail_test_workspace() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN IF NEW.name = ''Rollback'' THEN RAISE EXCEPTION ''test rollback'' USING ERRCODE = ''23514''; END IF; RETURN NULL; END'; CREATE CONSTRAINT TRIGGER fail_test_workspace AFTER INSERT ON workspace DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fail_test_workspace()`);
    try { assert.equal((await request(f.owner, 'workspaces', { name: 'Rollback' })).status, 400); }
    finally { await pool.query('DROP TRIGGER fail_test_workspace ON workspace; DROP FUNCTION fail_test_workspace()'); }
    assert.equal(await prisma.workspace.count(), before); assert.equal(await prisma.workspaceOperation.count(), receipts);
  });

  await t.test('session removal and issuer removal serialize before invitation consumption; no orphan membership', async () => {
    for (const revoke of ['session', 'issuer']) {
      const f = await fixture(); const recipient = await human(); const admin = await join(f, await human(), 'admin');
      // Keep the library lookup read-only so this test observes the service's
      // post-verification fence, rather than a session-renewal race.
      await prisma.session.update({ where: { id: recipient.sessionId }, data: { expiresAt: new Date(Date.now() + 7 * 86400000) } });
      const created = await invite(f, recipient, 'member', admin); const connection = await pool.connect();
      let pending;
      try {
        await connection.query('BEGIN');
        if (revoke === 'session') await connection.query('DELETE FROM session WHERE id=$1', [recipient.sessionId]);
        else await connection.query(`UPDATE membership SET state='revoked' WHERE "workspaceId"=$1 AND "principalId"=$2`, [f.workspace.id, admin.principalId]);
        pending = service.accept({ cookie: recipient.cookie }, randomUUID(), { token: created.token }).then(() => null, error => error);
        let blocked = false;
        // Better Auth can first renew this fixture's short session. That UPDATE
        // also takes the policy fence, before the service's explicit fence.
        for (let n = 0; n < 100; n++) { const rows = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND datname=current_database() AND pid<>pg_backend_pid()`); if (rows.rows[0].n) { blocked = true; break; } await delay(10); }
        assert.ok(blocked); await connection.query('COMMIT');
        assert.equal((await pending).getStatus(), revoke === 'session' ? 401 : 409);
        assert.equal(await prisma.membership.count({ where: { workspaceId: f.workspace.id, principalId: recipient.principalId } }), 0);
        assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: created.invitation.id } })).consumedAt, null);
      } finally { await connection.query('ROLLBACK'); await pending; connection.release(); }
    }
  });

  await t.test('successful accept retry revalidates membership and expired/revoked sessions fail HTTP', async () => {
    const f = await fixture(); const recipient = await human(); const created = await invite(f, recipient); const key = randomUUID();
    await ok(recipient, 'workspace-invitations/accept', { token: created.token }, key);
    await ok(recipient, 'workspace-invitations/accept', { token: created.token }, key);
    await ok(f.owner, `${f.path}/members/${recipient.principalId}`, { version: 1, state: 'revoked' });
    assert.equal((await request(recipient, 'workspace-invitations/accept', { token: created.token }, key)).status, 403);
    await prisma.session.update({ where: { id: recipient.sessionId }, data: { expiresAt: new Date(0) } });
    assert.equal((await request(recipient)).status, 401);
    await prisma.session.delete({ where: { id: f.owner.sessionId } });
    assert.equal((await request(f.owner, 'workspaces', { name: 'Denied' })).status, 401);
  });

  await t.test('invitation consumption and membership roll back with failed receipt; same key then recovers', async () => {
    const f = await fixture(); const recipient = await human(); const issued = await invite(f, recipient); const key = randomUUID();
    await pool.query(`CREATE FUNCTION fail_test_receipt() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''test rollback'' USING ERRCODE = ''23514''; END'; CREATE TRIGGER fail_test_receipt BEFORE INSERT ON workspace_operation FOR EACH ROW EXECUTE FUNCTION fail_test_receipt()`);
    try { assert.equal((await request(recipient, 'workspace-invitations/accept', { token: issued.token }, key)).status, 400); }
    finally { await pool.query('DROP TRIGGER fail_test_receipt ON workspace_operation; DROP FUNCTION fail_test_receipt()'); }
    assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: issued.invitation.id } })).consumedAt, null);
    assert.equal(await prisma.membership.count({ where: { workspaceId: f.workspace.id, principalId: recipient.principalId } }), 0);
    assert.equal(await prisma.workspaceOperation.count({ where: { actorPrincipalId: recipient.principalId, key } }), 0);
    await ok(recipient, 'workspace-invitations/accept', { token: issued.token }, key);
    await ok(recipient, 'workspace-invitations/accept', { token: issued.token }, key);
    assert.equal(await prisma.membership.count({ where: { workspaceId: f.workspace.id, principalId: recipient.principalId } }), 1);
  });
});
