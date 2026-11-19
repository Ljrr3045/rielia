import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { makeSignature } from 'better-auth/crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApplication, createHttpAdapter } from '../dist/application.js';
import { IdentityService } from '../dist/identity/identity.service.js';
import { PrincipalService } from '../dist/principals/principal.service.js';
import { SprintService } from '../dist/projects/sprint.service.js';
import { isPlannedSprint, isProjectPlanning, isSprintPage } from '@rielia/contracts';
import { openEventStream } from './event-stream-client.mjs';

test('T11.1 actual PostgreSQL/NodeAdapter planned sprint and planning settings', async (t) => {
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
    service = app.get(SprintService);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  t.after(async () => {
    await pool.end();
    await app.close();
  });
  async function human() {
    const id = randomUUID(),
      email = `${id}@example.test`;
    await db.user.create({ data: { id, name: 'Planning Human', email, emailVerified: true } });
    const principal = await db.principal.findUniqueOrThrow({ where: { userId: id } }),
      token = randomUUID(),
      sessionId = randomUUID();
    await db.session.create({
      data: { id: sessionId, token, userId: id, expiresAt: new Date(Date.now() + 86400000) },
    });
    return {
      id,
      email,
      sessionId,
      principalId: principal.id,
      cookie: `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, process.env.BETTER_AUTH_SECRET)}`)}`,
    };
  }
  async function request(user, path, body, key = randomUUID(), extra = {}) {
    const response = await fetch(`${url}/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(user ? { cookie: user.cookie } : {}),
        ...(body === undefined
          ? {}
          : {
              'content-type': 'application/json',
              origin: identity.config.origin,
              'idempotency-key': key,
            }),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    if (path.includes('/projects'))
      assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
    return { status: response.status, data: await response.json() };
  }
  async function ok(user, path, body, key) {
    const result = await request(user, path, body, key);
    assert.ok(result.status >= 200 && result.status < 300, JSON.stringify(result));
    return result.data;
  }
  async function fixture() {
    const owner = await human(),
      workspace = await ok(owner, 'workspaces', { name: 'Planning tenant' }),
      root = `workspaces/${workspace.id}`,
      project = await ok(owner, `${root}/projects`, { name: 'Planning project', key: 'SPR' });
    return { owner, workspace, root, project, path: `${root}/projects/${project.id}` };
  }
  async function join(f, role = 'member') {
    const user = await human(),
      invite = await ok(f.owner, `${f.root}/invitations`, { recipientEmail: user.email, role });
    await ok(user, 'workspace-invitations/accept', { token: invite.token });
    return user;
  }
  const fields = {
    name: 'Iteration',
    goal: 'Deliver planning',
    startDate: '2026-03-08',
    endDateExclusive: '2026-03-09',
  };
  async function settings(f, patch = {}) {
    const current = await ok(f.owner, `${f.path}/planning`);
    return ok(f.owner, `${f.path}/planning`, {
      expectedVersion: current.projectVersion,
      mode: 'scrum',
      timeZone: 'America/New_York',
      pointScale: [0, 1, 2, 3, 5, 8, 13, 21],
      ...patch,
    });
  }
  async function create(f, patch = {}, user = f.owner, key) {
    const current = await ok(user, `${f.path}/planning`);
    return ok(
      user,
      `${f.path}/sprints`,
      { expectedProjectVersion: current.projectVersion, ...fields, ...patch },
      key,
    );
  }
  const status = (n) => (error) => {
    assert.equal(error.getStatus(), n);
    return true;
  };

  await t.test(
    'migration adds defaults without touching archived legacy content/version/allocation/history',
    async () => {
      const schema = `t11_migration_${randomUUID().replaceAll('-', '')}`,
        connection = await pool.connect();
      try {
        await connection.query(`CREATE SCHEMA ${schema}`);
        await connection.query(`SET search_path TO ${schema},public`);
        await connection.query(
          `CREATE TABLE project(id text PRIMARY KEY,"workspaceId" text NOT NULL,name text,description text,visibility text,"nextTaskNumber" integer,version integer,"taskRevision" integer,"archivedAt" timestamp(3),"createdByPrincipalId" text,"creationMode" text,"creationSource" text,"creationGrantId" text,"createdAt" timestamp(3),"updatedAt" timestamp(3),UNIQUE("workspaceId",id));CREATE TABLE task(id text PRIMARY KEY,version integer,"archivedAt" timestamp(3));CREATE TABLE activity_event("workspaceId" text,"projectId" text,"taskId" text,action text CONSTRAINT activity_event_action_check CHECK(action='create-task'));CREATE FUNCTION preserve_project() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''legacy update forbidden''; END';CREATE TRIGGER preserve_project BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION preserve_project();INSERT INTO project(id,"workspaceId",version,"taskRevision","nextTaskNumber","archivedAt") VALUES('legacy','w',7,9,11,now());INSERT INTO task VALUES('legacy-task',4,now());INSERT INTO activity_event VALUES('w','legacy','legacy-task','create-task')`,
        );
        const before = (await connection.query(`SELECT to_jsonb(p) AS data FROM project p`)).rows[0]
          .data;
        const tasks = (await connection.query('SELECT to_jsonb(t) AS data FROM task t')).rows;
        await connection.query(
          await readFile(
            new URL(
              '../prisma/migrations/20261119210000_sprint_planning/migration.sql',
              import.meta.url,
            ),
            'utf8',
          ),
        );
        const after = (await connection.query('SELECT to_jsonb(p) AS data FROM project p')).rows[0]
          .data;
        for (const [k, v] of Object.entries(before)) assert.deepEqual(after[k], v);
        assert.equal(after.mode, 'kanban');
        assert.equal(after.timeZone, 'UTC');
        assert.equal(after.sprintRevision, 1);
        assert.deepEqual(after.pointScale, [0, 1, 2, 3, 5, 8, 13, 21]);
        assert.deepEqual(
          (await connection.query('SELECT to_jsonb(t) AS data FROM task t')).rows,
          tasks,
        );
        assert.equal(
          (await connection.query('SELECT count(*)::int AS n FROM activity_event')).rows[0].n,
          1,
        );
      } finally {
        await connection.query('ROLLBACK');
        await connection.query('SET search_path TO public');
        await connection.query(`DROP SCHEMA ${schema} CASCADE`);
        connection.release();
      }
    },
  );
  await t.test(
    'planning preserves Task revisions, captures local/UTC boundaries and streams current Project invalidation',
    async () => {
      const f = await fixture(),
        before = await db.project.findUniqueOrThrow({ where: { id: f.project.id } });
      const initial = await ok(f.owner, `${f.path}/planning`);
      assert.ok(isProjectPlanning(initial));
      assert.equal(initial.mode, 'kanban');
      assert.equal(initial.capabilities.canCreateSprint, false);
      assert.equal(
        (await request(f.owner, `${f.path}/sprints`, { expectedProjectVersion: 1, ...fields }))
          .status,
        409,
      );
      const config = await settings(f);
      assert.equal(config.projectVersion, 2);
      assert.equal(config.sprintRevision, 1);
      const stream = await openEventStream(url, f.workspace.id, f.owner.cookie);
      try {
        await stream.wait((e) => e.data.type === 'reset');
        const sprint = await create(f);
        assert.ok(isPlannedSprint(sprint));
        assert.equal(sprint.startsAt, '2026-03-08T05:00:00.000Z');
        assert.equal(sprint.endsAt, '2026-03-09T04:00:00.000Z');
        const hint = await stream.wait((e) => e.data.type === 'invalidate');
        assert.deepEqual(hint.data, {
          type: 'invalidate',
          entity: 'project',
          id: f.project.id,
          projectId: f.project.id,
          version: 2,
        });
        assert.equal(JSON.stringify(stream.records).includes(sprint.goal), false);
        const current = await db.project.findUniqueOrThrow({ where: { id: f.project.id } });
        assert.equal(current.version, 2);
        assert.equal(current.taskRevision, before.taskRevision);
        assert.equal(current.nextTaskNumber, before.nextTaskNumber);
        assert.equal(current.sprintRevision, 2);
        await settings(f, { mode: 'kanban', timeZone: 'UTC' });
        const edit = await ok(f.owner, `${f.path}/sprints/${sprint.id}`, {
          expectedVersion: 1,
          ...fields,
          name: 'Renamed',
        });
        assert.equal(edit.version, 2);
        assert.equal(edit.timeZone, 'America/New_York');
        assert.equal(edit.startsAt, sprint.startsAt);
        assert.equal((await ok(f.owner, `${f.path}/sprints`)).items.length, 1);
        assert.equal(
          (await request(f.owner, `${f.path}/sprints`, { expectedProjectVersion: 3, ...fields }))
            .status,
          409,
        );
      } finally {
        await stream.close();
      }
    },
  );
  await t.test(
    'strict IANA/date/input/origin/query and unimplemented route boundaries fail closed',
    async () => {
      const f = await fixture();
      await settings(f);
      for (const patch of [
        { timeZone: '+04:00' },
        { timeZone: 'Invalid/Zone' },
        { pointScale: [] },
        { pointScale: [1, 1] },
        { pointScale: [1001] },
        { pointScale: [1.5] },
        { mode: 'invalid' },
        { actorPrincipalId: 'forged' },
      ])
        assert.equal(
          (
            await request(f.owner, `${f.path}/planning`, {
              expectedVersion: 2,
              mode: 'scrum',
              timeZone: 'UTC',
              pointScale: [0, 1],
              ...patch,
            })
          ).status,
          400,
        );
      for (const patch of [
        { startDate: '2026-02-30' },
        { startDate: '0000-01-01' },
        { endDateExclusive: fields.startDate },
        { name: ' ' },
        { goal: 'x'.repeat(2001) },
        { source: 'mcp' },
        { state: 'active' },
      ])
        assert.equal(
          (
            await request(f.owner, `${f.path}/sprints`, {
              expectedProjectVersion: 2,
              ...fields,
              ...patch,
            })
          ).status,
          400,
        );
      await settings(f, { timeZone: 'America/Havana' });
      for (const dates of [
        { startDate: '2026-03-08', endDateExclusive: '2026-03-09' },
        { startDate: '2026-11-01', endDateExclusive: '2026-11-02' },
      ])
        assert.equal(
          (
            await request(f.owner, `${f.path}/sprints`, {
              expectedProjectVersion: 3,
              ...fields,
              ...dates,
            })
          ).status,
          400,
        );
      for (const suffix of [
        '/sprints?cursor=a&cursor=b',
        '/sprints?view=active',
        '/planning?unknown=value',
      ])
        assert.equal((await request(f.owner, f.path + suffix)).status, 400);
      assert.equal(
        (
          await request(
            f.owner,
            `${f.path}/sprints`,
            { expectedProjectVersion: 3, ...fields },
            randomUUID(),
            { origin: 'https://hostile.example.test' },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(f.owner, `${f.path}/planning`, undefined, undefined, {
            'x-rielia-mode': 'autonomous',
          })
        ).status,
        400,
      );
      assert.equal((await request(null, `${f.path}/planning`)).status, 401);
      await settings(f, { timeZone: 'America/New_York' });
      const valid = await create(f, { startDate: '2026-11-01', endDateExclusive: '2026-11-02' });
      assert.equal(Date.parse(valid.endsAt) - Date.parse(valid.startsAt), 25 * 3600000);
      assert.equal((await request(f.owner, `${f.path}/sprints/${valid.id}/start`, {})).status, 404);
      await settings(f, { timeZone: 'Etc/GMT-1' });
      const boundaryConfig = await ok(f.owner, `${f.path}/planning`);
      const beforeUnsupported = await db.sprint.count();
      assert.equal(
        (
          await request(f.owner, `${f.path}/sprints`, {
            expectedProjectVersion: boundaryConfig.projectVersion,
            ...fields,
            startDate: '0001-01-01',
            endDateExclusive: '0001-01-02',
          })
        ).status,
        400,
      );
      assert.equal(await db.sprint.count(), beforeUnsupported);
      await settings(f, { timeZone: 'UTC' });
      const earliest = await create(f, { startDate: '0001-01-01', endDateExclusive: '0001-01-02' });
      assert.equal(earliest.startDate, '0001-01-01');
      assert.equal(earliest.startsAt, '0001-01-01T00:00:00.000Z');
    },
  );
  await t.test(
    'same-key concurrent creation, different-hash rejection, versions and archived replay are atomic',
    async () => {
      const f = await fixture(),
        config = await settings(f),
        key = randomUUID(),
        body = { expectedProjectVersion: config.projectVersion, ...fields };
      const [a, b] = await Promise.all([
        request(f.owner, `${f.path}/sprints`, body, key),
        request(f.owner, `${f.path}/sprints`, body, key),
      ]);
      assert.equal(a.status, 201);
      assert.equal(b.status, 201);
      assert.equal(a.data.id, b.data.id);
      const id = a.data.id;
      assert.equal(await db.sprint.count({ where: { projectId: f.project.id } }), 1);
      assert.equal(
        await db.activityEvent.count({ where: { sprintId: id, action: 'create-sprint' } }),
        1,
      );
      assert.equal(
        (await request(f.owner, `${f.path}/sprints`, { ...body, name: 'Different' }, key)).data
          .code,
        'idempotency-conflict',
      );
      const edits = await Promise.all(
        ['One', 'Two'].map((name) =>
          request(f.owner, `${f.path}/sprints/${id}`, { expectedVersion: 1, ...fields, name }),
        ),
      );
      assert.deepEqual(edits.map((x) => x.status).sort(), [201, 409]);
      const current = await ok(f.owner, `${f.path}/sprints/${id}`);
      assert.equal(current.version, 2);
      assert.equal((await ok(f.owner, `${f.path}/sprints`, body, key)).version, 2);
      await ok(f.owner, `${f.path}/archive`, { expectedVersion: 2 });
      const replay = await ok(f.owner, `${f.path}/sprints`, body, key);
      assert.equal(replay.capabilities.canEdit, false);
      assert.equal(
        (await request(f.owner, `${f.path}/sprints/${id}`, { expectedVersion: 2, ...fields })).data
          .code,
        'archived',
      );
      assert.equal(
        (
          await request(f.owner, `${f.path}/planning`, {
            expectedVersion: 3,
            mode: 'scrum',
            timeZone: 'UTC',
            pointScale: [0, 1],
          })
        ).data.code,
        'archived',
      );
      await assert.rejects(
        pool.query('UPDATE sprint SET "createdByPrincipalId"=$1 WHERE id=$2', ['different', id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query('DELETE FROM sprint WHERE id=$1', [id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query("UPDATE sprint SET state='active' WHERE id=$1", [id]),
        (e) => e.code === '23514',
      );
      await assert.rejects(
        pool.query('UPDATE project SET "pointScale"=ARRAY[1,1] WHERE id=$1', [f.project.id]),
        (e) => e.code === '23514',
      );
    },
  );
  await t.test(
    'tenant/private/viewer/current revocation and actual grant subjects intersect every replay',
    async () => {
      const f = await fixture(),
        other = await fixture();
      await settings(f);
      const member = await join(f),
        viewer = await join(f, 'viewer');
      const sprint = await create(f, {}, member);
      assert.equal(sprint.creator.principalId, member.principalId);
      assert.equal(
        (await ok(viewer, `${f.path}/sprints/${sprint.id}`)).capabilities.canEdit,
        false,
      );
      assert.equal(
        (await request(viewer, `${f.path}/sprints`, { expectedProjectVersion: 2, ...fields }))
          .status,
        403,
      );
      assert.equal((await request(other.owner, `${f.path}/sprints`)).status, 403);
      assert.equal((await request(other.owner, `${other.path}/sprints/${sprint.id}`)).status, 403);
      await ok(f.owner, `${f.path}/visibility`, { expectedVersion: 2, visibility: 'private' });
      assert.equal((await request(member, `${f.path}/sprints`)).status, 403);
      assert.equal((await request(viewer, `${f.path}/sprints/${sprint.id}`)).status, 403);
      assert.equal((await ok(f.owner, `${f.path}/sprints`)).total, 1);
      await ok(f.owner, `${f.path}/access/${member.principalId}`, {
        expectedVersion: 3,
        state: 'active',
      });
      const current = await ok(member, `${f.path}/planning`),
        key = randomUUID(),
        body = { expectedProjectVersion: current.projectVersion, ...fields };
      await ok(member, `${f.path}/sprints`, body, key);
      await ok(f.owner, `${f.path}/access/${member.principalId}`, {
        expectedVersion: 4,
        state: 'revoked',
      });
      assert.equal((await request(member, `${f.path}/sprints`, body, key)).status, 403);
      const context = (await principals.webContext({ cookie: f.owner.cookie }, f.workspace.id))
        .context;
      const agent = await principals.registerAgent(context, {
        name: 'Planner Agent',
        role: 'member',
        custodianPrincipalId: f.owner.principalId,
      });
      // Private content still requires the Agent's own explicit access.
      const pv = await ok(f.owner, `${f.path}/planning`);
      await ok(f.owner, `${f.path}/access/${agent}`, {
        expectedVersion: pv.projectVersion,
        state: 'active',
      });
      for (const [mode, subject] of [
        ['delegated', f.owner.principalId],
        ['autonomous', agent],
      ]) {
        const grant = await principals.recordInternalGrant(context, {
            subjectPrincipalId: subject,
            mode,
            allowedOperations: ['read', 'write'],
            expiresAt: new Date(Date.now() + 3600000),
          }),
          execution = await principals.internalGrantContext(grant, f.workspace.id),
          planning = await service.planning(execution, f.workspace.id, f.project.id),
          key = randomUUID(),
          body = { expectedProjectVersion: planning.projectVersion, ...fields };
        const result = await service.save(
          execution,
          f.workspace.id,
          f.project.id,
          key,
          randomUUID(),
          body,
        );
        assert.equal(result.creator.principalId, subject);
        assert.equal(result.provenance.executionMode, mode);
        await principals.revokeGrant(context, grant);
        await assert.rejects(
          service.save(execution, f.workspace.id, f.project.id, key, randomUUID(), body),
          status(401),
        );
      }
      const readGrant = await principals.recordInternalGrant(context, {
          subjectPrincipalId: agent,
          mode: 'autonomous',
          allowedOperations: ['read'],
          expiresAt: new Date(Date.now() + 3600000),
        }),
        read = await principals.internalGrantContext(readGrant, f.workspace.id);
      assert.equal(
        (await service.planning(read, f.workspace.id, f.project.id)).capabilities
          .canConfigurePlanning,
        false,
      );
      await assert.rejects(
        service.save(read, f.workspace.id, f.project.id, randomUUID(), randomUUID(), {
          expectedProjectVersion: 6,
          ...fields,
        }),
        status(403),
      );
      await assert.rejects(
        service.planning({ ...context }, f.workspace.id, f.project.id),
        status(401),
      );
      await db.session.delete({ where: { id: f.owner.sessionId } });
      assert.equal((await request(f.owner, `${f.path}/planning`)).status, 401);
    },
  );
  await t.test(
    'concurrent planning configuration and role downgrade fence original-key replay',
    async () => {
      const f = await fixture();
      const body = { expectedVersion: 1, mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 3] };
      const results = await Promise.all([
        request(f.owner, `${f.path}/planning`, body),
        request(f.owner, `${f.path}/planning`, { ...body, timeZone: 'America/Caracas' }),
      ]);
      assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
      const member = await join(f);
      const current = await ok(member, `${f.path}/planning`);
      const key = randomUUID();
      const command = { expectedProjectVersion: current.projectVersion, ...fields };
      await ok(member, `${f.path}/sprints`, command, key);
      await pool.query(
        'UPDATE membership SET role=\'viewer\' WHERE "workspaceId"=$1 AND "principalId"=$2',
        [f.workspace.id, member.principalId],
      );
      assert.equal((await request(member, `${f.path}/sprints`, command, key)).status, 403);
    },
  );
  await t.test(
    'actual committed response loss retries the exact key without a second sprint or journal',
    async () => {
      const f = await fixture();
      const config = await settings(f);
      const body = { expectedProjectVersion: config.projectVersion, ...fields };
      const key = randomUUID();
      let release, notify;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      const committed = new Promise((resolve) => {
        notify = resolve;
      });
      const original = service.save;
      service.save = async (...args) => {
        const result = await original.apply(service, args);
        notify(result);
        await held;
        return result;
      };
      const abort = new AbortController();
      const pending = fetch(`${url}/api/v1/${f.path}/sprints`, {
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
        const rejection = assert.rejects(pending, (error) => error.name === 'AbortError');
        const result = await committed;
        abort.abort();
        await rejection;
        release();
        service.save = original;
        const replay = await ok(f.owner, `${f.path}/sprints`, body, key);
        assert.equal(replay.id, result.id);
        assert.equal(await db.sprint.count({ where: { projectId: f.project.id } }), 1);
        assert.equal(await db.activityEvent.count({ where: { sprintId: result.id } }), 1);
      } finally {
        abort.abort();
        release();
        service.save = original;
      }
    },
  );
  await t.test(
    'revision-bound pages include at most100 items, reject stale/foreign anchors and hide no totals',
    async () => {
      const f = await fixture();
      await settings(f);
      for (let i = 0; i < 102; i++) await create(f, { name: `Iteration ${i}` });
      const first = await ok(f.owner, `${f.path}/sprints`);
      assert.ok(isSprintPage(first));
      assert.equal(first.items.length, 100);
      assert.equal(first.total, 102);
      const second = await ok(f.owner, `${f.path}/sprints?cursor=${first.nextCursor}`);
      assert.equal(second.items.length, 2);
      assert.equal(new Set([...first.items, ...second.items].map((x) => x.id)).size, 102);
      await create(f);
      assert.equal(
        (await request(f.owner, `${f.path}/sprints?cursor=${first.nextCursor}`)).data.code,
        'page-changed',
      );
    },
  );
  await t.test(
    'deferred failure at every durable stage rolls back sprint/revisions/activity/outbox/receipt',
    async () => {
      const f = await fixture();
      await settings(f);
      const snapshot = async () => ({
        sprints: await db.sprint.count(),
        activity: await db.activityEvent.count(),
        outbox: await db.outboxEvent.count(),
        receipts: await db.projectTaskOperation.count(),
        project: await db.project.findUniqueOrThrow({ where: { id: f.project.id } }),
      });
      for (const table of ['sprint', 'activity_event', 'outbox_event', 'project_task_operation']) {
        const name = `t11_rollback_${randomUUID().replaceAll('-', '')}`,
          match =
            table === 'outbox_event'
              ? `EXISTS(SELECT 1 FROM activity_event WHERE id=NEW."activityId" AND "projectId"='${f.project.id}')`
              : table === 'project_task_operation'
                ? `NEW."workspaceId"='${f.workspace.id}' AND NEW.response->>'kind'='planned-sprint'`
                : `NEW."projectId"='${f.project.id}'`;
        try {
          await pool.query(
            `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${match} THEN RAISE EXCEPTION 'injected rollback' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;CREATE CONSTRAINT TRIGGER ${name} AFTER INSERT ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ${name}()`,
          );
          const before = await snapshot();
          assert.equal(
            (await request(f.owner, `${f.path}/sprints`, { expectedProjectVersion: 2, ...fields }))
              .status,
            400,
          );
          assert.deepEqual(await snapshot(), before);
        } finally {
          await pool.query(
            `DROP TRIGGER IF EXISTS ${name} ON ${table};DROP FUNCTION IF EXISTS ${name}()`,
          );
        }
      }
    },
  );
});
