import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';
import { canonical } from '../../dist/projects/project-task-input.js';

const workspaceId = 'values-workspace';
const projectId = 'values-project';
const taskId = 'values-task';
const key = '11111111-1111-4111-8111-111111111111';
const requestId = 'values-request';
const instant = new Date('2026-10-01T12:00:00.000Z');
const actor = {
  actorPrincipalId: 'operator',
  workspaceId,
  principalKind: 'human',
  role: 'admin',
  executionMode: 'human',
  source: 'web',
  grantId: null,
};
const project = {
  id: projectId,
  workspaceId,
  key: 'VALUE',
  name: 'Values project',
  description: 'Original project description',
  visibility: 'workspace',
  version: 3,
  taskRevision: 8,
  archivedAt: null,
  createdAt: instant,
  updatedAt: instant,
  createdByPrincipalId: 'creator',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
};
const task = {
  id: taskId,
  workspaceId,
  projectId,
  number: 7,
  title: 'Original title',
  description: 'Original description',
  type: 'task',
  priority: 'none',
  status: 'backlog',
  assigneePrincipalId: 'assignee',
  parentTaskId: null,
  dueDate: new Date('2028-02-29T00:00:00.000Z'),
  version: 4,
  rank: 1000n,
  archivedAt: null,
  createdAt: instant,
  updatedAt: instant,
  createdByPrincipalId: 'creator',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
};
const member = (principalId, patch = {}) => ({
  principalId,
  role: 'member',
  state: 'active',
  principal: { displayName: principalId, kind: 'human', state: 'active' },
  projectAccesses: [],
  ...patch,
});
const people = [member('creator'), member('operator'), member('assignee')];

// Each repository method consumes explicit, already-loaded answers. No query,
// authorization, mutation, version, trigger or transaction behavior is emulated.
function boundary(answers = {}, currentActor = actor, canWrite = true) {
  const tx = {};
  const calls = [];
  const remaining = new Map();
  for (const [path, values] of Object.entries(answers)) {
    const [entity, method] = path.split('.');
    const queue = [...values];
    remaining.set(path, queue);
    tx[entity] ??= {};
    tx[entity][method] = async (...args) => {
      calls.push({ path, args: globalThis.structuredClone(args) });
      assert.ok(queue.length, `Unexpected repository call: ${path}`);
      return globalThis.structuredClone(queue.shift());
    };
  }
  const context = Object.freeze({ boundary: 'verified PrincipalService execution' });
  const authorizations = [];
  const service = new ProjectTaskService({
    domainOperation: async (received, scope, operation, work) => {
      assert.equal(received, context);
      assert.equal(scope, workspaceId);
      authorizations.push(operation);
      return work(tx, currentActor, canWrite);
    },
  });
  return {
    service,
    context,
    authorizations,
    observed: (path) => calls.filter((call) => call.path === path).map((call) => call.args[0]),
    done: () => {
      for (const [path, queue] of remaining) assert.equal(queue.length, 0, path);
    },
  };
}

function creation(saved) {
  return boundary({
    'project.findFirst': [project, project],
    'projectTaskOperation.findUnique': [null],
    'task.create': [saved],
    'project.findUniqueOrThrow': [project],
    'membership.findMany': [people],
    'activityEvent.create': [null],
    'outboxEvent.create': [null],
    'projectTaskOperation.create': [null],
  });
}
function editing(saved) {
  return boundary({
    'project.findFirst': [project, project],
    'projectTaskOperation.findUnique': [null],
    'task.findFirst': [task],
    'task.findUnique': [task],
    'project.findUniqueOrThrow': [project, project],
    'membership.findMany': [people, people],
    'task.update': [saved],
    'activityEvent.create': [null],
    'outboxEvent.create': [null],
    'projectTaskOperation.create': [null],
  });
}
const edit = (f, input) =>
  f.service.changeTask(
    f.context,
    workspaceId,
    projectId,
    taskId,
    key,
    requestId,
    'edit-task',
    input,
  );
const invalid = (message) => (error) => {
  assert.equal(error.getStatus(), 400);
  assert.equal(error.message, message);
  return true;
};

test('task creation accepts a leap day, trims title and preserves optional description bytes', async () => {
  const description = '  Optional text\r\n\tsecond line  ';
  const saved = {
    ...task,
    title: 'Leap task',
    description,
    assigneePrincipalId: null,
    createdByPrincipalId: 'operator',
  };
  const f = creation(saved);
  const result = await f.service.createTask(f.context, workspaceId, projectId, key, requestId, {
    title: '  Leap task  ',
    description,
    dueDate: '2028-02-29',
  });
  const [{ data }] = f.observed('task.create');
  assert.equal(data.title, 'Leap task');
  assert.equal(data.description, description);
  assert.equal(data.dueDate.toISOString(), '2028-02-29T00:00:00.000Z');
  assert.equal(result.dueDate, '2028-02-29');
  assert.equal(result.description, description);
  f.done();
});

for (const [name, value] of [
  ['null', null],
  ['undefined', undefined],
]) {
  test(`explicit ${name} clears nullable task date and assignee through the public edit`, async () => {
    const f = editing({ ...task, version: 5, dueDate: null, assigneePrincipalId: null });
    const result = await edit(f, {
      expectedVersion: 4,
      dueDate: value,
      assigneePrincipalId: value,
    });
    assert.deepEqual(f.observed('task.update')[0].data, {
      assigneePrincipalId: null,
      dueDate: null,
    });
    assert.equal(result.dueDate, null);
    assert.equal(result.assigneePrincipalId, null);
    assert.equal(result.assignee, null);
    f.done();
  });
}

test('omitted optional fields preserve their loaded values during a title-only edit', async () => {
  const f = editing({ ...task, version: 5, title: 'Edited title' });
  const result = await edit(f, { expectedVersion: 4, title: '  Edited title  ' });
  assert.deepEqual(f.observed('task.update')[0].data, { title: 'Edited title' });
  assert.equal(result.description, 'Original description');
  assert.equal(result.dueDate, '2028-02-29');
  assert.equal(result.assigneePrincipalId, 'assignee');
  f.done();
});

test('optional description edit preserves whitespace and multiple lines without changing the input', async () => {
  const description = '  \r\n\tOptional description\n  ';
  const input = { expectedVersion: 4, description };
  const before = globalThis.structuredClone(input);
  const f = editing({ ...task, version: 5, description });
  const result = await edit(f, input);
  assert.deepEqual(f.observed('task.update')[0].data, { description });
  assert.equal(result.description, description);
  assert.deepEqual(input, before);
  f.done();
});

test('required title length is checked before trim without authorizing or changing the input', () => {
  const input = { expectedVersion: 4, title: ` ${'x'.repeat(299)} ` };
  const before = globalThis.structuredClone(input);
  const f = boundary();
  assert.equal(input.title.length, 301);
  assert.equal(input.title.trim().length, 299);
  assert.throws(() => edit(f, input), invalid('Invalid text.'));
  assert.deepEqual(f.authorizations, []);
  assert.deepEqual(input, before);
});

test('invalid or undefined nonnullable edits fail before authorization or repository access', () => {
  const f = boundary();
  for (const [fields, message] of [
    [{ title: undefined }, 'Invalid text.'],
    [{ title: 'line\nbreak' }, 'Invalid text.'],
    [{ description: undefined }, 'Invalid text.'],
    [{ description: null }, 'Invalid text.'],
    [{ type: undefined }, 'Invalid task property.'],
    [{ priority: undefined }, 'Invalid task property.'],
    [{ status: undefined }, 'Invalid task property.'],
    [{ priority: 'unsupported' }, 'Invalid task property.'],
    [{ assigneePrincipalId: 'invalid id' }, 'Invalid assignee.'],
    [{ dueDate: '2028-02-30' }, 'Invalid date-only due date.'],
  ])
    assert.throws(() => edit(f, { expectedVersion: 4, ...fields }), invalid(message));
  assert.deepEqual(f.authorizations, []);
});

test('empty edits and nonpositive, unsafe or noninteger expected versions fail before authorization', () => {
  const f = boundary();
  assert.throws(() => edit(f, { expectedVersion: 4 }), invalid('A task change is required.'));
  for (const expectedVersion of [undefined, 0, -1, 1.5, '4', Number.MAX_SAFE_INTEGER + 1])
    assert.throws(
      () => edit(f, { expectedVersion, title: 'Never saved' }),
      invalid('A positive expectedVersion is required.'),
    );
  assert.deepEqual(f.authorizations, []);
});

test('canonical request values ignore object property order while retaining array order and dates', () => {
  const left = { input: { z: null, a: instant }, target: ['project', 'task'], action: 'edit-task' };
  const right = {
    action: 'edit-task',
    target: ['project', 'task'],
    input: { a: instant, z: null },
  };
  const before = globalThis.structuredClone(left);
  const serialized = JSON.stringify(canonical(left));
  assert.equal(serialized, JSON.stringify(canonical(right)));
  assert.equal(
    serialized,
    '{"action":"edit-task","input":{"a":"2026-10-01T12:00:00.000Z","z":null},"target":["project","task"]}',
  );
  assert.notEqual(serialized, JSON.stringify(canonical({ ...right, target: ['task', 'project'] })));
  assert.deepEqual(left, before);
});

test('equivalent public creation property order replays its actual receipt without a second command', async () => {
  const saved = { ...task, assigneePrincipalId: null, createdByPrincipalId: 'operator' };
  const first = creation(saved);
  await first.service.createTask(first.context, workspaceId, projectId, key, requestId, {
    title: 'Original title',
    description: 'Original description',
    dueDate: '2028-02-29',
  });
  first.done();
  const receipt = first.observed('projectTaskOperation.create')[0].data;
  const replay = boundary({
    'project.findFirst': [project, project],
    'projectTaskOperation.findUnique': [receipt],
    'task.findUnique': [saved],
    'project.findUniqueOrThrow': [project],
    'membership.findMany': [people],
  });
  const result = await replay.service.createTask(
    replay.context,
    workspaceId,
    projectId,
    key,
    requestId,
    {
      dueDate: '2028-02-29',
      description: 'Original description',
      title: 'Original title',
    },
  );
  assert.equal(result.id, taskId);
  assert.equal(result.dueDate, '2028-02-29');
  assert.deepEqual(replay.authorizations, ['write']);
  replay.done();
});

test('human web administrator can change visibility and receives management capabilities', async () => {
  const changed = { ...project, visibility: 'private', version: 4 };
  const f = boundary({
    'project.findFirst': [project, project],
    'projectTaskOperation.findUnique': [null],
    'membership.findMany': [people, people],
    'project.update': [changed],
    'activityEvent.create': [null],
    'outboxEvent.create': [null],
    'projectTaskOperation.create': [null],
  });
  const result = await f.service.changeVisibility(
    f.context,
    workspaceId,
    projectId,
    key,
    requestId,
    {
      expectedVersion: 3,
      visibility: 'private',
    },
  );
  assert.deepEqual(f.observed('project.update')[0].data, {
    visibility: 'private',
    version: { increment: 1 },
  });
  assert.equal(result.visibility, 'private');
  assert.equal(result.version, 4);
  assert.equal(result.capabilities.canManageAccess, true);
  assert.equal(result.capabilities.canChangeVisibility, true);
  f.done();
});

// These supplied callback combinations isolate the project projection boundary;
// they do not prove PrincipalService emits each combination in production.
for (const scenario of [
  {
    name: 'project detail separates an explicitly read-only callback from human management flags',
    currentActor: actor,
    canWrite: false,
    capabilities: {
      canEdit: false,
      canArchive: false,
      canRestore: false,
      canManageAccess: true,
      canChangeVisibility: true,
      canGrantAccess: true,
      canRevokeAccess: true,
    },
  },
  {
    name: 'delegated human administrator project detail keeps content flags without human management flags',
    currentActor: {
      ...actor,
      executionMode: 'delegated',
      source: 'mcp',
      grantId: 'delegated-grant',
    },
    canWrite: true,
    capabilities: {
      canEdit: true,
      canArchive: true,
      canRestore: false,
      canManageAccess: false,
      canChangeVisibility: false,
      canGrantAccess: false,
      canRevokeAccess: false,
    },
  },
]) {
  test(scenario.name, async () => {
    const loadedProject = { ...project, visibility: 'private' };
    const f = boundary(
      {
        'project.findFirst': [loadedProject],
        'membership.findMany': [people],
      },
      scenario.currentActor,
      scenario.canWrite,
    );
    const result = await f.service.project(f.context, workspaceId, projectId);
    assert.deepEqual(f.observed('project.findFirst')[0].where, { workspaceId, id: projectId });
    assert.equal(result.id, projectId);
    assert.equal(result.workspaceId, workspaceId);
    assert.deepEqual(result.capabilities, scenario.capabilities);
    f.done();
  });
}

for (const scenario of [
  {
    name: 'human web owner can offer a grant to an active member without explicit private access',
    role: 'owner',
    archivedAt: null,
    target: member('target'),
    expected: {
      active: true,
      explicitAccess: null,
      implicitAccess: false,
      effectiveAccess: false,
      capabilities: { canGrant: true, canRevoke: false },
    },
  },
  {
    name: 'archived project retains current implicit administrator access without offering a grant',
    role: 'admin',
    archivedAt: instant,
    target: member('target', { role: 'admin', projectAccesses: [{ state: 'revoked' }] }),
    expected: {
      active: true,
      explicitAccess: 'revoked',
      implicitAccess: true,
      effectiveAccess: true,
      capabilities: { canGrant: false, canRevoke: false },
    },
  },
  {
    name: 'archived inactive explicit access remains revocable with its historical person display',
    role: 'admin',
    archivedAt: instant,
    target: member('target', {
      state: 'suspended',
      principal: { displayName: 'Historical Human', kind: 'human', state: 'active' },
      projectAccesses: [{ state: 'active' }],
    }),
    expected: {
      active: false,
      explicitAccess: 'active',
      implicitAccess: false,
      effectiveAccess: false,
      capabilities: { canGrant: false, canRevoke: true },
    },
  },
]) {
  test(scenario.name, async () => {
    const loadedProject = { ...project, visibility: 'private', archivedAt: scenario.archivedAt };
    const f = boundary(
      {
        'project.findFirst': [loadedProject],
        'membership.findMany': [people],
        'membership.findUnique': [scenario.target],
      },
      { ...actor, role: scenario.role },
    );
    const result = await f.service.accessReview(f.context, workspaceId, projectId, 'target');
    assert.equal(result.project.capabilities.canManageAccess, true);
    assert.equal(result.project.capabilities.canRevokeAccess, true);
    assert.equal(result.project.capabilities.canGrantAccess, scenario.archivedAt === null);
    assert.deepEqual(result.member, {
      principalId: 'target',
      name: scenario.target.principal.displayName,
      kind: 'human',
      role: scenario.target.role,
      ...scenario.expected,
    });
    f.done();
  });
}

for (const currentActor of [
  { ...actor, executionMode: 'delegated', source: 'mcp', grantId: 'delegated-grant' },
  {
    ...actor,
    actorPrincipalId: 'agent',
    principalKind: 'agent',
    role: 'member',
    executionMode: 'autonomous',
    source: 'mcp',
    grantId: 'autonomous-grant',
  },
]) {
  test(`${currentActor.executionMode} execution cannot inspect administrative access review`, async () => {
    const f = boundary({}, currentActor);
    await assert.rejects(
      f.service.accessReview(f.context, workspaceId, projectId, 'target'),
      (error) => {
        assert.equal(error.getStatus(), 403);
        assert.equal(error.message, 'Human project administration is required.');
        return true;
      },
    );
    assert.deepEqual(f.authorizations, ['read']);
    f.done();
  });
}

test('current private eligibility and archive change capabilities while historical task authorship stays intact', async () => {
  const historical = {
    ...task,
    createdByPrincipalId: 'original-agent',
    creationMode: 'autonomous',
    creationSource: 'mcp',
    creationGrantId: 'original-grant',
  };
  const creator = member('original-agent', {
    state: 'suspended',
    principal: { displayName: 'Original Agent', kind: 'agent', state: 'active' },
  });
  const results = [];
  for (const [archivedAt, projectAccesses] of [
    [null, [{ projectId, state: 'active' }]],
    [instant, []],
  ]) {
    const currentProject = { ...project, visibility: 'private', archivedAt };
    const f = boundary({
      'project.findFirst': [currentProject],
      'task.findUnique': [historical],
      'project.findUniqueOrThrow': [currentProject],
      'membership.findMany': [[creator, member('assignee', { projectAccesses })]],
    });
    results.push(await f.service.task(f.context, workspaceId, projectId, taskId));
    f.done();
  }
  const [active, archived] = results;
  assert.equal(active.assignee.active, true);
  assert.equal(active.capabilities.canEdit, true);
  assert.equal(archived.assignee.name, 'assignee');
  assert.equal(archived.assignee.active, false);
  assert.deepEqual(archived.capabilities, { canEdit: false, canArchive: false, canRestore: false });
  assert.equal(archived.projectArchivedAt, instant.toISOString());
  assert.equal(archived.archivedAt, null);
  assert.deepEqual(archived.creator, {
    principalId: 'original-agent',
    name: 'Original Agent',
    kind: 'agent',
    active: false,
  });
  assert.deepEqual(archived.creator, active.creator);
  assert.deepEqual(archived.provenance, {
    actorPrincipalId: 'original-agent',
    executionMode: 'autonomous',
    source: 'mcp',
    grantId: 'original-grant',
  });
  assert.deepEqual(archived.provenance, active.provenance);
  assert.equal(archived.dueDate, '2028-02-29');
});
