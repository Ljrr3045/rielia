import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { ProjectTaskService } from '../dist/projects/project-task.service.js';

test('T06 real PostgreSQL and HTTP project/task vertical', async t => {
  async function start() { const instance = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false }); configureApplication(instance); await instance.listen(0, '127.0.0.1'); return instance; }
  let app = await start(); let url = await app.getUrl(); let identity = app.get(IdentityService); let prisma = identity.runtime.prisma;
  let principals = app.get(PrincipalService); let service = app.get(ProjectTaskService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  t.after(async () => { await pool.end(); await app.close(); });
  async function human() {
    const id = randomUUID(); await prisma.user.create({ data: { id, name: 'Domain Human', email: `${id}@example.test`, emailVerified: true } });
    const principal = await prisma.principal.findUniqueOrThrow({ where: { userId: id } }); const token = randomUUID(); const sessionId = randomUUID();
    await prisma.session.create({ data: { id: sessionId, token, userId: id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}`;
    return { id, principalId: principal.id, email: `${id}@example.test`, sessionId, cookie };
  }
  async function request(user, path, body, key = randomUUID(), extra = {}) {
    const response = await fetch(`${url}/api/v1/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(user ? { cookie: user.cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json', origin: identity.config.origin, 'idempotency-key': key }), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    if (path.includes('/projects')) assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
    return { status: response.status, data: await response.json() };
  }
  async function ok(user, path, body, key) { const response = await request(user, path, body, key); assert.ok(response.status >= 200 && response.status < 300, JSON.stringify(response.data)); return response.data; }
  async function fixture() { const owner = await human(); const workspace = await ok(owner, 'workspaces', { name: 'Domain tenant' }); const root = `workspaces/${workspace.id}`; const path = `${root}/projects`; const project = await ok(owner, path, { key: 'RIE', name: 'Real project' }); return { owner, workspace, root, path, project, p: `${path}/${project.id}`, tasks: `${path}/${project.id}/tasks` }; }
  async function join(f, role = 'member') { const user = await human(); const issued = await ok(f.owner, `${f.root}/invitations`, { recipientEmail: user.email, role }); await ok(user, 'workspace-invitations/accept', { token: issued.token }); return user; }
  const counts = async () => Promise.all([prisma.project.count(), prisma.task.count(), prisma.activityEvent.count(), prisma.outboxEvent.count(), prisma.projectTaskOperation.count()]);
  const status = n => error => error.getStatus() === n;

  await t.test('minimal capture, real paging/details, stable key/URL and immutable creator separate from unassigned task', async () => {
    const f = await fixture(); const member = await join(f); const task = await ok(member, f.tasks, { title: 'Capture' });
    assert.equal(task.key, 'RIE-1'); assert.equal(task.title, 'Capture'); assert.equal(task.assignee, null); assert.equal(task.assigneePrincipalId, null);
    assert.equal(task.creator.principalId, member.principalId); assert.equal(task.provenance.executionMode, 'human'); assert.equal(task.provenance.source, 'web'); assert.equal(task.provenance.grantId, null);
    const link = new URL(task.url, 'https://app.example.test'); assert.equal(link.searchParams.get('workspace'), f.workspace.id); assert.equal(link.searchParams.get('task'), task.id);
    assert.equal((await ok(f.owner, `${f.tasks}/${task.id}`)).version, 1);
    const page = await ok(member, f.tasks); assert.equal(page.total, 1); assert.equal(page.capabilities.canCreate, true); assert.equal(page.items[0].id, task.id);
    const projectPage = await ok(member, f.path); assert.equal(projectPage.total, 1); assert.equal(projectPage.capabilities.canCreate, true);
    const event = await prisma.activityEvent.findFirstOrThrow({ where: { taskId: task.id } }); assert.equal(event.actorPrincipalId, member.principalId);
    const outbox = await prisma.outboxEvent.findUniqueOrThrow({ where: { activityId: event.id } }); assert.deepEqual(outbox.payload, { activityId: event.id });
    assert.ok(!JSON.stringify(event).includes('Capture'));
  });
  await t.test('two tenants, absent resources, project consistency and viewer denial leak no foreign records/counts', async () => {
    const a = await fixture(); const b = await fixture(); const viewer = await join(a, 'viewer'); const task = await ok(b.owner, b.tasks, { title: 'Foreign' });
    for (const suffix of ['', `/${b.project.id}`, `/${b.project.id}/tasks`, `/${b.project.id}/tasks/${task.id}`]) assert.equal((await request(a.owner, `${b.path}${suffix}`)).status, 403);
    for (const path of [`${a.path}/${b.project.id}`, `${a.tasks}/${task.id}`, `${a.path}/${randomUUID()}`]) assert.equal((await request(a.owner, path)).status, 403);
    assert.equal((await ok(a.owner, a.tasks)).total, 0); assert.equal((await ok(a.owner, a.path)).total, 1);
    assert.equal((await ok(viewer, a.path)).capabilities.canCreate, false); assert.equal((await ok(viewer, a.p)).capabilities.canEdit, false);
    assert.equal((await request(viewer, a.path, { key: 'NO', name: 'Denied' })).status, 403);
    assert.equal((await request(viewer, a.tasks, { title: 'Denied' })).status, 403);
    assert.equal((await request(a.owner, a.tasks, { title: 'Denied', assigneePrincipalId: b.owner.principalId })).status, 403);
    const own = await ok(a.owner, a.tasks, { title: 'Own' });
    await assert.rejects(pool.query('UPDATE task SET "projectId"=$1 WHERE id=$2', [b.project.id, own.id]), error => error.code === '23514');
    await assert.rejects(pool.query('INSERT INTO task(id,"workspaceId","projectId",number,title,"createdByPrincipalId","creationMode","creationSource") VALUES ($1,$2,$3,1,$4,$5,$6,$7)', [randomUUID(), a.workspace.id, b.project.id, 'Denied', a.owner.principalId, 'human', 'web']));
  });
  await t.test('strict origin/JSON/queries/actor rejection and field/date validation', async () => {
    const f = await fixture();
    assert.equal((await request(null, f.path)).status, 401);
    for (const extra of [{ origin: '' }, { origin: 'https://evil.test' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await request(f.owner, f.tasks, { title: 'Denied' }, randomUUID(), extra)).status, 403);
    assert.equal((await request(f.owner, f.tasks, { title: 'Denied' }, randomUUID(), { 'content-type': 'text/plain' })).status, 400);
    for (const field of ['createdByPrincipalId', 'authorPrincipalId', 'subjectPrincipalId', 'provenance', 'executionMode', 'source', 'grantId', 'projectId', 'workspaceId', 'labels', 'checklist', 'parentId']) assert.equal((await request(f.owner, f.tasks, { title: 'Denied', [field]: 'forged' })).status, 400);
    for (const field of ['actorPrincipalId', 'subjectPrincipalId', 'mode', 'source', 'grantId']) assert.equal((await request(f.owner, f.path, undefined, undefined, { [`x-rielia-${field}`]: 'forged' })).status, 400);
    for (const query of ['?workspaceId=forged', '?view=private', '?cursor=bad%20id', '?view=active&view=archived']) assert.equal((await request(f.owner, f.path + query)).status, 400);
    for (const body of [{}, { title: '' }, { title: 'x', status: 'custom' }, { title: 'x', dueDate: '2027-02-29' }, { title: 'x', dueDate: '2026-11-01T00:00:00Z' }, { title: 'x', dueDate: '0000-01-01' }, { title: 'x', priority: [] }]) assert.equal((await request(f.owner, f.tasks, body)).status, 400);
    for (const body of [{ name: 'x', key: 'lower' }, { name: 'x', key: 'PRI', visibility: 'private' }]) assert.equal((await request(f.owner, f.path, body)).status, 400);
    assert.equal((await request(f.owner, f.tasks, { title: 'x' }, 'bad-key')).status, 400);
    const malformed = await fetch(`${url}/api/v1/${f.tasks}`, { method: 'POST', headers: { cookie: f.owner.cookie, origin: identity.config.origin, 'content-type': 'application/json', 'idempotency-key': randomUUID(), 'x-request-id': 'forged' }, body: '{bad json' });
    assert.equal(malformed.status, 400); assert.equal(malformed.headers.get('cache-control'), 'no-store'); assert.match(malformed.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
    const leap = await ok(f.owner, f.tasks, { title: 'Leap', dueDate: '2028-02-29', description: '<script>alert(1)</script>\n[link](javascript:evil)' }); assert.equal(leap.dueDate, '2028-02-29');
    assert.ok(leap.description.startsWith('<script>'));
  });
  await t.test('actual 100-record cursor boundary, selected records outside first page, scoped totals and archive filtering', async () => {
    const f = await fixture(); const foreign = await fixture();
    // Fixture writes use the same real service, transactions/events and policy.
    const context = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    for (let n = 0; n < 102; n++) await service.createProject(context, f.workspace.id, randomUUID(), randomUUID(), { name: `Paged ${n}`, key: `PG${n}` });
    const first = await ok(f.owner, f.path); assert.equal(first.items.length, 100); assert.equal(first.total, 103); assert.ok(first.nextCursor);
    const second = await ok(f.owner, `${f.path}?cursor=${first.nextCursor}`); assert.equal(second.items.length, 3); assert.equal(second.total, 103); assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 103);
    const outside = second.items[0]; assert.equal((await ok(f.owner, `${f.path}/${outside.id}`)).id, outside.id);
    for (let n = 0; n < 102; n++) await service.createTask(context, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: `Paged task ${n}` });
    const tasks = await ok(f.owner, f.tasks); assert.equal(tasks.items.length, 100); assert.equal(tasks.total, 102);
    const tail = await ok(f.owner, `${f.tasks}?cursor=${tasks.nextCursor}`); assert.equal(tail.items.length, 2); assert.equal(tail.nextCursor, null);
    assert.equal(new Set([...tasks.items, ...tail.items].map(row => row.id)).size, 102);
    await ok(f.owner, `${f.tasks}/${tail.items[0].id}/archive`, { expectedVersion: 1 });
    assert.equal((await ok(f.owner, f.tasks)).total, 101); assert.equal((await ok(f.owner, `${f.tasks}?view=archived`)).total, 1);
    assert.equal((await ok(foreign.owner, foreign.path)).total, 1); assert.equal((await ok(foreign.owner, foreign.tasks)).total, 0);
  });
  await t.test('concurrent numbering, project-key uniqueness and scoped identical/different-payload replay', async () => {
    const f = await fixture(); const version = f.project.version;
    const created = await Promise.all(Array.from({ length: 8 }, (_, n) => ok(f.owner, f.tasks, { title: `Concurrent ${n}` })));
    assert.deepEqual(created.map(row => row.number).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal((await ok(f.owner, f.p)).version, version, 'counter-only allocation preserves project edit version');
    const duplicate = await Promise.all([request(f.owner, f.path, { name: 'One', key: 'SAME' }), request(f.owner, f.path, { name: 'Two', key: 'SAME' })]); assert.deepEqual(duplicate.map(row => row.status).sort(), [201, 409]);
    const key = randomUUID(); const input = { title: 'Replay' }; const before = await counts();
    const replayed = await Promise.all([ok(f.owner, f.tasks, input, key), ok(f.owner, f.tasks, input, key)]); assert.equal(replayed[0].id, replayed[1].id);
    const after = await counts(); assert.deepEqual(after.map((n, i) => n - before[i]), [0, 1, 1, 1, 1]);
    assert.equal((await request(f.owner, f.tasks, { title: 'Different' }, key)).status, 409);
    const b = await fixture(); const other = await ok(f.owner, 'workspaces', { name: 'Second own workspace' });
    const p = await ok(f.owner, `workspaces/${other.id}/projects`, { name: 'Scoped key', key: 'SAME' }, key); assert.equal(p.workspaceId, other.id);
    assert.equal((await ok(b.owner, b.path)).total, 1);
  });
  await t.test('same-value project edits advance version; stale concurrent project/task saves never overwrite', async () => {
    const f = await fixture(); const task = await ok(f.owner, f.tasks, { title: 'Original' });
    const project = await ok(f.owner, f.p, { expectedVersion: 1, name: f.project.name, description: '' }); assert.equal(project.version, 2);
    const stale = await request(f.owner, f.p, { expectedVersion: 1, name: 'Stale', description: '' }); assert.equal(stale.status, 409); assert.equal(stale.data.code, 'version-conflict'); assert.equal(stale.data.current.version, 2);
    const results = await Promise.all([request(f.owner, `${f.tasks}/${task.id}`, { expectedVersion: task.version, title: 'First' }), request(f.owner, `${f.tasks}/${task.id}`, { expectedVersion: task.version, title: 'Second' })]);
    assert.deepEqual(results.map(row => row.status).sort(), [201, 409]); const denied = results.find(row => row.status === 409); assert.equal(denied.data.code, 'version-conflict'); assert.equal(denied.data.current.version, 2);
    assert.equal((await request(f.owner, f.p, { expectedVersion: 2, key: 'NEW', name: 'x', description: '' })).status, 400);
    const event = await prisma.activityEvent.findMany({ where: { projectId: f.project.id, action: 'edit-project' } }); assert.deepEqual(event.map(row => row.entityVersion), [2]);
  });
  await t.test('active human/Agent assignment, historical inactive display and immutable creator/provenance through edits', async () => {
    const f = await fixture(); const member = await join(f);
    const agent = await ok(f.owner, `${f.root}/agents`, { name: 'Builder', role: 'member', custodianPrincipalId: f.owner.principalId });
    const original = await ok(member, f.tasks, { title: 'Assigned', assigneePrincipalId: agent.principalId });
    assert.equal(original.assignee.kind, 'agent'); assert.equal(original.creator.principalId, member.principalId);
    await ok(f.owner, `${f.root}/agents/${agent.principalId}`, { version: 1, state: 'suspended' });
    const historical = await ok(f.owner, `${f.tasks}/${original.id}`); assert.equal(historical.assignee.active, false);
    const edited = await ok(f.owner, `${f.tasks}/${original.id}`, { expectedVersion: 1, title: 'Unrelated edit', assigneePrincipalId: agent.principalId }); assert.equal(edited.assigneePrincipalId, agent.principalId);
    assert.deepEqual(edited.creator, original.creator); assert.deepEqual(edited.provenance, original.provenance);
    assert.equal((await request(f.owner, f.tasks, { title: 'New invalid assignment', assigneePrincipalId: agent.principalId })).status, 403);
    const reassigned = await ok(f.owner, `${f.tasks}/${original.id}`, { expectedVersion: edited.version, assigneePrincipalId: f.owner.principalId }); assert.equal(reassigned.assignee.kind, 'human'); assert.equal(reassigned.creator.principalId, member.principalId);
    for (const sql of ['UPDATE task SET "createdByPrincipalId"=$1 WHERE id=$2', 'UPDATE task SET "creationSource"=$1 WHERE id=$2']) await assert.rejects(pool.query(sql, [sql.includes('Source') ? 'mcp' : f.owner.principalId, original.id]));
    await assert.rejects(pool.query('DELETE FROM task WHERE id=$1', [original.id]));
  });
  await t.test('delegated/autonomous services preserve own actor and current grant narrowing without a new auth adapter', async () => {
    const f = await fixture(); const human = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const agentId = await principals.registerAgent(human, { name: 'Builder', role: 'member', custodianPrincipalId: f.owner.principalId });
    const input = { allowedOperations: ['read', 'write'], expiresAt: new Date(Date.now() + 3600000) };
    const delegatedId = await principals.recordInternalGrant(human, { ...input, subjectPrincipalId: f.owner.principalId, mode: 'delegated' });
    const autonomousId = await principals.recordInternalGrant(human, { ...input, subjectPrincipalId: agentId, mode: 'autonomous' });
    for (const [grantId, actor, mode] of [[delegatedId, f.owner.principalId, 'delegated'], [autonomousId, agentId, 'autonomous']]) {
      const context = await principals.internalGrantContext(grantId, f.workspace.id); const key = randomUUID();
      const task = await service.createTask(context, f.workspace.id, f.project.id, key, randomUUID(), { title: mode });
      assert.equal(task.creator.principalId, actor); assert.equal(task.assignee, null); assert.deepEqual(task.provenance, { actorPrincipalId: actor, executionMode: mode, source: 'mcp', grantId });
      await principals.revokeGrant(human, grantId); await assert.rejects(service.createTask(context, f.workspace.id, f.project.id, key, randomUUID(), { title: mode }), status(401));
    }
    const readId = await principals.recordInternalGrant(human, { subjectPrincipalId: agentId, mode: 'autonomous', allowedOperations: ['read'], expiresAt: input.expiresAt });
    const read = await principals.internalGrantContext(readId, f.workspace.id); assert.equal((await service.projects(read, f.workspace.id)).capabilities.canCreate, false);
    assert.equal((await service.project(read, f.workspace.id, f.project.id)).capabilities.canEdit, false);
    await assert.rejects(service.createTask(read, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Denied' }), status(403));
    await assert.rejects(service.createTask({ ...human }, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Forged' }), status(401));
  });
  await t.test('receipt replay checks current revoked/readonly membership and cannot leak history', async () => {
    const f = await fixture(); const member = await join(f); const key = randomUUID(); const body = { title: 'Saved' };
    await ok(member, f.tasks, body, key); await ok(f.owner, `${f.root}/members/${member.principalId}`, { version: 1, role: 'viewer' });
    assert.equal((await request(member, f.tasks, body, key)).status, 403);
    await ok(f.owner, `${f.root}/members/${member.principalId}`, { version: 2, state: 'revoked' });
    assert.equal((await request(member, f.tasks, body, key)).status, 403); assert.equal((await request(member, f.tasks)).status, 403);
  });
  await t.test('activity/outbox/receipt failures and deferred commit failure roll back business/counter/every durable effect', async () => {
    const f = await fixture();
    for (const table of ['activity_event', 'outbox_event', 'project_task_operation', 'task']) {
      const before = await counts(); const counter = (await prisma.project.findUniqueOrThrow({ where: { id: f.project.id } })).nextTaskNumber; const key = randomUUID();
      await pool.query(`CREATE FUNCTION fail_t06_write() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''forced rollback'' USING ERRCODE=''23514''; END'; CREATE CONSTRAINT TRIGGER fail_t06_write AFTER INSERT ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fail_t06_write()`);
      try { assert.equal((await request(f.owner, f.tasks, { title: 'Rollback' }, key)).status, 400); }
      finally { await pool.query(`DROP TRIGGER fail_t06_write ON ${table}; DROP FUNCTION fail_t06_write()`); }
      assert.deepEqual(await counts(), before); assert.equal((await prisma.project.findUniqueOrThrow({ where: { id: f.project.id } })).nextTaskNumber, counter);
      const recovered = await ok(f.owner, f.tasks, { title: 'Rollback' }, key); assert.equal(recovered.number, counter);
    }
  });
  await t.test('archive/restore hides active rows, stable links survive, project freeze and separate task recovery preserve numbers/history', async () => {
    const f = await fixture(); const a = await ok(f.owner, f.tasks, { title: 'Active' }); const b = await ok(f.owner, f.tasks, { title: 'Archived' });
    const archived = await ok(f.owner, `${f.tasks}/${b.id}/archive`, { expectedVersion: 1 }); assert.ok(archived.archivedAt);
    assert.deepEqual((await ok(f.owner, f.tasks)).items.map(row => row.id), [a.id]); assert.equal((await ok(f.owner, `${f.tasks}?view=archived`)).total, 1);
    assert.equal((await ok(f.owner, `${f.tasks}/${b.id}`)).id, b.id);
    const project = await ok(f.owner, `${f.p}/archive`, { expectedVersion: 1 }); assert.equal((await ok(f.owner, f.path)).total, 0); assert.equal((await ok(f.owner, `${f.path}?view=archived`)).total, 1);
    assert.equal((await ok(f.owner, `${f.tasks}/${a.id}`)).capabilities.canEdit, false);
    assert.equal((await request(f.owner, f.tasks, { title: 'Frozen' })).status, 409);
    assert.equal((await request(f.owner, `${f.tasks}/${a.id}`, { expectedVersion: 1, title: 'Frozen' })).status, 409);
    assert.equal((await request(f.owner, `${f.tasks}/${b.id}/restore`, { expectedVersion: archived.version })).status, 409);
    await ok(f.owner, `${f.p}/restore`, { expectedVersion: project.version }); assert.ok((await ok(f.owner, `${f.tasks}/${b.id}`)).archivedAt);
    await ok(f.owner, `${f.tasks}/${b.id}/restore`, { expectedVersion: archived.version }); assert.equal((await ok(f.owner, f.tasks)).total, 2);
    const next = await ok(f.owner, f.tasks, { title: 'Next' }); assert.equal(next.number, 3); assert.equal(next.projectKey, 'RIE');
  });
  await t.test('policy/archive races serialize and stale snapshots cannot write after revocation or project archive', async () => {
    const f = await fixture(); const member = await join(f); const context = (await principals.webContext({ cookie: member.cookie }, f.workspace.id)).context;
    const connection = await pool.connect();
    for (const change of ['archive', 'revoke']) {
      let pending;
      try {
        await connection.query('BEGIN');
        if (change === 'archive') await connection.query('UPDATE project SET "archivedAt"=now() WHERE id=$1', [f.project.id]);
        else await connection.query('UPDATE membership SET state=$1 WHERE "workspaceId"=$2 AND "principalId"=$3', ['revoked', f.workspace.id, member.principalId]);
        pending = service.createTask(context, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Race' }).then(() => null, error => error);
        let blocked = false; for (let n = 0; n < 100; n++) { const locks = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND datname=current_database() AND pid<>pg_backend_pid()`); if (locks.rows[0].n) { blocked = true; break; } await delay(10); }
        assert.ok(blocked); await connection.query('COMMIT'); assert.equal((await pending).getStatus(), change === 'archive' ? 409 : 403);
        assert.equal(await prisma.task.count({ where: { projectId: f.project.id } }), 0);
        if (change === 'archive') await pool.query('UPDATE project SET "archivedAt"=NULL WHERE id=$1', [f.project.id]);
      } finally { await connection.query('ROLLBACK'); await pending; }
    }
    connection.release();
  });
  await t.test('rows, authorship, counter and current reads survive actual Nest restart', async () => {
    const f = await fixture(); const saved = await ok(f.owner, f.tasks, { title: 'Persistent', dueDate: '2027-12-31' });
    await app.close(); app = await start(); url = await app.getUrl(); identity = app.get(IdentityService); prisma = identity.runtime.prisma; principals = app.get(PrincipalService); service = app.get(ProjectTaskService);
    const current = await ok(f.owner, `${f.tasks}/${saved.id}`); assert.equal(current.id, saved.id); assert.equal(current.dueDate, saved.dueDate); assert.deepEqual(current.provenance, saved.provenance);
    assert.equal((await ok(f.owner, f.tasks, { title: 'After restart' })).number, saved.number + 1);
  });
});
