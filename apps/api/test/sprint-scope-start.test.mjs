import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { SprintService } from '../dist/projects/sprint.service.js';
import { TaskPlanningService } from '../dist/projects/task-planning.service.js';
import {
  isSprint,
  isTaskPlanning,
  isSprintScopePage,
  isPlanningHistoryPage,
} from '@rielia/contracts';

test('T11.2 real PostgreSQL/HTTP scope, observations and explicit start', async (t) => {
  const app = await NestFactory.create(AppModule, createHttpAdapter(), {
    bodyParser: false,
    logger: false,
  });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl(),
    identity = app.get(IdentityService),
    db = identity.runtime.prisma,
    principals = app.get(PrincipalService),
    sprints = app.get(SprintService),
    planning = app.get(TaskPlanningService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  t.after(async () => {
    await pool.end();
    await app.close();
  });
  async function human() {
    const id = randomUUID(),
      token = randomUUID();
    await db.user.create({
      data: { id, name: 'Scope Human', email: `${id}@example.test`, emailVerified: true },
    });
    const principal = await db.principal.findUniqueOrThrow({ where: { userId: id } });
    await db.session.create({
      data: { id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 86400000) },
    });
    return {
      email: `${id}@example.test`,
      principalId: principal.id,
      cookie: `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}`,
    };
  }
  async function req(user, path, body, key = randomUUID()) {
    const r = await fetch(`${url}/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        cookie: user.cookie,
        ...(body === undefined
          ? {}
          : {
              origin: identity.config.origin,
              'content-type': 'application/json',
              'idempotency-key': key,
            }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, data: await r.json() };
  }
  async function ok(user, path, body, key) {
    const r = await req(user, path, body, key);
    assert.ok(r.status >= 200 && r.status < 300, JSON.stringify(r));
    return r.data;
  }
  const fields = {
    name: 'Scope sprint',
    goal: 'Durable planning',
    startDate: '2026-11-01',
    endDateExclusive: '2026-11-02',
  };
  async function fixture() {
    const owner = await human(),
      workspace = await ok(owner, 'workspaces', { name: 'Scope workspace' }),
      root = `workspaces/${workspace.id}`,
      project = await ok(owner, `${root}/projects`, { name: 'Scope project', key: 'SCP' }),
      path = `${root}/projects/${project.id}`;
    await ok(owner, `${path}/planning`, {
      expectedVersion: 1,
      mode: 'scrum',
      timeZone: 'America/New_York',
      pointScale: [0, 1, 3, 5, 8],
    });
    return { owner, workspace, root, project, path };
  }
  const sprint = async (f) =>
    ok(f.owner, `${f.path}/sprints`, {
      expectedProjectVersion: (await ok(f.owner, `${f.path}/planning`)).projectVersion,
      ...fields,
    });
  const task = async (f, patch = {}) =>
    ok(f.owner, `${f.path}/tasks`, { title: 'Scope task', ...patch });
  const getPlanning = async (f, t) => ok(f.owner, `${f.path}/tasks/${t}/planning`);
  async function scopeBody(f, t, target) {
    const current = await getPlanning(f, t);
    return {
      expectedTaskVersion: current.snapshot.version,
      expectedCurrentParticipationId: current.currentParticipation?.id ?? null,
      expectedSourceVersion: current.currentParticipation?.sprint.version ?? null,
      targetSprintId: target,
      expectedTargetVersion: target
        ? (await ok(f.owner, `${f.path}/sprints/${target}`)).version
        : null,
    };
  }
  const assign = async (f, t, s, key) =>
    ok(f.owner, `${f.path}/tasks/${t}/sprint`, await scopeBody(f, t, s), key);
  async function startBody(f, s) {
    const project = await db.project.findUniqueOrThrow({ where: { id: f.project.id } });
    return {
      expectedVersion: (await ok(f.owner, `${f.path}/sprints/${s}`)).version,
      expectedProjectVersion: project.version,
      expectedTaskRevision: project.taskRevision,
    };
  }
  const start = async (f, s, key) =>
    ok(f.owner, `${f.path}/sprints/${s}/start`, await startBody(f, s), key);
  const estimate = async (f, t, points) =>
    ok(f.owner, `${f.path}/tasks/${t}/planning`, {
      expectedVersion: (await getPlanning(f, t)).snapshot.version,
      estimatePoints: points,
    });
  async function digest(f) {
    const data = (
      await pool.query(
        `SELECT jsonb_build_object('project',(SELECT to_jsonb(p) FROM project p WHERE id=$1),'tasks',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM task t WHERE "projectId"=$1),'sprints',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM sprint s WHERE "projectId"=$1),'visits',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM sprint_participation v WHERE "projectId"=$1),'references',(SELECT jsonb_agg(to_jsonb(r) ORDER BY "participationId") FROM sprint_start_reference r WHERE "projectId"=$1),'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY id) FROM sprint_scope_event e WHERE "projectId"=$1),'activity',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM activity_event a WHERE "projectId"=$1),'outbox',(SELECT jsonb_agg(to_jsonb(o) ORDER BY o.id) FROM outbox_event o JOIN activity_event a ON a.id=o."activityId" WHERE a."projectId"=$1),'receipts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY key) FROM project_task_operation r WHERE "workspaceId"=$2)) AS data`,
        [f.project.id, f.workspace.id],
      )
    ).rows[0].data;
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  await t.test(
    'additive migration preserves populated archived legacy values without Task/Project DML',
    async () => {
      const schema = `scope_legacy_${randomUUID().replaceAll('-', '')}`,
        c = await pool.connect();
      try {
        await c.query(`CREATE SCHEMA ${schema};SET search_path TO ${schema},public`);
        await c.query(
          `CREATE TABLE project(id text PRIMARY KEY,"workspaceId" text NOT NULL,key text DEFAULT 'LEG',name text,description text,visibility text,"nextTaskNumber" integer,version integer,"taskRevision" integer,"archivedAt" timestamp(3),"createdByPrincipalId" text,"creationMode" text,"creationSource" text,"creationGrantId" text,"createdAt" timestamp(3),"updatedAt" timestamp(3),UNIQUE("workspaceId",id));CREATE TABLE task(id text PRIMARY KEY,"workspaceId" text,"projectId" text,version integer,rank bigint,status text,"parentTaskId" text,"archivedAt" timestamp(3),UNIQUE("workspaceId","projectId",id));CREATE TABLE activity_event(id text PRIMARY KEY,"workspaceId" text,"projectId" text,"taskId" text,action text CONSTRAINT activity_event_action_check CHECK(action='create-task'));CREATE TABLE membership("workspaceId" text,"principalId" text,UNIQUE("workspaceId","principalId"));CREATE TABLE execution_grant("workspaceId" text,id text,"subjectPrincipalId" text,UNIQUE("workspaceId",id,"subjectPrincipalId"));CREATE FUNCTION preserve_project() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''legacy update forbidden''; END';CREATE TRIGGER preserve_project BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION preserve_project();INSERT INTO project(id,"workspaceId",version,"taskRevision","nextTaskNumber","archivedAt") VALUES('legacy','w',7,9,11,now());INSERT INTO task VALUES('legacy-task','w','legacy',4,77,'done',NULL,now());INSERT INTO activity_event VALUES('legacy-activity','w','legacy','legacy-task','create-task')`,
        );
        await c.query(
          await readFile(
            new URL(
              '../prisma/migrations/20261119210000_sprint_planning/migration.sql',
              import.meta.url,
            ),
            'utf8',
          ),
        );
        await c.query(
          `CREATE FUNCTION reject_task_write() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''no task backfill''; END';CREATE TRIGGER reject_task_write BEFORE UPDATE ON task FOR EACH ROW EXECUTE FUNCTION reject_task_write()`,
        );
        await c.query(
          `UPDATE project SET "archivedAt"=NULL;UPDATE project SET mode='scrum';INSERT INTO membership VALUES('w','human');INSERT INTO sprint(id,"workspaceId","projectId",name,goal,"startDate","endDateExclusive","timeZone","startsAt","endsAt","createdByPrincipalId","creationMode","creationSource") VALUES('legacy-sprint','w','legacy','Legacy','Retained','2026-11-19','2026-11-20','UTC','2026-11-19T00:00:00Z','2026-11-20T00:00:00Z','human','human','web');UPDATE project SET "archivedAt"=now()`,
        );
        const oldSprint = (await c.query('SELECT to_jsonb(s) AS data FROM sprint s')).rows;
        const before = (
          await c.query(`SELECT to_jsonb(p) AS p,to_jsonb(t) AS t FROM project p CROSS JOIN task t`)
        ).rows;
        await c.query(
          await readFile(
            new URL(
              '../prisma/migrations/20261120000000_sprint_scope_start/migration.sql',
              import.meta.url,
            ),
            'utf8',
          ),
        );
        const after = (
          await c.query(
            `SELECT to_jsonb(p) AS p,to_jsonb(t)-'estimatePoints' AS t,t."estimatePoints" FROM project p CROSS JOIN task t`,
          )
        ).rows;
        assert.deepEqual(
          after.map(({ p, t }) => ({ p, t })),
          before,
        );
        assert.equal(after[0].estimatePoints, null);
        assert.deepEqual(
          (await c.query("SELECT to_jsonb(s)-'startedAt' AS data FROM sprint s")).rows,
          oldSprint,
        );
        assert.equal((await c.query('SELECT "startedAt" FROM sprint')).rows[0].startedAt, null);
        for (const table of [
          'sprint_participation',
          'sprint_scope_event',
          'sprint_start_reference',
        ])
          assert.equal((await c.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n, 0);
      } finally {
        await c.query('ROLLBACK');
        await c.query('SET search_path TO public');
        await c.query(`DROP SCHEMA ${schema} CASCADE`);
        c.release();
      }
    },
  );
  await t.test(
    'entry/transfer/exit/reentry retain visit snapshots and leave Task content/version/rank/revision unchanged',
    async () => {
      const f = await fixture(),
        a = await sprint(f),
        b = await sprint(f),
        t = await task(f);
      const before = await db.task.findUniqueOrThrow({ where: { id: t.id } }),
        rev = (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).taskRevision;
      const first = await assign(f, t.id, a.id),
        second = await assign(f, t.id, b.id),
        removed = await assign(f, t.id, null),
        again = await assign(f, t.id, a.id);
      assert.notEqual(first.operation.enteredVisitId, again.operation.enteredVisitId);
      assert.equal(second.operation.exitedVisitId, first.operation.enteredVisitId);
      assert.equal(removed.current.currentParticipation, null);
      assert.deepEqual(await db.task.findUniqueOrThrow({ where: { id: t.id } }), before);
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).taskRevision,
        rev,
      );
      const visits = await db.sprintParticipation.findMany({ where: { taskId: t.id } });
      assert.equal(visits.length, 3);
      assert.equal(visits.filter((v) => !v.exitedAt).length, 1);
      assert.equal(
        visits.find((v) => v.id === first.operation.enteredVisitId).entrySnapshot.estimatePoints,
        null,
      );
      await assert.rejects(
        pool.query('UPDATE sprint_participation SET "exitedAt"=NULL WHERE id=$1', [
          first.operation.enteredVisitId,
        ]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query('DELETE FROM sprint_participation WHERE id=$1', [
          first.operation.enteredVisitId,
        ]),
        (e) => e.code === '23514',
      );
    },
  );
  await t.test(
    'concurrent assignment/transfer and start enforce one current visit and one active sprint',
    async () => {
      const f = await fixture(),
        a = await sprint(f),
        b = await sprint(f),
        c = await sprint(f),
        t = await task(f);
      const body = await scopeBody(f, t.id, a.id),
        toB = { ...body, targetSprintId: b.id, expectedTargetVersion: b.version };
      assert.deepEqual(
        (
          await Promise.all([
            req(f.owner, `${f.path}/tasks/${t.id}/sprint`, body),
            req(f.owner, `${f.path}/tasks/${t.id}/sprint`, toB),
          ])
        )
          .map((x) => x.status)
          .sort(),
        [201, 409],
      );
      const [ba, bc] = await Promise.all([scopeBody(f, t.id, a.id), scopeBody(f, t.id, c.id)]);
      // Ensure both transitions choose a new destination from the winner.
      const source = (await getPlanning(f, t.id)).currentParticipation.sprint.id;
      const target1 = source === a.id ? b.id : a.id;
      const r = await Promise.all([
        req(f.owner, `${f.path}/tasks/${t.id}/sprint`, await scopeBody(f, t.id, target1)),
        req(f.owner, `${f.path}/tasks/${t.id}/sprint`, bc),
      ]);
      assert.deepEqual(r.map((x) => x.status).sort(), [201, 409]);
      assert.equal(
        await db.sprintParticipation.count({ where: { taskId: t.id, exitedAt: null } }),
        1,
      );
      assert.ok(ba);
      const [aa, bb] = await Promise.all([startBody(f, a.id), startBody(f, b.id)]);
      assert.deepEqual(
        (
          await Promise.all([
            req(f.owner, `${f.path}/sprints/${a.id}/start`, aa),
            req(f.owner, `${f.path}/sprints/${b.id}/start`, bb),
          ])
        )
          .map((x) => x.status)
          .sort(),
        [201, 409],
      );
      assert.equal(
        await db.sprint.count({ where: { projectId: f.project.id, state: 'active' } }),
        1,
      );
      assert.equal(
        await db.sprintScopeEvent.count({ where: { projectId: f.project.id, kind: 'start' } }),
        1,
      );
    },
  );
  await t.test(
    'complete start reference includes >100, archived children, zero/null, and only explicit start captures actual time',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        parent = await task(f),
        ids = [parent.id];
      await estimate(f, parent.id, 0);
      await assign(f, parent.id, s.id);
      for (let i = 0; i < 101; i++) {
        const t = await task(
          f,
          i === 0
            ? {
                parentTaskId: parent.id,
                expectedParentVersion: (await getPlanning(f, parent.id)).snapshot.version,
              }
            : {},
        );
        ids.push(t.id);
        await assign(f, t.id, s.id);
      }
      await ok(f.owner, `${f.path}/tasks/${ids[1]}/archive`, {
        expectedVersion: (await getPlanning(f, ids[1])).snapshot.version,
      });
      assert.equal((await ok(f.owner, `${f.path}/sprints/${s.id}`)).state, 'planned');
      const before = Date.now(),
        result = await start(f, s.id);
      assert.ok(isSprint(result.current));
      assert.equal(result.current.state, 'active');
      assert.ok(Date.parse(result.current.startedAt) >= before);
      assert.notEqual(result.current.startedAt, result.current.startsAt);
      assert.equal(await db.sprintStartReference.count({ where: { sprintId: s.id } }), 102);
      const page = await ok(f.owner, `${f.path}/sprints/${s.id}/scope`);
      assert.ok(isSprintScopePage(page));
      assert.equal(page.items.length, 100);
      assert.equal(page.total, 102);
      assert.equal(page.startTotals.pending, 101);
      assert.equal(page.startTotals.children, 1);
      assert.equal(page.startTotals.archived, 1);
      assert.equal(page.startTotals.unestimated, 100);
      const next = await ok(f.owner, `${f.path}/sprints/${s.id}/scope?cursor=${page.nextCursor}`);
      assert.equal(next.items.length, 2);
      const history = await ok(f.owner, `${f.path}/sprints/${s.id}/history`);
      assert.ok(isPlanningHistoryPage(history));
      assert.equal(history.items.length, 100);
      assert.equal(history.total, 105); // metadata +102 entries +archive +start
      await estimate(f, parent.id, 3);
      assert.equal(
        (await req(f.owner, `${f.path}/sprints/${s.id}/scope?cursor=${page.nextCursor}`)).data.code,
        'page-changed',
      );
      await assert.rejects(
        pool.query('UPDATE sprint SET "startedAt"=now() WHERE id=$1', [s.id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query('UPDATE sprint SET state=\'planned\',"startedAt"=NULL WHERE id=$1', [s.id]),
        (e) => e.code === '23514',
      );
      const ref = await db.sprintStartReference.findFirst({ where: { sprintId: s.id } });
      await assert.rejects(
        pool.query('DELETE FROM sprint_start_reference WHERE "participationId"=$1', [
          ref.participationId,
        ]),
        (e) => e.code === '23514',
      );
    },
  );
  await t.test(
    'Task status/move/parent final version/archive/restore observations preserve immutable references and separate canceled/done',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        parent = await task(f),
        child = await task(f);
      await estimate(f, parent.id, 5);
      await assign(f, parent.id, s.id);
      await assign(f, child.id, s.id);
      await start(f, s.id);
      const original = await db.sprintStartReference.findMany({ where: { sprintId: s.id } });
      await ok(f.owner, `${f.path}/tasks/${child.id}/parent`, {
        expectedVersion: 1,
        parentTaskId: parent.id,
        expectedParentVersion: (await getPlanning(f, parent.id)).snapshot.version,
      });
      const final = await getPlanning(f, child.id);
      const event = await db.sprintScopeEvent.findFirst({
        where: { taskId: child.id, kind: 'task-change' },
        orderBy: { ordinal: 'desc' },
      });
      assert.equal(event.afterSnapshot.version, final.snapshot.version);
      assert.equal(final.snapshot.version, 3);
      await ok(f.owner, `${f.path}/tasks/${child.id}`, {
        expectedVersion: final.snapshot.version,
        status: 'canceled',
      });
      await ok(f.owner, `${f.path}/tasks/${parent.id}`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
        status: 'done',
      });
      let totals = (await ok(f.owner, `${f.path}/sprints/${s.id}/scope`)).currentTotals;
      assert.equal(totals.done, 1);
      assert.equal(totals.donePoints, 5);
      assert.equal(totals.children, 1);
      await ok(f.owner, `${f.path}/tasks/${parent.id}/move`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
        expectedOrderVersion: (await db.project.findUniqueOrThrow({ where: { id: f.project.id } }))
          .taskRevision,
        status: 'todo',
        beforeTaskId: null,
      });
      await ok(f.owner, `${f.path}/tasks/${parent.id}/archive`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
      });
      assert.equal(
        (
          await req(f.owner, `${f.path}/tasks/${parent.id}/planning`, {
            expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
            estimatePoints: 3,
          })
        ).data.code,
        'archived',
      );
      assert.equal(
        (
          await req(
            f.owner,
            `${f.path}/tasks/${parent.id}/sprint`,
            await scopeBody(f, parent.id, null),
          )
        ).data.code,
        'archived',
      );
      await ok(f.owner, `${f.path}/tasks/${parent.id}/restore`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
      });
      await ok(f.owner, `${f.path}/tasks/${parent.id}`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
        status: 'canceled',
      });
      totals = (await ok(f.owner, `${f.path}/sprints/${s.id}/scope`)).currentTotals;
      assert.equal(totals.canceled, 1);
      assert.equal(totals.done, 0);
      const before = await db.sprintScopeEvent.count({ where: { sprintId: s.id } });
      await ok(f.owner, `${f.path}/tasks/${parent.id}`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
        title: 'Title only',
      });
      await ok(f.owner, `${f.path}/tasks/${parent.id}/comments`, {
        expectedVersion: (await getPlanning(f, parent.id)).snapshot.version,
        body: 'Comment only',
      });
      assert.equal(await db.sprintScopeEvent.count({ where: { sprintId: s.id } }), before);
      assert.deepEqual(
        await db.sprintStartReference.findMany({ where: { sprintId: s.id } }),
        original,
      );
    },
  );
  await t.test(
    'estimate null/zero/off-scale retention and independent child membership use current scale only for changes',
    async () => {
      const f = await fixture(),
        t = await task(f);
      assert.ok(isTaskPlanning(await getPlanning(f, t.id)));
      await estimate(f, t.id, 0);
      assert.equal((await getPlanning(f, t.id)).snapshot.estimatePoints, 0);
      await estimate(f, t.id, 5);
      await ok(f.owner, `${f.path}/planning`, {
        expectedVersion: 2,
        mode: 'kanban',
        timeZone: 'UTC',
        pointScale: [0, 1],
      });
      await estimate(f, t.id, 5);
      assert.equal(
        (
          await req(f.owner, `${f.path}/tasks/${t.id}/planning`, {
            expectedVersion: (await getPlanning(f, t.id)).snapshot.version,
            estimatePoints: 8,
          })
        ).status,
        400,
      );
      await estimate(f, t.id, null);
      assert.equal((await getPlanning(f, t.id)).snapshot.estimatePoints, null);
      assert.equal((await ok(f.owner, `${f.path}/tasks/${t.id}/sprint-history`)).total, 3);
      for (const bad of [
        { expectedVersion: 1 },
        { expectedVersion: 1, estimatePoints: -1 },
        { expectedVersion: 1, estimatePoints: 1.1 },
        { expectedVersion: 1, estimatePoints: 0, actorPrincipalId: 'forged' },
      ])
        assert.equal((await req(f.owner, `${f.path}/tasks/${t.id}/planning`, bad)).status, 400);
    },
  );
  await t.test(
    'legacy receipt replays current active Sprint through later metadata/mode/archive; new receipts preserve original transitions',
    async () => {
      const f = await fixture(),
        key = randomUUID(),
        body = { expectedProjectVersion: 2, ...fields },
        s = await ok(f.owner, `${f.path}/sprints`, body, key),
        editKey = randomUUID(),
        editBody = { expectedVersion: 1, ...fields, name: 'Edited' };
      await ok(f.owner, `${f.path}/sprints/${s.id}`, editBody, editKey);
      const t = await task(f),
        visitKey = randomUUID(),
        visitBody = await scopeBody(f, t.id, s.id),
        entry = await ok(f.owner, `${f.path}/tasks/${t.id}/sprint`, visitBody, visitKey),
        startKey = randomUUID(),
        startInput = await startBody(f, s.id),
        began = await ok(f.owner, `${f.path}/sprints/${s.id}/start`, startInput, startKey);
      await assign(f, t.id, null);
      await ok(f.owner, `${f.path}/planning`, {
        expectedVersion: 2,
        mode: 'kanban',
        timeZone: 'UTC',
        pointScale: [0],
      });
      await ok(f.owner, `${f.path}/sprints/${s.id}`, {
        expectedVersion: (await ok(f.owner, `${f.path}/sprints/${s.id}`)).version,
        ...fields,
        name: 'Active in Kanban',
      });
      await ok(f.owner, `${f.path}/archive`, { expectedVersion: 3 });
      const before = await digest(f);
      for (const [path, b, k] of [
        [`${f.path}/sprints`, body, key],
        [`${f.path}/sprints/${s.id}`, editBody, editKey],
      ]) {
        const replay = await ok(f.owner, path, b, k);
        assert.equal(replay.state, 'active');
        assert.equal(replay.capabilities.canEdit, false);
      }
      const replay = await ok(f.owner, `${f.path}/sprints/${s.id}/start`, startInput, startKey);
      assert.deepEqual(replay.operation, began.operation);
      assert.equal(replay.current.state, 'active');
      const visitReplay = await ok(f.owner, `${f.path}/tasks/${t.id}/sprint`, visitBody, visitKey);
      assert.deepEqual(visitReplay.operation, entry.operation);
      assert.equal(visitReplay.current.currentParticipation, null);
      assert.equal(await digest(f), before);
      assert.equal(
        (
          await req(
            f.owner,
            `${f.path}/sprints/${s.id}/start`,
            { ...startInput, expectedVersion: 999 },
            startKey,
          )
        ).data.code,
        'idempotency-conflict',
      );
    },
  );
  await t.test(
    'actual tenant/private/viewer/delegated/autonomous current authority gates commands and replays',
    async () => {
      const f = await fixture(),
        other = await fixture(),
        s = await sprint(f),
        taskRow = await task(f);
      async function member(role) {
        const u = await human(),
          invite = await ok(f.owner, `${f.root}/invitations`, { recipientEmail: u.email, role });
        await ok(u, 'workspace-invitations/accept', { token: invite.token });
        return u;
      }
      const viewer = await member('viewer'),
        memberUser = await member('member');
      const body = await scopeBody(f, taskRow.id, s.id);
      for (const u of [other.owner, viewer])
        assert.equal((await req(u, `${f.path}/tasks/${taskRow.id}/sprint`, body)).status, 403);
      const key = randomUUID();
      await ok(memberUser, `${f.path}/tasks/${taskRow.id}/sprint`, body, key);
      await ok(f.owner, `${f.path}/visibility`, { expectedVersion: 2, visibility: 'private' });
      assert.equal(
        (await req(memberUser, `${f.path}/tasks/${taskRow.id}/sprint`, body, key)).status,
        403,
      );
      assert.equal(
        (await req(viewer, `${f.path}/sprints/${s.id}/scope?cursor=foreign`)).status,
        403,
      );
      const c = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id)).context,
        agent = await principals.registerAgent(c, {
          name: 'Scope Agent',
          role: 'member',
          custodianPrincipalId: f.owner.principalId,
        });
      await ok(f.owner, `${f.path}/access/${agent}`, { expectedVersion: 3, state: 'active' });
      for (const [mode, subject] of [
        ['delegated', f.owner.principalId],
        ['autonomous', agent],
      ]) {
        const grant = await principals.recordInternalGrant(c, {
            subjectPrincipalId: subject,
            mode,
            allowedOperations: ['read', 'write'],
            expiresAt: new Date(Date.now() + 3600000),
          }),
          execution = await principals.internalGrantContext(grant, f.workspace.id),
          command = {
            expectedVersion: (await getPlanning(f, taskRow.id)).snapshot.version,
            estimatePoints: mode === 'delegated' ? 0 : 1,
          },
          k = randomUUID();
        await planning.estimate(
          execution,
          f.workspace.id,
          f.project.id,
          taskRow.id,
          k,
          randomUUID(),
          command,
        );
        await principals.revokeGrant(c, grant);
        await assert.rejects(
          planning.estimate(
            execution,
            f.workspace.id,
            f.project.id,
            taskRow.id,
            k,
            randomUUID(),
            command,
          ),
          (e) => e.getStatus() === 401,
        );
      }
      const grant = await principals.recordInternalGrant(c, {
          subjectPrincipalId: agent,
          mode: 'autonomous',
          allowedOperations: ['read'],
          expiresAt: new Date(Date.now() + 3600000),
        }),
        execution = await principals.internalGrantContext(grant, f.workspace.id);
      await assert.rejects(
        planning.setSprint(
          execution,
          f.workspace.id,
          f.project.id,
          taskRow.id,
          randomUUID(),
          randomUUID(),
          await scopeBody(f, taskRow.id, null),
        ),
        (e) => e.getStatus() === 403,
      );
      assert.equal(
        (await req(other.owner, `${f.path}/tasks/${taskRow.id}/sprint-history`)).status,
        403,
      );
    },
  );
  await t.test(
    'deferred failure at reference/visit/Sprint/event/Activity/outbox/receipt rolls back the complete aggregate',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        t = await task(f);
      await assign(f, t.id, s.id);
      for (const table of [
        'sprint_start_reference',
        'sprint',
        'sprint_scope_event',
        'activity_event',
        'outbox_event',
        'project_task_operation',
        'sprint_participation',
      ]) {
        const name = `scope_fail_${randomUUID().replaceAll('-', '')}`,
          membership = table === 'sprint_participation',
          path = membership ? `${f.path}/tasks/${t.id}/sprint` : `${f.path}/sprints/${s.id}/start`,
          body = membership ? await scopeBody(f, t.id, null) : await startBody(f, s.id),
          key = randomUUID();
        const match =
          table === 'outbox_event'
            ? `EXISTS(SELECT 1 FROM activity_event WHERE id=NEW."activityId" AND "projectId"='${f.project.id}')`
            : table === 'project_task_operation'
              ? `NEW."workspaceId"='${f.workspace.id}'`
              : `NEW."projectId"='${f.project.id}'`;
        try {
          await pool.query(
            `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF ${match} THEN RAISE EXCEPTION 'injected scope rollback' USING ERRCODE='23514'; END IF;RETURN NEW;END $$;CREATE CONSTRAINT TRIGGER ${name} AFTER INSERT OR UPDATE ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ${name}()`,
          );
          const before = await digest(f);
          assert.equal((await req(f.owner, path, body, key)).status, 400);
          assert.equal(await digest(f), before);
        } finally {
          await pool.query(
            `DROP TRIGGER IF EXISTS ${name} ON ${table};DROP FUNCTION IF EXISTS ${name}()`,
          );
        }
      }
      assert.equal((await start(f, s.id)).current.state, 'active');
    },
  );
  await t.test(
    'committed HTTP response loss and exact-key retry emits one transition with no duplicate effects',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        body = await startBody(f, s.id),
        key = randomUUID();
      let release, notify;
      const held = new Promise((r) => (release = r)),
        committed = new Promise((r) => (notify = r)),
        original = sprints.start;
      sprints.start = async (...args) => {
        const value = await original.apply(sprints, args);
        notify(value);
        await held;
        return value;
      };
      const abort = new AbortController(),
        pending = fetch(`${url}/api/v1/${f.path}/sprints/${s.id}/start`, {
          method: 'POST',
          headers: {
            cookie: f.owner.cookie,
            origin: identity.config.origin,
            'content-type': 'application/json',
            'idempotency-key': key,
          },
          body: JSON.stringify(body),
          signal: abort.signal,
        });
      try {
        const rejection = assert.rejects(pending, (e) => e.name === 'AbortError'),
          value = await committed;
        abort.abort();
        await rejection;
        release();
        sprints.start = original;
        const before = await digest(f),
          replay = await ok(f.owner, `${f.path}/sprints/${s.id}/start`, body, key);
        assert.deepEqual(replay.operation, value.operation);
        assert.equal(await digest(f), before);
        assert.equal(
          await db.sprintScopeEvent.count({ where: { sprintId: s.id, kind: 'start' } }),
          1,
        );
      } finally {
        abort.abort();
        release();
        sprints.start = original;
      }
    },
  );
  await t.test(
    'rank compaction locks and retains archived participants without inventing semantic history',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f, { status: 'todo' }),
        b = await task(f, { status: 'todo' }),
        moving = await task(f, { status: 'todo' });
      await assign(f, a.id, s.id);
      await assign(f, b.id, s.id);
      await assign(f, moving.id, s.id);
      await ok(f.owner, `${f.path}/tasks/${a.id}/archive`, {
        expectedVersion: (await getPlanning(f, a.id)).snapshot.version,
      });
      // The retained archived predecessor leaves no rank gap before b.
      await pool.query(
        'UPDATE task SET rank=CASE id WHEN $1 THEN 1 WHEN $2 THEN 2 ELSE 3 END WHERE id=ANY($3::text[])',
        [a.id, b.id, [a.id, b.id, moving.id]],
      );
      const before = await db.task.findUniqueOrThrow({ where: { id: a.id } }),
        n = await db.sprintScopeEvent.count({ where: { sprintId: s.id } });
      await ok(f.owner, `${f.path}/tasks/${moving.id}/move`, {
        expectedVersion: (await getPlanning(f, moving.id)).snapshot.version,
        expectedOrderVersion: (await db.project.findUniqueOrThrow({ where: { id: f.project.id } }))
          .taskRevision,
        status: 'todo',
        beforeTaskId: b.id,
      });
      const after = await db.task.findUniqueOrThrow({ where: { id: a.id } });
      assert.ok(after.version > before.version);
      assert.equal(after.rank, 1024n);
      assert.deepEqual(after.archivedAt, before.archivedAt);
      assert.equal(after.status, before.status);
      assert.equal(await db.sprintScopeEvent.count({ where: { sprintId: s.id } }), n);
      const page = await ok(f.owner, `${f.path}/sprints/${s.id}/scope`);
      assert.equal(page.currentTotals.archived, 1);
      assert.equal(page.currentTotals.pending, 3);
    },
  );
  await t.test(
    'actual start waits for the Project row lock before capturing its immutable server timestamp',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        input = await startBody(f, s.id),
        c = await pool.connect();
      let pending;
      try {
        await c.query('BEGIN');
        await c.query('SELECT id FROM project WHERE id=$1 FOR UPDATE', [f.project.id]);
        const pid = (await c.query('SELECT pg_backend_pid() pid')).rows[0].pid;
        pending = req(f.owner, `${f.path}/sprints/${s.id}/start`, input);
        let blocked = false;
        for (let i = 0; i < 100; i++) {
          blocked = (
            await pool.query(
              'SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid))) AS blocked',
              [pid],
            )
          ).rows[0].blocked;
          if (blocked) break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.equal(blocked, true);
        const released = Date.now();
        await c.query('COMMIT');
        const result = await pending;
        assert.equal(result.status, 201);
        assert.ok(Date.parse(result.data.current.startedAt) >= released);
      } finally {
        await c.query('ROLLBACK');
        c.release();
        await pending;
      }
    },
  );
  await t.test(
    'a failed Task semantic observation rolls back its Task version and all Sprint/journal state',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      const name = `scope_task_fail_${randomUUID().replaceAll('-', '')}`;
      try {
        await pool.query(
          `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW."projectId"='${f.project.id}' AND NEW.kind='task-change' THEN RAISE EXCEPTION 'injected observation rollback' USING ERRCODE='23514'; END IF;RETURN NEW;END $$;CREATE CONSTRAINT TRIGGER ${name} AFTER INSERT ON sprint_scope_event DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ${name}()`,
        );
        const before = await digest(f);
        assert.equal(
          (await req(f.owner, `${f.path}/tasks/${a.id}`, { expectedVersion: 1, status: 'done' }))
            .status,
          400,
        );
        assert.equal(await digest(f), before);
      } finally {
        await pool.query(
          `DROP TRIGGER IF EXISTS ${name} ON sprint_scope_event;DROP FUNCTION IF EXISTS ${name}()`,
        );
      }
    },
  );
  await t.test(
    'pre-scope retained Sprint Activity is projected exactly once without fabricated snapshots',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        legacy = randomUUID(),
        activity = randomUUID();
      await pool.query(
        'INSERT INTO sprint SELECT $1,"workspaceId","projectId",name,goal,state,1,"startDate","endDateExclusive","timeZone","startsAt","endsAt","createdByPrincipalId","creationMode","creationSource","creationGrantId","createdAt","updatedAt",NULL FROM sprint WHERE id=$2',
        [legacy, s.id],
      );
      await pool.query(
        'INSERT INTO activity_event(id,"workspaceId","projectId","sprintId","actorPrincipalId","executionMode",source,"requestId",action,"entityVersion","changedFields",changes) VALUES($1,$2,$3,$4,$5,\'human\',\'web\',$6,\'create-sprint\',1,ARRAY[\'name\',\'goal\'],\'[]\')',
        [activity, f.workspace.id, f.project.id, legacy, f.owner.principalId, randomUUID()],
      );
      await pool.query(
        'INSERT INTO outbox_event(id,"workspaceId","activityId",type,payload) VALUES($1,$2,$3,\'domain.activity\',jsonb_build_object(\'activityId\',$3::text))',
        [randomUUID(), f.workspace.id, activity],
      );
      const history = await ok(f.owner, `${f.path}/sprints/${legacy}/history`);
      assert.equal(history.total, 1);
      assert.equal(history.items[0].id, activity);
      assert.equal(history.items[0].before, null);
      assert.equal(history.items[0].after, null);
      assert.ok(isPlanningHistoryPage(history));
    },
  );
  await t.test(
    'direct SQL rejects missing start facts, forged scoped references and changes to immutable events',
    async () => {
      const f = await fixture(),
        other = await fixture(),
        s = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      const removedTask = await task(f),
        removedEntry = await assign(f, removedTask.id, s.id);
      await assign(f, removedTask.id, null);
      await assert.rejects(
        pool.query('UPDATE sprint SET state=\'active\',"startedAt"=clock_timestamp() WHERE id=$1', [
          s.id,
        ]),
        (e) => e.code === '23514',
      );
      assert.equal((await ok(f.owner, `${f.path}/sprints/${s.id}`)).state, 'planned');
      await start(f, s.id);
      const ref = await db.sprintStartReference.findFirst({ where: { sprintId: s.id } }),
        event = await db.sprintScopeEvent.findFirst({ where: { sprintId: s.id, kind: 'start' } });
      const removed = await db.sprintParticipation.findUniqueOrThrow({
        where: { id: removedEntry.operation.enteredVisitId },
      });
      await assert.rejects(
        pool.query('INSERT INTO sprint_start_reference VALUES($1,$2,$3,$4,$5,$6,$7)', [
          f.workspace.id,
          f.project.id,
          s.id,
          removed.id,
          removedTask.id,
          event.ordinal,
          removed.entrySnapshot,
        ]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query(
          'INSERT INTO sprint_participation(id,"workspaceId","projectId","sprintId","taskId","enteredAt","enteredOrdinal","entrySnapshot") SELECT $1,"workspaceId","projectId","sprintId","taskId","enteredAt","enteredOrdinal","entrySnapshot" FROM sprint_participation WHERE id=$2',
          [randomUUID(), ref.participationId],
        ),
        (e) => e.code === '23505',
      );
      await assert.rejects(
        pool.query("UPDATE sprint_scope_event SET kind='metadata' WHERE id=$1", [event.id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query(
          'INSERT INTO sprint_start_reference SELECT $1,$2,"sprintId","participationId","taskId","startOrdinal",snapshot FROM sprint_start_reference WHERE "participationId"=$3',
          [other.workspace.id, other.project.id, ref.participationId],
        ),
        (e) => e.code === '23503',
      );
      await assert.rejects(
        pool.query(
          'INSERT INTO sprint_participation(id,"workspaceId","projectId","sprintId","taskId","enteredAt","enteredOrdinal","entrySnapshot") SELECT $1,$2,$3,"sprintId","taskId","enteredAt","enteredOrdinal","entrySnapshot" FROM sprint_participation WHERE id=$4',
          [randomUUID(), other.workspace.id, other.project.id, ref.participationId],
        ),
        (e) => e.code === '23503',
      );
      const planned = await sprint(f),
        p = await db.sprintParticipation.findFirst({ where: { sprintId: s.id } });
      await assert.rejects(
        pool.query('UPDATE sprint SET state=\'active\',"startedAt"=clock_timestamp() WHERE id=$1', [
          planned.id,
        ]),
        (e) => e.code === '23505',
      );
      await assert.rejects(
        pool.query('INSERT INTO sprint_start_reference VALUES($1,$2,$3,$4,$5,$6,$7)', [
          f.workspace.id,
          f.project.id,
          planned.id,
          p.id,
          a.id,
          1,
          p.entrySnapshot,
        ]),
        (e) => ['23503', '23514'].includes(e.code),
      );
      await assert.rejects(
        pool.query('UPDATE task SET "estimatePoints"=1001 WHERE id=$1', [a.id]),
        (e) => e.code === '23514',
      );
    },
  );
  await t.test(
    'SQL activation with a valid start event still rejects a missing canonical start reference set atomically',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      const before = await digest(f),
        c = await pool.connect(),
        activity = randomUUID();
      try {
        await c.query('BEGIN');
        const active = (
          await c.query(
            'UPDATE sprint SET state=\'active\',"startedAt"=clock_timestamp() WHERE id=$1 RETURNING version,"startedAt"',
            [s.id],
          )
        ).rows[0];
        await c.query(
          'INSERT INTO activity_event(id,"workspaceId","projectId","sprintId","actorPrincipalId","executionMode",source,"requestId",action,"entityVersion","changedFields",changes) VALUES($1,$2,$3,$4,$5,\'human\',\'web\',$6,\'start-sprint\',$7,ARRAY[\'state\'],\'[]\')',
          [
            activity,
            f.workspace.id,
            f.project.id,
            s.id,
            f.owner.principalId,
            randomUUID(),
            active.version,
          ],
        );
        await c.query(
          'INSERT INTO sprint_scope_event(id,"workspaceId","projectId","sprintId",ordinal,kind,"activityId","occurredAt") VALUES($1,$2,$3,$4,$5,\'start\',$6,$7)',
          [
            randomUUID(),
            f.workspace.id,
            f.project.id,
            s.id,
            active.version,
            activity,
            active.startedAt,
          ],
        );
        await assert.rejects(c.query('COMMIT'), (e) => e.code === '23514');
        assert.equal(await digest(f), before);
      } finally {
        await c.query('ROLLBACK');
        c.release();
      }
    },
  );
});
