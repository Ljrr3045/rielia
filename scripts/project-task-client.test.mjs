import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createProjectTaskQueryOwner } from '../apps/web/src/lib/project-task-query-owner.ts';
import {
  createProjectTaskTransport,
  ProjectTaskFailure,
} from '../apps/web/src/lib/project-task-client.ts';
import { proxyProjectTask } from '../apps/web/src/lib/project-task-proxy.ts';
import { createTaskPlanningTransport } from '../apps/web/src/lib/task-planning-client.ts';
import {
  person as sharedPerson,
  project as sharedProject,
  task as sharedTask,
  taskPage as sharedTaskPage,
  comment as sharedComment,
  history as sharedHistory,
  planningHistory as sharedPlanningHistory,
  discovery as sharedDiscovery,
} from '../apps/web/test/unit/project-task-fixtures.mjs';
const creator = { principalId: 'human', name: 'Human', kind: 'human', active: true };
const project = {
  id: 'p',
  workspaceId: 'w',
  key: 'RIE',
  name: 'Project',
  description: '',
  visibility: 'workspace',
  version: 1,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  creator,
  provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null },
  capabilities: {
    canEdit: true,
    canArchive: true,
    canRestore: false,
    canManageAccess: false,
    canChangeVisibility: false,
    canGrantAccess: false,
    canRevokeAccess: false,
  },
  url: '/projects?workspace=w&project=p',
};
const page = (items) => ({
  items,
  total: items.length,
  nextCursor: null,
  capabilities: { canCreate: true },
});
const task = {
  ...project,
  id: 't',
  projectId: 'p',
  projectKey: 'RIE',
  key: 'RIE-1',
  number: 1,
  title: 'Title',
  type: 'task',
  priority: 'none',
  status: 'backlog',
  assigneePrincipalId: null,
  assignee: null,
  dueDate: null,
  projectArchivedAt: null,
  orderVersion: 1,
  parentTaskId: null,
};
const signal = () => new AbortController().signal;
test('T10 discovery transport validates requested scope, filters, archive and assignment before exposing results', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  const item = Object.fromEntries(
    Object.entries({
      ...task,
      assigneePrincipalId: 'human',
      assignee: creator,
      projectName: 'Project',
    }).filter(([key]) => key !== 'description'),
  );
  const query = { scope: 'mine', q: 'Title', view: 'active', filters: { priority: 'none' } };
  const good = {
    workspaceId: 'w',
    principalId: 'human',
    query,
    revision: 'a'.repeat(64),
    items: [item],
    total: 1,
    nextCursor: null,
  };
  let value = good;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(value);
  };
  const api = createProjectTaskTransport();
  assert.equal((await api.discover('w', query, signal())).items[0].id, 't');
  assert.match(calls[0].url, /task-discovery\?scope=mine/);
  assert.equal(calls[0].init.credentials, 'same-origin');
  for (const bad of [
    { ...good, workspaceId: 'foreign' },
    { ...good, query: { ...query, scope: 'search' } },
    { ...good, items: [{ ...item, assigneePrincipalId: null }] },
    { ...good, items: [{ ...item, workspaceId: 'foreign' }] },
    { ...good, items: [{ ...item, archivedAt: '2026-01-01' }] },
    { ...good, items: [{ ...item, priority: 'high' }] },
    { ...good, items: [{ ...item, description: 'Not a discovery field' }] },
  ]) {
    value = bad;
    await assert.rejects(api.discover('w', query, signal()), (e) => e.status === 502);
  }
  const count = calls.length;
  await assert.rejects(
    api.discover('w', { ...query, filters: { assignee: 'other' } }, signal()),
    (e) => e.status === 400,
  );
  assert.equal(calls.length, count);
});
test('discovery schema migration preserves response identity/extras and all request-query correlations', async (t) => {
  let value;
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 200, json: async () => value };
  });
  const api = createProjectTaskTransport();
  const requested = {
    scope: 'search',
    q: ' Title ',
    view: 'active',
    projectId: 'p',
    filters: { status: 'todo', priority: 'high', assignee: 'unassigned' },
  };
  const good = {
    ...sharedDiscovery,
    extra: undefined,
    query: {
      ...requested,
      q: 'Title',
      filters: { assignee: 'unassigned', priority: 'high', status: 'todo' },
    },
    items: [
      {
        ...sharedDiscovery.items[0],
        status: 'todo',
        priority: 'high',
        assigneePrincipalId: null,
        extra: undefined,
      },
    ],
  };
  value = good;
  assert.equal(await api.discover('w', requested, signal(), 'opaque_1'), good);
  assert.ok('extra' in good.items[0]);
  const url = new URL(calls[0].url, 'http://local.test');
  assert.equal(url.searchParams.get('q'), 'Title');
  assert.equal(url.searchParams.get('cursor'), 'opaque_1');
  assert.equal(calls[0].init.cache, 'no-store');
  for (const patch of [
    { scope: 'mine', filters: {} },
    { q: 'Other' },
    { view: 'archived' },
    { projectId: 'other' },
    { filters: { status: 'todo' } },
  ]) {
    value = { ...good, query: { ...good.query, ...patch } };
    await assert.rejects(api.discover('w', requested, signal()), (error) => error.status === 502);
  }
  for (const patch of [
    { projectId: 'other' },
    { status: 'done' },
    { priority: 'low' },
    { assigneePrincipalId: 'human' },
    { projectArchivedAt: '2030-01-01' },
    { description: undefined },
  ]) {
    value = { ...good, items: [{ ...good.items[0], ...patch }] };
    await assert.rejects(api.discover('w', requested, signal()), (error) => error.status === 502);
  }
  const mine = { scope: 'mine', q: '', view: 'archived', filters: {} };
  value = {
    ...sharedDiscovery,
    query: mine,
    items: [
      {
        ...sharedDiscovery.items[0],
        assigneePrincipalId: 'human',
        archivedAt: null,
        projectArchivedAt: '2030-01-01',
      },
    ],
  };
  assert.equal(await api.discover('w', mine, signal()), value);
  value = { ...value, principalId: 'different' };
  await assert.rejects(api.discover('w', mine, signal()), (error) => error.status === 502);
  value = {
    ...value,
    principalId: 'human',
    items: [{ ...value.items[0], projectArchivedAt: null }],
  };
  await assert.rejects(api.discover('w', mine, signal()), (error) => error.status === 502);
});

test('discovery proxy retains scalar URL admission, duplicate rejection and exact forwarding', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(String(url));
    return Response.json({ canonical: true });
  });
  const root = 'http://local.test/api/v1/workspaces/w/task-discovery';
  for (const params of [
    '',
    '?scope=mine&q=&view=active',
    `?q=${encodeURIComponent('😀'.repeat(50))}&cursor=${'x'.repeat(2048)}`,
    '?scope=search&assignee=unassigned&project=p&status=todo&priority=high',
  ]) {
    const result = await proxyProjectTask(new Request(root + params));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(new URL(calls.at(-1)).search, new URL(root + params).search);
  }
  const before = calls.length;
  for (const params of [
    '?scope=mine&assignee=human',
    '?q=a&q=b',
    '?cursor=a&cursor=b',
    '?scope[]=mine',
    '?view=null',
    '?project=',
    '?cursor=',
    '?cursor=bad%20cursor',
    `?cursor=${'x'.repeat(2049)}`,
    `?q=${encodeURIComponent('😀'.repeat(50) + 'a')}`,
    '?q=%7F',
    '?q=%00',
    '?extra=',
  ])
    assert.equal((await proxyProjectTask(new Request(root + params))).status, 400);
  assert.equal(calls.length, before);
});

test('T08 transport validates scoped revision pages and exact move payload; proxy rejects unsupported/repeated filters', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  let value = {
    ...page([{ ...task, priority: 'urgent' }]),
    orderVersion: 1,
    columnCounts: { backlog: 1, todo: 0, in_progress: 0, done: 0, canceled: 0 },
    selectedAssignee: null,
  };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(value);
  };
  const api = createProjectTaskTransport();
  assert.equal(
    (
      await api.tasks('w', 'p', 'active', signal(), undefined, {
        status: 'backlog',
        assignee: 'unassigned',
        priority: 'urgent',
      })
    ).orderVersion,
    1,
  );
  assert.ok(calls.at(-1).url.includes('assignee=unassigned'));
  value = { ...value, orderVersion: 2 };
  await assert.rejects(api.tasks('w', 'p', 'active', signal()), (e) => e.status === 502);
  value = task;
  await api.mutate(
    {
      type: 'move-task',
      workspaceId: 'w',
      projectId: 'p',
      taskId: 't',
      expectedVersion: 3,
      expectedOrderVersion: 4,
      status: 'done',
      beforeTaskId: null,
    },
    'move-key',
    signal(),
  );
  assert.ok(calls.at(-1).url.endsWith('/tasks/t/move'));
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), {
    expectedVersion: 3,
    expectedOrderVersion: 4,
    status: 'done',
    beforeTaskId: null,
  });
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p/tasks';
  const before = calls.length;
  for (const query of [
    'status=custom',
    'priority=high&priority=low',
    'labels=x',
    'assignee=bad%20id',
    'cursor=bad!',
  ])
    assert.equal((await proxyProjectTask(new Request(`${root}?${query}`))).status, 400);
  assert.equal((await proxyProjectTask(new Request(root + '/t/move'))).status, 400);
  assert.equal(calls.length, before);
  assert.equal(
    (await proxyProjectTask(new Request(root + '/t/move', { method: 'POST', body: '{}' }))).status,
    200,
  );
});

test('transport uses fixed scoped paths, exact command data/version/key and validates authoritative responses', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  let value = page([project]);
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(value);
  };
  const api = createProjectTaskTransport({ baseURL: 'https://app.example.test' });
  assert.equal((await api.projects('w', 'archived', signal(), 'cursor')).items[0].id, 'p');
  assert.ok(calls[0].url.endsWith('/workspaces/w/projects?view=archived&cursor=cursor'));
  value = task;
  await api.mutate(
    {
      type: 'edit-task',
      workspaceId: 'w',
      projectId: 'p',
      taskId: 't',
      expectedVersion: 7,
      fields: { title: 'Draft', dueDate: null },
    },
    'captured-key',
    signal(),
  );
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    title: 'Draft',
    dueDate: null,
    expectedVersion: 7,
  });
  assert.equal(calls[1].init.headers['Idempotency-Key'], 'captured-key');
  assert.equal(calls[1].init.cache, 'no-store');
  assert.equal(calls[1].init.redirect, 'error');
  value = { ...task, workspaceId: 'foreign' };
  await assert.rejects(
    api.task('w', 'p', 't', signal()),
    (e) => e instanceof ProjectTaskFailure && e.status === 502,
  );
  value = { ...page([project]), capabilities: undefined };
  await assert.rejects(api.projects('w', 'active', signal()), (e) => e.status === 502);
  value = { ...project, version: 0 };
  await assert.rejects(api.project('w', 'p', signal()), (e) => e.status === 502);
});
test('structured conflict includes current record and request ID; stalled HTTP is bounded and later retry recovers', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const command = {
    type: 'edit-project',
    workspaceId: 'w',
    projectId: 'p',
    expectedVersion: 1,
    name: 'Draft',
    description: '',
  };
  const api = createProjectTaskTransport({ timeout: 10 });
  globalThis.fetch = async () =>
    Response.json(
      { code: 'version-conflict', current: { ...project, version: 2 } },
      { status: 409, headers: { 'x-request-id': 'request' } },
    );
  await assert.rejects(
    api.mutate(command, 'key', signal()),
    (e) => e.status === 409 && e.current.version === 2 && e.requestId === 'request',
  );
  globalThis.fetch = async () =>
    Response.json(
      { code: 'version-conflict', current: { ...project, workspaceId: 'foreign' } },
      { status: 409 },
    );
  await assert.rejects(
    api.mutate(command, 'key', signal()),
    (e) => e.status === 409 && e.current === null,
  );
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    });
  const alive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(api.project('w', 'p', signal()));
  } finally {
    clearTimeout(alive);
  }
  globalThis.fetch = async () => Response.json(project);
  assert.equal((await api.project('w', 'p', signal())).id, 'p');
});
test('proxy forwards only required cookie/origin/key, no redirects or forwarding identity; cookies/request ID/no-store retained', async (t) => {
  const original = globalThis.fetch;
  const previous = process.env.API_BASE_URL;
  t.after(() => {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
  process.env.API_BASE_URL = 'http://127.0.0.1:3011';
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return Response.json(project, {
      headers: {
        'set-cookie': 'renewed=value; HttpOnly',
        'x-request-id': '00000000-0000-4000-8000-000000000001',
      },
    });
  };
  const response = await proxyProjectTask(
    new Request('https://app.example.test/api/v1/workspaces/w/projects/p', {
      method: 'POST',
      headers: {
        cookie: 'session=value',
        origin: 'https://app.example.test',
        'content-type': 'application/json',
        'idempotency-key': 'key',
        'x-forwarded-host': 'evil.test',
        'x-request-id': 'forged',
      },
      body: '{}',
    }),
  );
  assert.equal(captured.url.origin, 'http://127.0.0.1:3011');
  assert.equal(captured.init.headers.get('cookie'), 'session=value');
  assert.equal(captured.init.headers.get('origin'), 'https://app.example.test');
  assert.equal(captured.init.headers.get('x-forwarded-host'), null);
  assert.equal(captured.init.headers.get('x-request-id'), null);
  assert.equal(captured.init.redirect, 'manual');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(response.headers.get('set-cookie').startsWith('renewed='));
  assert.equal(response.headers.get('x-request-id'), '00000000-0000-4000-8000-000000000001');
  for (const path of [
    '/api/v1/workspaces/w/projects/p/export',
    '/api/v1/workspaces/w/projects/p/tasks/t/evil',
    '/api/v1/workspaces/w/projects/p/tasks/t/members',
  ])
    assert.equal(
      (await proxyProjectTask(new Request(`https://app.example.test${path}`))).status,
      400,
    );
  assert.equal(
    (
      await proxyProjectTask(
        new Request('https://app.example.test/api/v1/workspaces/w/projects', {
          headers: { 'x-rielia-source': 'forged' },
        }),
      )
    ).status,
    400,
  );
  globalThis.fetch = async () => {
    throw new Error('Private upstream details');
  };
  const failed = await proxyProjectTask(
    new Request('https://app.example.test/api/v1/workspaces/w/projects'),
  );
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('Private'));
});

test('private policy transport preserves exact visibility/access body, captured version/key and scoped pages', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  let value = { ...project, visibility: 'private' };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(value);
  };
  const api = createProjectTaskTransport();
  await api.mutate(
    {
      type: 'create-project',
      workspaceId: 'w',
      key: 'NEW',
      name: 'Private',
      visibility: 'private',
    },
    'create-key',
    signal(),
  );
  assert.equal(JSON.parse(calls.at(-1).init.body).visibility, 'private');
  await api.mutate(
    {
      type: 'change-visibility',
      workspaceId: 'w',
      projectId: 'p',
      expectedVersion: 3,
      visibility: 'workspace',
    },
    'visibility-key',
    signal(),
  );
  assert.ok(calls.at(-1).url.endsWith('/projects/p/visibility'));
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), {
    expectedVersion: 3,
    visibility: 'workspace',
  });
  await api.mutate(
    {
      type: 'change-access',
      workspaceId: 'w',
      projectId: 'p',
      principalId: 'agent',
      expectedVersion: 7,
      state: 'revoked',
    },
    'access-key',
    signal(),
  );
  assert.ok(calls.at(-1).url.endsWith('/projects/p/access/agent'));
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { expectedVersion: 7, state: 'revoked' });
  assert.equal(calls.at(-1).init.headers['Idempotency-Key'], 'access-key');
  value = {
    ...page([
      {
        ...creator,
        role: 'admin',
        explicitAccess: 'revoked',
        implicitAccess: true,
        effectiveAccess: true,
        capabilities: { canGrant: true, canRevoke: false },
      },
    ]),
    workspaceId: 'w',
    projectId: 'p',
    projectVersion: 7,
  };
  assert.equal((await api.access('w', 'p', signal(), 'human')).items[0].effectiveAccess, true);
  assert.ok(calls.at(-1).url.endsWith('/access?cursor=human'));
  value = { ...value, projectId: 'foreign' };
  await assert.rejects(api.access('w', 'p', signal()), (e) => e.status === 502);
  value = { ...page([creator]), workspaceId: 'w', projectId: 'p' };
  assert.equal((await api.assignees('w', 'p', signal())).items.length, 1);
  value = { ...value, items: [{ ...creator, active: false }] };
  await assert.rejects(api.assignees('w', 'p', signal()), (e) => e.status === 502);
  const member = {
    ...creator,
    role: 'member',
    explicitAccess: 'active',
    implicitAccess: false,
    effectiveAccess: true,
    capabilities: { canGrant: false, canRevoke: true },
  };
  value = { project, member };
  assert.equal((await api.accessReview('w', 'p', 'human', signal())).member.principalId, 'human');
  value = { project, member: { ...member, principalId: 'other' } };
  await assert.rejects(api.accessReview('w', 'p', 'human', signal()), (e) => e.status === 502);
  globalThis.fetch = async () =>
    Response.json(
      {
        code: 'version-conflict',
        current: project,
        accessCurrent: { ...member, principalId: 'other' },
      },
      { status: 409 },
    );
  await assert.rejects(
    api.mutate(
      {
        type: 'change-access',
        workspaceId: 'w',
        projectId: 'p',
        principalId: 'human',
        expectedVersion: 1,
        state: 'revoked',
      },
      'key',
      signal(),
    ),
    (e) => e.current.id === 'p' && e.accessCurrent === null,
  );
});
test('privacy proxy allowlist admits only the exact new route and method combinations', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p';
  for (const [suffix, method] of [
    ['/visibility', 'POST'],
    ['/access', 'GET'],
    ['/access/human', 'POST'],
    ['/access/human', 'GET'],
    ['/assignees', 'GET'],
  ])
    assert.equal((await proxyProjectTask(new Request(root + suffix, { method }))).status, 200);
  assert.equal(calls, 5);
  for (const [suffix, method] of [
    ['/visibility', 'GET'],
    ['/access', 'POST'],
    ['/assignees', 'POST'],
    ['/access/human/restore', 'POST'],
    ['/assignees/human', 'GET'],
    ['/access', 'DELETE'],
  ])
    assert.equal((await proxyProjectTask(new Request(root + suffix, { method }))).status, 400);
  assert.equal(calls, 5);
});
test('T09 collaboration transport scopes pages/reviews, exact payloads and closure warnings; proxy rejects method/query escapes', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  let value = {
    workspaceId: 'w',
    projectId: 'p',
    taskId: 't',
    revision: 1,
    items: [],
    total: 0,
    nextCursor: null,
    capabilities: { canCreate: true },
  };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(value);
  };
  const api = createProjectTaskTransport();
  await api.collaboration('w', 'p', 't', 'comments', signal());
  value = { ...value, taskId: 'foreign' };
  await assert.rejects(
    api.collaboration('w', 'p', 't', 'comments', signal()),
    (error) => error.status === 502,
  );
  value = task;
  const edit = {
    type: 'edit-comment',
    workspaceId: 'w',
    projectId: 'p',
    taskId: 't',
    expectedVersion: 7,
    commentId: 'c',
    expectedCommentVersion: 3,
    body: 'Original draft',
  };
  await api.mutate(edit, 'original-key', signal());
  assert.ok(calls.at(-1).url.endsWith('/tasks/t/comments/c'));
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), {
    expectedVersion: 7,
    expectedCommentVersion: 3,
    body: 'Original draft',
  });
  await api.mutate(
    {
      type: 'edit-task',
      workspaceId: 'w',
      projectId: 'p',
      taskId: 't',
      expectedVersion: 7,
      fields: { status: 'done' },
      acknowledgedChildrenVersion: 9,
    },
    'close-key',
    signal(),
  );
  assert.equal(JSON.parse(calls.at(-1).init.body).acknowledgedChildrenVersion, 9);
  globalThis.fetch = async () =>
    Response.json(
      {
        code: 'open-children',
        current: task,
        closeWarning: { open: 1, archivedOpen: 0, childrenVersion: 9 },
      },
      { status: 409 },
    );
  await assert.rejects(
    api.mutate(edit, 'key', signal()),
    (error) => error.closeWarning?.childrenVersion === 9,
  );
  globalThis.fetch = async () => {
    calls.push({});
    return Response.json({});
  };
  const root = 'https://app.example.test/api/v1/workspaces/w/projects/p/tasks/t';
  for (const suffix of [
    'relations',
    'parent-candidates',
    'checklist',
    'comments',
    'history',
    'comments/c',
  ])
    assert.equal((await proxyProjectTask(new Request(`${root}/${suffix}`))).status, 200);
  for (const suffix of [
    'parent',
    'checklist',
    'checklist/i',
    'checklist/i/move',
    'checklist/i/remove',
    'comments',
    'comments/c',
  ])
    assert.equal(
      (await proxyProjectTask(new Request(`${root}/${suffix}`, { method: 'POST', body: '{}' })))
        .status,
      200,
    );
  for (const [suffix, method] of [
    ['history', 'POST'],
    ['parent', 'GET'],
    ['comments/c/remove', 'POST'],
    ['checklist/i', 'DELETE'],
    ['comments?cursor=x&cursor=y', 'GET'],
    ['history?view=active', 'GET'],
  ])
    assert.equal(
      (await proxyProjectTask(new Request(`${root}/${suffix}`, { method }))).status,
      400,
    );
});

test('collaboration transport preserves every command body and original comment review while rejecting malformed modes', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  let value = task;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 200, headers: new globalThis.Headers(), json: async () => value };
  };
  const api = createProjectTaskTransport();
  const target = { workspaceId: 'w', projectId: 'p', taskId: 't', expectedVersion: 7 };
  for (const [type, fields, suffix, body] of [
    [
      'set-task-parent',
      { parentTaskId: 'parent', expectedParentVersion: 2 },
      'parent',
      { parentTaskId: 'parent', expectedParentVersion: 2 },
    ],
    [
      'add-checklist-item',
      { text: '  Draft  ', beforeItemId: null },
      'checklist',
      { text: '  Draft  ', beforeItemId: null },
    ],
    [
      'edit-checklist-item',
      { itemId: 'i', completed: false, text: '' },
      'checklist/i',
      { completed: false, text: '' },
    ],
    [
      'move-checklist-item',
      { itemId: 'i', beforeItemId: null },
      'checklist/i/move',
      { beforeItemId: null },
    ],
    ['remove-checklist-item', { itemId: 'i' }, 'checklist/i/remove', {}],
    ['add-comment', { body: ' \nDraft\n ' }, 'comments', { body: ' \nDraft\n ' }],
    [
      'edit-comment',
      { commentId: 'c', expectedCommentVersion: 3, body: 'Edit' },
      'comments/c',
      { expectedCommentVersion: 3, body: 'Edit' },
    ],
  ]) {
    assert.equal(await api.mutate({ ...target, type, ...fields }, 'retained-key', signal()), task);
    const call = calls.at(-1);
    assert.ok(call.url.endsWith(`/tasks/t/${suffix}`));
    assert.deepEqual(JSON.parse(call.init.body), { expectedVersion: 7, ...body });
    assert.equal(call.init.headers['Idempotency-Key'], 'retained-key');
    assert.equal(call.init.credentials, 'same-origin');
    assert.equal(call.init.cache, 'no-store');
    assert.equal(call.init.redirect, 'error');
  }
  const comment = { ...sharedComment, id: 'c', extra: { preserved: true } };
  value = { task, comment, extra: 'review' };
  const review = value;
  assert.equal(await api.commentReview('w', 'p', 't', 'c', signal()), review);
  assert.equal(review.comment, comment);
  value = Object.defineProperty({ task: { ...task, projectId: 'foreign' } }, 'comment', {
    get: () => assert.fail('Foreign task scope must reject before reading comment content'),
  });
  await assert.rejects(
    api.commentReview('w', 'p', 't', 'c', signal()),
    (error) => error.status === 502,
  );
  value = {
    ...review,
    task: { ...task, provenance: { ...task.provenance, actorPrincipalId: 'foreign' } },
  };
  await assert.rejects(
    api.commentReview('w', 'p', 't', 'c', signal()),
    (error) => error.status === 502,
  );
  value = {
    ...review,
    comment: {
      ...comment,
      author: { ...comment.author, kind: 'agent' },
      provenance: {
        ...comment.provenance,
        executionMode: 'autonomous',
        source: 'mcp',
        grantId: 'grant',
      },
    },
  };
  assert.equal(await api.commentReview('w', 'p', 't', 'c', signal()), value);
  for (const executionMode of [['delegated'], ['autonomous'], new String('delegated')]) {
    value = {
      ...review,
      comment: {
        ...comment,
        provenance: { ...comment.provenance, executionMode, source: 'mcp', grantId: 'grant' },
      },
    };
    await assert.rejects(
      api.commentReview('w', 'p', 't', 'c', signal()),
      (error) => error.status === 502,
    );
    value = {
      workspaceId: 'w',
      projectId: 'p',
      taskId: 't',
      revision: 1,
      items: [value.comment],
      total: 1,
      nextCursor: null,
      capabilities: { canCreate: true },
    };
    await assert.rejects(
      api.collaboration('w', 'p', 't', 'comments', signal()),
      (error) => error.status === 502,
    );
  }
});

test('schema transport keeps original response extras, scoped interpretation and independent malformed error fields', async (t) => {
  let value;
  let status = 200;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: status === 200,
    status,
    headers: new globalThis.Headers({ 'X-Request-Id': 'request' }),
    json: async () => value,
  }));
  const transport = createProjectTaskTransport();
  const abort = new AbortController().signal;
  value = {
    items: [sharedProject],
    total: 1,
    nextCursor: null,
    capabilities: { canCreate: true, canCreatePrivate: false, extra: 1 },
    extra: 2,
  };
  assert.equal(await transport.projects('w', 'active', abort), value);
  value = { ...value, capabilities: { canCreate: true, canCreatePrivate: null } };
  await assert.rejects(transport.projects('w', 'active', abort), (e) => e.status === 502);
  // Loose extra keys still participate in the original Project|Task scope logic.
  value = { ...sharedProject, projectId: 'foreign' };
  await assert.rejects(transport.project('w', 'p', abort), (e) => e.status === 502);
  const member = {
    ...sharedPerson,
    role: 'member',
    explicitAccess: null,
    implicitAccess: false,
    effectiveAccess: true,
    capabilities: { canGrant: true, canRevoke: false },
  };
  value = {
    workspaceId: 'w',
    projectId: 'p',
    projectVersion: 1,
    items: [member],
    total: 1,
    nextCursor: null,
    extra: 3,
  };
  assert.equal(await transport.access('w', 'p', abort), value);
  value = { ...value, projectVersion: 0 };
  await assert.rejects(transport.access('w', 'p', abort), (e) => e.status === 502);
  value = {
    workspaceId: 'foreign',
    projectId: 'p',
    items: [sharedPerson],
    total: 1,
    nextCursor: null,
  };
  await assert.rejects(transport.assignees('w', 'p', abort), (e) => e.status === 502);
  status = 409;
  value = {
    code: '',
    current: { ...sharedProject, creator: { ...sharedPerson, kind: ['human'] } },
    accessCurrent: member,
    closeWarning: { open: 1, archivedOpen: 0, childrenVersion: 1 },
  };
  await assert.rejects(
    transport.mutate(
      {
        type: 'change-access',
        workspaceId: 'w',
        projectId: 'p',
        principalId: 'human',
        expectedVersion: 1,
        state: 'active',
      },
      'same-key',
      abort,
    ),
    (e) => {
      assert.equal(e.status, 409);
      assert.equal(e.code, '');
      assert.equal(e.current, null);
      assert.equal(e.accessCurrent, member);
      assert.equal(e.closeWarning, value.closeWarning);
      assert.equal(e.requestId, 'request');
      return true;
    },
  );
});

test('actual collaboration, discovery and planning-history transports enforce the approved nested person correction', async (t) => {
  let value;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 200,
    headers: new globalThis.Headers(),
    json: async () => value,
  }));
  const transport = createProjectTaskTransport();
  const planning = createTaskPlanningTransport();
  const abort = new AbortController().signal;
  const malformed = { ...sharedPerson, kind: ['human'] };
  const comments = { ...sharedHistory, capabilities: { canCreate: true }, items: [sharedComment] };
  const paths = [
    [
      () => transport.collaboration('w', 'p', 't', 'comments', abort),
      comments,
      { ...comments, items: [{ ...sharedComment, author: malformed }] },
    ],
    [
      () => transport.collaboration('w', 'p', 't', 'history', abort),
      sharedHistory,
      { ...sharedHistory, items: [{ ...sharedHistory.items[0], actor: malformed }] },
    ],
    [
      () => transport.commentReview('w', 'p', 't', 'comment', abort),
      { task: sharedTask, comment: sharedComment },
      { task: sharedTask, comment: { ...sharedComment, author: malformed } },
    ],
    [
      () => transport.discover('w', sharedDiscovery.query, abort),
      sharedDiscovery,
      { ...sharedDiscovery, items: [{ ...sharedDiscovery.items[0], creator: malformed }] },
    ],
    [
      () => planning.taskHistory('w', 'p', 't', abort),
      sharedPlanningHistory,
      {
        ...sharedPlanningHistory,
        items: [{ ...sharedPlanningHistory.items[0], actor: malformed }],
      },
    ],
  ];
  for (const [request, good, bad] of paths) {
    value = good;
    assert.equal(await request(), good);
    value = bad;
    await assert.rejects(request(), (e) => e.status === 502);
  }
  value = { ...sharedTaskPage, items: Array(1) };
  await assert.rejects(transport.tasks('w', 'p', 'active', abort), (e) => e.status === 502);
  value = { ...sharedTask, provenance: { ...sharedTask.provenance, source: ['web'] } };
  await assert.rejects(transport.task('w', 'p', 't', abort), (e) => e.status === 502);
});

test('all collaboration collections keep literal routes, component cursors and original scoped pages', async (t) => {
  const calls = [];
  let value;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 202,
      headers: new globalThis.Headers({ 'content-type': 'text/plain' }),
      json: async () => value,
    };
  });
  const api = createProjectTaskTransport();
  const common = {
    workspaceId: 'w',
    projectId: 'p',
    taskId: 't',
    revision: 1,
    items: [],
    total: 0,
    nextCursor: null,
    extra: true,
  };
  for (const [collection, extra] of [
    [
      'relations',
      {
        parent: null,
        open: 0,
        archivedOpen: 0,
        capabilities: { canCreate: true, canLink: true, canUnlink: false },
      },
    ],
    ['parent-candidates', { capabilities: { canSelect: true } }],
    ['checklist', { capabilities: { canCreate: true, canEdit: true } }],
    ['comments', { capabilities: { canCreate: true } }],
    ['history', {}],
  ]) {
    value = { ...common, ...extra };
    assert.equal(await api.collaboration('w', 'p', 't', collection, signal(), 'a/% +'), value);
    assert.equal(
      calls.at(-1).url,
      `/api/v1/workspaces/w/projects/p/tasks/t/${collection}?cursor=a%2F%25%20%2B`,
    );
    value = { ...value, taskId: 'foreign' };
    await assert.rejects(
      api.collaboration('w', 'p', 't', collection, signal(), ''),
      (error) => error.status === 502,
    );
    assert.equal(calls.at(-1).url.endsWith('?'), false);
  }
});

test('project/task requests retain form query/filter order and exact unlink/edit/archive retry bytes', async (t) => {
  const calls = [];
  let value = page([project]);
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 202, headers: new globalThis.Headers(), json: async () => value };
  });
  const api = createProjectTaskTransport();
  await api.projects('w', 'active', signal(), 'a/% +~');
  assert.equal(calls.at(-1).url, '/api/v1/workspaces/w/projects?view=active&cursor=a%2F%25+%2B%7E');
  value = {
    ...sharedDiscovery,
    items: [],
    total: 0,
    nextCursor: null,
    query: {
      scope: 'search',
      q: 'x +/% 😀',
      view: 'active',
      projectId: 'p',
      filters: { priority: 'high', status: 'todo' },
    },
  };
  await api.discover('w', { ...value.query, q: '  x +/% 😀  ' }, signal(), '');
  assert.equal(
    calls.at(-1).url,
    '/api/v1/workspaces/w/task-discovery?scope=search&q=x+%2B%2F%25+%F0%9F%98%80&view=active&priority=high&status=todo&project=p',
  );
  value = task;
  const target = { workspaceId: 'w', projectId: 'p', taskId: 't', expectedVersion: 7 };
  const cases = [
    [
      { ...target, type: 'set-task-parent', parentTaskId: null },
      '/parent',
      '{"expectedVersion":7,"parentTaskId":null}',
    ],
    [
      {
        ...target,
        type: 'edit-task',
        fields: { title: 'Draft', dueDate: null, priority: 'none' },
        acknowledgedChildrenVersion: 0,
      },
      '',
      '{"title":"Draft","dueDate":null,"priority":"none","expectedVersion":7}',
    ],
    [{ ...target, type: 'archive-task' }, '/archive', '{"expectedVersion":7}'],
    [{ ...target, type: 'restore-task' }, '/restore', '{"expectedVersion":7}'],
  ];
  for (const [command, suffix, body] of cases) {
    for (let attempt = 0; attempt < 2; attempt++) {
      assert.equal(await api.mutate(command, 'same-original-key', signal()), task);
      const call = calls.at(-1);
      assert.equal(call.url, '/api/v1/workspaces/w/projects/p/tasks/t' + suffix);
      assert.equal(call.init.body, body);
      assert.equal(call.init.headers['Idempotency-Key'], 'same-original-key');
    }
  }
});

test('migrated project reads retain malformed-body status/request ID and validate filters before sending', async (t) => {
  let calls = 0;
  let response;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return response;
  });
  const api = createProjectTaskTransport();
  for (const status of [200, 202, 403]) {
    response = new Response('malformed', { status, headers: { 'x-request-id': 'parse-id' } });
    await assert.rejects(
      api.project('w', 'p', signal()),
      (error) =>
        error instanceof ProjectTaskFailure &&
        error.status === (status < 300 ? 502 : status) &&
        error.requestId === 'parse-id' &&
        error.current === null,
    );
  }
  const before = calls;
  await assert.rejects(
    api.tasks('w', 'p', 'active', signal(), undefined, { status: 'invented' }),
    (error) => error instanceof ProjectTaskFailure && error.status === 400,
  );
  assert.equal(calls, before);
  response = Response.json(
    page([{ ...project, workspaceId: 'foreign', url: '/projects?workspace=foreign&project=p' }]),
  );
  await assert.rejects(api.projects('w', 'active', signal()), (error) => error.status === 502);
  response = Response.json({
    ...task,
    projectId: 'foreign',
    url: '/projects?workspace=w&project=foreign&task=t',
  });
  await assert.rejects(
    api.mutate(
      {
        type: 'edit-task',
        workspaceId: 'w',
        projectId: 'p',
        taskId: 't',
        expectedVersion: 1,
        fields: { title: 'Draft' },
      },
      'captured-key',
      signal(),
    ),
    (error) => error.status === 502,
  );
});

async function projectHTTPFixture(t, handle) {
  const server = createServer(handle);
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
for (const phase of ['headers', 'body']) {
  test(
    `native project Query retirement aborts ${phase} and closes the actual HTTP response`,
    { timeout: 15000 },
    async (t) => {
      let admit, close;
      const admitted = new Promise((resolve) => {
        admit = resolve;
      });
      const closed = new Promise((resolve) => {
        close = resolve;
      });
      const baseURL = await projectHTTPFixture(t, (_req, res) => {
        res.once('close', close);
        if (phase === 'body') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.write('{"items":[');
        }
        admit();
      });
      const owner = createProjectTaskQueryOwner({
        workspaces: {},
        transport: createProjectTaskTransport({ baseURL }),
        authorized: () => true,
        changed() {},
        denied() {
          assert.fail('retired read cannot deny a replacement');
        },
      });
      t.after(() => owner.clear());
      owner.bind('native-epoch');
      owner.select({
        workspaceId: 'w',
        projectId: 'p',
        taskId: null,
        views: { projects: 'active', tasks: 'active' },
        taskView: { layout: 'list', filters: {}, column: 'todo' },
        discovery: null,
        parentCandidatesWanted: false,
      });
      const reading = owner.read('tasks');
      await admitted;
      owner.clear();
      await reading;
      await closed;
      assert.equal(owner.resources().tasks.data, null);
      assert.equal(owner.resources().tasks.status, 'idle');
    },
  );
}
test(
  'native project Query body deadline cannot publish stalled JSON as a current task page',
  { timeout: 15000 },
  async (t) => {
    let response, close;
    const closed = new Promise((resolve) => {
      close = resolve;
    });
    const baseURL = await projectHTTPFixture(t, (_req, res) => {
      response = res;
      res.once('close', close);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('{"items":[');
    });
    const owner = createProjectTaskQueryOwner({
      workspaces: {},
      transport: createProjectTaskTransport({ baseURL, timeout: 500 }),
      authorized: () => true,
      changed() {},
      denied() {
        assert.fail('deadline is not terminal denial');
      },
    });
    t.after(() => owner.clear());
    owner.bind('native-epoch');
    owner.select({
      workspaceId: 'w',
      projectId: 'p',
      taskId: null,
      views: { projects: 'active', tasks: 'active' },
      taskView: { layout: 'list', filters: {}, column: 'todo' },
      discovery: null,
      parentCandidatesWanted: false,
    });
    await owner.read('tasks');
    await closed;
    assert.equal(owner.resources().tasks.status, 'error');
    assert.equal(owner.resources().tasks.data, null);
    response.end('],"total":0,"nextCursor":null}');
    assert.equal(owner.resources().tasks.data, null);
  },
);
