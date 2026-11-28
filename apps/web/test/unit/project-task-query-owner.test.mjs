import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { createProjectTaskQueryOwner } from '../../src/lib/project-task-query-owner.ts';
import { ProjectTaskFailure } from '../../src/lib/project-task-client.ts';
import { project, task, taskPage } from './project-task-fixtures.mjs';

test('an explicit append retry sends the same continuation after a transient failure while retaining last-good rows', async (t) => {
  const calls = [];
  const owner = createProjectTaskQueryOwner({
    workspaces: {},
    transport: {
      async project() {
        return project;
      },
      async tasks(_w, _p, _view, _signal, cursor) {
        calls.push(cursor ?? null);
        if (calls.length === 2) throw new ProjectTaskFailure(503);
        return {
          ...taskPage,
          items: [cursor ? { ...task, id: 'tail-task' } : task],
          total: 2,
          nextCursor: cursor ? null : 'tail',
          columnCounts: { ...taskPage.columnCounts, todo: 2 },
        };
      },
    },
    authorized: () => true,
    denied: () => assert.fail('transient failure is not denial'),
    changed() {},
  });
  t.after(() => owner.clear());
  owner.bind('opaque-epoch');
  owner.select({
    workspaceId: 'w',
    projectId: 'p',
    taskId: null,
    views: { projects: 'active', tasks: 'active' },
    taskView: { layout: 'list', filters: {}, column: 'todo' },
    discovery: null,
    parentCandidatesWanted: false,
  });
  await owner.read('project');
  await owner.read('tasks');
  await owner.read('tasks', true);
  assert.equal(owner.resources().tasks.stale, true);
  assert.deepEqual(
    owner.resources().tasks.data.items.map((row) => row.id),
    ['t'],
  );
  await owner.read('tasks', true);
  assert.deepEqual(calls, [null, 'tail', 'tail']);
  assert.deepEqual(
    owner.resources().tasks.data.items.map((row) => row.id),
    ['t', 'tail-task'],
  );
  assert.equal(owner.resources().tasks.stale, false);
});

function discoveryItem(id) {
  const { description, ...record } = globalThis.structuredClone(task);
  assert.equal(typeof description, 'string');
  return { ...record, id, projectName: 'Project' };
}
function held() {
  let resolve;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
const selection = (change = {}) => ({
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  views: { projects: 'active', tasks: 'active' },
  taskView: { layout: 'list', filters: {}, column: 'todo' },
  discovery: null,
  parentCandidatesWanted: false,
  ...change,
});
function fixture(t, overrides = {}, client) {
  let allowed = true;
  const calls = [];
  const denials = [];
  const changed = [];
  const clone = (value) => globalThis.structuredClone(value);
  const collection = (name, w, p, id) => ({
    workspaceId: w,
    projectId: p,
    taskId: id,
    revision: 1,
    items: [],
    total: 0,
    nextCursor: null,
    ...(name === 'relations'
      ? {
          parent: null,
          open: 0,
          archivedOpen: 0,
          capabilities: { canCreate: true, canLink: true, canUnlink: true },
        }
      : name === 'parent-candidates'
        ? { capabilities: { canSelect: true } }
        : name === 'checklist'
          ? { capabilities: { canCreate: true, canEdit: true } }
          : name === 'comments'
            ? { capabilities: { canCreate: true } }
            : {}),
  });
  const transport = {
    project: async (w, p) => ({
      ...clone(project),
      workspaceId: w,
      id: p,
      capabilities: { ...project.capabilities, canManageAccess: true },
    }),
    task: async (w, p, id) => ({ ...clone(task), workspaceId: w, projectId: p, id }),
    tasks: async (w, p, _view, _signal, _cursor, filters = {}) => {
      const status = filters.status ?? 'todo';
      return {
        ...clone(taskPage),
        items: [{ ...clone(task), workspaceId: w, projectId: p, status }],
        columnCounts: { backlog: 0, todo: 0, in_progress: 0, done: 0, canceled: 0, [status]: 1 },
      };
    },
    projects: async (w) => ({
      items: [{ ...clone(project), workspaceId: w }],
      total: 1,
      nextCursor: null,
      capabilities: { canCreate: true },
    }),
    access: async (w, p) => ({
      workspaceId: w,
      projectId: p,
      projectVersion: 1,
      items: [],
      total: 0,
      nextCursor: null,
    }),
    assignees: async (w, p) => ({
      workspaceId: w,
      projectId: p,
      items: [],
      total: 0,
      nextCursor: null,
    }),
    collaboration: async (w, p, id, name) => collection(name, w, p, id),
    discover: async (w, query, _signal, cursor) => ({
      workspaceId: w,
      principalId: 'domain-human',
      query,
      revision: 'a'.repeat(64),
      items: [discoveryItem(cursor ? 'tail' : 'root')],
      total: 2,
      nextCursor: cursor ? null : 'tail',
    }),
    ...overrides,
  };
  const owner = createProjectTaskQueryOwner({
    client,
    workspaces: {
      workspaces: async () => ({ items: [], total: 0, nextCursor: null }),
      detail: async (id) => ({
        id,
        name: 'Workspace',
        ownerPrincipalId: 'domain-human',
        role: 'owner',
        createdAt: '2030-01-01',
      }),
      members: async () => ({ items: [], total: 0, nextCursor: null }),
    },
    transport: new Proxy(transport, {
      get(target, name) {
        const method = target[name];
        return typeof method === 'function'
          ? async (...args) => {
              calls.push({ name, args });
              return method(...args);
            }
          : method;
      },
    }),
    changed: () => changed.push(owner?.resources()),
    authorized: () => allowed,
    denied: (reason) => denials.push(reason),
  });
  t.after(() => owner.clear());
  owner.bind('private-epoch');
  owner.select(selection());
  return {
    owner,
    transport,
    calls,
    denials,
    changed,
    setAllowed(value) {
      allowed = value;
    },
  };
}

test('all concrete project DTO slots use independent admitted Query projections with lazy policy and candidate reads', async (t) => {
  const f = fixture(t);
  assert.equal(f.calls.length, 0);
  await f.owner.read('workspace');
  await f.owner.read('project');
  f.owner.administer();
  await f.owner.read('task');
  for (const name of [
    'workspaces',
    'members',
    'projects',
    'tasks',
    'projectAccess',
    'assignees',
    'relations',
    'checklist',
    'comments',
    'history',
  ])
    await f.owner.read(name);
  for (const name of [
    'workspaces',
    'workspace',
    'members',
    'projects',
    'project',
    'tasks',
    'task',
    'projectAccess',
    'assignees',
    'relations',
    'checklist',
    'comments',
    'history',
  ])
    assert.equal(f.owner.resources()[name].status, 'ready', name);
  const count = f.calls.length;
  await f.owner.read('parent-candidates');
  assert.equal(f.calls.length, count);
  f.owner.select(selection({ parentCandidatesWanted: true }));
  await f.owner.read('parent-candidates');
  assert.equal(f.owner.resources()['parent-candidates'].status, 'ready');
  f.owner.select(selection({ parentCandidatesWanted: false }));
  assert.equal(f.owner.resources()['parent-candidates'].data, null);
  f.owner.select(selection({ taskView: { layout: 'board', filters: {}, column: 'todo' } }));
  for (const status of ['backlog', 'todo', 'in_progress', 'done', 'canceled'])
    await f.owner.readColumn(status);
  assert.equal(f.owner.resources().tasks.data, null);
  assert.ok(Object.values(f.owner.resources().columns).every((value) => value.status === 'ready'));
});

for (const intervening of ['root', 'revalidation', 'invalidate', 'cancel', 'selection', 'epoch']) {
  test(`failed append eligibility cannot survive ${intervening}`, async (t) => {
    let attempt = 0;
    let rootFailure = false;
    const f = fixture(t, {
      tasks: async (_w, _p, _view, _signal, cursor) => {
        attempt++;
        if (rootFailure || cursor) throw new ProjectTaskFailure(503);
        return {
          ...globalThis.structuredClone(taskPage),
          total: 2,
          nextCursor: 'tail',
          columnCounts: { ...taskPage.columnCounts, todo: 2 },
        };
      },
    });
    await f.owner.read('tasks');
    await f.owner.read('tasks', true);
    assert.equal(attempt, 2);
    if (intervening === 'root' || intervening === 'revalidation') {
      rootFailure = true;
      await f.owner.read('tasks', false, intervening === 'revalidation');
    } else if (intervening === 'invalidate')
      f.owner.invalidate({ resources: ['tasks'], columns: false });
    else if (intervening === 'cancel') f.owner.cancel();
    else if (intervening === 'selection') f.owner.select(selection({ projectId: 'other' }));
    else f.owner.bind('replacement-epoch');
    const before = attempt;
    await f.owner.read('tasks', true);
    assert.equal(attempt, before);
  });
}
for (const status of [400, 404, 409, 401, 403, 502]) {
  test(`append status ${status} cannot acquire transient retry eligibility`, async (t) => {
    let reads = 0;
    const f = fixture(t, {
      tasks: async () => {
        if (++reads > 1)
          throw new ProjectTaskFailure(status, status === 409 ? 'page-changed' : null);
        return {
          ...globalThis.structuredClone(taskPage),
          total: 2,
          nextCursor: 'tail',
          columnCounts: { ...taskPage.columnCounts, todo: 2 },
        };
      },
    });
    await f.owner.read('tasks');
    await f.owner.read('tasks', true);
    await f.owner.read('tasks', true);
    assert.equal(reads, 2);
    if (status === 401 || status === 403)
      assert.deepEqual(f.denials, [status === 401 ? 'signed-out' : 'forbidden']);
  });
}

test('pending explicit tail retry remains stale, coalesces duplicate intent and freshens only after current admission', async (t) => {
  let reads = 0;
  const pending = held();
  const f = fixture(t, {
    tasks: async () => {
      reads++;
      if (reads === 2) throw new ProjectTaskFailure(503);
      if (reads === 3) return pending.promise;
      return {
        ...globalThis.structuredClone(taskPage),
        total: 2,
        nextCursor: 'tail',
        columnCounts: { ...taskPage.columnCounts, todo: 2 },
      };
    },
  });
  await f.owner.read('tasks');
  await f.owner.read('tasks', true);
  const retry = f.owner.read('tasks', true);
  await Promise.resolve();
  assert.equal(f.owner.resources().tasks.stale, true);
  assert.equal(f.owner.resources().tasks.loadingMore, true);
  await f.owner.read('tasks', true);
  assert.equal(reads, 3);
  pending.resolve({
    ...globalThis.structuredClone(taskPage),
    items: [{ ...task, id: 'tail' }],
    total: 2,
    nextCursor: null,
    columnCounts: { ...taskPage.columnCounts, todo: 2 },
  });
  await retry;
  assert.equal(f.owner.resources().tasks.data.items.length, 2);
  assert.equal(f.owner.resources().tasks.stale, false);
  await f.owner.read('tasks', true);
  assert.equal(reads, 3, 'no-more cannot send');
});

test('late cancelled success or denial cannot repopulate another selected project or deny its lifetime', async (t) => {
  for (const denied of [false, true]) {
    const pending = held();
    const f = fixture(t, { tasks: async () => pending.promise });
    const reading = f.owner.read('tasks');
    f.owner.select(selection({ projectId: 'other' }));
    if (denied) pending.resolve(Promise.reject(new ProjectTaskFailure(403)));
    else pending.resolve(globalThis.structuredClone(taskPage));
    await reading;
    assert.equal(f.owner.resources().tasks.data, null);
    assert.deepEqual(f.denials, []);
  }
});

test('discovery Back proves the actual same-binding Query chain and replacement root drops tails', async (t) => {
  let revision = 'a';
  let principal = 'domain-human';
  let fail = false;
  const f = fixture(t, {
    discover: async (w, query, _signal, cursor) => {
      if (fail) throw new ProjectTaskFailure(503);
      return {
        workspaceId: w,
        principalId: principal,
        query,
        revision: revision.repeat(64),
        items: [discoveryItem(cursor ? 'tail' : 'root')],
        total: 2,
        nextCursor: cursor ? null : 'tail',
      };
    },
  });
  const selectors = { scope: 'search', q: '', view: 'active', filters: {} };
  f.owner.select(selection({ discovery: selectors }));
  await f.owner.read('discovery');
  await f.owner.read('discovery', true);
  f.owner.select(selection({ projectId: 'other', taskId: 'other-task', discovery: selectors }));
  await f.owner.read('discovery', false, true);
  assert.equal(f.owner.resources().discovery.data.items.length, 2);
  fail = true;
  await f.owner.read('discovery', false, true);
  const count = f.calls.length;
  await f.owner.read('discovery', true);
  assert.equal(f.calls.length, count, 'failed revalidation cannot authorize tail');
  fail = false;
  revision = 'b';
  await f.owner.read('discovery', false, true);
  assert.equal(f.owner.resources().discovery.data.items.length, 1);
  await f.owner.read('discovery', true);
  principal = 'replacement-principal';
  await f.owner.read('discovery', false, true);
  assert.equal(f.owner.resources().discovery.data.items.length, 1);
});

test('resource relevance follows workspace discovery selectors rather than only the selected project', async (t) => {
  const f = fixture(t);
  const hint = (entity, projectId) => ({
    type: 'invalidate',
    entity,
    projectId,
    id: 'changed',
    version: 2,
  });
  assert.deepEqual(f.owner.relevance({ type: 'heartbeat' }), { resources: [], columns: false });
  assert.deepEqual(f.owner.relevance(hint('task', 'other')), { resources: [], columns: false });
  assert.deepEqual(f.owner.relevance(hint('project', 'other')), {
    resources: ['projects'],
    columns: false,
  });
  f.owner.select(selection({ discovery: { scope: 'mine', q: '', view: 'active', filters: {} } }));
  assert.deepEqual(f.owner.relevance(hint('task', 'other')), {
    resources: ['discovery'],
    columns: false,
  });
  f.owner.select(
    selection({
      discovery: { scope: 'search', q: 'term', view: 'active', filters: {}, projectId: 'p' },
    }),
  );
  assert.deepEqual(f.owner.relevance(hint('task', 'other')), { resources: [], columns: false });
  assert.ok(f.owner.relevance(hint('task', 'p')).resources.includes('relations'));
  assert.equal(f.owner.relevance(hint('project', 'p')).columns, true);
});

test('actual Query keys/defaults/records stay private and reentrant success cannot revive a retired selection', async (t) => {
  const client = new QueryClient();
  const f = fixture(t, {}, client);
  await f.owner.read('tasks');
  const query = client
    .getQueryCache()
    .getAll()
    .find((record) => record.queryKey.includes('tasks'));
  assert.ok(query);
  assert.equal(query.options.retry, false);
  assert.equal(query.options.gcTime, 0);
  assert.equal(query.options.staleTime, 0);
  assert.equal(query.options.networkMode, 'always');
  const keys = JSON.stringify(
    client
      .getQueryCache()
      .getAll()
      .map((record) => record.queryKey),
  );
  assert.ok(keys.includes('private-epoch'));
  assert.equal(keys.includes('domain-human'), false);
  assert.equal(keys.includes('session-human'), false);
  let retired = false;
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (
      !retired &&
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.queryKey.includes('tasks')
    ) {
      retired = true;
      f.owner.select(selection({ projectId: 'replacement' }));
    }
  });
  t.after(unsubscribe);
  await f.owner.read('tasks');
  assert.equal(retired, true);
  assert.equal(f.owner.resources().tasks.data, null);
  f.owner.clear();
  assert.equal(client.getQueryCache().getAll().length, 0);
  assert.equal(client.getMutationCache().getAll().length, 0);
});

for (const corruption of [
  'duplicate',
  'overlap',
  'cycle',
  'overflow',
  'total',
  'counts',
  'assignee',
  'capability',
  'scope',
]) {
  test(`task page ${corruption} cannot enter the last-good chain`, async (t) => {
    let attempt = 0;
    const root = {
      ...globalThis.structuredClone(taskPage),
      items: [{ ...task, id: 'root' }],
      total: 2,
      nextCursor: 'tail',
      columnCounts: { ...taskPage.columnCounts, todo: 2 },
    };
    const f = fixture(t, {
      tasks: async () => {
        if (++attempt === 1) return root;
        const next = {
          ...globalThis.structuredClone(root),
          items: [{ ...task, id: 'tail' }],
          nextCursor: null,
        };
        if (corruption === 'duplicate') next.items.push(next.items[0]);
        if (corruption === 'overlap') next.items = [root.items[0]];
        if (corruption === 'cycle') next.nextCursor = 'tail';
        if (corruption === 'overflow')
          next.items = [
            { ...task, id: 'tail' },
            { ...task, id: 'overflow' },
          ];
        if (corruption === 'total') next.total = 3;
        if (corruption === 'counts') next.columnCounts = { ...next.columnCounts, todo: 3 };
        if (corruption === 'assignee')
          next.selectedAssignee = {
            principalId: 'changed',
            name: 'Human',
            kind: 'human',
            active: true,
          };
        if (corruption === 'capability') next.capabilities = { canCreate: false };
        if (corruption === 'scope') next.items[0].workspaceId = 'foreign';
        return next;
      },
    });
    await f.owner.read('tasks');
    await f.owner.read('tasks', true);
    assert.deepEqual(
      f.owner.resources().tasks.data.items.map((row) => row.id),
      ['root'],
    );
    assert.equal(f.owner.resources().tasks.stale, true);
    assert.ok(['changed', 'error'].includes(f.owner.resources().tasks.status));
  });
}

test('new canonical task and project evidence stales dependent content/order/policy without borrowing their authority', async (t) => {
  let taskVersion = 1,
    projectVersion = 1;
  const f = fixture(t, {
    task: async () => ({ ...task, version: taskVersion, orderVersion: taskVersion }),
    project: async () => ({
      ...project,
      version: projectVersion,
      capabilities: { ...project.capabilities, canManageAccess: projectVersion === 1 },
    }),
  });
  await f.owner.read('project');
  f.owner.administer();
  await f.owner.read('task');
  await f.owner.read('projectAccess');
  await f.owner.read('checklist');
  await f.owner.read('relations');
  await f.owner.read('tasks');
  taskVersion = 2;
  await f.owner.read('task');
  assert.equal(f.owner.resources().checklist.stale, true);
  assert.equal(f.owner.resources().relations.stale, true);
  assert.equal(
    f.owner.resources().tasks.stale,
    true,
    'new detail cannot leave an older independent list authorized',
  );
  projectVersion = 2;
  await f.owner.read('project');
  assert.equal(f.owner.resources().projectAccess.data, null);
});

test('discovery bound retains real totals and continuation while stopping at one thousand rows', async (t) => {
  let reads = 0;
  const f = fixture(t, {
    discover: async (w, query, _signal, cursor) => {
      reads++;
      const start = Number(cursor ?? 0);
      return {
        workspaceId: w,
        principalId: 'domain-human',
        query,
        revision: 'a'.repeat(64),
        total: 1200,
        nextCursor: String(start + 100),
        items: Array.from({ length: 100 }, (_, i) => discoveryItem(String(start + i))),
      };
    },
  });
  f.owner.select(selection({ discovery: { scope: 'search', q: '', view: 'active', filters: {} } }));
  await f.owner.read('discovery');
  for (let i = 0; i < 10; i++) await f.owner.read('discovery', true);
  assert.equal(reads, 10);
  assert.equal(f.owner.resources().discovery.data.items.length, 1000);
  assert.equal(f.owner.resources().discovery.data.total, 1200);
  assert.equal(f.owner.resources().discovery.data.nextCursor, '1000');
});

for (const name of [
  'workspace',
  'projects',
  'project',
  'task',
  'assignees',
  'discovery',
  'projectAccess',
  'checklist',
]) {
  test(`canonical owner rejects a wrong-scope ${name} response without current authority or admission`, async (t) => {
    const f = fixture(t);
    await f.owner.read('project');
    await f.owner.read('task');
    f.owner.administer();
    if (name === 'workspace') f.owner.select(selection({ workspaceId: 'foreign' }));
    if (name === 'discovery')
      f.owner.select(
        selection({ discovery: { scope: 'search', q: 'x', view: 'active', filters: {} } }),
      );
    const method =
      {
        workspace: 'detail',
        projectAccess: 'access',
        checklist: 'collaboration',
        discovery: 'discover',
      }[name] ?? name;
    if (name === 'workspace') {
      const g = createProjectTaskQueryOwner({
        workspaces: { detail: async () => ({ id: 'wrong' }) },
        transport: {},
        changed() {},
        authorized: () => true,
        denied: () => assert.fail(),
      });
      t.after(() => g.clear());
      g.bind('opaque');
      g.select(selection());
      await g.read('workspace');
      assert.equal(g.resources().workspace.status, 'error');
      assert.equal(g.resources().workspace.data, null);
      return;
    }
    const original = f.transport[method];
    f.transport[method] = async (...args) => {
      const value = await original(...args);
      if (name === 'projects') value.items[0].workspaceId = 'wrong';
      else value.workspaceId = 'wrong';
      return value;
    };
    await f.owner.read(name);
    assert.equal(f.owner.resources()[name].status, 'error');
    assert.equal(f.owner.resources()[name].stale, true);
    assert.equal(f.owner.resources()[name].failure.status, 502);
    assert.deepEqual(f.denials, []);
  });
}

test('member pagination binds real principals without inventing a revision and policy version changes require a new read', async (t) => {
  let projectVersion = 1;
  const f = fixture(t, {
    project: async () => ({
      ...project,
      version: projectVersion,
      capabilities: { ...project.capabilities, canManageAccess: true },
    }),
  });
  await f.owner.read('project');
  f.owner.administer();
  await f.owner.read('projectAccess');
  projectVersion = 2;
  await f.owner.read('project');
  assert.equal(f.owner.resources().projectAccess.stale, true);
  const g = createProjectTaskQueryOwner({
    workspaces: {
      members: async (_w, _signal, cursor) => ({
        items: [{ principalId: cursor ? 'b' : 'a' }],
        total: 2,
        nextCursor: cursor ? null : 'tail',
      }),
    },
    transport: {},
    changed() {},
    authorized: () => true,
    denied: () => assert.fail(),
  });
  t.after(() => g.clear());
  g.select(selection());
  g.bind('opaque');
  g.select(selection());
  await g.read('members');
  await g.read('members', true);
  assert.deepEqual(
    g.resources().members.data.items.map((row) => row.principalId),
    ['a', 'b'],
  );
  assert.equal(g.resources().members.data.nextCursor, null);
});

test('reentrant cancellation during a Query selection retirement cannot cancel a replacement binding', async (t) => {
  const client = new QueryClient();
  const f = fixture(t, {}, client);
  await f.owner.read('tasks');
  const stop = client.getQueryCache().subscribe((event) => {
    if (event.type === 'removed') f.owner.select(selection({ projectId: 'next' }));
  });
  f.owner.cancel();
  f.owner.bind('replacement');
  stop();
  await f.owner.read('workspaces');
  assert.deepEqual(f.owner.resources().workspaces.data.items, []);
});

test('project-route workspace catalogue appends real scoped rows and a replacement root drops its old tail', async (t) => {
  const client = new QueryClient(),
    calls = [];
  const owner = createProjectTaskQueryOwner({
    client,
    workspaces: {
      workspaces: async (_signal, cursor) => {
        calls.push(cursor ?? null);
        return {
          items: [
            {
              id: cursor ? 'b' : 'a',
              name: 'Workspace',
              ownerPrincipalId: 'domain-human',
              role: 'member',
              createdAt: '2030-01-01',
            },
          ],
          total: 2,
          nextCursor: cursor ? null : 'tail',
        };
      },
    },
    transport: {},
    changed() {},
    authorized: () => true,
    denied: () => assert.fail(),
  });
  t.after(() => owner.clear());
  owner.bind('opaque-workspace-catalogue');
  await owner.read('workspaces');
  await owner.read('workspaces', true);
  assert.deepEqual(
    owner.resources().workspaces.data.items.map((row) => row.id),
    ['a', 'b'],
  );
  assert.equal(owner.resources().workspaces.data.total, 2);
  assert.equal(client.getQueryCache().getAll().length, 2);
  await owner.read('workspaces');
  assert.deepEqual(
    owner.resources().workspaces.data.items.map((row) => row.id),
    ['a'],
  );
  assert.equal(client.getQueryCache().getAll().length, 1);
  assert.deepEqual(calls, [null, 'tail', null]);
});

for (const replacement of ['selection', 'epoch'])
  test(`reentrant ${replacement} during actual pending Query cancellation preserves newly admitted task work`, async (t) => {
    const client = new QueryClient(),
      late = held();
    const f = fixture(t, { project: () => late.promise }, client);
    const old = f.owner.read('project');
    let armed = true,
      newReading;
    const stop = client.getQueryCache().subscribe((event) => {
      if (armed && event.type === 'removed') {
        armed = false;
        if (replacement === 'epoch') f.owner.bind('replacement-epoch');
        f.owner.select(selection({ projectId: 'next' }));
        newReading = f.owner.read('task');
      }
    });
    t.after(stop);
    f.owner.cancel();
    await newReading;
    late.resolve({ ...project });
    await old;
    assert.equal(armed, false);
    assert.equal(f.owner.resources().task.status, 'ready');
    assert.equal(f.owner.resources().task.data.projectId, 'next');
    assert.equal(f.owner.resources().project.data, null);
    assert.equal(f.calls.find((call) => call.name === 'task').args.at(-1).aborted, false);
  });
