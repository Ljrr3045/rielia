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
    'sprints',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM sprint s),
    'visits',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM sprint_participation v),
    'startReferences',(SELECT jsonb_agg(to_jsonb(r) ORDER BY "workspaceId","projectId","sprintId","participationId") FROM sprint_start_reference r),
    'scopeEvents',(SELECT jsonb_agg(to_jsonb(e) ORDER BY id) FROM sprint_scope_event e),
    'tasks',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM task t),
    'access',(SELECT jsonb_agg(to_jsonb(a) ORDER BY "workspaceId","projectId","principalId") FROM project_access a),
    'checklist',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM checklist_item c),
    'comments',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM task_comment c),
    'activity',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM activity_event a),
    'outbox',(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM outbox_event o),
    'receipts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY "workspaceId","actorPrincipalId","executionScope",key) FROM project_task_operation r)) AS data`);
  const data = rows.rows[0].data;
  assert.ok(
    data.projects.length &&
      data.sprints.length &&
      data.tasks.length &&
      data.visits.length &&
      data.startReferences.length &&
      data.scopeEvents.length &&
      data.access.length &&
      data.activity.length &&
      data.outbox.length &&
      data.receipts.length,
  );
  return {
    digest: createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    counts: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.length])),
  };
}
let app;
async function startApplication() {
  app = await NestFactory.create(AppModule, createHttpAdapter(), {
    bodyParser: false,
    logger: false,
  });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  return app.getUrl();
}
async function projectCookie(projectId) {
  const row = (
    await pool.query(
      `SELECT s.token FROM project p JOIN principal h ON h.id=p."createdByPrincipalId" JOIN session s ON s."userId"=h."userId" WHERE p.id=$1 AND s."expiresAt">now() LIMIT 1`,
      [projectId],
    )
  ).rows[0];
  assert.ok(row);
  return `__Secure-better-auth.session_token=${encodeURIComponent(`${row.token}.${await makeSignature(row.token, process.env.BETTER_AUTH_SECRET)}`)}`;
}
async function request(origin, cookie, path, body, key) {
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      cookie,
      ...(body === undefined
        ? {}
        : {
            origin: process.env.BETTER_AUTH_URL,
            'content-type': 'application/json',
            'idempotency-key': key,
          }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.ok(
    response.status >= 200 && response.status < 300,
    `Persistence witness HTTP ${response.status}`,
  );
  return response.json();
}
async function preparePlanningRetry() {
  const origin = await startApplication(),
    p = (
      await pool.query(
        `SELECT p.id,p."workspaceId" FROM project p JOIN principal h ON h.id=p."createdByPrincipalId" WHERE p.mode='scrum' AND p."archivedAt" IS NULL AND h.state='active' AND EXISTS(SELECT 1 FROM session s WHERE s."userId"=h."userId" AND s."expiresAt">now()) AND NOT EXISTS(SELECT 1 FROM sprint s WHERE s."projectId"=p.id AND s.state='active') LIMIT 1`,
      )
    ).rows[0];
  assert.ok(p);
  const cookie = await projectCookie(p.id),
    root = `workspaces/${p.workspaceId}/projects/${p.id}`,
    settings = await request(origin, cookie, `${root}/planning`),
    create = {
      path: `${root}/sprints`,
      key: randomUUID(),
      body: {
        expectedProjectVersion: settings.projectVersion,
        name: 'Restart witness',
        goal: 'Retain exact retry',
        startDate: '2026-11-19',
        endDateExclusive: '2026-11-20',
      },
    };
  const sprint = await request(origin, cookie, create.path, create.body, create.key),
    task = await request(
      origin,
      cookie,
      `${root}/tasks`,
      { title: 'Restart participant' },
      randomUUID(),
    );
  const assign = {
    path: `${root}/tasks/${task.id}/sprint`,
    key: randomUUID(),
    body: {
      expectedTaskVersion: task.version,
      expectedCurrentParticipationId: null,
      expectedSourceVersion: null,
      targetSprintId: sprint.id,
      expectedTargetVersion: sprint.version,
    },
  };
  const entered = await request(origin, cookie, assign.path, assign.body, assign.key),
    retainedTask = await request(
      origin,
      cookie,
      `${root}/tasks`,
      { title: 'Retained restart participant' },
      randomUUID(),
    ),
    retainedEntry = await request(
      origin,
      cookie,
      `${root}/tasks/${retainedTask.id}/sprint`,
      {
        expectedTaskVersion: retainedTask.version,
        expectedCurrentParticipationId: null,
        expectedSourceVersion: null,
        targetSprintId: sprint.id,
        expectedTargetVersion: entered.current.currentParticipation.sprint.version,
      },
      randomUUID(),
    ),
    project = (await pool.query('SELECT version,"taskRevision" FROM project WHERE id=$1', [p.id]))
      .rows[0];
  const start = {
    path: `${root}/sprints/${sprint.id}/start`,
    key: randomUUID(),
    body: {
      expectedVersion: retainedEntry.current.currentParticipation.sprint.version,
      expectedProjectVersion: project.version,
      expectedTaskRevision: project.taskRevision,
    },
  };
  const began = await request(origin, cookie, start.path, start.body, start.key),
    current = await request(origin, cookie, `${root}/tasks/${task.id}/planning`);
  await request(
    origin,
    cookie,
    assign.path,
    {
      expectedTaskVersion: current.snapshot.version,
      expectedCurrentParticipationId: current.currentParticipation.id,
      expectedSourceVersion: current.currentParticipation.sprint.version,
      targetSprintId: null,
      expectedTargetVersion: null,
    },
    randomUUID(),
  );
  const configured = await request(
    origin,
    cookie,
    `${root}/planning`,
    { expectedVersion: project.version, mode: 'kanban', timeZone: 'UTC', pointScale: [0, 1] },
    randomUUID(),
  );
  await request(
    origin,
    cookie,
    `${root}/archive`,
    { expectedVersion: configured.projectVersion },
    randomUUID(),
  );
  const participantPath = `${root}/tasks/${retainedTask.id}/planning`,
    participant = await request(origin, cookie, participantPath);
  assert.equal(participant.workspaceId, p.workspaceId);
  assert.equal(participant.projectId, p.id);
  assert.equal(participant.taskId, retainedTask.id);
  assert.equal(participant.currentParticipation.id, retainedEntry.operation.enteredVisitId);
  assert.equal(participant.currentParticipation.sprint.id, sprint.id);
  return {
    projectId: p.id,
    create,
    assign,
    start,
    entryOperation: entered.operation,
    startOperation: began.operation,
    participantPath,
    participant,
  };
}
try {
  if (mode === 'snapshot') {
    const retry = await preparePlanningRetry();
    await writeFile(path, JSON.stringify({ ...(await snapshot()), retry }), { mode: 0o600 });
  } else {
    const saved = JSON.parse(await readFile(path, 'utf8'));
    assert.deepEqual(await snapshot(), { digest: saved.digest, counts: saved.counts });
    app = await NestFactory.create(AppModule, createHttpAdapter(), {
      bodyParser: false,
      logger: false,
    });
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const origin = await app.getUrl();
    const retryCookie = await projectCookie(saved.retry.projectId),
      beforeReplay = await snapshot();
    const createReplay = await request(
      origin,
      retryCookie,
      saved.retry.create.path,
      saved.retry.create.body,
      saved.retry.create.key,
    );
    assert.equal(createReplay.state, 'active');
    assert.equal(createReplay.capabilities.canEdit, false);
    const startReplay = await request(
      origin,
      retryCookie,
      saved.retry.start.path,
      saved.retry.start.body,
      saved.retry.start.key,
    );
    assert.deepEqual(startReplay.operation, saved.retry.startOperation);
    const assignmentReplay = await request(
      origin,
      retryCookie,
      saved.retry.assign.path,
      saved.retry.assign.body,
      saved.retry.assign.key,
    );
    assert.deepEqual(assignmentReplay.operation, saved.retry.entryOperation);
    assert.equal(assignmentReplay.current.currentParticipation, null);
    assert.deepEqual(await snapshot(), beforeReplay);
    const sample =
      await pool.query(`SELECT t.id,t."workspaceId",t."projectId",p."nextTaskNumber",s.token FROM task t JOIN project p ON p.id=t."projectId" JOIN principal h ON h.id=p."createdByPrincipalId"
      JOIN session s ON s."userId"=h."userId" JOIN membership m ON m."workspaceId"=p."workspaceId" AND m."principalId"=h.id
      WHERE p."archivedAt" IS NULL AND t."archivedAt" IS NULL AND h.state='active' AND m.state='active' AND m.role IN ('owner','admin','member') AND s."expiresAt">now()
      AND project_principal_can_read(p."workspaceId",p.id,h.id) LIMIT 1`);
    const row = sample.rows[0];
    assert.ok(row);
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${row.token}.${await makeSignature(row.token, process.env.BETTER_AUTH_SECRET)}`)}`;
    const requestPath = `${origin}/api/v1/workspaces/${row.workspaceId}/projects/${row.projectId}/tasks`;
    const detail = await fetch(`${requestPath}/${row.id}`, { headers: { cookie } });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).id, row.id);
    const planned = await pool.query(
      `SELECT s.id,s."workspaceId",s."projectId",s.version,h."userId",session.token FROM sprint s JOIN project p ON p.id=s."projectId" JOIN principal h ON h.id=p."createdByPrincipalId" JOIN session ON session."userId"=h."userId" WHERE p."archivedAt" IS NULL AND h.state='active' AND session."expiresAt">now() LIMIT 1`,
    );
    assert.ok(planned.rows[0]);
    const sprint = planned.rows[0];
    const planningCookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${sprint.token}.${await makeSignature(sprint.token, process.env.BETTER_AUTH_SECRET)}`)}`;
    const planningRead = await fetch(
      `${origin}/api/v1/workspaces/${sprint.workspaceId}/projects/${sprint.projectId}/sprints/${sprint.id}`,
      { headers: { cookie: planningCookie } },
    );
    assert.equal(planningRead.status, 200);
    const retainedSprint = await planningRead.json();
    assert.equal(retainedSprint.version, sprint.version);
    const stored = (
      await pool.query('SELECT state,"startedAt" FROM sprint WHERE id=$1', [sprint.id])
    ).rows[0];
    assert.equal(retainedSprint.state, stored.state);
    if (stored.state === 'active')
      assert.equal(retainedSprint.startedAt, stored.startedAt.toISOString());
    const participant = await request(origin, retryCookie, saved.retry.participantPath);
    assert.deepEqual(participant, saved.retry.participant);
    assert.ok(participant.currentParticipation);
    const active = participant.currentParticipation.sprint;
    assert.equal(active.state, 'active');
    for (const sidecar of ['scope', 'history']) {
      const response = await fetch(
        `${origin}/api/v1/workspaces/${active.workspaceId}/projects/${active.projectId}/sprints/${active.id}/${sidecar}`,
        { headers: { cookie: retryCookie } },
      );
      assert.equal(response.status, 200);
      const value = await response.json();
      assert.equal(value.sprintId, active.id);
      assert.ok(value.total > 0);
    }
    const created = await fetch(requestPath, {
      method: 'POST',
      headers: {
        cookie,
        origin: process.env.BETTER_AUTH_URL,
        'content-type': 'application/json',
        'idempotency-key': randomUUID(),
      },
      body: JSON.stringify({ title: 'After PostgreSQL container restart' }),
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).number, row.nextTaskNumber);
    const denied =
      await pool.query(`SELECT a."workspaceId",a."projectId",s.token FROM project_access a JOIN principal h ON h.id=a."principalId" JOIN session s ON s."userId"=h."userId" JOIN project p ON p.id=a."projectId"
      WHERE p.visibility='private' AND h.state='active' AND s."expiresAt">now() AND NOT project_principal_can_read(a."workspaceId",a."projectId",h.id) LIMIT 1`);
    assert.ok(denied.rows[0]);
    const removed = denied.rows[0];
    const removedCookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${removed.token}.${await makeSignature(removed.token, process.env.BETTER_AUTH_SECRET)}`)}`;
    const revoked = await fetch(
      `${origin}/api/v1/workspaces/${removed.workspaceId}/projects/${removed.projectId}`,
      { headers: { cookie: removedCookie } },
    );
    assert.equal(revoked.status, 403);
    console.log(
      'Project/task content, access/revocation, attribution, versions, counters, estimates, visits, immutable start references/scope history, activity, outbox and receipts survived PostgreSQL container restart; real Nest reads, denied access and next allocation passed.',
    );
  }
} finally {
  await app?.close();
  await pool.end();
}
