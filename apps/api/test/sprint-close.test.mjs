import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { SprintService } from '../dist/projects/sprint.service.js';
import { ProjectTaskService } from '../dist/projects/project-task.service.js';
import {
  isSprintClosePreview,
  isSprintClosingOutcomePage,
  isSprintCloseResult,
  isSprintScopePage,
  isPlanningHistoryPage,
} from '@rielia/contracts';

const execute = promisify(execFile);
/** Test-only lease: setup and rollback failures cannot leak a client or its request. */
async function withLockedProjectRequest(pool, projectId, submit, inspect) {
  let client,
    pending,
    value,
    failure,
    failed = false;
  const abort = new AbortController();
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT id FROM project WHERE id=$1 FOR UPDATE', [projectId]);
    pending = Promise.resolve()
      .then(() => submit(abort.signal))
      .then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
    value = await inspect(client, async () => {
      const result = await pending;
      if ('error' in result) throw result.error;
      return result.value;
    });
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    abort.abort();
    let cleanupError;
    try {
      if (client) await client.query('ROLLBACK');
    } catch (error) {
      cleanupError = error;
    } finally {
      try {
        client?.release(cleanupError);
      } catch (error) {
        cleanupError ??= error;
      }
      if (pending) await pending;
    }
    if (cleanupError && !failed) {
      failed = true;
      failure = cleanupError;
    }
  }
  if (failed) throw failure;
  return value;
}

test('T11.3 real PostgreSQL/HTTP immutable close and carryover', async (t) => {
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
    projects = app.get(ProjectTaskService);
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
  async function req(user, path, body, key = randomUUID(), signal) {
    const r = await fetch(`${url}/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      signal,
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
        `SELECT jsonb_build_object('project',(SELECT to_jsonb(p) FROM project p WHERE id=$1),'tasks',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM task t WHERE "projectId"=$1),'sprints',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM sprint s WHERE "projectId"=$1),'visits',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM sprint_participation v WHERE "projectId"=$1),'references',(SELECT jsonb_agg(to_jsonb(r) ORDER BY "participationId") FROM sprint_start_reference r WHERE "projectId"=$1),'closures',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM sprint_closure c WHERE "projectId"=$1),'outcomes',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM sprint_closing_outcome c WHERE "projectId"=$1),'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY id) FROM sprint_scope_event e WHERE "projectId"=$1),'activity',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM activity_event a WHERE "projectId"=$1),'outbox',(SELECT jsonb_agg(to_jsonb(o) ORDER BY o.id) FROM outbox_event o JOIN activity_event a ON a.id=o."activityId" WHERE a."projectId"=$1),'receipts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY key) FROM project_task_operation r WHERE "workspaceId"=$2)) AS data`,
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
        await c.query(
          await readFile(
            new URL(
              '../prisma/migrations/20261121000000_sprint_close/migration.sql',
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
          (await c.query("SELECT to_jsonb(s)-'startedAt'-'closedAt' AS data FROM sprint s")).rows,
          oldSprint,
        );
        assert.equal((await c.query('SELECT "startedAt" FROM sprint')).rows[0].startedAt, null);
        for (const table of [
          'sprint_participation',
          'sprint_scope_event',
          'sprint_start_reference',
          'sprint_closure',
          'sprint_closing_outcome',
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
  const closeBody = (v) =>
    Object.fromEntries(
      [
        'expectedVersion',
        'expectedProjectVersion',
        'expectedTaskRevision',
        'expectedSprintRevision',
        'expectedTargetVersion',
        'destination',
        'previewSchema',
        'previewHash',
      ].map((k) => [k, v[k]]),
    );
  const preview = async (f, s, destination = null, cursor) =>
    ok(
      f.owner,
      `${f.path}/sprints/${s}/close-preview${destination !== null || cursor ? `?${new URLSearchParams({ ...(destination === null ? {} : { destination }), ...(cursor ? { cursor } : {}) })}` : ''}`,
    );
  const close = async (f, s, destination = null, key) =>
    ok(f.owner, `${f.path}/sprints/${s}/close`, closeBody(await preview(f, s, destination)), key);
  const path = (f, s) => `${f.path}/sprints/${s}`;
  const rawTasks = async (f) =>
    db.task.findMany({ where: { projectId: f.project.id }, orderBy: { id: 'asc' } });
  await t.test(
    'Prisma retains the SQL target-visit unique constraint without proposing its removal',
    async () => {
      const name = 'sprint_closing_outcome_targetParticipationId_key';
      const constraints = await pool.query(
        `SELECT conname, contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='sprint_closing_outcome'::regclass AND conname=$1`,
        [name],
      );
      assert.deepEqual(constraints.rows, [
        { conname: name, contype: 'u', definition: 'UNIQUE ("targetParticipationId")' },
      ]);
      const { stdout } = await execute(
        'pnpm',
        [
          '--filter',
          '@rielia/api',
          'exec',
          'prisma',
          'migrate',
          'diff',
          '--from-config-datasource',
          '--to-schema',
          'prisma/schema.prisma',
          '--script',
        ],
        { env: process.env, timeout: 30000, maxBuffer: 2 * 1024 * 1024 },
      );
      // Historical raw SQL constraints are intentionally not all represented by Prisma.
      assert.doesNotMatch(
        stdout,
        /DROP (?:CONSTRAINT|INDEX) "?sprint_closing_outcome_targetParticipationId_key/,
      );
    },
  );
  await t.test(
    'archived canonical closure succeeds in the affected non-UTC PostgreSQL transaction session',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      await ok(f.owner, `${f.path}/tasks/${a.id}/archive`, { expectedVersion: a.version });
      await start(f, s.id);
      const snapshot = (await getPlanning(f, a.id)).snapshot;
      assert.ok(snapshot.archivedAt);
      const input = closeBody(await preview(f, s.id, 'backlog'));
      const tasksBefore = await rawTasks(f);
      const revision = (await db.project.findUniqueOrThrow({ where: { id: f.project.id } }))
        .taskRevision;
      const original = projects.planningOperation;
      let observed;
      projects.planningOperation = function (context, workspaceId, projectId, operation, work) {
        return original.call(
          this,
          context,
          workspaceId,
          projectId,
          operation,
          async (tx, ...rest) => {
            if (projectId === f.project.id && operation === 'write') {
              // SET LOCAL cannot escape this commit/rollback or contaminate a pooled session.
              await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'America/Caracas'");
              [observed] =
                await tx.$queryRaw`SELECT current_setting('TimeZone') AS zone, pg_backend_pid() AS pid, to_char("archivedAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS old, to_char("archivedAt",'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS canonical FROM task WHERE id=${a.id}`;
              assert.equal(observed.zone, 'America/Caracas');
              assert.ok(observed.pid > 0);
              assert.notEqual(observed.old, snapshot.archivedAt);
              assert.equal(observed.canonical, snapshot.archivedAt);
            }
            return work(tx, ...rest);
          },
        );
      };
      try {
        const result = await req(f.owner, `${path(f, s.id)}/close`, input);
        assert.equal(result.status, 201, JSON.stringify(result));
        assert.equal(result.data.current.state, 'closed');
        assert.equal(observed.zone, 'America/Caracas');
      } finally {
        projects.planningOperation = original;
      }
      assert.deepEqual(
        (await ok(f.owner, `${path(f, s.id)}/closure/outcomes`)).items[0].snapshot,
        snapshot,
      );
      assert.deepEqual(await rawTasks(f), tasksBefore);
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).taskRevision,
        revision,
      );
    },
  );
  await t.test(
    'lock lease cleanup preserves setup/work errors and settles the pending request even when rollback fails',
    async () => {
      for (const failure of ['connect', 'BEGIN', 'lock', 'inspect', 'rollback']) {
        const primary = new Error(failure),
          cleanup = new Error('rollback failed');
        let releases = 0,
          releasedError,
          submitted = false,
          settled = false;
        const client = {
          async query(sql) {
            if (sql === 'ROLLBACK') throw failure === 'rollback' ? primary : cleanup;
            if (sql === failure || (failure === 'lock' && sql.startsWith('SELECT'))) throw primary;
          },
          release(error) {
            releases++;
            releasedError = error;
          },
        };
        const fakePool = {
          async connect() {
            if (failure === 'connect') throw primary;
            return client;
          },
        };
        await assert.rejects(
          withLockedProjectRequest(
            fakePool,
            'project',
            (signal) => {
              submitted = true;
              return new Promise((_resolve, reject) => {
                const finish = () => {
                  settled = true;
                  reject(new Error('request aborted'));
                };
                if (signal.aborted) finish();
                else signal.addEventListener('abort', finish, { once: true });
              });
            },
            async () => {
              if (failure === 'inspect') throw primary;
            },
          ),
          (error) => error === primary,
        );
        assert.equal(releases, failure === 'connect' ? 0 : 1);
        if (releases) assert.equal(releasedError, failure === 'rollback' ? primary : cleanup);
        assert.equal(submitted, ['inspect', 'rollback'].includes(failure));
        assert.equal(settled, submitted);
      }
    },
  );
  await t.test(
    'aggregate carryover freezes all >100 independent archived/child/zero/null/offscale consequences without Task DML',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        dest = await sprint(f),
        tasks = [];
      for (let i = 0; i < 103; i++) {
        const row = await task(f, { status: i === 0 ? 'done' : i === 1 ? 'canceled' : 'todo' });
        tasks.push(row);
        await assign(f, row.id, s.id);
        if (i === 0) await estimate(f, row.id, 5);
        if (i === 2) await estimate(f, row.id, 0);
      }
      await ok(f.owner, `${f.path}/tasks/${tasks[102].id}/parent`, {
        expectedVersion: (await getPlanning(f, tasks[102].id)).snapshot.version,
        parentTaskId: tasks[101].id,
        expectedParentVersion: (await getPlanning(f, tasks[101].id)).snapshot.version,
      });
      await ok(f.owner, `${f.path}/tasks/${tasks[102].id}/archive`, {
        expectedVersion: (await getPlanning(f, tasks[102].id)).snapshot.version,
      });
      await start(f, s.id);
      const settings = await ok(f.owner, `${f.path}/planning`);
      await ok(f.owner, `${f.path}/planning`, {
        expectedVersion: settings.projectVersion,
        mode: 'kanban',
        timeZone: 'UTC',
        pointScale: [0, 1],
      });
      const v = await preview(f, s.id, dest.id);
      assert.ok(isSprintClosePreview(v));
      assert.equal(v.total, 103);
      assert.equal(v.items.length, 100);
      assert.equal(v.pendingParticipants, 101);
      assert.equal(v.totals.donePoints, 5);
      assert.equal(v.totals.children, 1);
      assert.equal(v.totals.archived, 1);
      const next = await preview(f, s.id, dest.id, v.nextCursor);
      assert.equal(next.items.length, 3);
      assert.equal(next.previewHash, v.previewHash);
      assert.equal(next.nextCursor, null);
      const before = await rawTasks(f),
        p = await db.project.findUniqueOrThrow({ where: { id: f.project.id } }),
        source = await db.sprint.findUniqueOrThrow({ where: { id: s.id } }),
        target = await db.sprint.findUniqueOrThrow({ where: { id: dest.id } }),
        references = await db.sprintStartReference.findMany({
          where: { sprintId: s.id },
          orderBy: { participationId: 'asc' },
        });
      const value = await ok(f.owner, `${path(f, s.id)}/close`, closeBody(v));
      assert.ok(isSprintCloseResult(value));
      assert.equal(value.current.state, 'closed');
      assert.equal(value.current.version, source.version + 1);
      assert.equal(
        (await db.sprint.findUniqueOrThrow({ where: { id: dest.id } })).version,
        target.version + 1,
      );
      assert.deepEqual(await rawTasks(f), before);
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).taskRevision,
        p.taskRevision,
      );
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).version,
        p.version,
      );
      assert.deepEqual(
        await db.sprintStartReference.findMany({
          where: { sprintId: s.id },
          orderBy: { participationId: 'asc' },
        }),
        references,
      );
      assert.equal(
        await db.sprintParticipation.count({ where: { sprintId: s.id, exitedAt: null } }),
        0,
      );
      assert.equal(
        await db.sprintParticipation.count({ where: { sprintId: dest.id, exitedAt: null } }),
        101,
      );
      const outcomes = await ok(f.owner, `${path(f, s.id)}/closure/outcomes`);
      assert.ok(isSprintClosingOutcomePage(outcomes));
      assert.equal(outcomes.items.length, 100);
      assert.equal(
        (await ok(f.owner, `${path(f, s.id)}/closure/outcomes?cursor=${outcomes.nextCursor}`)).items
          .length,
        3,
      );
      const summary = await ok(f.owner, `${path(f, s.id)}/scope`);
      assert.ok(isSprintScopePage(summary));
      assert.deepEqual(summary.closingTotals, value.closure.totals);
      assert.equal(summary.removed, 0);
      assert.equal(summary.transferred, 0);
      const history = await ok(f.owner, `${f.path}/tasks/${tasks[102].id}/sprint-history`);
      assert.ok(isPlanningHistoryPage(history));
      assert.equal(history.items.filter((x) => x.kind === 'outcome').length, 1);
      assert.equal(history.items.find((x) => x.kind === 'outcome').disposition, 'carried');
    },
  );
  await t.test(
    'empty, done/canceled and child-only pending require explicit per-participant destinations without family cascade',
    async () => {
      const f = await fixture(),
        s = await sprint(f);
      await start(f, s.id);
      const empty = await close(f, s.id);
      assert.equal(empty.closure.total, 0);
      assert.equal(empty.closure.destination, null);
      const childSprint = await sprint(f),
        parent = await task(f),
        child = await task(f);
      await ok(f.owner, `${f.path}/tasks/${child.id}/parent`, {
        expectedVersion: child.version,
        parentTaskId: parent.id,
        expectedParentVersion: (await getPlanning(f, parent.id)).snapshot.version,
      });
      await assign(f, child.id, childSprint.id);
      await start(f, childSprint.id);
      const v = await preview(f, childSprint.id);
      assert.equal(v.totals.pending, 0);
      assert.equal(v.pendingParticipants, 1);
      assert.equal(v.canClose, false);
      assert.equal(
        (await req(f.owner, `${path(f, childSprint.id)}/close`, closeBody(v))).data.code,
        'destination-required',
      );
      const before = await rawTasks(f),
        closed = await close(f, childSprint.id, 'backlog');
      assert.equal(closed.closure.pendingParticipants, 1);
      assert.deepEqual(await rawTasks(f), before);
      assert.equal((await getPlanning(f, parent.id)).currentParticipation, null);
      assert.equal((await getPlanning(f, child.id)).currentParticipation, null);
      const doneSprint = await sprint(f);
      for (const status of ['done', 'canceled']) {
        const t = await task(f, { status });
        await assign(f, t.id, doneSprint.id);
      }
      await start(f, doneSprint.id);
      const done = await close(f, doneSprint.id);
      assert.equal(done.closure.totals.done, 1);
      assert.equal(done.closure.totals.canceled, 1);
      assert.equal(done.closure.pendingParticipants, 0);
    },
  );
  await t.test(
    'stale source/target/task/scope/mode/archive/scale binding fails and never silently rebases',
    async () => {
      for (const change of ['task', 'scope', 'target', 'mode', 'archive', 'scale']) {
        const f = await fixture(),
          s = await sprint(f),
          dest = await sprint(f),
          a = await task(f);
        await assign(f, a.id, s.id);
        await start(f, s.id);
        const v = await preview(f, s.id, dest.id);
        if (change === 'task') await estimate(f, a.id, 1);
        if (change === 'scope') {
          const b = await task(f);
          await assign(f, b.id, s.id);
        }
        if (change === 'target')
          await ok(f.owner, path(f, dest.id), {
            expectedVersion: v.expectedTargetVersion,
            ...fields,
            name: 'Edited target',
          });
        if (change === 'mode' || change === 'scale')
          await ok(f.owner, `${f.path}/planning`, {
            expectedVersion: v.expectedProjectVersion,
            mode: change === 'mode' ? 'kanban' : 'scrum',
            timeZone: 'UTC',
            pointScale: change === 'scale' ? [0, 1] : [0, 1, 3, 5, 8],
          });
        if (change === 'archive')
          await ok(f.owner, `${f.path}/archive`, { expectedVersion: v.expectedProjectVersion });
        const before = await digest(f),
          r = await req(f.owner, `${path(f, s.id)}/close`, closeBody(v));
        assert.equal(r.status, 409);
        assert.equal(r.data.code, change === 'archive' ? 'archived' : 'close-preview-changed');
        assert.equal(await digest(f), before);
      }
    },
  );
  await t.test(
    'concurrent close/task,scope,target,mode,archive,access and grant races assert both operations and committed invariants',
    async () => {
      for (const change of ['task', 'scope', 'target', 'mode', 'archive', 'access', 'grant']) {
        const f = await fixture(),
          s = await sprint(f),
          dest = await sprint(f),
          a = await task(f);
        await assign(f, a.id, s.id);
        await start(f, s.id);
        let closingUser = f.owner;
        if (change === 'access') {
          closingUser = await human();
          const invite = await ok(f.owner, `${f.root}/invitations`, {
            recipientEmail: closingUser.email,
            role: 'member',
          });
          await ok(closingUser, 'workspace-invitations/accept', { token: invite.token });
          await ok(f.owner, `${f.path}/visibility`, { expectedVersion: 2, visibility: 'private' });
          await ok(f.owner, `${f.path}/access/${closingUser.principalId}`, {
            expectedVersion: 3,
            state: 'active',
          });
        }
        const actor = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id))
          .context;
        let execution, grant;
        if (change === 'grant') {
          grant = await principals.recordInternalGrant(actor, {
            subjectPrincipalId: f.owner.principalId,
            mode: 'delegated',
            allowedOperations: ['read', 'write'],
            expiresAt: new Date(Date.now() + 3600000),
          });
          execution = await principals.internalGrantContext(grant, f.workspace.id);
        }
        const pv = execution
          ? await sprints.closePreview(execution, f.workspace.id, f.project.id, s.id, dest.id)
          : await preview({ ...f, owner: closingUser }, s.id, dest.id);
        const input = closeBody(pv),
          k = randomUUID();
        // Prepare all expected versions before either competitor is submitted.
        const taskBefore = await db.task.findUniqueOrThrow({ where: { id: a.id } });
        const sourceBody = change === 'scope' ? await scopeBody(f, a.id, null) : null;
        const compete = () => {
          if (change === 'task')
            return req(f.owner, `${f.path}/tasks/${a.id}/planning`, {
              expectedVersion: taskBefore.version,
              estimatePoints: 1,
            });
          if (change === 'scope') return req(f.owner, `${f.path}/tasks/${a.id}/sprint`, sourceBody);
          if (change === 'target')
            return req(f.owner, path(f, dest.id), {
              expectedVersion: pv.expectedTargetVersion,
              ...fields,
              name: 'Racing target',
            });
          if (change === 'mode')
            return req(f.owner, `${f.path}/planning`, {
              expectedVersion: pv.expectedProjectVersion,
              mode: 'kanban',
              timeZone: 'UTC',
              pointScale: [0, 1, 3, 5, 8],
            });
          if (change === 'archive')
            return req(f.owner, `${f.path}/archive`, {
              expectedVersion: pv.expectedProjectVersion,
            });
          if (change === 'access')
            return req(f.owner, `${f.path}/access/${closingUser.principalId}`, {
              expectedVersion: pv.expectedProjectVersion,
              state: 'revoked',
            });
          return principals.revokeGrant(actor, grant).then(() => ({ status: 200, data: null }));
        };
        const closing = execution
          ? sprints
              .close(execution, f.workspace.id, f.project.id, s.id, k, randomUUID(), input)
              .then((data) => ({ status: 201, data }))
              .catch((e) => ({ status: e.getStatus(), data: e.getResponse() }))
          : req(closingUser, `${path(f, s.id)}/close`, input, k);
        const [closed, competitor] = await Promise.all([closing, compete()]);
        t.diagnostic(
          `${change}: close=${closed.status}/${closed.data.code ?? 'committed'}, competitor=${competitor.status}/${competitor.data?.code ?? 'committed'}`,
        );
        const loserCodes = {
          task: 'close-preview-changed',
          scope: 'close-preview-changed',
          target: 'close-preview-changed',
          mode: 'close-preview-changed',
          archive: 'archived',
        };
        if (closed.status !== 201) {
          const expectedStatus = change === 'access' ? 403 : change === 'grant' ? 401 : 409;
          assert.equal(closed.status, expectedStatus, `${change}: ${JSON.stringify(closed)}`);
          if (expectedStatus === 409) assert.equal(closed.data.code, loserCodes[change]);
        }
        if (['scope', 'target'].includes(change) && competitor.status !== 201) {
          assert.equal(competitor.status, 409, `${change}: ${JSON.stringify(competitor)}`);
          assert.equal(
            competitor.data.code,
            change === 'scope' ? 'current-sprint-conflict' : 'version-conflict',
          );
          assert.equal(closed.status, 201);
        } else {
          assert.equal(
            competitor.status,
            change === 'grant' ? 200 : 201,
            `${change}: ${JSON.stringify(competitor)}`,
          );
          if (['scope', 'target'].includes(change)) assert.equal(closed.status, 409);
        }
        const outcomes = await db.sprintClosingOutcome.findMany({ where: { sprintId: s.id } });
        assert.equal(outcomes.length, closed.status === 201 ? 1 : 0);
        assert.equal(await db.sprintClosure.count({ where: { sprintId: s.id } }), outcomes.length);
        assert.equal(
          (await db.sprint.findUniqueOrThrow({ where: { id: s.id } })).state,
          outcomes.length ? 'closed' : 'active',
        );
        const current = await db.sprintParticipation.findFirst({
          where: { taskId: a.id, exitedAt: null },
        });
        if (change === 'scope' && competitor.status === 201) assert.equal(current, null);
        else assert.equal(current.sprintId, outcomes.length ? dest.id : s.id);
        const taskAfter = await db.task.findUniqueOrThrow({ where: { id: a.id } });
        assert.equal(taskAfter.estimatePoints, change === 'task' ? 1 : taskBefore.estimatePoints);
        assert.equal(taskAfter.version, taskBefore.version + (change === 'task' ? 1 : 0));
        if (outcomes.length)
          assert.equal(outcomes[0].snapshot.estimatePoints, taskBefore.estimatePoints);
        if (change === 'target')
          assert.equal(
            (await db.sprint.findUniqueOrThrow({ where: { id: dest.id } })).name,
            competitor.status === 201 ? 'Racing target' : fields.name,
          );
        if (change === 'mode')
          assert.equal(
            (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).mode,
            'kanban',
          );
        if (change === 'archive')
          assert.ok(
            (await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).archivedAt,
          );
        if (change === 'access')
          assert.equal((await req(closingUser, `${path(f, s.id)}/close`, input, k)).status, 403);
        if (change === 'grant') {
          assert.ok(
            (await db.executionGrant.findUniqueOrThrow({ where: { id: grant } })).revokedAt,
          );
          await assert.rejects(
            sprints.close(execution, f.workspace.id, f.project.id, s.id, k, randomUUID(), input),
            (e) => e.getStatus() === 401,
          );
        }
      }
    },
  );
  await t.test(
    'original create/edit/start/visit/estimate and close retries survive true closed state, later Task reopening, target changes, mode and archive',
    async () => {
      const f = await fixture(),
        settings = await ok(f.owner, `${f.path}/planning`),
        createInput = { expectedProjectVersion: settings.projectVersion, ...fields },
        createKey = randomUUID(),
        s = await ok(f.owner, `${f.path}/sprints`, createInput, createKey),
        dest = await sprint(f),
        editInput = { expectedVersion: s.version, ...fields, name: 'Edited source' },
        editKey = randomUUID();
      await ok(f.owner, path(f, s.id), editInput, editKey);
      const a = await task(f, { status: 'done' }),
        estimateKey = randomUUID(),
        estimateInput = { expectedVersion: a.version, estimatePoints: 0 };
      await ok(f.owner, `${f.path}/tasks/${a.id}/planning`, estimateInput, estimateKey);
      const visitInput = await scopeBody(f, a.id, s.id),
        visitKey = randomUUID(),
        entry = await ok(f.owner, `${f.path}/tasks/${a.id}/sprint`, visitInput, visitKey),
        startInput = await startBody(f, s.id),
        startKey = randomUUID(),
        began = await ok(f.owner, `${path(f, s.id)}/start`, startInput, startKey),
        input = closeBody(await preview(f, s.id, dest.id)),
        closeKey = randomUUID(),
        closed = await ok(f.owner, `${path(f, s.id)}/close`, input, closeKey);
      await ok(f.owner, `${f.path}/tasks/${a.id}`, {
        expectedVersion: (await getPlanning(f, a.id)).snapshot.version,
        status: 'todo',
      });
      await ok(f.owner, path(f, dest.id), {
        expectedVersion: input.expectedTargetVersion + 1,
        ...fields,
        name: 'Later destination',
      });
      const current = await ok(f.owner, `${f.path}/planning`);
      await ok(f.owner, `${f.path}/planning`, {
        expectedVersion: current.projectVersion,
        mode: 'kanban',
        timeZone: 'UTC',
        pointScale: [0, 1],
      });
      await ok(f.owner, `${f.path}/archive`, { expectedVersion: current.projectVersion + 1 });
      const before = await digest(f);
      for (const [endpoint, body, key] of [
        [`${f.path}/sprints`, createInput, createKey],
        [path(f, s.id), editInput, editKey],
      ])
        assert.equal((await ok(f.owner, endpoint, body, key)).state, 'closed');
      assert.deepEqual(
        (await ok(f.owner, `${path(f, s.id)}/start`, startInput, startKey)).operation,
        began.operation,
      );
      const replay = await ok(f.owner, `${f.path}/tasks/${a.id}/sprint`, visitInput, visitKey);
      assert.deepEqual(replay.operation, entry.operation);
      assert.equal(replay.current.currentParticipation, null);
      assert.equal(
        (await ok(f.owner, `${f.path}/tasks/${a.id}/planning`, estimateInput, estimateKey)).snapshot
          .status,
        'todo',
      );
      assert.deepEqual(await ok(f.owner, `${path(f, s.id)}/close`, input, closeKey), closed);
      assert.equal(await digest(f), before);
      assert.equal(
        (
          await req(
            f.owner,
            `${path(f, s.id)}/close`,
            { ...input, previewHash: 'f'.repeat(64) },
            closeKey,
          )
        ).data.code,
        'idempotency-conflict',
      );
      assert.equal((await req(f.owner, `${path(f, s.id)}/close`, input)).status, 409);
      assert.equal(
        (await ok(f.owner, `${path(f, s.id)}/closure/outcomes`)).items[0].snapshot.status,
        'done',
      );
    },
  );
  await t.test(
    'same-key and different-key concurrent closes commit one closure and one Activity/outbox/receipt',
    async () => {
      for (const same of [true, false]) {
        const f = await fixture(),
          s = await sprint(f),
          a = await task(f);
        await assign(f, a.id, s.id);
        await start(f, s.id);
        const input = closeBody(await preview(f, s.id, 'backlog')),
          key = randomUUID();
        const results = await Promise.all([
          req(f.owner, `${path(f, s.id)}/close`, input, key),
          req(f.owner, `${path(f, s.id)}/close`, input, same ? key : randomUUID()),
        ]);
        assert.equal(results.filter((r) => r.status < 300).length, same ? 2 : 1);
        assert.equal(await db.sprintClosure.count({ where: { sprintId: s.id } }), 1);
        assert.equal(
          await db.activityEvent.count({ where: { sprintId: s.id, action: 'close-sprint' } }),
          1,
        );
      }
    },
  );
  await t.test(
    'actual committed-response loss retries exact original close without duplicate effects',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      await start(f, s.id);
      const input = closeBody(await preview(f, s.id, 'backlog')),
        key = randomUUID();
      let release, notify;
      const held = new Promise((r) => (release = r)),
        committed = new Promise((r) => (notify = r)),
        original = sprints.close;
      sprints.close = async (...args) => {
        const value = await original.apply(sprints, args);
        notify(value);
        await held;
        return value;
      };
      const abort = new AbortController(),
        pending = fetch(`${url}/api/v1/${path(f, s.id)}/close`, {
          method: 'POST',
          headers: {
            cookie: f.owner.cookie,
            origin: identity.config.origin,
            'content-type': 'application/json',
            'idempotency-key': key,
          },
          body: JSON.stringify(input),
          signal: abort.signal,
        });
      try {
        const rejection = assert.rejects(pending, (e) => e.name === 'AbortError'),
          value = await committed;
        abort.abort();
        await rejection;
        release();
        sprints.close = original;
        const before = await digest(f);
        assert.deepEqual(await ok(f.owner, `${path(f, s.id)}/close`, input, key), value);
        assert.equal(await digest(f), before);
      } finally {
        abort.abort();
        release();
        sprints.close = original;
      }
    },
  );
  await t.test(
    'injected deferred failures at every aggregate stage roll back state, visits, outcomes and all journals',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        dest = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      await start(f, s.id);
      for (const table of [
        'sprint',
        'sprint_closure',
        'sprint_closing_outcome',
        'sprint_participation',
        'sprint_scope_event',
        'activity_event',
        'outbox_event',
        'project_task_operation',
      ]) {
        const name = `close_fail_${randomUUID().replaceAll('-', '')}`,
          match =
            table === 'outbox_event'
              ? `EXISTS(SELECT 1 FROM activity_event WHERE id=NEW."activityId" AND "projectId"='${f.project.id}')`
              : table === 'project_task_operation'
                ? `NEW."workspaceId"='${f.workspace.id}'`
                : `NEW."projectId"='${f.project.id}'`;
        try {
          await pool.query(
            `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF ${match} THEN RAISE EXCEPTION 'injected close rollback' USING ERRCODE='23514';END IF;RETURN NEW;END $$;CREATE CONSTRAINT TRIGGER ${name} AFTER INSERT OR UPDATE ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ${name}()`,
          );
          const input = closeBody(await preview(f, s.id, dest.id)),
            before = await digest(f);
          assert.equal((await req(f.owner, `${path(f, s.id)}/close`, input)).status, 400);
          assert.equal(await digest(f), before);
        } finally {
          await pool.query(
            `DROP TRIGGER IF EXISTS ${name} ON ${table};DROP FUNCTION IF EXISTS ${name}()`,
          );
        }
      }
      assert.ok(isSprintCloseResult(await close(f, s.id, dest.id)));
    },
  );
  await t.test(
    'tenant/viewer/private/revoked/grant identity and strict query/body boundaries precede preview and replay anchors',
    async () => {
      const f = await fixture(),
        other = await fixture(),
        s = await sprint(f);
      await start(f, s.id);
      const v = await preview(f, s.id);
      for (const endpoint of ['close-preview?cursor=bad', 'closure', 'closure/outcomes?cursor=bad'])
        assert.equal((await req(other.owner, `${path(f, s.id)}/${endpoint}`)).status, 403);
      const viewer = await human(),
        invite = await ok(f.owner, `${f.root}/invitations`, {
          recipientEmail: viewer.email,
          role: 'viewer',
        });
      await ok(viewer, 'workspace-invitations/accept', { token: invite.token });
      assert.equal((await req(viewer, `${path(f, s.id)}/close-preview`)).status, 403);
      assert.equal((await req(viewer, `${path(f, s.id)}/close`, closeBody(v))).status, 403);
      for (const query of [
        'destination=backlog&destination=other',
        'cursor=x&cursor=y',
        'destination=../bad',
        'author=x',
        'view=active',
      ])
        assert.equal((await req(f.owner, `${path(f, s.id)}/close-preview?${query}`)).status, 400);
      for (const patch of [
        { actorPrincipalId: 'spoof' },
        { previewSchema: 2 },
        { expectedVersion: 0 },
        { destination: undefined },
      ])
        assert.equal(
          (await req(f.owner, `${path(f, s.id)}/close`, { ...closeBody(v), ...patch })).status,
          400,
        );
      const context = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id))
          .context,
        agent = await principals.registerAgent(context, {
          name: 'Close Agent',
          role: 'member',
          custodianPrincipalId: f.owner.principalId,
        });
      for (const [mode, subject] of [
        ['delegated', f.owner.principalId],
        ['autonomous', agent],
      ]) {
        const source = await sprint(f);
        if ((await db.sprint.findUniqueOrThrow({ where: { id: s.id } })).state === 'active')
          await close(f, s.id);
        await start(f, source.id);
        const grant = await principals.recordInternalGrant(context, {
            subjectPrincipalId: subject,
            mode,
            allowedOperations: ['read', 'write'],
            expiresAt: new Date(Date.now() + 3600000),
          }),
          execution = await principals.internalGrantContext(grant, f.workspace.id),
          pv = await sprints.closePreview(execution, f.workspace.id, f.project.id, source.id),
          key = randomUUID();
        const webPreview = await preview(f, source.id);
        assert.equal(webPreview.expectedVersion, pv.expectedVersion);
        assert.equal(webPreview.expectedSprintRevision, pv.expectedSprintRevision);
        assert.equal(webPreview.expectedTaskRevision, pv.expectedTaskRevision);
        assert.deepEqual(webPreview.items, pv.items);
        assert.notEqual(webPreview.previewHash, pv.previewHash);
        const result = await sprints.close(
          execution,
          f.workspace.id,
          f.project.id,
          source.id,
          key,
          randomUUID(),
          closeBody(pv),
        );
        assert.equal(result.current.state, 'closed');
        const closedPreview = await req(f.owner, `${path(f, source.id)}/close-preview`);
        assert.equal(closedPreview.status, 409);
        assert.equal(closedPreview.data.code, 'invalid-transition');
        await assert.rejects(
          sprints.closePreview(execution, f.workspace.id, f.project.id, source.id),
          (e) => e.getStatus() === 409 && e.getResponse().code === 'invalid-transition',
        );
        await principals.revokeGrant(context, grant);
        await assert.rejects(
          sprints.close(
            execution,
            f.workspace.id,
            f.project.id,
            source.id,
            key,
            randomUUID(),
            closeBody(pv),
          ),
          (e) => e.getStatus() === 401,
        );
      }
    },
  );
  await t.test(
    'actual close time follows Project and participant locks and later semantics cannot rewrite outcomes',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        dest = await sprint(f),
        a = await task(f),
        parent = await task(f);
      await assign(f, a.id, s.id);
      await start(f, s.id);
      const input = closeBody(await preview(f, s.id, dest.id));
      await withLockedProjectRequest(
        pool,
        f.project.id,
        (signal) => req(f.owner, `${path(f, s.id)}/close`, input, randomUUID(), signal),
        async (c, response) => {
          await new Promise((resolve) => setTimeout(resolve, 60));
          const released = (await c.query('SELECT clock_timestamp() AS at')).rows[0].at;
          await c.query('COMMIT');
          const value = await response();
          assert.equal(value.status, 201);
          assert.ok(Date.parse(value.data.current.closedAt) >= released.getTime());
        },
      );
      const frozen = await ok(f.owner, `${path(f, s.id)}/closure/outcomes`),
        references = await db.sprintStartReference.findMany({ where: { sprintId: s.id } });
      await estimate(f, a.id, 1);
      await ok(f.owner, `${f.path}/tasks/${a.id}/parent`, {
        expectedVersion: (await getPlanning(f, a.id)).snapshot.version,
        parentTaskId: parent.id,
        expectedParentVersion: (await getPlanning(f, parent.id)).snapshot.version,
      });
      await ok(f.owner, `${f.path}/tasks/${a.id}/archive`, {
        expectedVersion: (await getPlanning(f, a.id)).snapshot.version,
      });
      assert.deepEqual(await ok(f.owner, `${path(f, s.id)}/closure/outcomes`), frozen);
      assert.deepEqual(
        await db.sprintStartReference.findMany({ where: { sprintId: s.id } }),
        references,
      );
    },
  );
  await t.test(
    'new composite outcome FKs reject real foreign closure/visit identities and complete close facts still require exact outcomes',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        a = await task(f);
      const entered = await assign(f, a.id, s.id);
      await start(f, s.id);
      const other = await fixture(),
        otherSource = await sprint(other),
        otherTarget = await sprint(other),
        foreignTask = await task(other);
      const foreignEntry = await assign(other, foreignTask.id, otherTarget.id);
      await start(other, otherSource.id);
      const foreignClosure = await close(other, otherSource.id);
      const snapshot = (await getPlanning(f, a.id)).snapshot,
        before = await digest(f),
        c = await pool.connect(),
        closureId = randomUUID(),
        activityId = randomUUID();
      try {
        await c.query('BEGIN');
        const source = (
          await c.query(
            'UPDATE sprint SET state=\'closed\',"closedAt"=clock_timestamp() WHERE id=$1 RETURNING *',
            [s.id],
          )
        ).rows[0];
        const startEvent = await db.sprintScopeEvent.findFirstOrThrow({
          where: { sprintId: s.id, kind: 'start' },
        });
        await c.query(
          'INSERT INTO activity_event SELECT (jsonb_populate_record(NULL::activity_event,to_jsonb(a)||$2::jsonb)).* FROM activity_event a WHERE id=$1',
          [
            startEvent.activityId,
            JSON.stringify({
              id: activityId,
              action: 'close-sprint',
              entityVersion: source.version,
              changedFields: ['state', 'participation'],
              changes: [],
              requestId: randomUUID(),
            }),
          ],
        );
        await c.query(
          'INSERT INTO sprint_closure(id,"workspaceId","projectId","sprintId",destination,"sourceOrdinal","closedAt","previewSchema","previewHash","activityId") VALUES($1,$2,$3,$4,\'backlog\',$5,$6,1,$7,$8)',
          [
            closureId,
            f.workspace.id,
            f.project.id,
            s.id,
            source.version,
            source.closedAt,
            'a'.repeat(64),
            activityId,
          ],
        );
        const insert =
          'INSERT INTO sprint_closing_outcome(id,"workspaceId","projectId","sprintId","closureId","participationId","taskId",snapshot,disposition,"targetSprintId","targetParticipationId") VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)';
        await c.query('SAVEPOINT foreign_closure');
        await assert.rejects(
          c.query(insert, [
            randomUUID(),
            f.workspace.id,
            f.project.id,
            s.id,
            foreignClosure.closure.id,
            entered.operation.enteredVisitId,
            a.id,
            snapshot,
            'backlog',
            null,
            null,
          ]),
          (e) => e.code === '23503',
        );
        await c.query('ROLLBACK TO SAVEPOINT foreign_closure');
        const constraints = (
          await c.query(
            `SELECT conname FROM pg_constraint WHERE conrelid='sprint_closing_outcome'::regclass AND contype='f' AND pg_get_constraintdef(oid) LIKE '%targetParticipationId%'`,
          )
        ).rows;
        assert.equal(constraints.length, 1);
        await c.query(
          `SET CONSTRAINTS "${constraints[0].conname.replaceAll('"', '""')}" IMMEDIATE`,
        );
        await c.query('SAVEPOINT foreign_target');
        await assert.rejects(
          c.query(insert, [
            randomUUID(),
            f.workspace.id,
            f.project.id,
            s.id,
            closureId,
            entered.operation.enteredVisitId,
            a.id,
            snapshot,
            'carried',
            otherTarget.id,
            foreignEntry.operation.enteredVisitId,
          ]),
          (e) => e.code === '23503',
        );
        await c.query('ROLLBACK TO SAVEPOINT foreign_target');
        await c.query(
          'INSERT INTO sprint_scope_event(id,"workspaceId","projectId","sprintId",ordinal,kind,"activityId","occurredAt") VALUES($1,$2,$3,$4,$5,\'close\',$6,$7)',
          [
            randomUUID(),
            f.workspace.id,
            f.project.id,
            s.id,
            source.version,
            activityId,
            source.closedAt,
          ],
        );
        await assert.rejects(c.query('COMMIT'), (e) => e.code === '23514');
      } finally {
        await c.query('ROLLBACK');
        c.release();
      }
      assert.equal(await digest(f), before);
    },
  );
  await t.test(
    'direct SQL rejects missing closure/outcome sets, scoped FKs, frozen outcomes, closed metadata, old ordinal gaps and start fact rewrites',
    async () => {
      const f = await fixture(),
        s = await sprint(f),
        dest = await sprint(f),
        a = await task(f);
      await assign(f, a.id, s.id);
      await start(f, s.id);
      await assert.rejects(
        pool.query('UPDATE sprint SET state=\'closed\',"closedAt"=clock_timestamp() WHERE id=$1', [
          s.id,
        ]),
        (e) => e.code === '23514',
      );
      const name = `omit_outcome_${randomUUID().replaceAll('-', '')}`;
      try {
        await pool.query(
          `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RETURN NULL;END $$;CREATE TRIGGER ${name} BEFORE INSERT ON sprint_closing_outcome FOR EACH ROW EXECUTE FUNCTION ${name}()`,
        );
        const before = await digest(f);
        assert.ok(
          [400, 409].includes(
            (
              await req(
                f.owner,
                `${path(f, s.id)}/close`,
                closeBody(await preview(f, s.id, dest.id)),
              )
            ).status,
          ),
        );
        assert.equal(await digest(f), before);
      } finally {
        await pool.query(`DROP TRIGGER ${name} ON sprint_closing_outcome;DROP FUNCTION ${name}()`);
      }
      const value = await close(f, s.id, dest.id),
        o = await db.sprintClosingOutcome.findFirstOrThrow({ where: { sprintId: s.id } }),
        event = await db.sprintScopeEvent.findFirstOrThrow({
          where: { sprintId: s.id, kind: 'start' },
        });
      for (const sql of [
        "UPDATE sprint SET name='Changed' WHERE id=$1",
        'UPDATE sprint SET state=\'active\',"closedAt"=NULL WHERE id=$1',
        'DELETE FROM sprint_closure WHERE "sprintId"=$1',
        'UPDATE sprint_closure SET "previewHash"=repeat(\'b\',64) WHERE "sprintId"=$1',
        'DELETE FROM sprint_closing_outcome WHERE "sprintId"=$1',
        'UPDATE sprint_closing_outcome SET snapshot=jsonb_set(snapshot,\'{status}\',\'"done"\') WHERE "sprintId"=$1',
        "UPDATE sprint_start_reference SET snapshot=jsonb_set(snapshot,'{version}','99') WHERE \"sprintId\"=$1",
      ])
        await assert.rejects(pool.query(sql, [s.id]), (e) => e.code === '23514');
      await assert.rejects(
        pool.query(
          'INSERT INTO sprint_scope_event(id,"workspaceId","projectId","sprintId",ordinal,kind,"activityId","occurredAt") VALUES($1,$2,$3,$4,1,\'metadata\',$5,now())',
          [randomUUID(), f.workspace.id, f.project.id, s.id, value.operation.activityId],
        ),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query('UPDATE sprint_scope_event SET ordinal=99 WHERE id=$1', [event.id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query(
          'INSERT INTO sprint_closing_outcome SELECT $1,"workspaceId","projectId","sprintId","closureId","participationId","taskId",snapshot,disposition,"targetSprintId","targetParticipationId" FROM sprint_closing_outcome WHERE id=$2',
          [randomUUID(), o.id],
        ),
        (e) => ['23505', '23514'].includes(e.code),
      );
      const before = await digest(f);
      assert.equal(
        (await req(f.owner, path(f, s.id), { expectedVersion: value.current.version, ...fields }))
          .data.code,
        'invalid-transition',
      );
      assert.equal(
        (
          await req(f.owner, `${f.path}/tasks/${a.id}/sprint`, {
            ...(await scopeBody(f, a.id, s.id)),
          })
        ).data.code,
        'invalid-transition',
      );
      assert.equal(await digest(f), before);
    },
  );
});
