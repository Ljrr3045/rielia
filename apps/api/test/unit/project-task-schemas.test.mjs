import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createProjectInput,
  changeProjectInput,
  createTaskInput,
  changeTaskInput,
  visibilityInput,
  accessInput,
  moveTaskInput,
  canonical,
} from '../../dist/projects/project-task-input.js';
import { ProjectTaskHttp } from '../../dist/projects/project-task-http.js';

const invalid = (message) => (error) => {
  assert.equal(error.getStatus(), 400);
  assert.equal(error.message, message);
  return true;
};
test('project adapters preserve admission, field and version error precedence', () => {
  for (const [parse, input, message] of [
    [createProjectInput, { name: '', key: 'bad', forged: true }, 'Invalid project/task request.'],
    [createProjectInput, { name: '', key: 'bad', description: null }, 'Invalid text.'],
    [createProjectInput, { name: 'Name', key: 'bad', description: '\0' }, 'Invalid text.'],
    [
      createProjectInput,
      { name: 'Name', key: 'bad' },
      'Use a 2–10 character uppercase project key and valid visibility.',
    ],
    [
      (v) => changeProjectInput(v, true),
      { expectedVersion: 0, name: '' },
      'A positive expectedVersion is required.',
    ],
    [(v) => changeProjectInput(v, true), { expectedVersion: 1 }, 'Invalid text.'],
    [
      visibilityInput,
      { expectedVersion: 0, visibility: 'bad' },
      'A positive expectedVersion is required.',
    ],
    [
      visibilityInput,
      { expectedVersion: 1, visibility: ['private'] },
      'Invalid project visibility.',
    ],
    [
      (v) => accessInput(v, 'bad id'),
      { expectedVersion: 0, state: 'bad' },
      'A positive expectedVersion is required.',
    ],
    [
      (v) => accessInput(v, 'bad id'),
      { expectedVersion: 1, state: 'active' },
      'Invalid project access.',
    ],
    [
      (v) => accessInput(v, 'person'),
      { expectedVersion: 1, state: 'bad' },
      'Invalid project access.',
    ],
  ])
    assert.throws(() => parse(input), invalid(message));
  assert.deepEqual(createProjectInput({ name: '  Project  ', key: 'PR', description: null }), {
    name: 'Project',
    key: 'PR',
    description: '',
    visibility: 'workspace',
  });
  assert.equal(
    createProjectInput({ name: 'x', key: 'PR', visibility: 'private' }).visibility,
    'private',
  );
  assert.deepEqual(changeProjectInput({ expectedVersion: 1 }, false), { version: 1, fields: null });
  assert.deepEqual(
    changeProjectInput({ expectedVersion: 1, name: '  Edit  ', description: ' \n ' }, true),
    { version: 1, fields: { name: 'Edit', description: ' \n ' } },
  );
  assert.equal(
    visibilityInput({ expectedVersion: 1, visibility: 'workspace' }).visibility,
    'workspace',
  );
  assert.equal(accessInput({ expectedVersion: 1, state: 'active' }, 'person').state, 'active');
});

test('task adapters retain nullable clearing, omissions, parent binding and canonical normalized values', () => {
  const input = {
    title: '  Task  ',
    description: ' \n\t ',
    dueDate: '2028-02-29',
    parentTaskId: 'parent',
    expectedParentVersion: 2,
  };
  const before = globalThis.structuredClone(input);
  const created = createTaskInput(input);
  assert.deepEqual(created, {
    fields: {
      title: 'Task',
      description: ' \n\t ',
      type: 'task',
      priority: 'none',
      status: 'backlog',
      assigneePrincipalId: null,
      dueDate: new Date('2028-02-29T00:00:00.000Z'),
    },
    parentTaskId: 'parent',
    parentVersion: 2,
  });
  assert.deepEqual(input, before);
  assert.equal(canonical(created.fields).dueDate, '2028-02-29T00:00:00.000Z');
  assert.deepEqual(changeTaskInput({ expectedVersion: 1, title: '  Edit  ' }, true).fields, {
    title: 'Edit',
  });
  assert.deepEqual(
    changeTaskInput(
      { expectedVersion: 1, dueDate: undefined, assigneePrincipalId: undefined },
      true,
    ).fields,
    { assigneePrincipalId: null, dueDate: null },
  );
  assert.deepEqual(changeTaskInput({ expectedVersion: 1 }, false), {
    version: 1,
    acknowledgment: undefined,
    fields: null,
  });
  assert.equal(
    createTaskInput({ title: 'x', type: undefined, priority: undefined, status: undefined }).fields
      .status,
    'backlog',
  );
  for (const [input, message] of [
    [{ title: '', parentTaskId: null }, 'Invalid text.'],
    [{ title: 'x', type: 'bad', assigneePrincipalId: 'bad id' }, 'Invalid task property.'],
    [{ title: 'x', assigneePrincipalId: 'bad id', dueDate: 'bad' }, 'Invalid assignee.'],
    [{ title: 'x', dueDate: '2028-02-30', parentTaskId: null }, 'Invalid date-only due date.'],
    [{ title: 'x', parentTaskId: null }, 'Invalid parent task.'],
    [{ title: 'x', expectedParentVersion: undefined }, 'Invalid parent task.'],
    [{ title: 'x', parentTaskId: 'parent' }, 'A positive expectedVersion is required.'],
  ])
    assert.throws(() => createTaskInput(input), invalid(message));
  for (const [input, message] of [
    [
      { expectedVersion: 0, acknowledgedChildrenVersion: 0, title: '' },
      'A positive expectedVersion is required.',
    ],
    [
      { expectedVersion: 1, acknowledgedChildrenVersion: 0, title: '' },
      'A positive expectedVersion is required.',
    ],
    [{ expectedVersion: 1, acknowledgedChildrenVersion: 1 }, 'A task change is required.'],
    [{ expectedVersion: 1, status: undefined }, 'Invalid task property.'],
  ])
    assert.throws(() => changeTaskInput(input, true), invalid(message));
});

test('move adapter preserves version, order, destination then acknowledgment precedence', () => {
  const body = {
    expectedVersion: 1,
    expectedOrderVersion: 2,
    status: 'done',
    beforeTaskId: null,
    acknowledgedChildrenVersion: 3,
  };
  assert.deepEqual(moveTaskInput(body), body);
  for (const [patch, message] of [
    [
      { expectedVersion: 0, expectedOrderVersion: 0, status: 'bad' },
      'A positive expectedVersion is required.',
    ],
    [{ expectedOrderVersion: 0, status: 'bad' }, 'A positive expectedVersion is required.'],
    [{ status: 'bad', acknowledgedChildrenVersion: 0 }, 'Invalid task move.'],
    [{ beforeTaskId: 'bad id', acknowledgedChildrenVersion: 0 }, 'Invalid task move.'],
    [{ acknowledgedChildrenVersion: 0 }, 'A positive expectedVersion is required.'],
  ])
    assert.throws(() => moveTaskInput({ ...body, ...patch }), invalid(message));
});

test('HTTP query schemas retain admission before context and actual operation/cookie/no-store mapping', async () => {
  let authorizations = 0;
  const context = {};
  const http = new ProjectTaskHttp(
    {
      webContext: async () => {
        authorizations++;
        return { context, headers: new globalThis.Headers({ 'Set-Cookie': 'renewed=1' }) };
      },
    },
    { config: { origin: 'https://app.example.test' } },
  );
  function response() {
    const headers = new Map();
    return {
      headers,
      getHeader: (key) => headers.get(key),
      setHeader: (key, value) => headers.set(key, value),
      append: (key, value) => headers.set(key, value),
      json: (value) => value,
    };
  }
  for (const [mode, query] of [
    [true, { cursor: 'x'.repeat(129) }],
    ['cursor', { view: 'active' }],
    ['tasks', { status: ['todo'] }],
    ['tasks', { cursor: 'x'.repeat(2049) }],
  ]) {
    const res = response();
    await assert.rejects(
      http.respond(
        { method: 'GET', headers: {}, params: { workspaceId: 'w' }, query },
        res,
        'w',
        mode,
        async () => assert.fail('Invalid query reached operation'),
      ),
      invalid('Invalid project/task query.'),
    );
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(authorizations, 0);
  const res = response();
  let received;
  await http.respond(
    {
      method: 'GET',
      headers: {},
      params: { workspaceId: 'w' },
      query: { status: 'todo', cursor: 'x'.repeat(2048) },
    },
    res,
    'w',
    'tasks',
    async (...args) => {
      received = args;
      return { success: true };
    },
  );
  assert.equal(received[0], context);
  assert.equal(received[2], 'active');
  assert.equal(received[3].length, 2048);
  assert.deepEqual(received[4], { status: 'todo' });
  assert.equal(res.headers.get('Set-Cookie'), 'renewed=1');
  assert.equal(authorizations, 1);
});
