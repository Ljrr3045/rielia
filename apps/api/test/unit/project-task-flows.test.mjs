import 'reflect-metadata';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';

const workspaceId = 'workspace-flow';
const projectId = 'project-flow';
const taskId = 'task-flow';
const principalId = 'member-flow';
const requestId = 'request-flow';
const key = '11111111-1111-4111-8111-111111111111';
const now = Date.UTC(2026, 10, 7, 12);
const projectRow = (patch = {}) => ({
  id: projectId,
  workspaceId,
  sequence: 11n,
  key: 'FLOW',
  name: 'Flow project',
  description: 'Project description',
  visibility: 'workspace',
  version: 3,
  taskRevision: 7,
  archivedAt: null,
  createdAt: new Date(now),
  updatedAt: new Date(now),
  createdByPrincipalId: 'human-flow',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
  ...patch,
});
const taskRow = (patch = {}) => ({
  id: taskId,
  workspaceId,
  projectId,
  number: 1,
  title: 'Parent task',
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
  createdByPrincipalId: 'human-flow',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
  ...patch,
});
const memberRow = (id = 'human-flow', patch = {}) => ({
  workspaceId,
  principalId: id,
  role: 'member',
  state: 'active',
  principal: {
    displayName: id === 'human-flow' ? 'Flow Human' : 'Target Human',
    kind: 'human',
    state: 'active',
  },
  projectAccesses: [],
  ...patch,
});
const creator = () => [memberRow()];
const answer = (name, value, inspect) => ({ name, value, inspect });
const cursor = (patch = {}) =>
  Buffer.from(
    JSON.stringify({
      v: 1,
      w: workspaceId,
      p: projectId,
      view: 'active',
      filters: {},
      revision: 7,
      anchor: 'anchor-flow',
      ...patch,
    }),
  ).toString('base64url');

// The script supplies loaded answers only. It never evaluates a where clause,
// mutates storage, increments versions, computes permissions/ranks or emulates
// transaction/trigger behavior. Unexpected calls and unused answers fail closed.
function fixture(t, options = {}) {
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
    actorPrincipalId: 'human-flow',
    principalKind: 'human',
    workspaceId,
    executionMode: 'human',
    source: 'web',
    role: 'admin',
    grantId: null,
    ...options.actor,
  });
  const context = Object.freeze({ boundary: 'current verified PrincipalService evidence' });
  const pending = [],
    calls = [],
    authorities = [];
  const consume = async (name, args) => {
    calls.push({ name, args: globalThis.structuredClone(args) });
    const step = pending.shift();
    assert.ok(step, 'Unexpected collaborator call: ' + name);
    assert.equal(name, step.name, 'Scripted collaborator order');
    step.inspect?.(...args);
    if (step.error) throw step.error;
    return globalThis.structuredClone(step.value);
  };
  const tx = {};
  for (const model of [
    'project',
    'task',
    'membership',
    'projectAccess',
    'projectTaskOperation',
    'activityEvent',
    'outboxEvent',
  ]) {
    tx[model] = {};
    for (const operation of [
      'findFirst',
      'findUnique',
      'findUniqueOrThrow',
      'findMany',
      'count',
      'groupBy',
      'create',
      'update',
      'upsert',
    ])
      tx[model][operation] = (...args) => consume(model + '.' + operation, args);
  }
  tx.$queryRaw = (...args) => consume('rank', args);
  const principals = {
    domainOperation: async (received, scope, operation, work) => {
      assert.equal(received, context);
      assert.equal(scope, workspaceId);
      authorities.push(operation);
      if (options.authorityError) throw options.authorityError;
      return work(tx, actor, options.canWrite ?? true);
    },
    assertAssignable: async (received, scope, id) => {
      assert.equal(received, tx);
      return consume('principal.assertAssignable', [scope, id]);
    },
  };
  return {
    service: new ProjectTaskService(principals),
    actor,
    context,
    calls,
    authorities,
    script: (...steps) => pending.push(...steps),
    done: () => {
      assert.deepEqual(pending, [], 'Unused required collaborator answers');
      assert.equal(authorities.length, 1, 'One authority/transaction operation');
    },
  };
}
const denial = (status, code, inspect) => (error) => {
  assert.equal(error.getStatus(), status);
  const body = error.getResponse();
  if (code) assert.equal(body.code, code);
  inspect?.(body);
  return true;
};
const noEffects = (f) =>
  assert.deepEqual(
    f.calls.filter(({ name }) => /\.(?:create|update|upsert)$/.test(name) || name === 'rank'),
    [],
  );
const journal = () => [
  answer('activityEvent.create'),
  answer('outboxEvent.create'),
  answer('projectTaskOperation.create'),
];
const mutationStart = (project = projectRow(), before) => [
  answer('project.findFirst', project),
  answer('projectTaskOperation.findUnique', null),
  ...(before ? [answer('task.findFirst', before)] : []),
];
const currentTask = (project = projectRow(), task = taskRow(), people = creator()) => [
  answer('project.findFirst', project),
  answer('task.findUnique', task),
  answer('project.findUniqueOrThrow', project),
  answer('membership.findMany', people),
];
const changeProject = (f, action, payload) =>
  f.service.changeProject(f.context, workspaceId, projectId, key, requestId, action, payload);
const changeAccess = (f, state = 'active', expectedVersion = 3) =>
  f.service.changeAccess(f.context, workspaceId, projectId, principalId, key, requestId, {
    expectedVersion,
    state,
  });
const move = (f, patch = {}) =>
  f.service.moveTask(f.context, workspaceId, projectId, taskId, key, requestId, {
    expectedVersion: 4,
    expectedOrderVersion: 7,
    status: 'todo',
    beforeTaskId: null,
    ...patch,
  });

test(
  'projects resolves only a current visible ID anchor and returns a bounded page without global sequence',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const rows = Array.from({ length: 101 }, (_, n) =>
      projectRow({ id: `project-${n}`, sequence: BigInt(n + 12) }),
    );
    f.script(
      answer('project.findFirst', { sequence: 11n }, ({ where, select }) => {
        assert.equal(where.workspaceId, workspaceId);
        assert.equal(where.id, 'anchor-flow');
        assert.deepEqual(select, { sequence: true });
      }),
      answer('project.findMany', rows, ({ where, take, orderBy }) => {
        assert.deepEqual(where.sequence, { gt: 11n });
        assert.equal(where.archivedAt, null);
        assert.equal(take, 101);
        assert.deepEqual(orderBy, { sequence: 'asc' });
      }),
      answer('membership.findMany', creator()),
      answer('project.count', 145),
    );
    const result = await f.service.projects(f.context, workspaceId, 'active', 'anchor-flow');
    assert.equal(result.items.length, 100);
    assert.equal(result.nextCursor, 'project-99');
    assert.equal(result.total, 145);
    assert.deepEqual(result.capabilities, { canCreate: true, canCreatePrivate: true });
    assert.ok(result.items.every((row) => !('sequence' in row)));
    f.done();
  },
);

test(
  'project pages keep archive/read-only projection and no cursor on a short final page',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { canWrite: false, actor: { role: 'viewer' } });
    f.script(
      answer('project.findMany', [projectRow({ archivedAt: new Date(now) })], ({ where, take }) => {
        assert.equal(where.workspaceId, workspaceId);
        assert.deepEqual(where.archivedAt, { not: null });
        assert.equal(where.OR.length, 2);
        assert.equal(take, 101);
      }),
      answer('membership.findMany', creator()),
      answer('project.count', 1),
    );
    const result = await f.service.projects(f.context, workspaceId, 'archived');
    assert.equal(result.nextCursor, null);
    assert.equal(result.items[0].archivedAt, new Date(now).toISOString());
    assert.deepEqual(result.capabilities, { canCreate: false, canCreatePrivate: false });
    assert.equal(result.items[0].capabilities.canEdit, false);
    f.done();
  },
);

test(
  'malformed project cursor rejects before authority and missing current anchor rejects before page hydration',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    assert.throws(
      () => f.service.projects(f.context, workspaceId, 'active', '!foreign'),
      denial(400),
    );
    assert.deepEqual(f.authorities, []);
    assert.deepEqual(f.calls, []);
    f.script(answer('project.findFirst', null));
    await assert.rejects(
      f.service.projects(f.context, workspaceId, 'active', 'foreign-anchor'),
      denial(400),
    );
    assert.deepEqual(
      f.calls.map(({ name }) => name),
      ['project.findFirst'],
    );
    f.done();
  },
);

test(
  'current denied project stops detail and task collection before task data or people hydration',
  { timeout: 5000 },
  async (t) => {
    for (const operation of ['project', 'task', 'tasks'])
      await t.test(operation, async (child) => {
        const f = fixture(child);
        f.script(answer('project.findFirst', null));
        await assert.rejects(
          f.service[operation](
            f.context,
            workspaceId,
            projectId,
            ...(operation === 'task' ? [taskId] : []),
          ),
          denial(403, null, (body) => {
            assert.equal(body.message, 'Project/task access is denied.');
            assert.equal('current' in body, false);
          }),
        );
        assert.deepEqual(
          f.calls.map(({ name }) => name),
          ['project.findFirst'],
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'task paging crosses status columns with shrinking limits and current filter/revision cursor',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    const anchor = taskRow({ id: 'anchor-flow', status: 'todo', rank: 100n });
    const first = Array.from({ length: 60 }, (_, n) =>
      taskRow({ id: `todo-${n}`, status: 'todo', priority: 'high', number: n + 1 }),
    );
    const second = Array.from({ length: 41 }, (_, n) =>
      taskRow({ id: `progress-${n}`, status: 'in_progress', priority: 'high', number: n + 61 }),
    );
    f.script(
      answer('project.findFirst', projectRow()),
      answer('task.findFirst', anchor),
      answer('task.findMany', first, ({ where, take, orderBy }) => {
        assert.equal(where.status, 'todo');
        assert.deepEqual(where.rank, { gt: 100n });
        assert.equal(take, 101);
        assert.deepEqual(orderBy, [{ rank: 'asc' }, { number: 'asc' }]);
      }),
      answer('task.findMany', second, ({ where, take }) => {
        assert.equal(where.status, 'in_progress');
        assert.equal('rank' in where, false);
        assert.equal(take, 41);
      }),
      answer('membership.findMany', creator()),
      answer('task.groupBy', [
        { status: 'todo', _count: { _all: 60 } },
        { status: 'in_progress', _count: { _all: 90 } },
      ]),
    );
    const filters = { priority: 'high', assignee: 'unassigned' };
    const result = await f.service.tasks(
      f.context,
      workspaceId,
      projectId,
      'active',
      cursor({ filters: { assignee: 'unassigned', priority: 'high' } }),
      filters,
    );
    assert.equal(result.items.length, 100);
    assert.equal(result.total, 150);
    assert.equal(result.orderVersion, 7);
    assert.deepEqual(result.columnCounts, {
      backlog: 0,
      todo: 60,
      in_progress: 90,
      done: 0,
      canceled: 0,
    });
    assert.equal(result.selectedAssignee, null);
    assert.deepEqual(JSON.parse(Buffer.from(result.nextCursor, 'base64url').toString('utf8')), {
      v: 1,
      w: workspaceId,
      p: projectId,
      view: 'active',
      filters: { assignee: 'unassigned', priority: 'high' },
      revision: 7,
      anchor: 'progress-39',
    });
    f.done();
  },
);

test(
  'task cursor rejects foreign scope/filter or malformed values before anchor and collection reads',
  { timeout: 5000 },
  async (t) => {
    for (const [label, value] of [
      ['workspace', cursor({ w: 'foreign' })],
      ['project', cursor({ p: 'foreign' })],
      ['archive', cursor({ view: 'archived' })],
      ['filters', cursor({ filters: { status: 'done' } })],
      ['anchor', cursor({ anchor: '!bad' })],
      ['revision', cursor({ revision: 0 })],
      ['encoding', '!bad'],
      ['json', Buffer.from('{broken').toString('base64url')],
    ])
      await t.test(label, async (child) => {
        const f = fixture(child);
        f.script(answer('project.findFirst', projectRow()));
        await assert.rejects(
          f.service.tasks(f.context, workspaceId, projectId, 'active', value),
          denial(400),
        );
        assert.deepEqual(
          f.calls.map(({ name }) => name),
          ['project.findFirst'],
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'stale task revision returns page-changed while absent authorized anchor returns invalid cursor',
  { timeout: 5000 },
  async (t) => {
    await t.test('revision', async (child) => {
      const f = fixture(child);
      f.script(answer('project.findFirst', projectRow({ taskRevision: 8 })));
      await assert.rejects(
        f.service.tasks(f.context, workspaceId, projectId, 'active', cursor()),
        denial(409, 'page-changed'),
      );
      assert.deepEqual(
        f.calls.map(({ name }) => name),
        ['project.findFirst'],
      );
      f.done();
    });
    await t.test('anchor', async (child) => {
      const f = fixture(child);
      f.script(answer('project.findFirst', projectRow()), answer('task.findFirst', null));
      await assert.rejects(
        f.service.tasks(f.context, workspaceId, projectId, 'active', cursor()),
        denial(400),
      );
      f.done();
    });
  },
);

test(
  'selected assignee projection separates current eligibility, authorized historical identity and arbitrary IDs',
  { timeout: 5000 },
  async (t) => {
    for (const mode of ['eligible', 'historical', 'unknown'])
      await t.test(mode, async (child) => {
        const f = fixture(child, { canWrite: false });
        const project = projectRow({ visibility: 'private', archivedAt: new Date(now) });
        f.script(
          answer('project.findFirst', project),
          answer('task.findMany', [], ({ where }) => {
            assert.equal(where.status, 'todo');
            assert.equal(where.assigneePrincipalId, principalId);
            assert.deepEqual(where.archivedAt, { not: null });
          }),
          answer('task.groupBy', [{ status: 'todo', _count: { _all: 2 } }]),
          answer(
            'membership.findFirst',
            mode === 'eligible' ? { principalId } : null,
            ({ where }) => {
              assert.equal(where.workspaceId, workspaceId);
              assert.equal(where.state, 'active');
              assert.equal(where.principalId, principalId);
              assert.equal(where.OR.length, 2);
            },
          ),
        );
        if (mode !== 'eligible')
          f.script(answer('task.findFirst', mode === 'historical' ? { id: taskId } : null));
        if (mode !== 'unknown') f.script(answer('membership.findMany', [memberRow(principalId)]));
        const result = await f.service.tasks(
          f.context,
          workspaceId,
          projectId,
          'archived',
          undefined,
          { status: 'todo', assignee: principalId },
        );
        assert.equal(result.total, 2);
        assert.equal(result.nextCursor, null);
        assert.deepEqual(result.capabilities, { canCreate: false });
        assert.deepEqual(
          result.selectedAssignee,
          mode === 'unknown'
            ? null
            : { principalId, name: 'Target Human', kind: 'human', active: mode === 'eligible' },
        );
        f.done();
      });
  },
);

test(
  'access and eligible-assignee pages keep distinct current scopes and bounded principal cursors',
  { timeout: 5000 },
  async (t) => {
    for (const operation of ['access', 'assignees'])
      await t.test(operation, async (child) => {
        const f = fixture(child);
        const rows = Array.from({ length: 101 }, (_, n) => memberRow(`person-${n}`));
        f.script(
          answer('project.findFirst', projectRow({ visibility: 'private' })),
          answer('membership.findFirst', { principalId: 'anchor-flow' }, ({ where }) => {
            assert.equal(where.workspaceId, workspaceId);
            assert.equal(where.principalId, 'anchor-flow');
            assert.equal(where.state, operation === 'assignees' ? 'active' : undefined);
            if (operation === 'assignees')
              assert.deepEqual(where.principal.kind, { in: ['human', 'agent'] });
          }),
          answer('membership.findMany', rows, ({ where, take, orderBy }) => {
            assert.deepEqual(where.principalId, { gt: 'anchor-flow' });
            assert.equal(take, 101);
            assert.deepEqual(orderBy, { principalId: 'asc' });
          }),
          answer('membership.count', 122),
        );
        const result = await f.service[operation](f.context, workspaceId, projectId, 'anchor-flow');
        assert.equal(result.items.length, 100);
        assert.equal(result.nextCursor, 'person-99');
        assert.equal(result.total, 122);
        if (operation === 'access') assert.equal(result.projectVersion, 3);
        else assert.ok(result.items.every((person) => person.active));
        f.done();
      });
  },
);

test(
  'member-page absent or ineligible anchors fail before page data and final short pages have no cursor',
  { timeout: 5000 },
  async (t) => {
    for (const operation of ['access', 'assignees'])
      await t.test(operation, async (child) => {
        await child.test('missing anchor', async (nested) => {
          const f = fixture(nested);
          f.script(answer('project.findFirst', projectRow()), answer('membership.findFirst', null));
          await assert.rejects(
            f.service[operation](f.context, workspaceId, projectId, 'foreign-anchor'),
            denial(400),
          );
          f.done();
        });
        await child.test('final page', async (nested) => {
          const f = fixture(nested);
          f.script(
            answer('project.findFirst', projectRow()),
            answer('membership.findMany', [memberRow()]),
            answer('membership.count', 1),
          );
          const result = await f.service[operation](f.context, workspaceId, projectId);
          assert.equal(result.nextCursor, null);
          f.done();
        });
      });
  },
);

test(
  'same-value project edit still requests a canonical version increment and awaited journal',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    f.script(
      ...mutationStart(),
      answer('project.findFirst', projectRow()),
      answer('membership.findMany', creator()),
      answer('project.update', projectRow({ version: 4 }), ({ data, where }) => {
        assert.deepEqual(data, {
          name: 'Flow project',
          description: 'Project description',
          version: { increment: 1 },
        });
        assert.deepEqual(where, { workspaceId_id: { workspaceId, id: projectId } });
      }),
      answer('membership.findMany', creator()),
      ...journal(),
    );
    const result = await changeProject(f, 'edit-project', {
      expectedVersion: 3,
      name: 'Flow project',
      description: 'Project description',
    });
    assert.equal(result.version, 4);
    assert.deepEqual(
      f.calls.slice(-3).map(({ name }) => name),
      ['activityEvent.create', 'outboxEvent.create', 'projectTaskOperation.create'],
    );
    f.done();
  },
);

test(
  'project version conflicts expose current content and attempt no write or journal',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    f.script(
      ...mutationStart(),
      answer('project.findFirst', projectRow()),
      answer('membership.findMany', creator()),
    );
    await assert.rejects(
      changeProject(f, 'edit-project', { expectedVersion: 2, name: 'Changed', description: '' }),
      denial(409, 'version-conflict', (body) => {
        assert.equal(body.current.version, 3);
        assert.equal(body.current.name, 'Flow project');
      }),
    );
    noEffects(f);
    f.done();
  },
);

test(
  'project archive/restore changes only the project with an expected-version increment',
  { timeout: 5000 },
  async (t) => {
    for (const action of ['archive-project', 'restore-project'])
      await t.test(action, async (child) => {
        const f = fixture(child);
        const archivedAt = action === 'archive-project' ? null : new Date(now);
        f.script(
          ...mutationStart(projectRow({ archivedAt })),
          answer('project.findFirst', projectRow({ archivedAt })),
          answer('membership.findMany', creator()),
          answer(
            'project.update',
            projectRow({
              version: 4,
              archivedAt: action === 'archive-project' ? new Date(now) : null,
            }),
            ({ data }) => {
              assert.deepEqual(data, {
                archivedAt: action === 'archive-project' ? new Date(now) : null,
                version: { increment: 1 },
              });
            },
          ),
          answer('membership.findMany', creator()),
          ...journal(),
        );
        const result = await changeProject(f, action, { expectedVersion: 3 });
        assert.equal(result.version, 4);
        assert.equal(
          result.archivedAt,
          action === 'archive-project' ? new Date(now).toISOString() : null,
        );
        assert.equal(
          f.calls.some(({ name }) => name.startsWith('task.')),
          false,
        );
        f.done();
      });
  },
);

test(
  'frozen project edits/archive and already-active restore return current conflict without effects',
  { timeout: 5000 },
  async (t) => {
    for (const action of ['edit-project', 'archive-project', 'restore-project'])
      await t.test(action, async (child) => {
        const f = fixture(child);
        const row = projectRow({ archivedAt: action === 'restore-project' ? null : new Date(now) });
        f.script(
          ...mutationStart(row),
          answer('project.findFirst', row),
          answer('membership.findMany', creator()),
        );
        await assert.rejects(
          changeProject(f, action, {
            expectedVersion: 3,
            ...(action === 'edit-project' ? { name: 'New name', description: '' } : {}),
          }),
          denial(409, 'archived', (body) => {
            assert.equal(body.current.version, 3);
            if (action === 'restore-project')
              assert.equal(body.message, 'Project is already active.');
          }),
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'access conflict includes exact requested target DTO before assignment/upsert or effects',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    f.script(
      ...mutationStart(),
      answer('project.findFirst', projectRow()),
      answer('membership.findMany', creator()),
      answer(
        'membership.findUnique',
        memberRow(principalId, { projectAccesses: [{ state: 'revoked' }] }),
      ),
    );
    await assert.rejects(
      changeAccess(f, 'active', 2),
      denial(409, 'version-conflict', (body) => {
        assert.equal(body.current.version, 3);
        assert.equal(body.accessCurrent.principalId, principalId);
        assert.equal(body.accessCurrent.explicitAccess, 'revoked');
      }),
    );
    noEffects(f);
    f.done();
  },
);

test(
  'visibility version and archive conflicts stop before project update and journal',
  { timeout: 5000 },
  async (t) => {
    for (const reason of ['version', 'archive'])
      await t.test(reason, async (child) => {
        const f = fixture(child);
        const row = projectRow({ archivedAt: reason === 'archive' ? new Date(now) : null });
        f.script(
          ...mutationStart(row),
          answer('project.findFirst', row),
          answer('membership.findMany', creator()),
        );
        await assert.rejects(
          f.service.changeVisibility(f.context, workspaceId, projectId, key, requestId, {
            expectedVersion: reason === 'version' ? 2 : 3,
            visibility: 'private',
          }),
          denial(409, reason === 'version' ? 'version-conflict' : 'archived'),
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'access page management denial precedes project and member data',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { actor: { executionMode: 'delegated', source: 'mcp' } });
    await assert.rejects(f.service.access(f.context, workspaceId, projectId), denial(403));
    assert.deepEqual(f.calls, []);
    f.done();
  },
);

test(
  'access activation uses current same-transaction assignment and returns trigger-updated project',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t);
    f.script(
      ...mutationStart(),
      answer('project.findFirst', projectRow()),
      answer('membership.findMany', creator()),
      answer('membership.findUnique', memberRow(principalId)),
      answer('principal.assertAssignable', undefined, (scope, id) => {
        assert.equal(scope, workspaceId);
        assert.equal(id, principalId);
      }),
      answer('projectAccess.upsert', {}, ({ create, update, where }) => {
        assert.deepEqual(create, { workspaceId, projectId, principalId, state: 'active' });
        assert.deepEqual(update, { state: 'active' });
        assert.deepEqual(where, {
          workspaceId_projectId_principalId: { workspaceId, projectId, principalId },
        });
      }),
      answer('project.findFirst', projectRow({ version: 4 })),
      answer('membership.findMany', creator()),
      ...journal(),
    );
    const result = await changeAccess(f);
    assert.equal(result.version, 4);
    assert.equal(f.calls.at(-3).args[0].data.accessPrincipalId, principalId);
    f.done();
  },
);

test(
  'archived project allows access revocation but rejects activation and missing target without effects',
  { timeout: 5000 },
  async (t) => {
    for (const reason of ['revoke', 'activate', 'missing'])
      await t.test(reason, async (child) => {
        const f = fixture(child);
        const row = projectRow({ archivedAt: new Date(now) });
        f.script(
          ...mutationStart(row),
          answer('project.findFirst', row),
          answer('membership.findMany', creator()),
          answer('membership.findUnique', reason === 'missing' ? null : memberRow(principalId)),
        );
        if (reason === 'revoke')
          f.script(
            answer('projectAccess.upsert', {}, ({ update }) =>
              assert.deepEqual(update, { state: 'revoked' }),
            ),
            answer('project.findFirst', projectRow({ version: 4, archivedAt: new Date(now) })),
            answer('membership.findMany', creator()),
            ...journal(),
          );
        const operation = changeAccess(f, reason === 'revoke' ? 'revoked' : 'active');
        if (reason === 'revoke') {
          const result = await operation;
          assert.equal(result.version, 4);
          assert.equal(result.archivedAt, new Date(now).toISOString());
        } else {
          await assert.rejects(
            operation,
            denial(reason === 'missing' ? 403 : 409, reason === 'missing' ? null : 'archived'),
          );
          noEffects(f);
        }
        f.done();
      });
  },
);

test(
  'access management denial precedes current target and receipt lookup',
  { timeout: 5000 },
  async (t) => {
    const f = fixture(t, { actor: { executionMode: 'delegated', source: 'mcp' } });
    await assert.rejects(changeAccess(f), denial(403));
    assert.deepEqual(f.calls, []);
    f.done();
  },
);

test(
  'reassignment requires current project eligibility after the existing PrincipalService check',
  { timeout: 5000 },
  async (t) => {
    for (const eligible of [false, true])
      await t.test(String(eligible), async (child) => {
        const f = fixture(child);
        const project = projectRow({ visibility: 'private' });
        const row = taskRow();
        f.script(
          ...mutationStart(project, row),
          ...currentTask(project, row),
          answer('principal.assertAssignable'),
          answer('membership.findFirst', eligible ? { principalId } : null, ({ where }) => {
            assert.equal(where.principalId, principalId);
            assert.equal(where.workspaceId, workspaceId);
            assert.equal(where.OR.length, 2);
          }),
        );
        if (eligible)
          f.script(
            answer(
              'task.update',
              taskRow({ version: 5, assigneePrincipalId: principalId }),
              ({ data }) => assert.deepEqual(data, { assigneePrincipalId: principalId }),
            ),
            answer(
              'project.findUniqueOrThrow',
              projectRow({ visibility: 'private', taskRevision: 8 }),
            ),
            answer('membership.findMany', [
              memberRow(),
              memberRow(principalId, { projectAccesses: [{ projectId }] }),
            ]),
            ...journal(),
          );
        const operation = f.service.changeTask(
          f.context,
          workspaceId,
          projectId,
          taskId,
          key,
          requestId,
          'edit-task',
          { expectedVersion: 4, assigneePrincipalId: principalId },
        );
        if (eligible) {
          const result = await operation;
          assert.equal(result.assignee.principalId, principalId);
          assert.equal(result.creator.principalId, 'human-flow');
        } else {
          await assert.rejects(operation, denial(403));
          noEffects(f);
        }
        f.done();
      });
  },
);

test(
  'move version/order/archive conflicts stop before rank allocation or task write',
  { timeout: 5000 },
  async (t) => {
    for (const reason of ['version', 'order', 'project archive', 'task archive'])
      await t.test(reason, async (child) => {
        const f = fixture(child);
        const project = projectRow({
          archivedAt: reason === 'project archive' ? new Date(now) : null,
        });
        const row = taskRow({ archivedAt: reason === 'task archive' ? new Date(now) : null });
        f.script(...mutationStart(project, row), ...currentTask(project, row));
        await assert.rejects(
          move(f, {
            expectedVersion: reason === 'version' ? 3 : 4,
            expectedOrderVersion: reason === 'order' ? 6 : 7,
          }),
          denial(
            409,
            reason === 'version'
              ? 'version-conflict'
              : reason === 'order'
                ? 'order-conflict'
                : 'archived',
            (body) => assert.equal(body.current.id, taskId),
          ),
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'move rejects missing or self anchor before rank/write without revealing another task',
  { timeout: 5000 },
  async (t) => {
    for (const anchor of [taskId, 'foreign-anchor'])
      await t.test(anchor, async (child) => {
        const f = fixture(child);
        f.script(...mutationStart(projectRow(), taskRow()), ...currentTask());
        if (anchor !== taskId)
          f.script(
            answer('task.findFirst', null, ({ where }) =>
              assert.deepEqual(where, {
                workspaceId,
                projectId,
                id: anchor,
                status: 'todo',
                archivedAt: null,
              }),
            ),
          );
        await assert.rejects(
          move(f, { beforeTaskId: anchor }),
          denial(400, null, (body) => assert.equal(body.message, 'Invalid move anchor.')),
        );
        noEffects(f);
        f.done();
      });
  },
);

test(
  'open-child move warning precedes anchor/rank and matching current acknowledgment updates only the parent',
  { timeout: 5000 },
  async (t) => {
    for (const acknowledged of [false, true])
      await t.test(String(acknowledged), async (child) => {
        const f = fixture(child);
        f.script(
          ...mutationStart(projectRow(), taskRow()),
          ...currentTask(),
          answer('task.count', 2, ({ where }) => {
            assert.equal(where.parentTaskId, taskId);
            assert.deepEqual(where.status, { notIn: ['done', 'canceled'] });
          }),
        );
        if (!acknowledged)
          f.script(
            answer('task.count', 1, ({ where }) =>
              assert.deepEqual(where.archivedAt, { not: null }),
            ),
          );
        else
          f.script(
            answer('task.findFirst', { id: 'destination-flow' }),
            answer('rank', [{ rank: 2500n }], (parts, ...values) => {
              assert.match(parts.join('?'), /task_rank_before/);
              assert.deepEqual(values, [
                workspaceId,
                projectId,
                'done',
                'destination-flow',
                taskId,
              ]);
            }),
            answer(
              'task.update',
              taskRow({ status: 'done', version: 5, rank: 2500n }),
              ({ where, data }) => {
                assert.deepEqual(where, {
                  workspaceId_projectId_id: { workspaceId, projectId, id: taskId },
                });
                assert.deepEqual(data, { status: 'done', rank: 2500n });
              },
            ),
            answer('project.findUniqueOrThrow', projectRow({ taskRevision: 8 })),
            answer('membership.findMany', creator()),
            ...journal(),
          );
        const operation = move(f, {
          status: 'done',
          beforeTaskId: 'destination-flow',
          ...(acknowledged ? { acknowledgedChildrenVersion: 7 } : {}),
        });
        if (acknowledged) {
          const result = await operation;
          assert.equal(result.status, 'done');
          assert.equal(result.version, 5);
          assert.equal(result.orderVersion, 8);
          assert.equal(f.calls.filter(({ name }) => name === 'task.update').length, 1);
        } else {
          await assert.rejects(
            operation,
            denial(409, 'open-children', (body) =>
              assert.deepEqual(body.closeWarning, { open: 2, archivedOpen: 1, childrenVersion: 7 }),
            ),
          );
          noEffects(f);
        }
        f.done();
      });
  },
);
