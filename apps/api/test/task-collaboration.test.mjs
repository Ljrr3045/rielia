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
import { TaskCollaborationService } from '../dist/projects/task-collaboration.service.js';
import { isCollaborationPage } from '@rielia/contracts';

test('T09 real PostgreSQL/NodeAdapter collaboration, security and atomic recovery', async t => {
  const app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false }); configureApplication(app); await app.listen(0, '127.0.0.1');
  const url = await app.getUrl(); const identity = app.get(IdentityService); const db = identity.runtime.prisma; const principals = app.get(PrincipalService); const service = app.get(TaskCollaborationService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 }); t.after(async () => { await pool.end(); await app.close(); });
  async function human() {
    const id = randomUUID(); const email = `${id}@example.test`; await db.user.create({ data: { id, name: 'Collaboration Human', email, emailVerified: true } });
    const principal = await db.principal.findUniqueOrThrow({ where: { userId: id } }); const token = randomUUID();
    await db.session.create({ data: { id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 86400000) } });
    return { id, email, principalId: principal.id, cookie: `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}` };
  }
  async function request(user, path, body, key = randomUUID(), headers = {}, signal) {
    const response = await fetch(`${url}/api/v1/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(user ? { cookie: user.cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json', origin: identity.config.origin, 'idempotency-key': key }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal });
    assert.equal(response.headers.get('cache-control'), 'no-store'); if (path.includes('/projects')) assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
    return { status: response.status, data: await response.json() };
  }
  async function ok(user, path, body, key) { const response = await request(user, path, body, key); assert.ok(response.status >= 200 && response.status < 300, JSON.stringify(response)); return response.data; }
  async function fixture() {
    const owner = await human(); const workspace = await ok(owner, 'workspaces', { name: 'Collaboration tenant' }); const root = `workspaces/${workspace.id}`;
    const project = await ok(owner, `${root}/projects`, { key: 'COL', name: 'Collaboration project' }); const path = `${root}/projects/${project.id}`; const tasks = `${path}/tasks`;
    const task = await ok(owner, tasks, { title: 'Parent' }); return { owner, workspace, root, project, path, tasks, task, detail: `${tasks}/${task.id}` };
  }
  async function join(f, role = 'member') { const user = await human(); const issued = await ok(f.owner, `${f.root}/invitations`, { recipientEmail: user.email, role }); await ok(user, 'workspace-invitations/accept', { token: issued.token }); return user; }
  async function change(f, suffix, fields, user = f.owner, key) { const row = await ok(user, f.detail); return ok(user, `${f.detail}/${suffix}`, { expectedVersion: row.version, ...fields }, key); }
  async function page(f, collection, user = f.owner, query = '') { const value = await ok(user, `${f.detail}/${collection}${query}`); assert.ok(isCollaborationPage(value, collection), collection); return value; }
  const counts = () => Promise.all([db.task.count(), db.checklistItem.count(), db.taskComment.count(), db.activityEvent.count(), db.outboxEvent.count(), db.projectTaskOperation.count()]);

  await t.test('actual additive migration preserves archived legacy task fields/versions and leaves legacy events without invented snapshots', async () => {
    const schema = `t09_migration_${randomUUID().replaceAll('-', '')}`; const connection = await pool.connect();
    try {
      await connection.query(`CREATE SCHEMA ${schema}`); await connection.query(`SET search_path TO ${schema}, public`);
      await connection.query('CREATE TABLE project(id text PRIMARY KEY,"workspaceId" text,"archivedAt" timestamp(3)); CREATE TABLE task(id text PRIMARY KEY,"workspaceId" text,"projectId" text,number integer,status text,version integer,"archivedAt" timestamp(3),UNIQUE("workspaceId","projectId",id)); CREATE TABLE membership("workspaceId" text,"principalId" text,UNIQUE("workspaceId","principalId")); CREATE TABLE execution_grant("workspaceId" text,id text,"subjectPrincipalId" text,UNIQUE("workspaceId",id,"subjectPrincipalId")); CREATE TABLE activity_event(id text,"workspaceId" text,"projectId" text,"taskId" text,"createdAt" timestamp(3),action text CONSTRAINT activity_event_action_check CHECK(action IN (\'edit-task\')))');
      await connection.query(`CREATE FUNCTION fence_principal_policy() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NULL; END'; CREATE FUNCTION preserve_old_task() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''legacy row edited''; END'; INSERT INTO project VALUES ('p','w',now()); INSERT INTO task VALUES ('t','w','p',17,'todo',9,now()); INSERT INTO activity_event VALUES ('event','w','p','t',now(),'edit-task'); CREATE TRIGGER preserve_old_task BEFORE UPDATE ON task FOR EACH ROW EXECUTE FUNCTION preserve_old_task()`);
      const before = (await connection.query('SELECT id,number,status,version,"archivedAt" FROM task')).rows;
      await connection.query(await readFile(new URL('../prisma/migrations/20261031170000_task_collaboration/migration.sql', import.meta.url), 'utf8'));
      assert.deepEqual((await connection.query('SELECT id,number,status,version,"archivedAt" FROM task')).rows, before);
      assert.equal((await connection.query('SELECT "parentTaskId" FROM task')).rows[0].parentTaskId, null); assert.equal((await connection.query('SELECT changes FROM activity_event')).rows[0].changes, null);
    } finally { await connection.query('ROLLBACK'); await connection.query('SET search_path TO public'); await connection.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); connection.release(); }
  });

  await t.test('same-project single-level create/link/unlink, SQL invariants and opposing-link race', async () => {
    const f = await fixture(); const foreign = await fixture();
    const child = await ok(f.owner, f.tasks, { title: 'Child', parentTaskId: f.task.id, expectedParentVersion: f.task.version }); assert.equal(child.parentTaskId, f.task.id); assert.equal(child.assignee, null);
    const relations = await page(f, 'relations'); assert.equal(relations.items[0].id, child.id); assert.equal(relations.open, 1);
    const childPath = `${f.tasks}/${child.id}`;
    assert.equal((await request(f.owner, f.tasks, { title: 'Grandchild', parentTaskId: child.id, expectedParentVersion: child.version })).status, 400);
    for (const parentTaskId of [f.task.id, foreign.task.id, randomUUID()]) assert.equal((await request(f.owner, `${f.detail}/parent`, { expectedVersion: f.task.version, parentTaskId, expectedParentVersion: 1 })).status, 400);
    await assert.rejects(pool.query('UPDATE task SET "parentTaskId"=id WHERE id=$1', [f.task.id]));
    await assert.rejects(pool.query('UPDATE task SET "parentTaskId"=$1 WHERE id=$2', [foreign.task.id, child.id]));
    await assert.rejects(pool.query('UPDATE task SET "parentTaskId"=$1 WHERE id=$2', [child.id, f.task.id]));
    const detached = await ok(f.owner, `${childPath}/parent`, { expectedVersion: child.version, parentTaskId: null }); assert.equal(detached.parentTaskId, null);
    const candidates = await ok(f.owner, `${childPath}/parent-candidates`); assert.equal(candidates.items[0].id, f.task.id);
    const a = await ok(f.owner, f.tasks, { title: 'A' }); const b = await ok(f.owner, f.tasks, { title: 'B' });
    const race = await Promise.all([[a, b], [b, a]].map(([task, parent]) => request(f.owner, `${f.tasks}/${task.id}/parent`, { expectedVersion: task.version, parentTaskId: parent.id, expectedParentVersion: parent.version })));
    assert.deepEqual(race.map(row => row.status).sort(), [201, 400]);
    const stored = await db.task.findMany({ where: { id: { in: [a.id, b.id] } } }); assert.equal(stored.filter(row => row.parentTaskId).length, 1);
  });
  await t.test('hierarchy checks skip real rank compaction and inspect final transaction rows for indexed relationship changes', async () => {
    const f = await fixture(); const child = await ok(f.owner, f.tasks, { title: 'Child', parentTaskId: f.task.id, expectedParentVersion: f.task.version }); const moving = await ok(f.owner, f.tasks, { title: 'Moving root', status: 'todo' });
    await pool.query('UPDATE task SET rank=CASE WHEN id=$1 THEN 1 ELSE 2 END WHERE id=ANY($2::text[])', [f.task.id, [f.task.id, child.id]]);
    const original = (await pool.query("SELECT pg_get_functiondef('check_task_hierarchy()'::regprocedure) AS definition")).rows[0].definition;
    await pool.query(`CREATE OR REPLACE FUNCTION check_task_hierarchy() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''hierarchy check invoked'' USING ERRCODE=''23514''; END'`);
    try {
      const current = await ok(f.owner, `${f.tasks}/${moving.id}`);
      const moved = await ok(f.owner, `${f.tasks}/${moving.id}/move`, { expectedVersion: current.version, expectedOrderVersion: current.orderVersion, status: 'backlog', beforeTaskId: child.id });
      assert.equal(moved.status, 'backlog'); assert.ok((await ok(f.owner, f.detail)).version > f.task.version);
      await pool.query('UPDATE task SET title=title,"parentTaskId"="parentTaskId" WHERE id=$1', [child.id]);
      await assert.rejects(pool.query('UPDATE task SET "parentTaskId"=$1 WHERE id=$2', [f.task.id, moving.id]), /hierarchy check invoked/);
    } finally { await pool.query(original); }
    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      // Temporarily grandchild-shaped, but final state has just one level.
      await connection.query('UPDATE task SET "parentTaskId"=$1 WHERE id=$2', [moving.id, f.task.id]);
      await connection.query('UPDATE task SET "parentTaskId"=NULL WHERE id=$1', [child.id]); await connection.query('COMMIT');
      assert.equal((await ok(f.owner, f.detail)).parentTaskId, moving.id);
      await connection.query('BEGIN'); await connection.query('UPDATE task SET "parentTaskId"=$1 WHERE id=$2', [f.task.id, child.id]);
      await assert.rejects(connection.query('COMMIT'), /one level/); await connection.query('ROLLBACK');
      assert.equal((await ok(f.owner, `${f.tasks}/${child.id}`)).parentTaskId, null);
    } finally { await connection.query('ROLLBACK'); connection.release(); }
  });
  await t.test('both close paths warn, stale child acknowledgments fail, and parent close/archive never hides or changes children', async () => {
    const f = await fixture(); const child = await ok(f.owner, f.tasks, { title: 'Open child', parentTaskId: f.task.id, expectedParentVersion: 1 });
    const before = await counts(); const initial = await ok(f.owner, f.detail);
    const warning = await request(f.owner, f.detail, { expectedVersion: initial.version, status: 'done' }); assert.equal(warning.data.code, 'open-children'); assert.equal(warning.data.closeWarning.open, 1); assert.deepEqual(await counts(), before);
    const archivedChild = await ok(f.owner, `${f.tasks}/${child.id}/archive`, { expectedVersion: child.version });
    const stale = await request(f.owner, f.detail, { expectedVersion: initial.version, status: 'done', acknowledgedChildrenVersion: warning.data.closeWarning.childrenVersion }); assert.equal(stale.data.code, 'open-children'); assert.equal(stale.data.closeWarning.archivedOpen, 1);
    const current = await ok(f.owner, f.detail); const move = { expectedVersion: current.version, expectedOrderVersion: current.orderVersion, status: 'canceled', beforeTaskId: null };
    assert.equal((await request(f.owner, `${f.detail}/move`, move)).data.code, 'open-children');
    const done = await ok(f.owner, `${f.detail}/move`, { ...move, acknowledgedChildrenVersion: current.orderVersion }); assert.equal(done.status, 'canceled');
    assert.deepEqual((await ok(f.owner, `${f.tasks}/${child.id}`)).version, archivedChild.version);
    await ok(f.owner, `${f.tasks}/${child.id}/restore`, { expectedVersion: archivedChild.version });
    const archivedParent = await ok(f.owner, `${f.detail}/archive`, { expectedVersion: done.version });
    const childNow = await ok(f.owner, `${f.tasks}/${child.id}`); await ok(f.owner, `${f.tasks}/${child.id}`, { expectedVersion: childNow.version, title: 'Independently writable child' });
    assert.ok((await ok(f.owner, f.tasks)).items.some(row => row.id === child.id));
    assert.equal((await request(f.owner, `${f.tasks}/${child.id}/parent`, { expectedVersion: childNow.version + 1, parentTaskId: null })).status, 409);
    await ok(f.owner, `${f.detail}/restore`, { expectedVersion: archivedParent.version });
  });
  await t.test('checklist text/order/toggle/retained removal, anchors, limit and aggregate concurrent edits', async () => {
    const f = await fixture(); await change(f, 'checklist', { text: 'First', beforeItemId: null }); const first = (await page(f, 'checklist')).items[0];
    await change(f, 'checklist', { text: 'Second', beforeItemId: first.id }); let rows = (await page(f, 'checklist')).items; assert.deepEqual(rows.map(row => row.text), ['Second', 'First']);
    assert.equal(rows[0].capabilities.canMoveUp, false); assert.equal(rows[1].moveUpBeforeItemId, rows[0].id);
    await change(f, `checklist/${first.id}/move`, { beforeItemId: rows[0].id }); await change(f, `checklist/${first.id}`, { completed: true, text: 'Edited' });
    assert.equal((await ok(f.owner, f.detail)).status, 'backlog'); assert.equal((await page(f, 'checklist')).items[0].completed, true);
    const row = await ok(f.owner, f.detail); const race = await Promise.all([true, false].map(completed => request(f.owner, `${f.detail}/checklist/${first.id}`, { expectedVersion: row.version, completed })));
    assert.deepEqual(race.map(value => value.status).sort(), [201, 409]);
    const before = await counts(); for (const fields of [{ text: '', beforeItemId: null }, { text: 'x'.repeat(501), beforeItemId: null }, { text: 'x', beforeItemId: randomUUID() }]) assert.equal((await request(f.owner, `${f.detail}/checklist`, { expectedVersion: (await ok(f.owner, f.detail)).version, ...fields })).status, 400);
    assert.deepEqual(await counts(), before);
    await change(f, `checklist/${first.id}/remove`, {}); assert.equal((await page(f, 'checklist')).items.length, 1); assert.ok((await db.checklistItem.findUnique({ where: { id: first.id } })).removedAt);
    await assert.rejects(pool.query('DELETE FROM checklist_item WHERE id=$1', [first.id]));
    const data = Array.from({ length: 99 }, (_, index) => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, taskId: f.task.id, text: `Item ${index}`, position: index + 2 })); await db.checklistItem.createMany({ data });
    assert.equal((await page(f, 'checklist')).capabilities.canCreate, false);
    assert.equal((await request(f.owner, `${f.detail}/checklist`, { expectedVersion: (await ok(f.owner, f.detail)).version, text: 'Overflow', beforeItemId: null })).status, 400);
  });
  await t.test('comment own-author editing, immutable attribution, spoofing and independent comment optimistic versions', async () => {
    const f = await fixture(); const member = await join(f); const body = '<script>alert(1)</script> [unsafe](javascript:alert) **Markdown**';
    await change(f, 'comments', { body }, member); let comment = (await page(f, 'comments', member)).items[0]; assert.equal(comment.author.principalId, member.principalId); assert.equal(comment.editedAt, null); assert.equal(comment.body, body);
    assert.equal((await page(f, 'comments')).items[0].capabilities.canEdit, false);
    assert.equal((await request(f.owner, `${f.detail}/comments/${comment.id}`, { expectedVersion: (await ok(f.owner, f.detail)).version, expectedCommentVersion: 1, body: 'Admin cannot rewrite another author' })).status, 403);
    await change(f, `comments/${comment.id}`, { expectedCommentVersion: 1, body: 'Author edit' }, member); const edited = (await page(f, 'comments', member)).items[0]; assert.equal(edited.version, 2); assert.ok(edited.editedAt); assert.deepEqual(edited.author, comment.author); assert.deepEqual(edited.provenance, comment.provenance);
    const row = await ok(member, f.detail); const stale = await request(member, `${f.detail}/comments/${comment.id}`, { expectedVersion: row.version, expectedCommentVersion: 1, body: 'Stale body' }); assert.equal(stale.data.code, 'comment-conflict');
    for (const extra of [{ authorPrincipalId: f.owner.principalId }, { source: 'mcp' }, { executionMode: 'autonomous' }]) assert.equal((await request(member, `${f.detail}/comments`, { expectedVersion: row.version, body: 'spoof', ...extra })).status, 400);
    for (const body of ['', ' ', 'x'.repeat(10001), '\0']) assert.equal((await request(member, `${f.detail}/comments`, { expectedVersion: row.version, body })).status, 400);
    await assert.rejects(pool.query('UPDATE task_comment SET "authorPrincipalId"=$1 WHERE id=$2', [f.owner.principalId, comment.id])); await assert.rejects(pool.query('DELETE FROM task_comment WHERE id=$1', [comment.id]));
    const review = await ok(member, `${f.detail}/comments/${comment.id}`); assert.equal(review.comment.version, 2); assert.equal(review.task.version, row.version);
    assert.equal((await request(member, `${f.detail}/comments/${randomUUID()}`)).status, 403);
  });
  await t.test('delegated human and autonomous authorship, restricted grants and revoked replay', async () => {
    const f = await fixture(); const web = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context;
    const agentId = await principals.registerAgent(web, { name: 'Collaboration Builder', role: 'member', custodianPrincipalId: f.owner.principalId });
    for (const [subjectPrincipalId, mode] of [[f.owner.principalId, 'delegated'], [agentId, 'autonomous']]) {
      const grant = await principals.recordInternalGrant(web, { subjectPrincipalId, mode, allowedOperations: ['read', 'write'], expiresAt: new Date(Date.now() + 3600000) }); const context = await principals.internalGrantContext(grant, f.workspace.id);
      const input = { expectedVersion: (await ok(f.owner, f.detail)).version, body: mode }; const key = randomUUID();
      const result = await service.mutate(context, f.workspace.id, f.project.id, f.task.id, key, randomUUID(), 'add-comment', input);
      const comment = (await service.page(context, f.workspace.id, f.project.id, f.task.id, 'comments')).items.find(row => row.body === mode); assert.equal(comment.author.principalId, subjectPrincipalId); assert.equal(comment.provenance.executionMode, mode); assert.equal(comment.provenance.grantId, grant);
      const before = await counts(); const replay = await service.mutate(context, f.workspace.id, f.project.id, f.task.id, key, randomUUID(), 'add-comment', input); assert.equal(replay.version, result.version); assert.deepEqual(await counts(), before);
      await principals.revokeGrant(web, grant); await assert.rejects(service.mutate(context, f.workspace.id, f.project.id, f.task.id, key, randomUUID(), 'add-comment', input));
    }
    const grant = await principals.recordInternalGrant(web, { subjectPrincipalId: agentId, mode: 'autonomous', allowedOperations: ['read'], expiresAt: new Date(Date.now() + 3600000) }); const read = await principals.internalGrantContext(grant, f.workspace.id);
    assert.equal((await service.page(read, f.workspace.id, f.project.id, f.task.id, 'comments')).capabilities.canCreate, false);
    await assert.rejects(service.mutate(read, f.workspace.id, f.project.id, f.task.id, randomUUID(), randomUUID(), 'add-comment', { expectedVersion: 1, body: 'denied' }));
  });
  await t.test('viewer/private/foreign/archive denial, current-authority replay and safe request boundary', async () => {
    const f = await fixture(); const viewer = await join(f, 'viewer'); const member = await join(f); const foreign = await fixture();
    assert.equal((await page(f, 'comments', viewer)).capabilities.canCreate, false); assert.equal((await request(viewer, `${f.detail}/comments`, { expectedVersion: 1, body: 'Denied' })).status, 403);
    const payload = { expectedVersion: 1, body: 'Member comment' }; const key = randomUUID(); await ok(member, `${f.detail}/comments`, payload, key);
    const privateProject = await ok(f.owner, `${f.path}/visibility`, { expectedVersion: f.project.version, visibility: 'private' });
    for (const collection of ['relations', 'parent-candidates', 'checklist', 'comments', 'history']) assert.equal((await request(member, `${f.detail}/${collection}`)).status, 403);
    assert.equal((await request(member, `${f.detail}/comments`, payload, key)).status, 403);
    assert.equal((await request(foreign.owner, `${f.detail}/history`)).status, 403);
    await ok(f.owner, `${f.path}/access/${member.principalId}`, { expectedVersion: privateProject.version, state: 'active' });
    const archived = await change(f, 'archive', {}); for (const suffix of ['comments', 'checklist', 'parent']) assert.equal((await request(f.owner, `${f.detail}/${suffix}`, { expectedVersion: archived.version, ...(suffix === 'comments' ? { body: 'Frozen' } : suffix === 'checklist' ? { text: 'Frozen', beforeItemId: null } : { parentTaskId: null }) })).status, 409);
    for (const [headers, code] of [[{ origin: 'https://evil.test' }, 403], [{ 'x-rielia-author-principal-id': f.owner.principalId }, 400], [{ 'content-type': 'text/plain' }, 400]]) assert.equal((await request(f.owner, `${f.detail}/comments`, { expectedVersion: archived.version, body: 'bad' }, randomUUID(), headers)).status, code);
    assert.equal((await request(f.owner, `${f.detail}/history?cursor=x&cursor=y`)).status, 400); assert.equal((await request(f.owner, `${f.detail}/history?secret=x`)).status, 400);
  });
  await t.test('paged relations/candidates/comments/history bind scope/revision/collection and legacy history never invents values', async () => {
    const f = await fixture(); const actor = { createdByPrincipalId: f.owner.principalId, creationMode: 'human', creationSource: 'web' };
    await db.task.createMany({ data: Array.from({ length: 102 }, (_, i) => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, title: `Child ${i}`, number: 1, parentTaskId: f.task.id, ...actor })) });
    const first = await page(f, 'relations'); assert.equal(first.items.length, 100); assert.equal(first.total, 102); const second = await page(f, 'relations', f.owner, `?cursor=${first.nextCursor}`); assert.equal(second.items.length, 2);
    await db.taskComment.createMany({ data: Array.from({ length: 102 }, (_, i) => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, taskId: f.task.id, body: `Paged ${i}`, authorPrincipalId: f.owner.principalId, creationMode: 'human', creationSource: 'web' })) });
    const comments = await page(f, 'comments'); assert.equal(comments.items.length, 100); const tail = await page(f, 'comments', f.owner, `?cursor=${comments.nextCursor}`); assert.equal(tail.items.length, 2); assert.equal(new Set([...comments.items, ...tail.items].map(row => row.id)).size, 102);
    const legacyId = randomUUID(); await db.activityEvent.create({ data: { id: legacyId, workspaceId: f.workspace.id, projectId: f.project.id, taskId: f.task.id, actorPrincipalId: f.owner.principalId, executionMode: 'human', source: 'web', requestId: 'private-correlation', action: 'edit-task', entityVersion: 1, changedFields: ['title', 'password-secret'] } });
    await db.activityEvent.createMany({ data: Array.from({ length: 102 }, () => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, taskId: f.task.id, actorPrincipalId: f.owner.principalId, executionMode: 'human', source: 'web', requestId: 'private-correlation', action: 'edit-task', entityVersion: 1, changedFields: ['title'] })) });
    let row = await ok(f.owner, f.detail); await ok(f.owner, f.detail, { expectedVersion: row.version, priority: 'high', status: 'todo' });
    const history = await page(f, 'history'); assert.equal(history.items.length, 100); const historyTail = await page(f, 'history', f.owner, `?cursor=${history.nextCursor}`); const events = [...history.items, ...historyTail.items]; assert.equal(new Set(events.map(row => row.id)).size, history.total);
    const legacy = events.find(row => row.id === legacyId); assert.deepEqual(legacy.changes, []); assert.deepEqual(legacy.fields, ['title']); assert.ok(!JSON.stringify(events).includes('private-correlation')); assert.ok(!JSON.stringify(events).includes('password-secret'));
    assert.ok(events.some(row => row.changes.some(change => change.field === 'priority' && change.before === 'none' && change.after === 'high')));
    assert.equal((await request(f.owner, `${f.detail}/history?cursor=${comments.nextCursor}`)).status, 400);
    await change(f, 'comments', { body: 'Invalidate pages' }); assert.equal((await page(f, 'comments')).items[0].body, 'Invalidate pages'); assert.equal((await request(f.owner, `${f.detail}/comments?cursor=${comments.nextCursor}`)).data.code, 'page-changed'); assert.equal((await request(f.owner, `${f.detail}/relations?cursor=${first.nextCursor}`)).data.code, 'page-changed');
    const oldest = tail.items.at(-1); await change(f, `comments/${oldest.id}`, { expectedCommentVersion: oldest.version, body: 'Older comment updated canonically' }); assert.equal((await page(f, 'comments')).items[0].id, oldest.id);
    const leaf = await ok(f.owner, f.tasks, { title: 'Candidate target' }); const candidates = await ok(f.owner, `${f.tasks}/${leaf.id}/parent-candidates`); assert.ok(candidates.items.every(row => row.id !== leaf.id)); assert.deepEqual(candidates.items.map(row => row.id), [f.task.id]);
    await db.task.createMany({ data: Array.from({ length: 102 }, (_, i) => ({ id: randomUUID(), workspaceId: f.workspace.id, projectId: f.project.id, title: `Candidate ${i}`, number: 1, ...actor })) });
    const parents = await ok(f.owner, `${f.tasks}/${leaf.id}/parent-candidates`); assert.equal(parents.items.length, 100); const parentsTail = await ok(f.owner, `${f.tasks}/${leaf.id}/parent-candidates?cursor=${parents.nextCursor}`); assert.equal(new Set([...parents.items, ...parentsTail.items].map(row => row.id)).size, 103);
  });
  await t.test('atomic deferred failure rolls back collaboration, task/project versions, activity, outbox and receipt', async () => {
    const f = await fixture();
    const snapshot = async () => (await pool.query(`SELECT jsonb_build_object('project',(SELECT to_jsonb(p) FROM project p WHERE id=$1),'task',(SELECT to_jsonb(t) FROM task t WHERE id=$2),'checklist',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM checklist_item c WHERE "taskId"=$2),'comments',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM task_comment c WHERE "taskId"=$2)) AS data`, [f.project.id, f.task.id])).rows[0].data;
    for (const table of ['checklist_item', 'task_comment', 'task', 'activity_event', 'outbox_event', 'project_task_operation']) {
      const before = await snapshot(); const total = await counts(); const suffix = table === 'checklist_item' ? 'checklist' : 'comments';
      await pool.query(`CREATE FUNCTION fail_t09() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''forced rollback'' USING ERRCODE=''23514''; END'; CREATE CONSTRAINT TRIGGER fail_t09 AFTER ${table === 'task' ? 'UPDATE' : 'INSERT'} ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fail_t09()`);
      try { assert.equal((await request(f.owner, `${f.detail}/${suffix}`, { expectedVersion: (await ok(f.owner, f.detail)).version, ...(suffix === 'checklist' ? { text: 'Rollback', beforeItemId: null } : { body: 'Rollback' }) })).status, 400); }
      finally { await pool.query(`DROP TRIGGER fail_t09 ON ${table}; DROP FUNCTION fail_t09()`); }
      assert.deepEqual(await snapshot(), before); assert.deepEqual(await counts(), total);
    }
  });
  await t.test('aborted HTTP comment can commit, then original-key retry recovers exactly once', async () => {
    const f = await fixture(); const key = randomUUID(); const input = { expectedVersion: 1, body: 'Unknown outcome' }; const before = await counts();
    await pool.query(`CREATE FUNCTION delay_t09() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN IF NEW.action=''add-comment'' THEN PERFORM pg_sleep(0.4); END IF; RETURN NEW; END'; CREATE TRIGGER delay_t09 AFTER INSERT ON activity_event FOR EACH ROW EXECUTE FUNCTION delay_t09()`);
    const abort = new AbortController(); let pending;
    try {
      pending = request(f.owner, `${f.detail}/comments`, input, key, {}, abort.signal).catch(error => error);
      let running = false; for (let i = 0; i < 100; i++) { const result = await pool.query("SELECT 1 FROM pg_stat_activity WHERE wait_event='PgSleep' AND query LIKE '%activity_event%'"); if (result.rowCount) { running = true; break; } await delay(10); }
      assert.ok(running); abort.abort(); await pending; await delay(450);
    } finally { await pool.query('DROP TRIGGER delay_t09 ON activity_event; DROP FUNCTION delay_t09()'); }
    const recovered = await ok(f.owner, `${f.detail}/comments`, input, key); assert.equal(recovered.version, 2); assert.deepEqual((await counts()).map((n, i) => n - before[i]), [0, 0, 1, 1, 1, 1]);
    assert.equal((await page(f, 'comments')).items.filter(row => row.body === input.body).length, 1);
    assert.equal((await request(f.owner, `${f.detail}/comments`, { ...input, body: 'Different payload' }, key)).status, 409);
  });
});
