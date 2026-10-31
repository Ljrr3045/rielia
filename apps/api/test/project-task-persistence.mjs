// Test-only container-restart witness. Never imported by production code.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';

const [mode, path] = process.argv.slice(2);
assert.ok(['snapshot', 'verify'].includes(mode) && path);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function snapshot() {
  const rows = await pool.query(`SELECT jsonb_build_object(
    'projects',(SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM project p),
    'tasks',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM task t),
    'access',(SELECT jsonb_agg(to_jsonb(a) ORDER BY "workspaceId","projectId","principalId") FROM project_access a),
    'checklist',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM checklist_item c),
    'comments',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM task_comment c),
    'activity',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM activity_event a),
    'outbox',(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM outbox_event o),
    'receipts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY "workspaceId","actorPrincipalId","executionScope",key) FROM project_task_operation r)) AS data`);
  const data = rows.rows[0].data; assert.ok(data.projects.length && data.tasks.length && data.access.length && data.activity.length && data.outbox.length && data.receipts.length);
  return { digest: createHash('sha256').update(JSON.stringify(data)).digest('hex'), counts: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.length])) };
}
let app;
try {
  if (mode === 'snapshot') await writeFile(path, JSON.stringify(await snapshot()), { mode: 0o600 });
  else {
    assert.deepEqual(await snapshot(), JSON.parse(await readFile(path, 'utf8')));
    app = await NestFactory.create(AppModule, createHttpAdapter(), { bodyParser: false, logger: false }); configureApplication(app); await app.listen(0, '127.0.0.1'); const origin = await app.getUrl();
    const sample = await pool.query(`SELECT t.id,t."workspaceId",t."projectId",p."nextTaskNumber",s.token FROM task t JOIN project p ON p.id=t."projectId" JOIN principal h ON h.id=p."createdByPrincipalId"
      JOIN session s ON s."userId"=h."userId" JOIN membership m ON m."workspaceId"=p."workspaceId" AND m."principalId"=h.id
      WHERE p."archivedAt" IS NULL AND t."archivedAt" IS NULL AND h.state='active' AND m.state='active' AND m.role IN ('owner','admin','member') AND s."expiresAt">now()
      AND project_principal_can_read(p."workspaceId",p.id,h.id) LIMIT 1`);
    const row = sample.rows[0]; assert.ok(row);
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${row.token}.${await makeSignature(row.token, process.env.BETTER_AUTH_SECRET)}`)}`;
    const requestPath = `${origin}/api/v1/workspaces/${row.workspaceId}/projects/${row.projectId}/tasks`;
    const detail = await fetch(`${requestPath}/${row.id}`, { headers: { cookie } }); assert.equal(detail.status, 200); assert.equal((await detail.json()).id, row.id);
    const created = await fetch(requestPath, { method: 'POST', headers: { cookie, origin: process.env.BETTER_AUTH_URL, 'content-type': 'application/json', 'idempotency-key': randomUUID() }, body: JSON.stringify({ title: 'After PostgreSQL container restart' }) });
    assert.equal(created.status, 201); assert.equal((await created.json()).number, row.nextTaskNumber);
    const denied = await pool.query(`SELECT a."workspaceId",a."projectId",s.token FROM project_access a JOIN principal h ON h.id=a."principalId" JOIN session s ON s."userId"=h."userId" JOIN project p ON p.id=a."projectId"
      WHERE p.visibility='private' AND h.state='active' AND s."expiresAt">now() AND NOT project_principal_can_read(a."workspaceId",a."projectId",h.id) LIMIT 1`);
    assert.ok(denied.rows[0]); const removed = denied.rows[0]; const removedCookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${removed.token}.${await makeSignature(removed.token, process.env.BETTER_AUTH_SECRET)}`)}`;
    const revoked = await fetch(`${origin}/api/v1/workspaces/${removed.workspaceId}/projects/${removed.projectId}`, { headers: { cookie: removedCookie } }); assert.equal(revoked.status, 403);
    console.log('Project/task content, access/revocation, attribution, versions, counters, activity, outbox and receipts survived PostgreSQL container restart; real Nest reads, denied access and next allocation passed.');
  }
} finally { await app?.close(); await pool.end(); }
