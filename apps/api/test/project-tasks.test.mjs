import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
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

  await t.test('actual additive paging migration backfills existing projects deterministically and retains unique immutable allocation', async () => {
    const schema = `t06_paging_${randomUUID().replaceAll('-', '')}`; const connection = await pool.connect();
    try {
      await connection.query(`CREATE SCHEMA ${schema}`); await connection.query(`SET search_path TO ${schema}, public`);
      await connection.query('CREATE TABLE project(id text PRIMARY KEY, "createdAt" timestamp(3) NOT NULL, "workspaceId" text NOT NULL DEFAULT \'workspace\')');
      await connection.query(`INSERT INTO project(id,"createdAt") VALUES ('later','2026-10-28'),('b','2026-10-27'),('a','2026-10-27')`);
      await connection.query(await readFile(new URL('../prisma/migrations/20261028230000_project_task_paging/migration.sql', import.meta.url), 'utf8'));
      assert.deepEqual((await connection.query('SELECT id, sequence FROM project ORDER BY sequence')).rows, [{ id: 'a', sequence: 1 }, { id: 'b', sequence: 2 }, { id: 'later', sequence: 3 }]);
      assert.equal((await connection.query(`INSERT INTO project(id,"createdAt") VALUES ('new','2026-10-29') RETURNING sequence`)).rows[0].sequence, 4);
      await assert.rejects(connection.query(`UPDATE project SET sequence=DEFAULT WHERE id='a'`), error => error.code === '23514');
      await assert.rejects(connection.query(`INSERT INTO project(id,"createdAt",sequence) VALUES ('forged','2026-10-29',1)`), error => error.code === '428C9');
    } finally { await connection.query('ROLLBACK'); await connection.query('SET search_path TO public'); await connection.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); connection.release(); }
  });

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
    for (const query of ['?workspaceId=forged', '?view=private', '?cursor=bad%20id', '?cursor=abc', '?cursor=0', '?cursor=-1', '?cursor=2147483648', '?view=active&view=archived']) assert.equal((await request(f.owner, f.path + query)).status, 400);
    for (const cursor of ['abc', '0', '-1', '2147483648']) assert.equal((await request(f.owner, `${f.tasks}?cursor=${cursor}`)).status, 400);
    for (const body of [{}, { title: '' }, { title: 'x', status: 'custom' }, { title: 'x', dueDate: '2027-02-29' }, { title: 'x', dueDate: '2026-11-01T00:00:00Z' }, { title: 'x', dueDate: '0000-01-01' }, { title: 'x', priority: [] }]) assert.equal((await request(f.owner, f.tasks, body)).status, 400);
    for (const body of [{ name: 'x', key: 'lower' }, { name: 'x', key: 'PRI', visibility: 'invalid' }]) assert.equal((await request(f.owner, f.path, body)).status, 400);
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
    assert.equal(first.nextCursor, first.items.at(-1).id, 'project cursors expose only an already visible scoped public ID, never global allocation');
    assert.ok(first.items.every(row => !('sequence' in row)));
    const missingCursor = await request(f.owner, `${f.path}?cursor=${randomUUID()}`);
    const foreignCursor = await request(f.owner, `${f.path}?cursor=${foreign.project.id}`);
    assert.equal(missingCursor.status, 400); assert.equal(foreignCursor.status, 400); assert.deepEqual(foreignCursor.data, missingCursor.data);
    // A late fixed low UUID makes the previous random-ID cursor defect
    // deterministic. Trusted fixture DML still takes real scope/policy triggers.
    const late = await prisma.project.create({ data: { id: '00000000-0000-4000-8000-000000000000', workspaceId: f.workspace.id, key: 'LATE', name: 'Late insert', createdByPrincipalId: f.owner.principalId, creationMode: 'human', creationSource: 'web' } });
    const second = await ok(f.owner, `${f.path}?cursor=${first.nextCursor}`); assert.equal(second.items.length, 4); assert.equal(second.total, 104); assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 104); assert.ok(second.items.some(row => row.id === late.id));
    const anchor = first.items.at(-1); await ok(f.owner, `${f.path}/${anchor.id}/archive`, { expectedVersion: anchor.version });
    const archivedAnchorPage = await ok(f.owner, `${f.path}?cursor=${first.nextCursor}`);
    assert.deepEqual(archivedAnchorPage.items.map(row => row.id), second.items.map(row => row.id), 'archiving an anchor does not invalidate a scoped cursor');
    const outside = second.items[0]; assert.equal((await ok(f.owner, `${f.path}/${outside.id}`)).id, outside.id);
    for (let n = 0; n < 102; n++) await service.createTask(context, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: `Paged task ${n}` });
    const tasks = await ok(f.owner, f.tasks); assert.equal(tasks.items.length, 100); assert.equal(tasks.total, 102);
    const lateTask = await prisma.task.create({ data: { id: '00000000-0000-4000-8000-000000000001', workspaceId: f.workspace.id, projectId: f.project.id, number: 1, title: 'Late task', createdByPrincipalId: f.owner.principalId, creationMode: 'human', creationSource: 'web' } });
    const tail = await ok(f.owner, `${f.tasks}?cursor=${tasks.nextCursor}`); assert.equal(tail.items.length, 3); assert.equal(tail.nextCursor, null);
    assert.equal(new Set([...tasks.items, ...tail.items].map(row => row.id)).size, 103); assert.ok(tail.items.some(row => row.id === lateTask.id));
    await ok(f.owner, `${f.tasks}/${tail.items[0].id}/archive`, { expectedVersion: 1 });
    assert.equal((await ok(f.owner, f.tasks)).total, 102); assert.equal((await ok(f.owner, `${f.tasks}?view=archived`)).total, 1);
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
  const projectVersion = async f => (await ok(f.owner, f.p)).version;
  const setVisibility = async (f, visibility) => ok(f.owner, `${f.p}/visibility`, { expectedVersion: await projectVersion(f), visibility });
  const setAccess = async (f, person, state = 'active', key) => ok(f.owner, `${f.p}/access/${person.principalId}`, { expectedVersion: await projectVersion(f), state }, key);

  await t.test('T07 actual additive migration preserves existing T06 rows and establishes scoped immutable access', async () => {
    const schema = `t07_upgrade_${randomUUID().replaceAll('-', '')}`; const c = await pool.connect();
    try {
      await c.query(`CREATE SCHEMA ${schema}`); await c.query(`SET search_path TO ${schema}, public`);
      for (const migration of ['20261025000000_identity', '20261028000000_principal_foundations', '20261028190000_workspace_flows', '20261028220000_project_task_flows', '20261028230000_project_task_paging']) await c.query(await readFile(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), 'utf8'));
      await c.query('BEGIN'); await c.query(`INSERT INTO "user"(id,name,email,"updatedAt") VALUES ('legacy-human','Legacy','legacy@example.test',now())`);
      const principal = (await c.query(`SELECT id FROM principal WHERE "userId"='legacy-human'`)).rows[0].id;
      await c.query('INSERT INTO workspace(id,name,"ownerPrincipalId") VALUES ($1,$2,$3)', ['legacy-workspace', 'Legacy workspace', principal]);
      await c.query('INSERT INTO membership("workspaceId","principalId",role) VALUES ($1,$2,$3)', ['legacy-workspace', principal, 'owner']);
      await c.query('INSERT INTO project(id,"workspaceId",key,name,"createdByPrincipalId","creationMode","creationSource") VALUES ($1,$2,$3,$4,$5,$6,$7)', ['legacy-project', 'legacy-workspace', 'LEG', 'Preserved', principal, 'human', 'web']);
      await c.query('INSERT INTO task(id,"workspaceId","projectId",number,title,"createdByPrincipalId","creationMode","creationSource") VALUES ($1,$2,$3,1,$4,$5,$6,$7)', ['legacy-task', 'legacy-workspace', 'legacy-project', 'Preserved task', principal, 'human', 'web']); await c.query('COMMIT');
      const before = (await c.query(`SELECT to_jsonb(p) AS data FROM project p WHERE id='legacy-project'`)).rows[0].data;
      await c.query(await readFile(new URL('../prisma/migrations/20261029160000_project_access/migration.sql', import.meta.url), 'utf8'));
      assert.deepEqual((await c.query(`SELECT to_jsonb(p) AS data FROM project p WHERE id='legacy-project'`)).rows[0].data, before);
      assert.equal((await c.query('SELECT count(*)::int AS n FROM project_access')).rows[0].n, 0);
      await c.query(`UPDATE project SET visibility='private' WHERE id='legacy-project'`); assert.equal((await c.query(`SELECT version FROM project WHERE id='legacy-project'`)).rows[0].version, before.version + 1);
      await c.query('INSERT INTO project_access("workspaceId","projectId","principalId") VALUES ($1,$2,$3)', ['legacy-workspace', 'legacy-project', principal]);
      assert.equal((await c.query(`SELECT version FROM project WHERE id='legacy-project'`)).rows[0].version, before.version + 2);
      await assert.rejects(c.query('UPDATE project_access SET "projectId"=$1', ['foreign']), e => e.code === '23514');
      await assert.rejects(c.query('DELETE FROM project_access'), e => e.code === '23514');
      await assert.rejects(c.query('INSERT INTO project_access("workspaceId","projectId","principalId",state) VALUES ($1,$2,$3,$4)', ['legacy-workspace', 'missing', principal, 'revoked']), e => e.code === '23503');
      assert.equal((await c.query(`SELECT number FROM task WHERE id='legacy-task'`)).rows[0].number, 1);
    } finally { await c.query('ROLLBACK'); await c.query('SET search_path TO public'); await c.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); c.release(); }
  });

  await t.test('T07 automatic human administration, explicit human/viewer access and two-tenant content matrix', async () => {
    const f = await fixture(); const admin = await join(f, 'admin'); const member = await join(f); const viewer = await join(f, 'viewer'); const foreign = await fixture();
    // Kody kind concern: the complete principal kind CHECK permits only these
    // two assignable kinds plus the reserved System; the deferred consistency
    // trigger forbids System membership even through ordinary direct SQL.
    await assert.rejects(pool.query('INSERT INTO membership("workspaceId","principalId",role) VALUES ($1,$2,$3)', [f.workspace.id, 'rielia-system', 'viewer']), e => e.code === '23514');
    assert.equal((await ok(f.owner, `${f.p}/access`)).total, 4);
    const task = await ok(f.owner, f.tasks, { title: 'Private title', assigneePrincipalId: member.principalId });
    const privateProject = await setVisibility(f, 'private'); assert.equal(privateProject.version, 2);
    for (const user of [f.owner, admin]) {
      assert.equal((await ok(user, f.path)).total, 1); assert.equal((await ok(user, f.p)).visibility, 'private');
      assert.equal((await ok(user, `${f.tasks}/${task.id}`)).title, 'Private title'); assert.equal((await ok(user, f.p)).capabilities.canManageAccess, true);
    }
    for (const user of [member, viewer, foreign.owner]) {
      if (user !== foreign.owner) assert.equal((await ok(user, f.path)).total, 0);
      for (const path of [f.p, f.tasks, `${f.tasks}/${task.id}`, `${f.p}/assignees`, `${f.p}/access`, `${f.p}/access/${member.principalId}`]) {
        const denied = await request(user, path); assert.equal(denied.status, 403); assert.ok(!JSON.stringify(denied.data).includes('Private title'));
      }
    }
    assert.equal((await request(member, f.path, { key: 'DENIED', name: 'Private create', visibility: 'private' })).status, 403);
    const created = await ok(admin, f.path, { key: 'PRIVATE', name: 'Admin private', visibility: 'private' }); assert.equal(created.visibility, 'private');
    const uniqueness = await request(member, f.path, { key: 'PRIVATE', name: 'Collision' }); assert.equal(uniqueness.status, 409);
    assert.ok(!JSON.stringify(uniqueness.data).includes('Admin private')); assert.ok(!JSON.stringify(uniqueness.data).includes(created.id));
    await setAccess(f, member); await setAccess(f, viewer);
    assert.equal((await ok(member, f.p)).capabilities.canEdit, true); assert.equal((await ok(viewer, f.p)).capabilities.canEdit, false);
    assert.equal((await request(viewer, f.tasks, { title: 'No write' })).status, 403);
    assert.equal((await request(member, `${f.p}/visibility`, { expectedVersion: await projectVersion(f), visibility: 'workspace' })).status, 403);
    assert.equal((await request(member, `${f.p}/access/${viewer.principalId}`, { expectedVersion: await projectVersion(f), state: 'revoked' })).status, 403);
    const page = await ok(admin, `${f.p}/access`); const automatic = page.items.find(row => row.principalId === admin.principalId);
    assert.equal(automatic.implicitAccess, true); assert.equal(automatic.explicitAccess, null); assert.equal(automatic.effectiveAccess, true);
    await setAccess(f, admin); await setAccess(f, admin, 'revoked');
    assert.equal((await ok(admin, `${f.p}/access`)).items.find(row => row.principalId === admin.principalId).effectiveAccess, true);
    await ok(f.owner, `${f.root}/members/${admin.principalId}`, { version: 1, role: 'member' });
    assert.equal((await request(admin, f.p)).status, 403); await setAccess(f, admin); assert.equal((await ok(admin, f.p)).capabilities.canManageAccess, false);
    await setVisibility(f, 'workspace'); await setVisibility(f, 'private'); assert.equal((await ok(member, f.p)).visibility, 'private');
    assert.equal((await ok(f.owner, `${f.p}/access`)).items.find(row => row.principalId === member.principalId).explicitAccess, 'active');
    for (const path of [`${f.p}/access?view=active`, `${f.p}/assignees?view=active`]) assert.equal((await request(f.owner, path)).status, 400);
    assert.equal((await request(f.owner, `${f.p}/access/${foreign.owner.principalId}`, { expectedVersion: await projectVersion(f), state: 'active' })).status, 403);
    for (const visibility of [['private'], null, {}]) assert.equal((await request(f.owner, `${f.p}/visibility`, { expectedVersion: await projectVersion(f), visibility })).status, 400);
    assert.equal((await request(f.owner, `${f.p}/access/${member.principalId}`, { expectedVersion: await projectVersion(f), state: ['active'] })).status, 400);
  });

  await t.test('T07 private authorization precedes writes, conflicts and all same-key target replays', async () => {
    const f = await fixture(); const member = await join(f); const ownerContext = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const createKey = randomUUID(); const createBody = { title: 'Past authority' }; const task = await ok(member, f.tasks, createBody, createKey);
    const projectKey = randomUUID(); const projectBody = { key: 'OWN', name: 'Historical creator' }; const own = await ok(member, f.path, projectBody, projectKey);
    const editKey = randomUUID(); const editBody = { expectedVersion: task.version, title: 'Accepted edit' }; await ok(member, `${f.tasks}/${task.id}`, editBody, editKey);
    await setVisibility(f, 'private');
    await service.changeVisibility(ownerContext, f.workspace.id, own.id, randomUUID(), randomUUID(), { expectedVersion: own.version, visibility: 'private' });
    const attempts = [
      [f.tasks, createBody, createKey], [`${f.tasks}/${task.id}`, editBody, editKey], [f.path, projectBody, projectKey],
      [f.p, { expectedVersion: 1, name: 'Denied edit', description: '' }], [`${f.p}/archive`, { expectedVersion: 1 }], [`${f.p}/restore`, { expectedVersion: 1 }],
      [`${f.tasks}/${task.id}/archive`, { expectedVersion: 1 }], [`${f.tasks}/${task.id}/restore`, { expectedVersion: 1 }],
    ];
    const before = await counts();
    for (const [path, body, key] of attempts) { const r = await request(member, path, body, key); assert.equal(r.status, 403); assert.equal(r.data.current, undefined); }
    assert.deepEqual(await counts(), before); assert.equal((await ok(f.owner, `${f.tasks}/${task.id}`)).creator.principalId, member.principalId);
    await setAccess(f, member); const replay = await ok(member, f.tasks, createBody, createKey); assert.equal(replay.title, 'Accepted edit');
    await setAccess(f, member, 'revoked'); assert.equal((await request(member, f.tasks, createBody, createKey)).status, 403);
    await setAccess(f, member); await ok(f.owner, `${f.root}/members/${member.principalId}`, { version: 1, state: 'suspended' });
    assert.equal((await request(member, f.p)).status, 403); await ok(f.owner, `${f.root}/members/${member.principalId}`, { version: 2, state: 'active' });
    assert.equal((await ok(member, f.p)).id, f.project.id); await ok(f.owner, `${f.root}/members/${member.principalId}`, { version: 3, state: 'revoked' });
    assert.equal((await request(f.owner, `${f.p}/access/${member.principalId}`, { expectedVersion: await projectVersion(f), state: 'active' })).status, 403);
    assert.equal((await request(member, f.p)).status, 403);
  });

  await t.test('T07 delegated admin content and autonomous own access obey grants without human administration', async () => {
    const f = await fixture(); await setVisibility(f, 'private'); const humanContext = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const agentId = await principals.registerAgent(humanContext, { name: 'Private Agent', role: 'member', custodianPrincipalId: f.owner.principalId });
    const expiresAt = new Date(Date.now() + 3600000);
    const delegatedId = await principals.recordInternalGrant(humanContext, { subjectPrincipalId: f.owner.principalId, mode: 'delegated', allowedOperations: ['read', 'write'], expiresAt });
    const delegated = await principals.internalGrantContext(delegatedId, f.workspace.id);
    assert.equal((await service.project(delegated, f.workspace.id, f.project.id)).capabilities.canManageAccess, false);
    assert.equal((await service.projects(delegated, f.workspace.id)).capabilities.canCreatePrivate, false);
    const delegateTask = await service.createTask(delegated, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Delegated' }); assert.equal(delegateTask.creator.principalId, f.owner.principalId);
    for (const c of [delegated]) {
      await assert.rejects(service.changeVisibility(c, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { expectedVersion: await projectVersion(f), visibility: 'workspace' }), status(403));
      await assert.rejects(service.changeAccess(c, f.workspace.id, f.project.id, agentId, randomUUID(), randomUUID(), { expectedVersion: await projectVersion(f), state: 'active' }), status(403));
      await assert.rejects(service.access(c, f.workspace.id, f.project.id), status(403));
      await assert.rejects(service.createProject(c, f.workspace.id, randomUUID(), randomUUID(), { key: 'DPR', name: 'Denied', visibility: 'private' }), status(403));
    }
    const grantId = await principals.recordInternalGrant(humanContext, { subjectPrincipalId: agentId, mode: 'autonomous', allowedOperations: ['read', 'write'], expiresAt });
    const agent = await principals.internalGrantContext(grantId, f.workspace.id); assert.equal((await service.projects(agent, f.workspace.id)).total, 0);
    await assert.rejects(service.project(agent, f.workspace.id, f.project.id), status(403));
    await setAccess(f, { principalId: agentId }); const key = randomUUID(); const body = { title: 'Own Agent', assigneePrincipalId: agentId };
    const task = await service.createTask(agent, f.workspace.id, f.project.id, key, randomUUID(), body); assert.equal(task.creator.kind, 'agent'); assert.equal(task.provenance.executionMode, 'autonomous');
    await assert.rejects(service.changeAccess(agent, f.workspace.id, f.project.id, agentId, randomUUID(), randomUUID(), { expectedVersion: await projectVersion(f), state: 'revoked' }), status(403));
    const readId = await principals.recordInternalGrant(humanContext, { subjectPrincipalId: agentId, mode: 'autonomous', allowedOperations: ['read'], expiresAt }); const read = await principals.internalGrantContext(readId, f.workspace.id);
    assert.equal((await service.project(read, f.workspace.id, f.project.id)).capabilities.canEdit, false);
    await assert.rejects(service.createTask(read, f.workspace.id, f.project.id, randomUUID(), randomUUID(), body), status(403));
    await setAccess(f, { principalId: agentId }, 'revoked'); await assert.rejects(service.createTask(agent, f.workspace.id, f.project.id, key, randomUUID(), body), status(403));
    await setAccess(f, { principalId: agentId }); await principals.revokeGrant(humanContext, grantId); await assert.rejects(service.createTask(agent, f.workspace.id, f.project.id, key, randomUUID(), body), status(401));
    assert.equal((await ok(f.owner, `${f.tasks}/${task.id}`)).creator.principalId, agentId);
  });

  await t.test('T07 assignment eligibility, historical attribution and archived revocation use current project policy', async () => {
    const f = await fixture(); const member = await join(f); const viewer = await join(f, 'viewer');
    const task = await ok(member, f.tasks, { title: 'Assignment history', assigneePrincipalId: member.principalId }); await setVisibility(f, 'private');
    assert.equal((await ok(f.owner, `${f.tasks}/${task.id}`)).assignee.active, false);
    assert.equal((await ok(f.owner, `${f.p}/assignees`)).items.some(row => row.principalId === member.principalId), false);
    assert.equal((await request(f.owner, f.tasks, { title: 'Denied assignment', assigneePrincipalId: member.principalId })).status, 403);
    const edited = await ok(f.owner, `${f.tasks}/${task.id}`, { expectedVersion: task.version, title: 'Keep historical', assigneePrincipalId: member.principalId }); assert.equal(edited.assigneePrincipalId, member.principalId); assert.equal(edited.creator.principalId, member.principalId);
    await assert.rejects(pool.query('INSERT INTO task(id,"workspaceId","projectId",number,title,"createdByPrincipalId","assigneePrincipalId","creationMode","creationSource") VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8)', [randomUUID(), f.workspace.id, f.project.id, 'Denied SQL', f.owner.principalId, member.principalId, 'human', 'web']), e => e.code === '23514');
    await setAccess(f, member); const eligible = await ok(f.owner, `${f.p}/assignees`); assert.ok(eligible.items.some(row => row.principalId === member.principalId));
    const archived = await ok(f.owner, `${f.p}/archive`, { expectedVersion: await projectVersion(f) });
    assert.equal(archived.capabilities.canGrantAccess, false); assert.equal(archived.capabilities.canRevokeAccess, true);
    assert.equal((await request(f.owner, `${f.p}/visibility`, { expectedVersion: archived.version, visibility: 'workspace' })).status, 409);
    assert.equal((await request(f.owner, `${f.p}/access/${viewer.principalId}`, { expectedVersion: archived.version, state: 'active' })).status, 409);
    const revoked = await setAccess(f, member, 'revoked'); assert.equal(revoked.version, archived.version + 1); assert.equal((await request(member, f.p)).status, 403);
    assert.equal((await ok(f.owner, `${f.p}/access`)).items.find(row => row.principalId === member.principalId).explicitAccess, 'revoked');
    await ok(f.owner, `${f.p}/restore`, { expectedVersion: revoked.version }); await setAccess(f, member); assert.equal((await ok(member, f.p)).id, f.project.id);
  });

  await t.test('T07 filtered project counts and 100-row boundaries never authorize hidden or revoked cursor anchors', async () => {
    const f = await fixture(); const member = await join(f); const context = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    let hidden;
    for (let n = 0; n < 105; n++) {
      if (n % 20 === 0) hidden = await service.createProject(context, f.workspace.id, randomUUID(), randomUUID(), { name: 'Hidden content', key: `H${n}`, visibility: 'private' });
      await service.createProject(context, f.workspace.id, randomUUID(), randomUUID(), { name: `Visible ${n}`, key: `V${n}` });
    }
    const first = await ok(member, f.path); assert.equal(first.items.length, 100); assert.equal(first.total, 106); assert.equal(first.nextCursor, first.items.at(-1).id);
    const second = await ok(member, `${f.path}?cursor=${first.nextCursor}`); assert.equal(second.items.length, 6); assert.equal(second.total, 106); assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 106);
    assert.ok(!JSON.stringify(first).includes('Hidden content')); assert.ok(first.items.every(row => !('sequence' in row)));
    const hiddenAnchor = await request(member, `${f.path}?cursor=${hidden.id}`); const absent = await request(member, `${f.path}?cursor=${randomUUID()}`); assert.equal(hiddenAnchor.status, 400); assert.deepEqual(hiddenAnchor.data, absent.data);
    const anchor = first.items.at(-1); await service.changeVisibility(context, f.workspace.id, anchor.id, randomUUID(), randomUUID(), { expectedVersion: anchor.version, visibility: 'private' });
    assert.equal((await request(member, `${f.path}?cursor=${anchor.id}`)).status, 400);
    await service.changeAccess(context, f.workspace.id, anchor.id, member.principalId, randomUUID(), randomUUID(), { expectedVersion: anchor.version + 1, state: 'active' });
    await service.changeProject(context, f.workspace.id, anchor.id, randomUUID(), randomUUID(), 'archive-project', { expectedVersion: anchor.version + 2 });
    assert.equal((await ok(member, `${f.path}?cursor=${anchor.id}`)).items.length, 6);
  });

  await t.test('T07 access version conflicts and deferred event failures roll back access, project and all durable effects', async () => {
    const f = await fixture(); const member = await join(f); await setVisibility(f, 'private');
    const version = await projectVersion(f); const a = { expectedVersion: version, state: 'active' }; const key = randomUUID();
    const first = await ok(f.owner, `${f.p}/access/${member.principalId}`, a, key); const beforeReplay = await counts(); assert.equal((await ok(f.owner, `${f.p}/access/${member.principalId}`, a, key)).version, first.version); assert.deepEqual(await counts(), beforeReplay);
    const event = await prisma.activityEvent.findFirstOrThrow({ where: { projectId: f.project.id, action: 'change-access' } }); assert.equal(event.accessPrincipalId, member.principalId); assert.deepEqual(event.changedFields, ['state']);
    const conflict = await request(f.owner, `${f.p}/access/${member.principalId}`, { expectedVersion: version, state: 'revoked' }); assert.equal(conflict.status, 409); assert.equal(conflict.data.current.version, first.version);
    assert.equal(conflict.data.accessCurrent.principalId, member.principalId); assert.equal(conflict.data.accessCurrent.explicitAccess, 'active');
    const review = await ok(f.owner, `${f.p}/access/${member.principalId}`); assert.equal(review.project.version, first.version); assert.deepEqual(review.member, conflict.data.accessCurrent);
    for (const table of ['project_access', 'activity_event', 'outbox_event', 'project_task_operation']) {
      const before = await counts(); const current = await projectVersion(f); const row = await prisma.projectAccess.findUniqueOrThrow({ where: { workspaceId_projectId_principalId: { workspaceId: f.workspace.id, projectId: f.project.id, principalId: member.principalId } } });
      await pool.query(`CREATE FUNCTION fail_t07_write() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''forced rollback'' USING ERRCODE=''23514''; END'; CREATE CONSTRAINT TRIGGER fail_t07_write AFTER INSERT OR UPDATE ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fail_t07_write()`);
      try { assert.equal((await request(f.owner, `${f.p}/access/${member.principalId}`, { expectedVersion: current, state: 'revoked' })).status, 400); }
      finally { await pool.query(`DROP TRIGGER fail_t07_write ON ${table}; DROP FUNCTION fail_t07_write()`); }
      assert.deepEqual(await counts(), before); assert.equal(await projectVersion(f), current); assert.deepEqual(await prisma.projectAccess.findUniqueOrThrow({ where: { workspaceId_projectId_principalId: { workspaceId: f.workspace.id, projectId: f.project.id, principalId: member.principalId } } }), row);
    }
    const concurrent = await Promise.all([request(f.owner, `${f.p}/access/${member.principalId}`, { expectedVersion: first.version, state: 'revoked' }), request(f.owner, `${f.p}/visibility`, { expectedVersion: first.version, visibility: 'workspace' })]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
  });

  await t.test('T07 access and eligible-assignee pagination use scoped counts and reject revoked eligible anchors', async () => {
    const f = await fixture(); const context = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context; const people = [];
    for (let n = 0; n < 101; n++) { const person = await human(); await principals.addHumanMember(context, person.id, 'member'); people.push(person); }
    await setVisibility(f, 'private');
    // Direct fixture data still runs the same fence, composite FKs and aggregate
    // version guards; API effects/receipts are exercised in the other cases.
    await prisma.projectAccess.createMany({ data: people.map(person => ({ workspaceId: f.workspace.id, projectId: f.project.id, principalId: person.principalId })) });
    for (const suffix of ['access', 'assignees']) {
      const first = await ok(f.owner, `${f.p}/${suffix}`); assert.equal(first.items.length, 100); assert.equal(first.total, 102);
      const tail = await ok(f.owner, `${f.p}/${suffix}?cursor=${first.nextCursor}`); assert.equal(tail.items.length, 2); assert.equal(tail.total, 102); assert.equal(new Set([...first.items, ...tail.items].map(row => row.principalId)).size, 102);
      if (suffix === 'access') { const review = await ok(f.owner, `${f.p}/access/${tail.items[0].principalId}`); assert.equal(review.member.principalId, tail.items[0].principalId); assert.equal(review.project.version, first.projectVersion); }
    }
    const first = await ok(f.owner, `${f.p}/assignees`); const anchor = first.items.find(row => row.principalId !== f.owner.principalId); const target = people.find(person => person.principalId === anchor.principalId);
    assert.ok(target); await setAccess(f, target, 'revoked'); assert.equal((await request(f.owner, `${f.p}/assignees?cursor=${anchor.principalId}`)).status, 400);
    const foreign = await human(); const denied = await request(f.owner, `${f.p}/access?cursor=${foreign.principalId}`); const missing = await request(f.owner, `${f.p}/access?cursor=${randomUUID()}`); assert.equal(denied.status, 400); assert.deepEqual(denied.data, missing.data);
  });

  await t.test('T07 private revocation fence blocks old-context read, write, replay and assignment until commit', async () => {
    const f = await fixture(); const member = await join(f); await setVisibility(f, 'private'); await setAccess(f, member);
    const memberContext = (await principals.webContext({ cookie: member.cookie }, f.workspace.id)).context; const ownerContext = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const key = randomUUID(); const body = { title: 'Replay before removal' }; await service.createTask(memberContext, f.workspace.id, f.project.id, key, randomUUID(), body);
    const connection = await pool.connect(); let operations;
    try {
      await connection.query('BEGIN'); await connection.query('UPDATE project_access SET state=$1 WHERE "workspaceId"=$2 AND "projectId"=$3 AND "principalId"=$4', ['revoked', f.workspace.id, f.project.id, member.principalId]);
      operations = [service.project(memberContext, f.workspace.id, f.project.id), service.createTask(memberContext, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Denied after commit' }), service.createTask(memberContext, f.workspace.id, f.project.id, key, randomUUID(), body), service.createTask(ownerContext, f.workspace.id, f.project.id, randomUUID(), randomUUID(), { title: 'Denied assignee', assigneePrincipalId: member.principalId })].map(p => p.then(() => null, e => e));
      let blocked = false; for (let n = 0; n < 100; n++) { const locks = await pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND datname=current_database() AND pid<>pg_backend_pid()`); if (locks.rows[0].n >= 4) { blocked = true; break; } await delay(10); }
      assert.ok(blocked); await connection.query('COMMIT'); const denied = await Promise.all(operations); assert.ok(denied.every(e => e?.getStatus() === 403));
      assert.equal(await prisma.task.count({ where: { projectId: f.project.id } }), 1);
    } finally { await connection.query('ROLLBACK'); if (operations) await Promise.all(operations); connection.release(); }
  });

  await t.test('rows, authorship, counter and current reads survive actual Nest restart', async () => {
    const f = await fixture(); const saved = await ok(f.owner, f.tasks, { title: 'Persistent', dueDate: '2027-12-31' });
    await app.close(); app = await start(); url = await app.getUrl(); identity = app.get(IdentityService); prisma = identity.runtime.prisma; principals = app.get(PrincipalService); service = app.get(ProjectTaskService);
    const current = await ok(f.owner, `${f.tasks}/${saved.id}`); assert.equal(current.id, saved.id); assert.equal(current.dueDate, saved.dueDate); assert.deepEqual(current.provenance, saved.provenance);
    assert.equal((await ok(f.owner, f.tasks, { title: 'After restart' })).number, saved.number + 1);
  });
});
