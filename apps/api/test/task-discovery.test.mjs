import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { TaskDiscoveryService } from '../dist/projects/task-discovery.service.js';
import { TaskEventsService } from '../dist/projects/task-events.service.js';
import { isTaskDiscoveryPage } from '@rielia/contracts';
import { openEventStream } from './event-stream-client.mjs';


test('T10 real PostgreSQL search, current policy and committed session SSE', async t => {
  const app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false }); configureApplication(app); await app.listen(0, '127.0.0.1');
  const url = await app.getUrl(); const identity = app.get(IdentityService); const db = identity.runtime.prisma; const principals = app.get(PrincipalService); const discovery = app.get(TaskDiscoveryService); const events = app.get(TaskEventsService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 }); t.after(async () => { await pool.end(); await app.close(); });
  async function human() { const id = randomUUID(); await db.user.create({ data: { id, name: 'Discovery Human', email: `${id}@example.test`, emailVerified: true } }); const principal = await db.principal.findUniqueOrThrow({ where: { userId: id } }); const token = randomUUID(); const sessionId = randomUUID(); await db.session.create({ data: { id: sessionId, token, userId: id, expiresAt: new Date(Date.now() + 86400000) } }); return { id, sessionId, email: `${id}@example.test`, principalId: principal.id, cookie: `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}` }; }
  async function request(user, path, body, headers = {}) { const response = await fetch(`${url}/api/v1/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { cookie: user.cookie, ...(body === undefined ? {} : { origin: identity.config.origin, 'content-type': 'application/json', 'idempotency-key': randomUUID() }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: response.status, data: await response.json() }; }
  async function ok(user, path, body) { const result = await request(user, path, body); assert.ok(result.status >= 200 && result.status < 300, JSON.stringify(result)); return result.data; }
  async function fixture() { const owner = await human(); const workspace = await ok(owner, 'workspaces', { name: 'Discovery tenant' }); const root = `workspaces/${workspace.id}`; const project = await ok(owner, `${root}/projects`, { key: 'FIND', name: 'Readable project' }); const tasks = `${root}/projects/${project.id}/tasks`; const task = await ok(owner, tasks, { title: 'Literal %_ Find Me', assigneePrincipalId: owner.principalId }); return { owner, workspace, root, project, tasks, task }; }
  async function join(f, role) { const person = await human(); const invitation = await ok(f.owner, `${f.root}/invitations`, { recipientEmail: person.email, role }); await ok(person, 'workspace-invitations/accept', { token: invitation.token }); return person; }
  async function page(f, user = f.owner, query = '') { const result = await ok(user, `${f.root}/task-discovery${query ? `?${query}` : ''}`); assert.ok(isTaskDiscoveryPage(result)); return result; }
  const f = await fixture(); const member = await join(f, 'member'); const viewer = await join(f, 'viewer'); const admin = await join(f, 'admin'); const foreign = await fixture();
  const secret = await ok(f.owner, `${f.root}/projects`, { key: 'HIDE', name: 'Private project', visibility: 'private' }); const privateTasks = `${f.root}/projects/${secret.id}/tasks`; const privateTask = await ok(f.owner, privateTasks, { title: 'Hidden classified title' });
  await t.test('additive migration preserves retained historical outbox payload/identity/timestamps and assigns unique positive cursors', async () => {
    const schema = `t10_migration_${randomUUID().replaceAll('-', '')}`; const connection = await pool.connect();
    try {
      await connection.query(`CREATE SCHEMA ${schema}`); await connection.query(`SET search_path TO ${schema},public`);
      await connection.query(`CREATE TABLE outbox_event(id text PRIMARY KEY,"workspaceId" text,"activityId" text,type text,payload jsonb,"createdAt" timestamp(3)); CREATE FUNCTION retain_domain_event() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''retained''; END'; CREATE TRIGGER retain_outbox BEFORE UPDATE OR DELETE ON outbox_event FOR EACH ROW EXECUTE FUNCTION retain_domain_event(); CREATE FUNCTION fence_principal_policy() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NULL; END'; INSERT INTO outbox_event VALUES ('old-a','w','activity-a','domain.activity','{"activityId":"activity-a"}',now()),('old-b','w','activity-b','domain.activity','{"activityId":"activity-b"}',now())`);
      const before = (await connection.query('SELECT id,"workspaceId","activityId",type,payload,"createdAt" FROM outbox_event ORDER BY id')).rows;
      await connection.query(await readFile(new URL('../prisma/migrations/20261101203000_task_discovery/migration.sql', import.meta.url), 'utf8'));
      assert.deepEqual((await connection.query('SELECT id,"workspaceId","activityId",type,payload,"createdAt" FROM outbox_event ORDER BY id')).rows, before);
      assert.deepEqual((await connection.query('SELECT sequence FROM outbox_event ORDER BY sequence')).rows.map(row => row.sequence), ['1', '2']);
      const next = await connection.query(`INSERT INTO outbox_event(id,sequence) VALUES('new',999) RETURNING sequence`); assert.equal(next.rows[0].sequence, '3');
      await assert.rejects(connection.query(`UPDATE outbox_event SET payload='{}' WHERE id='old-a'`), /retained/);
    } finally { await connection.query('ROLLBACK'); await connection.query('SET search_path TO public'); await connection.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); connection.release(); }
  });
  await t.test('authorized ID/title/counts, strict My tasks assignment, literal search and existing filters', async () => {
    const assigned = await ok(f.owner, f.tasks, { title: 'Assigned to collaborator', assigneePrincipalId: member.principalId, priority: 'high', status: 'todo' }); const created = await ok(member, f.tasks, { title: 'Created by collaborator without assignment' });
    const mine = await page(f, member, 'scope=mine'); assert.deepEqual(mine.items.map(row => row.id), [assigned.id]); assert.equal(mine.items[0].creator.principalId, f.owner.principalId); assert.equal(created.assigneePrincipalId, null);
    assert.equal((await page(f, member, 'scope=mine&status=done')).total, 0); assert.equal((await page(f, member, 'scope=mine&status=todo&priority=high')).total, 1);
    assert.equal((await page(f, member, 'q=%25_')).total, 1);
    for (const query of [`q=${f.task.id}`, 'q=find-1', 'q=FIND%20ME']) assert.equal((await page(f, member, query)).items[0].id, f.task.id);
    assert.equal((await page(f, member, 'q=FIND-9999999999')).total, 0);
    for (const user of [member, viewer]) { const result = await page(f, user); assert.equal(result.total, 3); assert.ok(!JSON.stringify(result).includes(secret.id)); assert.ok(!JSON.stringify(result).includes(privateTask.title)); }
    for (const user of [f.owner, admin]) assert.ok((await page(f, user)).items.some(row => row.id === privateTask.id));
    assert.equal((await page(f, member, `q=${privateTask.id}`)).total, 0); assert.equal((await page(f, member, `q=${foreign.task.id}`)).total, 0);
    assert.equal((await request(member, `${foreign.root}/task-discovery`)).status, 403);
    for (const query of ['scope=mine&scope=search', 'scope=mine&assignee=other', 'view=active&view=archived', 'q=x&q=y', 'q=%00', 'label=x', 'sprint=x']) assert.equal((await request(member, `${f.root}/task-discovery?${query}`)).status, 400);
    assert.equal((await request(member, `${f.root}/task-discovery?project=${secret.id}`)).status, 403);
    assert.ok((await page(f, viewer)).items.every(row => !row.capabilities.canEdit && !('description' in row)));
  });
  await t.test('100-row keyset paging binds principal/filter/revision and hidden changes cannot alter pages', async () => {
    await db.task.createMany({ data: Array.from({ length: 105 }, (_, n) => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, number: 1000 + n, title: `Page witness ${n}`, createdByPrincipalId: f.owner.principalId, creationMode: 'human', creationSource: 'web' })) });
    const first = await page(f, member); assert.equal(first.items.length, 100); assert.ok(first.nextCursor);
    await ok(f.owner, privateTasks, { title: 'More hidden content' }); const unchanged = await page(f, member); assert.equal(unchanged.revision, first.revision);
    const second = await page(f, member, `cursor=${first.nextCursor}`); assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, first.total);
    assert.equal((await request(viewer, `${f.root}/task-discovery?cursor=${first.nextCursor}`)).status, 400);
    assert.equal((await request(member, `${f.root}/task-discovery?status=todo&cursor=${first.nextCursor}`)).status, 400);
    await ok(f.owner, f.tasks, { title: 'Changed authorized snapshot' }); assert.equal((await request(member, `${f.root}/task-discovery?cursor=${first.nextCursor}`)).data.code, 'page-changed');
  });
  await t.test('delegated and autonomous subjects use own assignment/access/grant ceiling and current revocation', async () => {
    const web = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context; const agentId = await principals.registerAgent(web, { name: 'Finder Agent', role: 'member', custodianPrincipalId: f.owner.principalId });
    await ok(f.owner, f.tasks, { title: 'Agent assignment', assigneePrincipalId: agentId });
    for (const [subjectPrincipalId, mode] of [[f.owner.principalId, 'delegated'], [agentId, 'autonomous']]) { const grant = await principals.recordInternalGrant(web, { subjectPrincipalId, mode, allowedOperations: ['read'], expiresAt: new Date(Date.now() + 3600000) }); const context = await principals.internalGrantContext(grant, f.workspace.id); const result = await discovery.page(context, f.workspace.id, { scope: 'mine', q: '', filters: {}, view: 'active' }); assert.ok(result.items.every(row => row.assigneePrincipalId === subjectPrincipalId && !row.capabilities.canEdit)); assert.equal(result.total, 1); assert.equal((await discovery.page(context, f.workspace.id, { scope: 'search', q: privateTask.id, filters: {}, view: 'active' })).total, mode === 'delegated' ? 1 : 0); await principals.revokeGrant(web, grant); await assert.rejects(discovery.page(context, f.workspace.id, { scope: 'mine', q: '', filters: {}, view: 'active' })); }
  });
  await t.test('archive/restore views retain identity and current permissions including project archive', async () => {
    const row = await ok(f.owner, f.tasks, { title: 'Archive discovery witness' });
    await ok(f.owner, `${f.tasks}/${row.id}/archive`, { expectedVersion: row.version }); assert.equal((await page(f, member, `q=${row.id}`)).total, 0); assert.equal((await page(f, member, `view=archived&q=${row.id}`)).items[0].id, row.id);
    const archived = await ok(f.owner, `${f.tasks}/${row.id}`); await ok(f.owner, `${f.tasks}/${row.id}/restore`, { expectedVersion: archived.version });
    const project = await ok(f.owner, `${f.root}/projects/${f.project.id}`); const frozen = await ok(f.owner, `${f.root}/projects/${f.project.id}/archive`, { expectedVersion: project.version });
    assert.equal((await page(f, member, `q=${row.id}`)).total, 0); const old = await page(f, member, `view=archived&q=${row.id}`); assert.equal(old.total, 1); assert.equal(old.items[0].capabilities.canEdit, false);
    await ok(f.owner, `${f.root}/projects/${f.project.id}/restore`, { expectedVersion: frozen.version });
  });
  await t.test('per-session admission and slow-reader backpressure close without a producer queue', async () => {
    const streams = [];
    try { for (let n = 0; n < 4; n++) streams.push(await openEventStream(url, f.workspace.id, f.owner.cookie));
      const rejected = await fetch(`${url}/api/v1/${f.root}/events`, { headers: { cookie: f.owner.cookie } }); assert.equal(rejected.status, 503); await rejected.body.cancel();
    } finally { await Promise.all(streams.map(stream => stream.close())); }
    for (let n = 0; n < 50 && events.connections.size; n++) await delay(20);
    const web = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const slow = new EventEmitter(); Object.assign(slow, { destroyed: false, headersSent: false, ended: false, writes: 0, setHeader() {}, flushHeaders() { this.headersSent = true; }, write() { this.writes++; return false; }, end() { this.ended = true; } });
    await events.serve(web, f.workspace.id, slow); assert.equal(slow.ended, true); assert.equal(slow.writes, 1); assert.equal(events.connections.size, 0);
  });
  await t.test('multi-project hydration is one bounded membership batch and every SSE poll uses only current id/version metadata', async () => {
    for (let n = 0; n < 5; n++) { const project = await ok(f.owner, `${f.root}/projects`, { key: `BAT${n}`, name: `Batched result ${n}` }); await ok(f.owner, `${f.root}/projects/${project.id}/tasks`, { title: 'Batched witness', assigneePrincipalId: member.principalId }); }
    let policy = await ok(f.owner, `${f.root}/projects/${secret.id}`); policy = await ok(f.owner, `${f.root}/projects/${secret.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'active' });
    for (const person of [f.owner, admin, member]) await ok(f.owner, privateTasks, { title: 'BatchScoped private assignment', assigneePrincipalId: person.principalId });
    await ok(f.owner, `${f.root}/projects/${secret.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'revoked' });
    let batches = 0; let authorizationReads = 0; const projections = [];
    identity.runtime.prisma = db.$extends({ query: {
      membership: { findMany({ args, query }) { batches++; assert.ok(args.where.principalId.in.length <= 200); return query(args); }, findUnique({ args, query }) { authorizationReads++; return query(args); } },
      project: { findMany({ args, query }) { projections.push(args.select); return query(args); } },
    } });
    let stream;
    try {
      const result = await page(f, f.owner, 'q=Batched'); assert.equal(result.items.length, 5); assert.equal(new Set(result.items.map(row => row.projectId)).size, 5); assert.ok(result.items.every(row => row.assignee.active)); assert.equal(batches, 1);
      const historical = await page(f, f.owner, 'q=BatchScoped'); assert.equal(batches, 2); assert.equal(historical.items.length, 3);
      assert.equal(historical.items.find(row => row.assigneePrincipalId === member.principalId).assignee.active, false);
      for (const person of [f.owner, admin]) assert.equal(historical.items.find(row => row.assigneePrincipalId === person.principalId).assignee.active, true);
      assert.ok(historical.items.every(row => row.assignee.name && row.creator.principalId === f.owner.principalId));
      projections.length = 0; authorizationReads = 0;
      stream = await openEventStream(url, f.workspace.id, f.owner.cookie); await stream.wait(row => row.id); await delay(2200);
      assert.ok(projections.length >= 3); assert.ok(projections.every(select => JSON.stringify(select) === JSON.stringify({ id: true, version: true }))); assert.ok(authorizationReads >= projections.length);
    } finally { await stream?.close(); identity.runtime.prisma = db; }
  });
  await t.test('two sessions receive only committed authorized hints, rollback has no event, and abort cleans subscriptions', async () => {
    const one = await openEventStream(url, f.workspace.id, f.owner.cookie); const two = await openEventStream(url, f.workspace.id, member.cookie);
    try { await one.wait(row => row.data.type === 'reset'); await two.wait(row => row.data.type === 'reset'); const count = two.records.length;
      await ok(f.owner, privateTasks, { title: 'Hidden stream write' }); await delay(1150); assert.equal(two.records.length, count);
      const created = await ok(member, f.tasks, { title: 'Committed live task' }); for (const stream of [one, two]) { const event = await stream.wait(row => row.data.id === created.id); assert.deepEqual(event.data, { type: 'invalidate', entity: 'task', id: created.id, projectId: f.project.id, version: 1 }); assert.match(event.id, /^[0-9a-f-]{36}$/); }
      const before = await db.outboxEvent.count();
      await pool.query(`CREATE FUNCTION t10_fail_commit() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''test deferred rollback''; END'; CREATE CONSTRAINT TRIGGER t10_fail_commit AFTER INSERT ON task DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.title='Rollback stream witness') EXECUTE FUNCTION t10_fail_commit()`);
      try { assert.equal((await request(f.owner, f.tasks, { title: 'Rollback stream witness' })).status, 503); } finally { await pool.query('DROP TRIGGER t10_fail_commit ON task; DROP FUNCTION t10_fail_commit()'); }
      assert.equal(await db.outboxEvent.count(), before); await delay(1150); assert.ok(!JSON.stringify(two.records).includes('Rollback stream witness')); assert.equal(await db.task.count({ where: { title: 'Rollback stream witness' } }), 0);
    } finally { await one.close(); await two.close(); }
    for (let n = 0; n < 50 && events.connections.size; n++) await delay(20); assert.equal(events.connections.size, 0);
  });
  await t.test('outbox statement fence prevents allocated-uncommitted gaps and delayed transaction-start events remain discoverable', async () => {
    const activity = await db.activityEvent.findFirstOrThrow({ where: { workspaceId: f.workspace.id, taskId: { not: null } } }); const a = await pool.connect(); const b = await pool.connect();
    async function insert(connection) { const activityId = randomUUID(); const id = randomUUID(); await connection.query('INSERT INTO activity_event(id,"workspaceId","projectId","taskId","actorPrincipalId","executionMode",source,"requestId",action,"entityVersion","changedFields") VALUES($1,$2,$3,$4,$5,\'human\',\'web\',$6,\'edit-task\',1,ARRAY[\'title\'])', [activityId, f.workspace.id, f.project.id, f.task.id, f.owner.principalId, randomUUID()]); const result = await connection.query('INSERT INTO outbox_event(id,"workspaceId","activityId",type,payload) VALUES($1,$2,$3,\'domain.activity\',$4) RETURNING sequence', [id, f.workspace.id, activityId, JSON.stringify({ activityId })]); return BigInt(result.rows[0].sequence); }
    assert.ok(activity); try { await a.query('BEGIN'); const first = await insert(a); let done = false; const later = (async () => { await b.query('BEGIN'); const second = await insert(b); await b.query('COMMIT'); done = true; return second; })(); await delay(80); assert.equal(done, false); await a.query('COMMIT'); assert.ok(await later > first);
      await a.query('BEGIN'); const committedLaterStart = await insert(b); const delayedOldStart = await insert(a); await a.query('COMMIT'); assert.ok(delayedOldStart > committedLaterStart);
      await a.query('BEGIN'); const rollback = await insert(a); await a.query('ROLLBACK'); const after = await insert(b); assert.ok(after > rollback);
    } finally { await a.query('ROLLBACK'); await b.query('ROLLBACK'); a.release(); b.release(); }
  });
  await t.test('resume is session/workspace-bound, capped and expires; overflow resets and heartbeat is delivered', async () => {
    const first = await openEventStream(url, f.workspace.id, member.cookie); const initial = await first.wait(row => row.id); await first.close();
    const created = await ok(f.owner, f.tasks, { title: 'Resume witness' }); const resumed = await openEventStream(url, f.workspace.id, member.cookie, initial.id); await resumed.wait(row => row.data.id === created.id); await resumed.close();
    const wrong = await openEventStream(url, f.workspace.id, viewer.cookie, initial.id); assert.equal((await wrong.wait(row => row.id)).data.type, 'reset'); await wrong.close();
    if (events.handles.has(initial.id)) events.handles.get(initial.id).expires = 0;
    const expired = await openEventStream(url, f.workspace.id, member.cookie, initial.id); const baseline = await expired.wait(row => row.id); await expired.close();
    for (let n = 0; n < 101; n++) await ok(f.owner, f.tasks, { title: `Replay backlog ${n}` });
    const overflow = await openEventStream(url, f.workspace.id, member.cookie, baseline.id); assert.equal((await overflow.wait(row => row.id)).data.type, 'reset'); await overflow.wait(row => row.data.type === 'heartbeat', 18000); await overflow.close();
    assert.ok(events.handles.size <= 512); const sessionCounts = new Map(); for (const value of events.handles.values()) sessionCounts.set(value.binding, (sessionCounts.get(value.binding) ?? 0) + 1); assert.ok([...sessionCounts.values()].every(n => n <= 32));
  });
  await t.test('privacy/access changes reevaluate subscriptions and expired or removed sessions close with generic denial', async () => {
    let policy = await ok(f.owner, `${f.root}/projects/${secret.id}`); policy = await ok(f.owner, `${f.root}/projects/${secret.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'active' });
    const stream = await openEventStream(url, f.workspace.id, member.cookie); await stream.wait(row => row.id); const start = stream.records.length;
    await ok(f.owner, `${f.root}/projects/${secret.id}/access/${member.principalId}`, { expectedVersion: policy.version, state: 'revoked' }); await stream.wait(row => row.data.type === 'reset' && stream.records.indexOf(row) >= start);
    await ok(f.owner, privateTasks, { title: 'Post revocation hidden' }); await delay(1150); assert.ok(stream.records.slice(start).every(row => row.data.id !== privateTask.id && row.data.projectId !== secret.id)); assert.equal((await page(f, member, `q=${privateTask.id}`)).total, 0);
    await db.session.update({ where: { id: member.sessionId }, data: { expiresAt: new Date(Date.now() - 1000) } }); await stream.wait(row => row.data.type === 'denied' && row.data.reason === 'signed-out'); await stream.close();
    const removed = await openEventStream(url, f.workspace.id, viewer.cookie); await removed.wait(row => row.id); const visibilityStart = removed.records.length;
    const beforePrivacy = await ok(f.owner, `${f.root}/projects/${f.project.id}`); const madePrivate = await ok(f.owner, `${f.root}/projects/${f.project.id}/visibility`, { expectedVersion: beforePrivacy.version, visibility: 'private' });
    await removed.wait(row => row.data.type === 'reset' && removed.records.indexOf(row) >= visibilityStart); assert.equal((await page(f, viewer, `q=${f.task.id}`)).total, 0);
    await ok(f.owner, f.tasks, { title: 'After midstream privacy change' }); await delay(1150); assert.ok(removed.records.slice(visibilityStart).every(row => row.data.projectId !== f.project.id));
    await ok(f.owner, `${f.root}/projects/${f.project.id}/visibility`, { expectedVersion: madePrivate.version, visibility: 'workspace' });
    const web = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context; await principals.updateMember(web, viewer.principalId, { state: 'revoked' }); await removed.wait(row => row.data.type === 'denied' && row.data.reason === 'forbidden'); await removed.close();
    const hostile = await fetch(`${url}/api/v1/${f.root}/events`, { headers: { cookie: f.owner.cookie, origin: 'https://foreign.test' } }); assert.equal(hostile.status, 403); await hostile.body.cancel();
  });
});
