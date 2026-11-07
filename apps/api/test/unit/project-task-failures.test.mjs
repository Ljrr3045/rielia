import 'reflect-metadata';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const workspaceId = 'workspace-unit';
const projectId = 'project-unit';
const taskId = '00000000-0000-4000-8000-000000000001';
const key = '11111111-1111-4111-8111-111111111111';
const requestId = 'request-unit';
const freeze = (value) => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const copy = (value) => freeze(globalThis.structuredClone(value));
const payload = Object.freeze({ title: 'Created task' });

// Scripted records stand for repository results, not a query engine or a
// transactional store. Effects are observations of attempted collaborator calls;
// only the real PostgreSQL suites can establish rollback and atomicity.
function fixture(t, actorPatch = {}) {
  t.mock.timers.enable({ apis: ['Date'], now });
  let nextId = 0;
  t.mock.method(
    crypto,
    'randomUUID',
    () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`,
  );
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  const actor = Object.freeze({
    actorPrincipalId: 'human-unit',
    principalKind: 'human',
    workspaceId,
    executionMode: 'human',
    source: 'web',
    role: 'member',
    grantId: null,
    ...actorPatch,
  });
  const context = Object.freeze({ boundary: 'verified by PrincipalService' });
  const state = {
    project: {
      id: projectId,
      workspaceId,
      key: 'UNIT',
      name: 'Unit project',
      description: '',
      visibility: 'workspace',
      version: 3,
      taskRevision: 7,
      archivedAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      createdByPrincipalId: 'human-unit',
      creationMode: 'human',
      creationSource: 'web',
      creationGrantId: null,
    },
    task: {
      id: taskId,
      workspaceId,
      projectId,
      number: 1,
      title: 'Created task',
      description: '',
      type: 'task',
      priority: 'none',
      status: 'backlog',
      assigneePrincipalId: null,
      parentTaskId: null,
      dueDate: null,
      version: 4,
      rank: 1000n,
      archivedAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      createdByPrincipalId: 'human-unit',
      creationMode: 'human',
      creationSource: 'web',
      creationGrantId: null,
    },
    projectAvailable: true,
    receipt: null,
    authorizationError: null,
    failAt: null,
  };
  const effects = { tasks: [], activities: [], outbox: [], receipts: [] };
  const trace = [];
  const failure = new Error('injected collaborator failure');
  const observe = (name, data) => {
    trace.push(name);
    effects[name].push(globalThis.structuredClone(data));
    if (state.failAt === name) throw failure;
  };
  const tx = {
    project: {
      findFirst: async () => {
        trace.push('project-read');
        return state.projectAvailable ? copy(state.project) : null;
      },
      findUniqueOrThrow: async () => {
        trace.push('project-current');
        return copy(state.project);
      },
    },
    task: {
      findUnique: async () => {
        trace.push('task-current');
        return copy(state.task);
      },
      findFirst: async () => copy(state.task),
      create: async ({ data }) => {
        observe('tasks', data);
        return copy(state.task);
      },
    },
    membership: {
      findMany: async () => [
        copy({
          principalId: 'human-unit',
          role: 'member',
          state: 'active',
          principal: { displayName: 'Unit Human', kind: 'human', state: 'active' },
          projectAccesses: [],
        }),
      ],
    },
    projectTaskOperation: {
      findUnique: async () => {
        trace.push('receipt-read');
        return copy(state.receipt);
      },
      create: async ({ data }) => {
        observe('receipts', data);
        state.receipt = globalThis.structuredClone(data);
      },
    },
    activityEvent: {
      create: async ({ data }) => {
        observe('activities', data);
      },
    },
    outboxEvent: {
      create: async ({ data }) => {
        observe('outbox', data);
      },
    },
  };
  const principals = {
    domainOperation: async (received, scope, operation, work) => {
      assert.equal(received, context);
      assert.equal(scope, workspaceId);
      assert.equal(operation, 'write');
      trace.push('authorize');
      if (state.authorizationError) throw state.authorizationError;
      return work(tx, actor, true);
    },
  };
  const service = new ProjectTaskService(principals);
  const create = (input) =>
    service.createTask(context, workspaceId, projectId, key, requestId, input ?? payload);
  return { service, context, actor, state, effects, trace, failure, create };
}

const status = (code) => (error) => {
  assert.equal(error.getStatus(), code);
  return true;
};
const noEffects = (f) =>
  assert.deepEqual(f.effects, { tasks: [], activities: [], outbox: [], receipts: [] });

test(
  'invalid authorship and impossible calendar dates fail before authorization or persistence',
  { timeout: 5000 },
  (t) => {
    const f = fixture(t);
    for (const input of [
      { title: 'Created task', createdByPrincipalId: 'someone-else' },
      { title: 'Created task', executionMode: 'autonomous' },
      { title: 'Created task', author: 'someone-else' },
      { title: 'Created task', dueDate: '2026-02-29' },
      { title: 'Created task', dueDate: '2026-04-31' },
      { title: 'Created task', dueDate: '0000-01-01' },
      { title: 'Created task', dueDate: '2026-01-01T00:00:00Z' },
      { title: '   ' },
    ])
      assert.throws(() => f.create(input), status(400));
    assert.deepEqual(f.trace, []);
    noEffects(f);
  },
);

test(
  'an unavailable private project and a missing project have the same public denial',
  { timeout: 5000 },
  async (t) => {
    const responses = [];
    for (const reason of ['private project denied by repository scope', 'missing project']) {
      await t.test(reason, async (child) => {
        const f = fixture(child);
        f.state.projectAvailable = false;
        await assert.rejects(f.create(), (error) => {
          assert.equal(error.getStatus(), 403);
          responses.push(error.getResponse());
          assert.equal('current' in error.getResponse(), false);
          return true;
        });
        assert.deepEqual(f.trace, ['authorize', 'project-read']);
        noEffects(f);
      });
    }
    assert.deepEqual(responses, [
      { statusCode: 403, error: 'Forbidden', message: 'Project/task access is denied.' },
      { statusCode: 403, error: 'Forbidden', message: 'Project/task access is denied.' },
    ]);
  },
);

test(
  'stale expectedVersion returns current authorized task without attempting a write',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    f.state.task.title = 'Current authorized content';
    await assert.rejects(
      f.service.changeTask(f.context, workspaceId, projectId, taskId, key, requestId, 'edit-task', {
        expectedVersion: 3,
        title: 'Stale overwrite',
      }),
      (error) => {
        assert.equal(error.getStatus(), 409);
        const response = error.getResponse();
        assert.equal(response.code, 'version-conflict');
        assert.equal(response.current.id, taskId);
        assert.equal(response.current.title, 'Current authorized content');
        assert.equal(response.current.version, 4);
        assert.equal(response.current.orderVersion, 7);
        assert.deepEqual(response.current.creator, {
          principalId: 'human-unit',
          name: 'Unit Human',
          kind: 'human',
          active: true,
        });
        assert.equal(response.current.capabilities.canEdit, true);
        assert.equal('rank' in response.current, false);
        return true;
      },
    );
    noEffects(f);
  },
);

test('delegated administrator cannot change project visibility', { timeout: 5000 }, async (t) => {
  const f = fixture(t, {
    role: 'admin',
    executionMode: 'delegated',
    source: 'mcp',
    grantId: 'grant-unit',
  });
  await assert.rejects(
    f.service.changeVisibility(f.context, workspaceId, projectId, key, requestId, {
      expectedVersion: 3,
      visibility: 'private',
    }),
    (error) => {
      assert.equal(error.getStatus(), 403);
      assert.equal(error.message, 'Human project administration is required.');
      return true;
    },
  );
  assert.deepEqual(f.trace, ['authorize']);
  noEffects(f);
});

test(
  'successful task creation uses server attribution and one linked activity, outbox and receipt',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const result = await f.create({ title: '  Created task  ' });
    assert.equal(result.id, taskId);
    assert.equal(result.title, 'Created task');
    assert.equal(result.assigneePrincipalId, null);
    assert.equal(result.assignee, null);
    assert.deepEqual(result.provenance, {
      actorPrincipalId: 'human-unit',
      executionMode: 'human',
      source: 'web',
      grantId: null,
    });
    assert.deepEqual(f.effects.tasks, [
      {
        id: taskId,
        workspaceId,
        projectId,
        number: 1,
        title: 'Created task',
        description: '',
        type: 'task',
        priority: 'none',
        status: 'backlog',
        assigneePrincipalId: null,
        dueDate: null,
        createdByPrincipalId: 'human-unit',
        creationMode: 'human',
        creationSource: 'web',
        creationGrantId: null,
      },
    ]);
    assert.equal(f.effects.activities.length, 1);
    const activity = f.effects.activities[0];
    assert.equal(activity.actorPrincipalId, 'human-unit');
    assert.equal(activity.taskId, result.id);
    assert.equal(activity.entityVersion, result.version);
    assert.equal(activity.requestId, requestId);
    assert.equal(activity.action, 'create-task');
    assert.equal('title' in activity, false);
    assert.equal('description' in activity, false);
    assert.deepEqual(f.effects.outbox, [
      {
        id: '00000000-0000-4000-8000-000000000003',
        workspaceId,
        activityId: activity.id,
        type: 'domain.activity',
        payload: { activityId: activity.id },
      },
    ]);
    assert.equal(f.effects.receipts.length, 1);
    assert.equal(f.effects.receipts[0].key, key);
    assert.equal(f.effects.receipts[0].executionScope, 'web');
    assert.deepEqual(f.effects.receipts[0].response, result);
    assert.deepEqual(
      f.trace.filter((name) => ['tasks', 'activities', 'outbox', 'receipts'].includes(name)),
      ['tasks', 'activities', 'outbox', 'receipts'],
    );
  },
);

test(
  'same idempotency key with different payload conflicts before another command effect',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    await f.create();
    const before = globalThis.structuredClone(f.effects);
    await assert.rejects(f.create({ title: 'Different command' }), (error) => {
      assert.equal(error.getStatus(), 409);
      assert.equal(error.message, 'Idempotency key belongs to another request.');
      return true;
    });
    assert.deepEqual(f.effects, before);
  },
);

test(
  'original-key replay reauthorizes and returns current content without new effects',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const original = await f.create();
    const before = globalThis.structuredClone(f.effects);
    f.state.task.title = 'Edited since the original command';
    f.state.task.version = 8;
    f.state.project.taskRevision = 12;
    const replay = await f.create();
    assert.equal(replay.id, original.id);
    assert.equal(replay.title, 'Edited since the original command');
    assert.equal(replay.version, 8);
    assert.equal(replay.orderVersion, 12);
    assert.equal(f.trace.filter((name) => name === 'authorize').length, 2);
    assert.deepEqual(f.effects, before);
    assert.equal(f.state.receipt.response.title, 'Created task');
  },
);

test(
  'original-key replay cannot use a receipt after current authorization is revoked',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    await f.create();
    const before = globalThis.structuredClone(f.effects);
    const traceStart = f.trace.length;
    f.state.authorizationError = new ForbiddenException('Workspace access is denied.');
    await assert.rejects(f.create(), (error) => error === f.state.authorizationError);
    assert.deepEqual(f.trace.slice(traceStart), ['authorize']);
    assert.deepEqual(f.effects, before);
  },
);

test(
  'original-key replay cannot expose a project that is no longer readable',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    await f.create();
    const before = globalThis.structuredClone(f.effects);
    const traceStart = f.trace.length;
    f.state.projectAvailable = false;
    await assert.rejects(f.create(), status(403));
    assert.deepEqual(f.trace.slice(traceStart), ['authorize', 'project-read']);
    assert.deepEqual(f.effects, before);
  },
);

test(
  'collaborator failures reject instead of continuing later command effects',
  { timeout: 5000 },
  async (t) => {
    for (const [failed, attempted] of [
      ['tasks', ['tasks']],
      ['activities', ['tasks', 'activities']],
      ['outbox', ['tasks', 'activities', 'outbox']],
      ['receipts', ['tasks', 'activities', 'outbox', 'receipts']],
    ]) {
      await t.test(failed, async (child) => {
        const f = fixture(child);
        f.state.failAt = failed;
        await assert.rejects(f.create(), (error) => error === f.failure);
        assert.deepEqual(
          f.trace.filter((name) => ['tasks', 'activities', 'outbox', 'receipts'].includes(name)),
          attempted,
        );
        for (const name of ['tasks', 'activities', 'outbox', 'receipts']) {
          assert.equal(f.effects[name].length, attempted.includes(name) ? 1 : 0);
        }
        assert.equal(f.state.receipt, null);
      });
    }
  },
);
