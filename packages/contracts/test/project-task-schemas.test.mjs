import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as contracts from '../dist/index.js';
const person = { principalId: 'human', name: 'Human', kind: 'human', active: true };
const provenance = {
  actorPrincipalId: 'human',
  executionMode: 'human',
  source: 'web',
  grantId: null,
};
const project = {
  id: 'p',
  workspaceId: 'w',
  key: 'PR',
  name: 'Project',
  description: '',
  visibility: 'workspace',
  version: 1,
  archivedAt: null,
  createdAt: '2030-01-02',
  updatedAt: '2030-01-02',
  creator: person,
  provenance,
  url: '',
  capabilities: {
    canEdit: true,
    canArchive: true,
    canRestore: false,
    canManageAccess: false,
    canChangeVisibility: false,
    canGrantAccess: false,
    canRevokeAccess: false,
  },
};
const task = {
  ...project,
  id: 't',
  projectId: 'p',
  projectKey: 'PR',
  number: 1,
  key: 'PR-1',
  title: 'Task',
  type: 'task',
  priority: 'none',
  status: 'todo',
  parentTaskId: null,
  orderVersion: 1,
  projectArchivedAt: null,
  assigneePrincipalId: null,
  assignee: null,
  dueDate: null,
};
const taskPage = {
  items: [task],
  total: 1,
  nextCursor: null,
  capabilities: { canCreate: true },
  orderVersion: 1,
  columnCounts: { backlog: 0, todo: 1, in_progress: 0, done: 0, canceled: 0 },
  selectedAssignee: null,
};
const comment = {
  id: 'comment',
  body: 'Comment',
  version: 1,
  author: person,
  provenance,
  createdAt: '2030-01-02',
  updatedAt: '2030-01-02',
  editedAt: null,
  capabilities: { canEdit: true },
};
const history = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  revision: 1,
  total: 1,
  nextCursor: null,
  items: [
    {
      id: 'activity',
      action: 'create-task',
      fields: [],
      actor: person,
      provenance,
      entityVersion: 1,
      createdAt: '2030-01-02',
      changes: [],
    },
  ],
};
const planningHistory = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  sprintId: null,
  taskRevision: 1,
  sprintRevision: 1,
  total: 1,
  nextCursor: null,
  items: [
    {
      id: 'event',
      taskId: 't',
      sprintId: null,
      participationId: null,
      ordinal: 1,
      kind: 'metadata',
      action: 'create-sprint',
      occurredAt: '2030-01-02T00:00:00.000Z',
      before: null,
      after: null,
      actor: person,
      provenance,
    },
  ],
};
const discovery = {
  workspaceId: 'w',
  principalId: 'human',
  revision: 'a'.repeat(64),
  total: 1,
  nextCursor: null,
  query: { scope: 'search', q: '', view: 'active', filters: {} },
  items: [
    Object.fromEntries(
      Object.entries({ ...task, projectName: 'Project' }).filter(([key]) => key !== 'description'),
    ),
  ],
};

// Source-bound differential inputs: scalar JSON arrays and custom objects are distinct.
function scalarWitnesses() {
  const cases = [];
  for (const kind of ['human', 'agent'])
    for (const value of [[kind], { toString: () => kind }]) {
      const malformed = { ...person, kind: value };
      cases.push(['isDomainPerson', malformed]);
      cases.push(['isProject', { ...project, creator: malformed }]);
      cases.push(['isTask', { ...task, assignee: malformed }]);
      cases.push(['isTaskComment', { ...comment, author: malformed }]);
      cases.push([
        'isCollaborationPage',
        {
          ...history,
          items: [{ ...history.items[0], actor: malformed }],
        },
        'history',
      ]);
      cases.push([
        'isPlanningHistoryPage',
        {
          ...planningHistory,
          items: [{ ...planningHistory.items[0], actor: malformed }],
        },
      ]);
      cases.push([
        'isTaskDiscoveryPage',
        {
          ...discovery,
          items: [{ ...discovery.items[0], creator: malformed }],
        },
      ]);
    }
  for (const [key, values] of [
    ['executionMode', ['human', 'delegated', 'autonomous']],
    ['source', ['web', 'mcp']],
  ]) {
    for (const scalar of values)
      for (const value of [[scalar], { toString: () => scalar }]) {
        cases.push(['isProject', { ...project, provenance: { ...provenance, [key]: value } }]);
        cases.push(['isTask', { ...task, provenance: { ...provenance, [key]: value } }]);
      }
  }
  return cases;
}

test('canonical project/task schemas retain broad historical strings, dates, grants and extras', () => {
  for (const [schema, guard, value] of [
    [contracts.projectSchema, contracts.isProject, project],
    [contracts.taskSchema, contracts.isTask, task],
  ]) {
    const broad = {
      ...value,
      id: '',
      workspaceId: '',
      key: '',
      url: '',
      createdAt: 'January 2, 2030',
      updatedAt: '1999-01-01',
      archivedAt: '2030-01-03',
      creator: { ...person, principalId: '', name: '', extra: 1 },
      provenance: {
        actorPrincipalId: '',
        executionMode: 'delegated',
        source: 'web',
        grantId: null,
        extra: 2,
      },
      extra: { retained: true },
    };
    assert.equal(guard(broad), true);
    assert.deepEqual(schema.parse(broad), broad);
    for (const grantId of ['', 'spaces / broad grant', null])
      assert.equal(guard({ ...broad, provenance: { ...broad.provenance, grantId } }), true);
    assert.equal(
      guard({ ...broad, provenance: { ...broad.provenance, actorPrincipalId: 'foreign' } }),
      false,
    );
    for (const property of ['archivedAt', 'createdAt', 'creator', 'capabilities']) {
      const missing = { ...broad };
      delete missing[property];
      assert.equal(guard(missing), false, property);
    }
  }
  assert.equal(
    contracts.isTask({
      ...task,
      dueDate: '0000-02-31',
      parentTaskId: '',
      assigneePrincipalId: '',
      assignee: person,
    }),
    true,
  );
});

test('approved scalar correction reaches G02 and actual G04/G05/G06 nested person guards', () => {
  for (const [name, value, collection] of scalarWitnesses())
    assert.equal(contracts[name](value, collection), false, name);
  for (const [name, value, collection] of [
    ['isTaskComment', comment],
    ['isCollaborationPage', history, 'history'],
    ['isPlanningHistoryPage', planningHistory],
    ['isTaskDiscoveryPage', discovery],
  ])
    assert.equal(contracts[name](value, collection), true, name);
  // T38.2f explicitly approves primitive G06 modes, retaining the original witness.
  const delegated = {
    ...comment.provenance,
    executionMode: ['delegated'],
    source: 'mcp',
    grantId: 'grant',
  };
  assert.equal(contracts.isTaskComment({ ...comment, provenance: delegated }), false);
  assert.equal(
    contracts.isPlanningHistoryPage({
      ...planningHistory,
      items: [{ ...planningHistory.items[0], provenance: delegated }],
    }),
    false,
  );
});

test('domain pages validate the known private capability while preserving extras and generic page policy', () => {
  const page = {
    items: [project, project],
    total: 2,
    nextCursor: 'any / nonempty cursor',
    capabilities: { canCreate: true, extra: 1 },
    extra: 2,
  };
  for (const canCreatePrivate of [true, false])
    assert.equal(
      contracts.isProjectPage({
        ...page,
        capabilities: { ...page.capabilities, canCreatePrivate },
      }),
      true,
    );
  assert.equal(contracts.isProjectPage(page), true);
  assert.deepEqual(contracts.projectPageSchema.parse(page), page);
  for (const canCreatePrivate of [null, 'true', 1, [], undefined]) {
    assert.equal(
      contracts.isProjectPage({
        ...page,
        capabilities: { ...page.capabilities, canCreatePrivate },
      }),
      false,
    );
    assert.equal(
      contracts.isTaskPage({ ...taskPage, capabilities: { canCreate: true, canCreatePrivate } }),
      false,
    );
  }
  const member = {
    ...person,
    role: 'member',
    explicitAccess: null,
    implicitAccess: false,
    effectiveAccess: true,
    capabilities: { canGrant: true, canRevoke: false },
  };
  const access = {
    ...page,
    workspaceId: 'w',
    projectId: 'p',
    projectVersion: 1,
    items: Array(101).fill(member),
    total: 101,
  };
  assert.equal(contracts.isProjectAccessPage(access), true);
  assert.equal(contracts.isProjectAccessReview({ project, member, extra: 1 }), true);
  assert.equal(
    contracts.isProjectAccessReview({ project, member: { ...member, role: 'other' } }),
    false,
  );
  assert.equal(contracts.isProjectAccessPage({ ...access, projectVersion: 0 }), false);
  assert.equal(contracts.isProjectAssigneePage({ ...access, items: [person], total: 1 }), true);
  assert.equal(
    contracts.isProjectAssigneePage({ ...access, items: [{ ...person, active: false }], total: 1 }),
    false,
  );
});

test('task pages preserve duplicate/revision/count/cursor rules and reject nonJSON sparse arrays', () => {
  const duplicated = {
    ...taskPage,
    items: [task, task],
    total: 2,
    columnCounts: { ...taskPage.columnCounts, todo: 2 },
  };
  assert.equal(contracts.isTaskPage(duplicated), true);
  assert.deepEqual(contracts.taskPageSchema.parse(duplicated), duplicated);
  assert.equal(contracts.isTaskPage({ ...taskPage, items: Array(1) }), false);
  assert.equal(contracts.isTaskPage({ ...taskPage, items: [null] }), false);
  for (const patch of [
    { orderVersion: 2 },
    { total: 2 },
    { total: 0 },
    { nextCursor: '' },
    { nextCursor: 'x'.repeat(2049) },
    { selectedAssignee: {} },
    { columnCounts: { ...taskPage.columnCounts, backlog: -1 } },
  ])
    assert.equal(contracts.isTaskPage({ ...taskPage, ...patch }), false);
  assert.equal(contracts.isTaskPage({ ...taskPage, nextCursor: 'x'.repeat(2048) }), true);
});

test('strict inputs normalize UTF16 text/defaults while retaining explicit null and key presence', () => {
  assert.deepEqual(
    contracts.createProjectInputSchema.parse({ name: '  Name  ', key: 'PR', description: null }),
    { name: 'Name', key: 'PR', description: '' },
  );
  const create = contracts.createTaskInputSchema.parse({
    title: '  Task  ',
    description: null,
    dueDate: '2028-02-29',
  });
  assert.deepEqual(create, {
    title: 'Task',
    description: '',
    type: 'task',
    priority: 'none',
    status: 'backlog',
    assigneePrincipalId: null,
    dueDate: '2028-02-29',
  });
  assert.equal(
    contracts.createTaskInputSchema.safeParse({ title: '😀'.repeat(150) }).success,
    true,
  );
  assert.equal(
    contracts.createTaskInputSchema.safeParse({ title: '😀'.repeat(151) }).success,
    false,
  );
  const omitted = contracts.editTaskInputSchema.parse({ expectedVersion: 1, title: 'New' });
  assert.equal('assigneePrincipalId' in omitted, false);
  const clearing = contracts.editTaskInputSchema.parse({
    expectedVersion: 1,
    assigneePrincipalId: undefined,
    dueDate: undefined,
  });
  assert.equal('assigneePrincipalId' in clearing, true);
  assert.equal('dueDate' in clearing, true);
  for (const body of [
    { title: 'line\nbreak' },
    { title: 'x', type: null },
    { title: 'x', dueDate: '2028-02-30' },
    { title: 'x', dueDate: '0000-01-01' },
    { title: 'x', parentTaskId: null },
    { title: 'x', expectedParentVersion: 1 },
    { title: 'x', parentTaskId: 'parent' },
    { title: 'x', actorPrincipalId: 'forged' },
  ])
    assert.equal(contracts.createTaskInputSchema.safeParse(body).success, false);
  for (const body of [
    { expectedVersion: 1 },
    { expectedVersion: 1, acknowledgedChildrenVersion: 1 },
    { expectedVersion: 1, description: undefined },
    { expectedVersion: 1, description: null },
    { expectedVersion: 0, title: 'x' },
    { expectedVersion: Number.MAX_SAFE_INTEGER + 1, title: 'x' },
  ])
    assert.equal(contracts.editTaskInputSchema.safeParse(body).success, false);
  assert.equal(
    contracts.createTaskInputSchema.safeParse({
      title: 'x',
      parentTaskId: 'parent',
      expectedParentVersion: 1,
    }).success,
    true,
  );
  assert.equal(
    contracts.createProjectInputSchema.safeParse({ name: 'Name', key: 'PR', visibility: undefined })
      .success,
    false,
  );
  assert.equal(contracts.isTaskFilters({ status: undefined }), false);
});

test('canonical create/edit descriptions preserve whitespace and UTF16 bounds while rejecting NUL', () => {
  for (const [schema, input] of [
    [contracts.createProjectInputSchema, { name: '  Project  ', key: 'PR' }],
    [contracts.editProjectInputSchema, { expectedVersion: 1, name: '  Project  ' }],
    [contracts.createTaskInputSchema, { title: '  Task  ' }],
    [contracts.editTaskInputSchema, { expectedVersion: 1, title: '  Task  ' }],
  ]) {
    for (const description of ['  \nDescription\t  ', '😀'.repeat(10000)]) {
      const result = schema.parse({ ...input, description });
      assert.equal(result.description, description);
      if ('name' in result) assert.equal(result.name, 'Project');
      if ('title' in result) assert.equal(result.title, 'Task');
    }
    for (const description of ['x'.repeat(20001), `${'😀'.repeat(10000)}x`, 'Text\0tail'])
      assert.equal(schema.safeParse({ ...input, description }).success, false);
  }
});

test('activity categorical changes retain the migrated status, type and priority enum dependencies', () => {
  for (const [field, before, after, wrongCategory] of [
    ['status', 'backlog', 'todo', 'bug'],
    ['type', 'task', 'bug', 'urgent'],
    ['priority', 'high', 'urgent', 'task'],
  ]) {
    assert.equal(contracts.isActivityChange({ field, before, after }), true);
    assert.equal(contracts.isActivityChange({ field, before: wrongCategory, after }), false);
    assert.equal(contracts.isActivityChange({ field, before, after: wrongCategory }), false);
  }
});
