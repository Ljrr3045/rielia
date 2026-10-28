import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { storageConstraintException } from '../dist/principals/principal-errors.js';

test('T35.0 PostgreSQL principal, policy and verified execution foundations', async t => {
  const app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  const identity = app.get(IdentityService);
  const service = app.get(PrincipalService);
  const prisma = identity.runtime.prisma;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 6 });
  t.after(async () => { await pool.end(); await app.close(); });
  async function human() {
    const id = randomUUID();
    await prisma.user.create({ data: { id, name: 'Human Fixture', email: `${id}@example.test`, emailVerified: true } });
    const principal = await prisma.principal.findUniqueOrThrow({ where: { userId: id } });
    const token = randomUUID();
    const session = await prisma.session.create({ data: { id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 3600000) } });
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}`;
    return { id, principalId: principal.id, sessionId: session.id, cookie };
  }
  async function fixture() {
    const owner = await human();
    const workspaceId = await service.bootstrapWorkspaceForHuman(owner.id, 'Workspace');
    const context = (await service.webContext({ cookie: owner.cookie }, workspaceId)).context;
    return { owner, workspaceId, context };
  }
  async function badSql(sql, values = [], code = '23514') {
    await assert.rejects(pool.query(sql, values), error => error.code === code);
  }
  const status = expected => error => error.getStatus?.() === expected;
  const grantInput = (subjectPrincipalId, mode = 'autonomous', allowedOperations = ['read', 'write']) => ({ subjectPrincipalId, mode, allowedOperations, expiresAt: new Date(Date.now() + 3600000) });

  await t.test('legacy user backfill, reserved system and concurrent human mapping are real and unique', async () => {
    const legacy = await prisma.principal.findUniqueOrThrow({ where: { userId: 'legacy-user' } });
    assert.equal(legacy.kind, 'human');
    assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: 'rielia-system' } })).kind, 'system');
    const id = randomUUID();
    await Promise.all(Array.from({ length: 8 }, () => pool.query(`INSERT INTO "user"(id,name,email,"updatedAt") VALUES ($1,'Concurrent',$2,now()) ON CONFLICT DO NOTHING`, [id, `${id}@example.test`])));
    const mapped = await prisma.principal.findMany({ where: { userId: id } });
    assert.equal(mapped.length, 1);
    await badSql(`INSERT INTO principal(kind,"displayName","userId") VALUES ('human','Duplicate',$1)`, [id], '23505');
    await badSql(`INSERT INTO principal(kind,"displayName") VALUES ('human','Missing user')`);
    await badSql(`INSERT INTO principal(kind,"displayName","userId") VALUES ('agent','Fake social agent',$1)`, [id]);
    await badSql(`INSERT INTO principal(kind,"displayName") VALUES ('system','Impersonated system')`);
    await badSql(`UPDATE principal SET kind = 'agent' WHERE id = $1`, [mapped[0].id]);
    await badSql(`DELETE FROM principal WHERE id = $1`, [mapped[0].id]);
    await badSql(`DELETE FROM "user" WHERE id = $1`, [id], '23001');
    await badSql(`UPDATE principal SET "userId" = 'legacy-user' WHERE id = $1`, [mapped[0].id]);
    assert.equal((await prisma.principal.findUniqueOrThrow({ where: { userId: id } })).id, mapped[0].id);
  });

  await t.test('actual HTTP boundary verifies cookies, selects membership and rejects unsigned identity', async () => {
    const a = await fixture();
    const b = await fixture();
    const path = `/api/v1/workspaces/${a.workspaceId}/execution-context`;
    for (const headers of [{}, { cookie: '__Secure-better-auth.session_token=unsigned' }]) {
      const response = await fetch(url + path, { headers });
      assert.equal(response.status, 401); assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    const okay = await fetch(url + path, { headers: { cookie: a.owner.cookie } });
    assert.equal(okay.status, 200); assert.equal(okay.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await okay.json(), { actorPrincipalId: a.owner.principalId, principalKind: 'human', workspaceId: a.workspaceId, executionMode: 'human', source: 'web', role: 'owner', grantId: null });
    const denied = await fetch(url + path, { headers: { cookie: b.owner.cookie } });
    assert.equal(denied.status, 403); assert.equal(denied.headers.get('cache-control'), 'no-store');
    for (const key of ['authorPrincipalId', 'actorPrincipalId', 'subjectPrincipalId', 'executionMode', 'source', 'grantId']) {
      const response = await fetch(url + path + `?${key}=forged`, { headers: { cookie: a.owner.cookie } });
      assert.equal(response.status, 400);
    }
    for (const key of ['x-rielia-actor-principal-id', 'x-rielia-source', 'x-rielia-grant-id', 'x-execution-mode']) {
      assert.equal((await fetch(url + path, { headers: { cookie: a.owner.cookie, [key]: 'forged' } })).status, 400);
    }
    const forgedBody = JSON.stringify({ authorPrincipalId: b.owner.principalId, executionMode: 'autonomous' });
    const rawStatus = await new Promise((resolve, reject) => {
      const request = httpRequest(url + path, { method: 'GET', headers: { cookie: a.owner.cookie, 'content-type': 'application/json', 'content-length': String(forgedBody.length) } }, response => {
        response.resume(); response.on('end', () => resolve(response.statusCode));
      });
      request.on('error', reject); request.end(forgedBody);
    });
    assert.equal(rawStatus, 400);
    assert.equal((await fetch(url + '/api/v1/principals', { method: 'POST', headers: { origin: process.env.BETTER_AUTH_URL } })).status, 404);
    await assert.rejects(service.creationAttribution({ ...a.context }, {}), status(401));
    await assert.rejects(service.internalGrantContext('unsigned-request-grant', a.workspaceId), status(401));
    assert.equal((await fetch(url + '/api/v1/identity/session', { headers: { cookie: a.owner.cookie } })).status, 200);
  });

  await t.test('database rejects owner loss, cross-workspace agents, elevated agents and orphan active agents', async () => {
    const a = await fixture(); const b = await fixture();
    const admin = await human();
    await service.addHumanMember(a.context, admin.id, 'admin');
    const agent = await service.registerAgent(a.context, { name: 'Builder', role: 'member', custodianPrincipalId: admin.principalId });
    assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: agent } })).userId, null);
    await badSql(`UPDATE principal SET state='suspended' WHERE id=$1`, [a.owner.principalId]);
    await badSql(`UPDATE membership SET state='revoked' WHERE "principalId"=$1 AND "workspaceId"=$2`, [a.owner.principalId, a.workspaceId]);
    await badSql(`UPDATE workspace SET "ownerPrincipalId"=$1 WHERE id=$2`, [agent, a.workspaceId]);
    await badSql(`INSERT INTO membership("workspaceId","principalId",role) VALUES ($1,$2,'member')`, [b.workspaceId, agent]);
    for (const role of ['owner', 'admin']) await badSql(`UPDATE membership SET role=$1 WHERE "principalId"=$2`, [role, agent]);
    await badSql(`UPDATE principal SET "workspaceId"=$1 WHERE id=$2`, [b.workspaceId, agent]);
    await badSql(`UPDATE principal SET "custodianPrincipalId"=$1 WHERE id=$2`, [b.owner.principalId, agent]);
    await badSql(`INSERT INTO principal(kind,"displayName","workspaceId","custodianPrincipalId") VALUES ('agent','Orphan',$1,$2)`, [a.workspaceId, admin.principalId]);
    await badSql(`INSERT INTO membership("workspaceId","principalId",role) VALUES ($1,'rielia-system','member')`, [a.workspaceId]);
    await badSql(`UPDATE principal SET state='suspended' WHERE id=$1`, [admin.principalId]);
    await badSql(`UPDATE membership SET role='member' WHERE "principalId"=$1`, [admin.principalId]);
    await badSql(`UPDATE membership SET state='revoked' WHERE "principalId"=$1`, [admin.principalId]);
    await assert.rejects(service.updateMember(a.context, admin.principalId, { role: 'member' }), status(403));
    await service.manageAgent(a.context, agent, { custodianPrincipalId: a.owner.principalId });
    await service.updateMember(a.context, admin.principalId, { state: 'revoked' });
    assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: agent } })).id, agent);
    await service.manageAgent(a.context, agent, { state: 'suspended' });
    // Explicit suspension permits departing custodians without rewriting identity.
    await pool.query(`UPDATE principal SET "custodianPrincipalId"=$1 WHERE id=$2`, [admin.principalId, agent]);
    await assert.rejects(service.manageAgent(a.context, agent, { state: 'active' }), status(403));
  });

  await t.test('delegated subject, autonomous own membership, immutable grant limits and issuer isolation', async () => {
    const a = await fixture(); const b = await fixture();
    const agent = await service.registerAgent(a.context, { name: 'Viewer Agent', role: 'viewer', custodianPrincipalId: a.owner.principalId });
    const delegatedId = await service.recordInternalGrant(a.context, grantInput(a.owner.principalId, 'delegated'));
    await assert.rejects(service.recordInternalGrant(a.context, grantInput(agent)), status(403));
    const autonomousId = await service.recordInternalGrant(a.context, grantInput(agent, 'autonomous', ['read']));
    const delegated = await service.internalGrantContext(delegatedId, a.workspaceId);
    const autonomous = await service.internalGrantContext(autonomousId, a.workspaceId);
    assert.equal(delegated.actorPrincipalId, a.owner.principalId);
    assert.equal(delegated.executionMode, 'delegated');
    assert.equal(autonomous.actorPrincipalId, agent); assert.equal(autonomous.role, 'viewer');
    await assert.rejects(service.registerAgent(delegated, { name: 'Denied', role: 'member', custodianPrincipalId: a.owner.principalId }), status(403));
    await assert.rejects(service.creationAttribution(autonomous, {}), status(403));
    await assert.rejects(service.addHumanMember(autonomous, b.owner.id, 'member'), status(403));
    await assert.rejects(service.internalGrantContext(autonomousId, b.workspaceId), status(401));
    await assert.rejects(service.recordInternalGrant(a.context, grantInput(b.owner.principalId, 'delegated')), status(403));
    const sql = `INSERT INTO execution_grant(id,"workspaceId","subjectPrincipalId","authorizedByPrincipalId",mode,"allowedOperations","expiresAt") VALUES ($1,$2,$3,$4,$5,ARRAY['read'],now()+interval '1 hour')`;
    const otherHuman = await human();
    await service.addHumanMember(a.context, otherHuman.id, 'member');
    await badSql(sql, [randomUUID(), a.workspaceId, otherHuman.principalId, a.owner.principalId, 'delegated']);
    const viewer = await human();
    await service.addHumanMember(a.context, viewer.id, 'viewer');
    const viewerContext = (await service.webContext({ cookie: viewer.cookie }, a.workspaceId)).context;
    await assert.rejects(service.recordInternalGrant(viewerContext, grantInput(viewer.principalId, 'delegated')), status(403));
    const viewerReadId = await service.recordInternalGrant(viewerContext, grantInput(viewer.principalId, 'delegated', ['read']));
    const otherContext = (await service.webContext({ cookie: otherHuman.cookie }, a.workspaceId)).context;
    const otherReadId = await service.recordInternalGrant(otherContext, grantInput(otherHuman.principalId, 'delegated', ['read']));
    await assert.rejects(service.revokeGrant(viewerContext, otherReadId), status(403));
    await assert.rejects(service.revokeGrant(delegated, delegatedId), status(403));
    await service.updateMember(a.context, viewer.principalId, { role: 'member' });
    await assert.rejects(service.creationAttribution(await service.internalGrantContext(viewerReadId, a.workspaceId), {}), status(403));
    await service.revokeGrant(viewerContext, viewerReadId);
    await assert.rejects(service.internalGrantContext(viewerReadId, a.workspaceId), status(401));
    await badSql(sql, [randomUUID(), a.workspaceId, b.owner.principalId, a.owner.principalId, 'delegated']);
    await badSql(sql, [randomUUID(), b.workspaceId, agent, b.owner.principalId, 'autonomous']);
    await badSql(sql, [randomUUID(), a.workspaceId, agent, agent, 'autonomous']);
    await badSql(`INSERT INTO execution_grant(id,"workspaceId","subjectPrincipalId","authorizedByPrincipalId",mode,"allowedOperations","expiresAt") VALUES ($1,$2,$3,$4,'autonomous',ARRAY['read','write'],now()+interval '1 hour')`, [randomUUID(), a.workspaceId, agent, a.owner.principalId]);
    await badSql(`UPDATE execution_grant SET mode='delegated' WHERE id=$1`, [autonomousId]);
    await badSql(`UPDATE execution_grant SET "subjectPrincipalId"=$1 WHERE id=$2`, [a.owner.principalId, autonomousId]);
    await badSql(`UPDATE execution_grant SET "allowedOperations"=ARRAY['read','write'] WHERE id=$1`, [await service.recordInternalGrant(a.context, grantInput(agent, 'autonomous', ['read']))]);
    await service.updateMember(a.context, agent, { role: 'member' });
    await assert.rejects(service.creationAttribution(autonomous, {}), status(403)); // promotion cannot expand old grant
    const writeId = await service.recordInternalGrant(a.context, grantInput(agent));
    const writer = await service.internalGrantContext(writeId, a.workspaceId);
    const attributed = await service.creationAttribution(writer, {});
    assert.equal(attributed.createdByPrincipalId, agent); assert.equal(attributed.assigneePrincipalId, null);
    assert.equal(attributed.provenance.role, 'member'); // current, rather than cached
  });

  await t.test('authorship and assignee stay independent; stale contexts fail after each revocation source', async () => {
    const a = await fixture(); const b = await fixture();
    const agent = await service.registerAgent(a.context, { name: 'Builder', role: 'member', custodianPrincipalId: a.owner.principalId });
    const grantId = await service.recordInternalGrant(a.context, grantInput(agent));
    const context = await service.internalGrantContext(grantId, a.workspaceId);
    const original = await service.creationAttribution(a.context, { assigneePrincipalId: agent });
    const unassigned = await service.creationAttribution(a.context, {});
    assert.equal(original.createdByPrincipalId, a.owner.principalId); assert.equal(original.authorPrincipalId, a.owner.principalId); assert.equal(original.assigneePrincipalId, agent);
    assert.equal(unassigned.assigneePrincipalId, null);
    assert.ok(Object.isFrozen(original)); assert.ok(Object.isFrozen(original.provenance));
    for (const key of ['createdByPrincipalId', 'authorPrincipalId', 'actorPrincipalId', 'subjectPrincipalId', 'executionMode', 'mode', 'source', 'grantId']) {
      await assert.rejects(service.creationAttribution(a.context, { [key]: b.owner.principalId }), status(400));
    }
    await assert.rejects(service.creationAttribution(a.context, { assigneePrincipalId: b.owner.principalId }), status(403));
    await assert.rejects(service.creationAttribution(a.context, { assigneePrincipalId: 'rielia-system' }), status(403));
    await service.manageAgent(a.context, agent, { state: 'suspended' });
    await assert.rejects(service.creationAttribution(context, {}), status(403));
    assert.equal(original.createdByPrincipalId, a.owner.principalId); assert.equal(original.assigneePrincipalId, agent);
    await service.manageAgent(a.context, agent, { state: 'active' });
    await service.updateMember(a.context, agent, { state: 'suspended' });
    await assert.rejects(service.creationAttribution(context, {}), status(403));
    await service.updateMember(a.context, agent, { state: 'active' });
    await service.revokeGrant(a.context, grantId); await service.revokeGrant(a.context, grantId);
    await assert.rejects(service.creationAttribution(context, {}), status(401));
    await badSql(`UPDATE execution_grant SET "revokedAt"=NULL WHERE id=$1`, [grantId]);
    const expired = await service.recordInternalGrant(a.context, { ...grantInput(agent), expiresAt: new Date(Date.now() + 100) });
    await delay(120); await assert.rejects(service.internalGrantContext(expired, a.workspaceId), status(401));
    await prisma.session.delete({ where: { id: a.owner.sessionId } });
    await assert.rejects(service.creationAttribution(a.context, {}), status(401));
    await assert.rejects(service.webContext({ cookie: a.owner.cookie }, a.workspaceId), status(401));
    assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: agent } })).id, agent);
  });

  await t.test('human membership/principal/session expiry and agent revocation deny old contexts without reattribution', async () => {
    const a = await fixture(); const member = await human();
    await service.addHumanMember(a.context, member.id, 'member');
    const context = (await service.webContext({ cookie: member.cookie }, a.workspaceId)).context;
    const historical = await service.creationAttribution(context, {});
    await service.updateMember(a.context, member.principalId, { state: 'suspended' });
    await assert.rejects(service.creationAttribution(context, {}), status(403));
    await service.updateMember(a.context, member.principalId, { state: 'active' });
    await pool.query(`UPDATE principal SET state='suspended' WHERE id=$1`, [member.principalId]);
    await assert.rejects(service.creationAttribution(context, {}), status(403));
    await pool.query(`UPDATE principal SET state='active' WHERE id=$1`, [member.principalId]);
    await prisma.session.update({ where: { id: member.sessionId }, data: { expiresAt: new Date(0) } });
    await assert.rejects(service.creationAttribution(context, {}), status(401));
    await service.updateMember(a.context, member.principalId, { state: 'revoked' });
    await badSql(`UPDATE membership SET state='active' WHERE "workspaceId"=$1 AND "principalId"=$2`, [a.workspaceId, member.principalId]);
    assert.equal(historical.createdByPrincipalId, member.principalId);
    const agent = await service.registerAgent(a.context, { name: 'Revoked Agent', role: 'member', custodianPrincipalId: a.owner.principalId });
    const grantId = await service.recordInternalGrant(a.context, grantInput(agent));
    const autonomous = await service.internalGrantContext(grantId, a.workspaceId);
    await service.manageAgent(a.context, agent, { state: 'revoked' });
    await assert.rejects(service.creationAttribution(autonomous, {}), status(401));
    await badSql(`UPDATE principal SET state='active' WHERE id=$1`, [agent]);
    assert.equal((await prisma.executionGrant.findUniqueOrThrow({ where: { id: grantId } })).subjectPrincipalId, agent);
  });

  await t.test('autonomous issuer demotion cannot lend permissions and does not replace its agent subject', async () => {
    const a = await fixture(); const admin = await human();
    await service.addHumanMember(a.context, admin.id, 'admin');
    const administrator = (await service.webContext({ cookie: admin.cookie }, a.workspaceId)).context;
    const agent = await service.registerAgent(administrator, { name: 'Independent Builder', role: 'member', custodianPrincipalId: a.owner.principalId });
    const grantId = await service.recordInternalGrant(administrator, grantInput(agent));
    const context = await service.internalGrantContext(grantId, a.workspaceId);
    await service.updateMember(a.context, admin.principalId, { state: 'revoked' });
    const attribution = await service.creationAttribution(context, {});
    assert.equal(attribution.createdByPrincipalId, agent);
    await assert.rejects(service.registerAgent(administrator, { name: 'Denied', role: 'member', custodianPrincipalId: a.owner.principalId }), status(403));
  });

  await t.test('permanent database constraints return sanitized 4xx and outages remain 503', async () => {
    const a = await fixture(); const member = await human();
    await service.addHumanMember(a.context, member.id, 'member');
    await assert.rejects(service.addHumanMember(a.context, member.id, 'member'), status(409));
    await assert.rejects(service.bootstrapWorkspaceForHuman(a.owner.id, 'Duplicate', a.workspaceId), status(409));
    await assert.rejects(service.bootstrapWorkspaceForHuman(a.owner.id, ''), error => error.getStatus?.() === 400 && error.message === 'Principal data violates a storage constraint.');
    await assert.rejects(service.registerAgent(a.context, { name: 'x'.repeat(201), role: 'member', custodianPrincipalId: a.owner.principalId }), status(400));
    await service.updateMember(a.context, member.principalId, { state: 'revoked' });
    await assert.rejects(service.updateMember(a.context, member.principalId, { state: 'active' }), status(409));
    for (const operation of [
      () => prisma.membership.create({ data: { workspaceId: a.workspaceId, principalId: 'missing-principal', role: 'member' } }),
      () => pool.query(`INSERT INTO membership("workspaceId","principalId",role) VALUES ($1,'missing-principal','member')`, [a.workspaceId]),
      () => pool.query(`UPDATE principal SET kind='agent' WHERE id=$1`, [a.owner.principalId]),
      () => pool.query(`DELETE FROM "user" WHERE id=$1`, [a.owner.id]),
    ]) {
      await assert.rejects(operation(), error => {
        const translated = storageConstraintException(error);
        assert.deepEqual(translated?.getResponse(), { message: 'Principal data violates a storage constraint.', error: 'Bad Request', statusCode: 400 });
        return true;
      });
    }
    await pool.query('ALTER TABLE principal_policy_fence RENAME TO test_unavailable_fence');
    try {
      await assert.rejects(service.bootstrapWorkspaceForHuman(a.owner.id, 'Unavailable'), status(503));
      const response = await fetch(`${url}/api/v1/workspaces/${a.workspaceId}/execution-context`, { headers: { cookie: a.owner.cookie } });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { message: 'Principal operation is unavailable.', error: 'Service Unavailable', statusCode: 503 });
    } finally { await pool.query('ALTER TABLE test_unavailable_fence RENAME TO principal_policy_fence'); }
  });

  await t.test('context resolution shares a read fence while mutations still wait for exclusive authorization', async () => {
    const a = await fixture(); const connection = await pool.connect();
    let read; let mutation;
    try {
      await connection.query('BEGIN');
      await connection.query('SELECT singleton FROM principal_policy_fence WHERE singleton FOR SHARE');
      let resolved = false;
      read = service.webContext({ cookie: a.owner.cookie }, a.workspaceId).then(result => { resolved = true; return result; });
      for (let n = 0; n < 100 && !resolved; n++) {
        const waiting = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'UPDATE principal_policy_fence%'`);
        if (waiting.rows[0].n > 0) break;
        await delay(10);
      }
      assert.ok(resolved, 'context read must finish while another shared reader holds the fence');
      assert.equal((await read).context.actorPrincipalId, a.owner.principalId);
      mutation = service.registerAgent(a.context, { name: 'Waits for shared reader', role: 'member', custodianPrincipalId: a.owner.principalId });
      let blocked = false;
      for (let n = 0; n < 100; n++) {
        const waiting = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'UPDATE principal_policy_fence%'`);
        if (waiting.rows[0].n > 0) { blocked = true; break; }
        await delay(10);
      }
      assert.ok(blocked, 'policy mutation must still acquire an exclusive fence');
      await connection.query('COMMIT');
      assert.ok(await mutation);
    } finally { await connection.query('ROLLBACK'); await read; await mutation; connection.release(); }
  });

  await t.test('direct SQL competing custodian demotion and agent activation cannot commit write skew', async () => {
    for (const isolation of ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']) {
      const a = await fixture(); const admin = await human();
      await service.addHumanMember(a.context, admin.id, 'admin');
      const agent = await service.registerAgent(a.context, { name: 'Competing Agent', role: 'member', custodianPrincipalId: admin.principalId });
      await service.manageAgent(a.context, agent, { state: 'suspended' });
      const first = await pool.connect(); const second = await pool.connect();
      const application = `t35-${randomUUID()}`;
      try {
        await first.query('BEGIN');
        await second.query(`BEGIN ISOLATION LEVEL ${isolation}`);
        await second.query(`SELECT set_config('application_name',$1,false)`, [application]);
        await second.query('SELECT count(*) FROM principal'); // pin snapshot
        await first.query(`UPDATE membership SET role='member' WHERE "workspaceId"=$1 AND "principalId"=$2`, [a.workspaceId, admin.principalId]);
        const competing = second.query(`UPDATE principal SET state='active' WHERE id=$1`, [agent]);
        // Attach immediately so a fast failure cannot become an unhandled rejection.
        const observed = competing.then(() => null, error => error);
        let blocked = false;
        for (let n = 0; n < 100; n++) {
          const result = await pool.query(`SELECT wait_event_type FROM pg_stat_activity WHERE application_name=$1`, [application]);
          if (result.rows[0]?.wait_event_type === 'Lock') { blocked = true; break; }
          await delay(10);
        }
        assert.ok(blocked, 'second SQL connection must wait on policy fence');
        await first.query('COMMIT');
        const error = await observed;
        if (isolation === 'READ COMMITTED') {
          assert.equal(error, null);
          await assert.rejects(second.query('COMMIT'), error => error.code === '23514');
        } else assert.equal(error?.code, '40001');
        await second.query('ROLLBACK');
        assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: agent } })).state, 'suspended');
        // Explicit management transfer + retry recovers without changing subject.
        await service.manageAgent(a.context, agent, { custodianPrincipalId: a.owner.principalId, state: 'active' });
        assert.equal((await prisma.principal.findUniqueOrThrow({ where: { id: agent } })).state, 'active');
      } finally { await first.query('ROLLBACK'); await second.query('ROLLBACK'); first.release(); second.release(); }
    }
  });

  await t.test('policy mutation waits for in-flight session revocation, rechecks it and performs no write', async () => {
    const a = await fixture(); const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      await connection.query('DELETE FROM session WHERE id=$1', [a.owner.sessionId]);
      const name = `denied-${randomUUID()}`;
      const mutation = service.registerAgent(a.context, { name, role: 'member', custodianPrincipalId: a.owner.principalId });
      const observed = mutation.then(() => null, error => error);
      let blocked = false;
      for (let n = 0; n < 100; n++) {
        const result = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'UPDATE principal_policy_fence%'`);
        if (result.rows[0].n > 0) { blocked = true; break; }
        await delay(10);
      }
      assert.ok(blocked, 'service authorization must wait for session revocation transaction');
      await connection.query('COMMIT');
      assert.equal((await observed)?.getStatus(), 401);
      assert.equal(await prisma.principal.count({ where: { displayName: name } }), 0);
      await assert.rejects(service.creationAttribution(a.context, {}), status(401));
    } finally { await connection.query('ROLLBACK'); connection.release(); }
  });
});
