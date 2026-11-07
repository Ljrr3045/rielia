import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';
import { TaskDiscoveryService } from '../../dist/projects/task-discovery.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const query = { scope: 'search', q: '', view: 'active', filters: {} };
const status = (code, responseCode) => (error) => {
  assert.equal(error.getStatus(), code);
  if (responseCode) assert.equal(error.getResponse().code, responseCode);
  return true;
};
const row = (number) => ({
  id: `task-${number}`,
  workspaceId: 'w',
  projectId: 'p',
  number,
  title: `Task ${number}`,
  description: 'Private detail body',
  type: 'task',
  priority: 'high',
  status: 'todo',
  version: 2,
  assigneePrincipalId: 'reader',
  parentTaskId: null,
  dueDate: null,
  archivedAt: null,
  createdAt: new Date(now),
  updatedAt: new Date(now),
  createdByPrincipalId: 'creator',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
});

// Query constraints are observed at the repository boundary, never evaluated by
// a fake SQL engine. The real shared projector supplies every returned item.
function fixture() {
  const context = Object.freeze({ boundary: 'current actor composition' });
  const actor = {
    actorPrincipalId: 'reader',
    workspaceId: 'w',
    principalKind: 'human',
    role: 'member',
    executionMode: 'human',
    source: 'web',
    grantId: null,
  };
  const state = {
    projects: [
      {
        id: 'p',
        workspaceId: 'w',
        key: 'UNIT',
        name: 'Visible project',
        version: 3,
        taskRevision: 8,
        visibility: 'workspace',
        archivedAt: null,
      },
    ],
    rows: [row(1)],
    total: 1,
    anchor: { projectId: 'p', number: 100 },
    canWrite: true,
    assigneeActive: true,
    authorizationError: null,
    hydrationError: null,
  };
  const calls = { reads: 0, projects: [], pages: [], counts: [], anchors: [], hydration: [] };
  const tx = {
    project: {
      findMany: async (input) => {
        calls.projects.push(input);
        return state.projects;
      },
    },
    task: {
      findMany: async (input) => {
        calls.pages.push(input);
        return state.rows;
      },
      count: async (input) => {
        calls.counts.push(input);
        return state.total;
      },
      findFirst: async (input) => {
        calls.anchors.push(input);
        return state.anchor;
      },
    },
    membership: {
      findMany: async (input) => {
        calls.hydration.push(input);
        if (state.hydrationError) throw state.hydrationError;
        return [
          {
            principalId: 'creator',
            role: 'member',
            state: 'active',
            principal: { displayName: 'Original Creator', kind: 'human', state: 'active' },
            projectAccesses: [],
          },
          {
            principalId: 'reader',
            role: 'member',
            state: state.assigneeActive ? 'active' : 'revoked',
            principal: { displayName: 'Current Reader', kind: 'human', state: 'active' },
            projectAccesses: [],
          },
        ];
      },
    },
  };
  const projects = new ProjectTaskService({
    domainOperation: async (received, w, operation, work) => {
      assert.equal(received, context);
      assert.equal(w, 'w');
      assert.equal(operation, 'read');
      calls.reads++;
      if (state.authorizationError) throw state.authorizationError;
      return work(tx, actor, state.canWrite);
    },
  });
  const service = new TaskDiscoveryService(projects);
  assert.deepEqual(Reflect.getMetadata('design:paramtypes', TaskDiscoveryService), [
    ProjectTaskService,
  ]);
  const page = (input = query, cursor) => service.page(context, 'w', input, cursor);
  const firstCursor = async (input = query) => {
    state.rows = Array.from({ length: 101 }, (_, index) => row(index + 1));
    state.total = 101;
    return (await page(input)).nextCursor;
  };
  return { actor, state, calls, page, firstCursor };
}

test('My tasks constrains current assignee independently of immutable creator and uses actual item projection', async () => {
  const f = fixture();
  const result = await f.page({ ...query, scope: 'mine' });
  assert.equal(f.calls.pages[0].where.AND[0].assigneePrincipalId, 'reader');
  assert.equal(result.principalId, 'reader');
  assert.equal(result.items[0].creator.principalId, 'creator');
  assert.equal(result.items[0].assigneePrincipalId, 'reader');
  assert.equal(result.items[0].projectName, 'Visible project');
  assert.equal(result.items[0].url, '/projects?workspace=w&project=p&task=task-1');
  assert.equal('description' in result.items[0], false);
  assert.equal(f.calls.hydration.length, 1);
});

test('literal search escapes wildcard characters and carries explicit status, priority and unassigned filters', async () => {
  const f = fixture();
  const input = {
    ...query,
    q: '  50%_\\off  ',
    filters: { status: 'todo', priority: 'high', assignee: 'unassigned' },
  };
  const result = await f.page(input);
  const where = f.calls.counts[0].where;
  assert.equal(where.AND[0].OR[0].title.contains, '50\\%\\_\\\\off');
  assert.equal(where.AND[0].OR[0].title.mode, 'insensitive');
  assert.equal(where.status, 'todo');
  assert.equal(where.priority, 'high');
  assert.equal(where.assigneePrincipalId, null);
  assert.equal(result.query.q, '50%_\\off');
  assert.equal(input.q, '  50%_\\off  ');
});

test('public project-key search adds only the matching currently readable project number', async () => {
  const f = fixture();
  await f.page({ ...query, q: 'unit-2' });
  assert.deepEqual(f.calls.counts[0].where.AND[0].OR[2], { projectId: 'p', number: 2 });
  const g = fixture();
  await g.page({ ...query, q: 'HIDDEN-2' });
  assert.equal(g.calls.counts[0].where.AND[0].OR.length, 2);
});

test('read-only projection retains historical assignee name without returning detail bodies or edit capabilities', async () => {
  const f = fixture();
  f.state.canWrite = false;
  f.state.assigneeActive = false;
  const result = await f.page();
  const item = result.items[0];
  assert.equal(item.assignee.name, 'Current Reader');
  assert.equal(item.assignee.active, false);
  assert.equal(item.creator.principalId, 'creator');
  assert.equal(item.capabilities.canEdit, false);
  assert.equal(item.capabilities.canArchive, false);
  assert.equal('description' in item, false);
});

test('one bounded hydration covers represented projects and identities for a full page', async () => {
  const f = fixture();
  f.state.projects.push({ ...f.state.projects[0], id: 'q', key: 'NEXT', name: 'Second project' });
  f.state.rows = Array.from({ length: 100 }, (_, index) => ({
    ...row(index + 1),
    projectId: index < 50 ? 'p' : 'q',
  }));
  f.state.total = 100;
  const result = await f.page();
  assert.equal(result.items.length, 100);
  assert.equal(f.calls.hydration.length, 1);
  assert.deepEqual(f.calls.hydration[0].where.principalId.in, ['creator', 'reader']);
  assert.deepEqual(f.calls.hydration[0].include.projectAccesses.where.projectId.in, ['p', 'q']);
  assert.equal(result.items[99].projectName, 'Second project');
});

test('cursor continuation accepts equivalent normalized filter order and stays anchored in the matching collection', async () => {
  const f = fixture();
  const input = { ...query, filters: { status: 'todo', priority: 'high' } };
  const cursor = await f.firstCursor(input);
  assert.match(cursor, /^[A-Za-z0-9_-]{1,2048}$/);
  const value = JSON.parse(Buffer.from(cursor, 'base64url').toString());
  assert.equal(value.anchor, 'task-100');
  f.state.rows = [];
  const result = await f.page({ ...query, filters: { priority: 'high', status: 'todo' } }, cursor);
  assert.deepEqual(result.items, []);
  assert.equal(result.nextCursor, null);
  assert.equal(result.total, 101);
  assert.equal(f.calls.anchors[0].where.id, 'task-100');
  assert.deepEqual(f.calls.pages[1].where.AND[1], {
    OR: [{ projectId: { gt: 'p' } }, { projectId: 'p', number: { gt: 100 } }],
  });
});

for (const [name, alter] of [
  [
    'workspace',
    (value) => {
      value.w = 'other';
    },
  ],
  [
    'actor',
    (value) => {
      value.actor = 'other';
    },
  ],
  [
    'query',
    (value) => {
      value.query.q = 'other';
    },
  ],
  [
    'unexpected field',
    (value) => {
      value.extra = 'untrusted';
    },
  ],
])
  test(`cursor rejects a different ${name} before anchor, hydration or task page access`, async () => {
    const f = fixture();
    const cursor = await f.firstCursor();
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    alter(value);
    const before = f.calls.pages.length;
    await assert.rejects(
      f.page(query, Buffer.from(JSON.stringify(value)).toString('base64url')),
      status(400),
    );
    assert.equal(f.calls.pages.length, before);
    assert.equal(f.calls.anchors.length, 0);
    assert.equal(f.calls.hydration.length, 1);
  });

test('cursor rejects malformed/oversized encoding and an anchor no longer in its matching scope', async () => {
  const f = fixture();
  for (const cursor of ['!', 'a'.repeat(2049), Buffer.from('{}').toString('base64url')])
    await assert.rejects(f.page(query, cursor), status(400));
  const cursor = await f.firstCursor();
  f.state.anchor = null;
  await assert.rejects(f.page(query, cursor), status(400));
  assert.equal(f.calls.pages.length, 1);
});

test('authorized revision changes invalidate a cursor before another task page is read', async () => {
  const f = fixture();
  const cursor = await f.firstCursor();
  f.state.projects[0].taskRevision++;
  await assert.rejects(f.page(query, cursor), status(409, 'page-changed'));
  assert.equal(f.calls.pages.length, 1);
  assert.equal(f.calls.anchors.length, 0);
});

test('unreadable selected project and current authority denial return no task page', async () => {
  const f = fixture();
  await assert.rejects(f.page({ ...query, projectId: 'hidden' }), status(403));
  f.state.authorizationError = new ForbiddenException('Workspace access is denied.');
  await assert.rejects(f.page(), (error) => error === f.state.authorizationError);
  assert.equal(f.calls.pages.length + f.calls.hydration.length, 0);
});

test('empty authorized scope returns an empty canonical page without people hydration', async () => {
  const f = fixture();
  f.state.projects = [];
  f.state.rows = [];
  f.state.total = 0;
  const result = await f.page();
  assert.deepEqual(result.items, []);
  assert.equal(result.total, 0);
  assert.equal(result.nextCursor, null);
  assert.equal(f.calls.hydration.length, 0);
  assert.deepEqual(f.calls.counts[0].where.projectId.in, []);
});

test('hydration failure rejects the page instead of returning unverified partial identities', async () => {
  const f = fixture();
  f.state.hydrationError = new Error('people unavailable');
  await assert.rejects(f.page(), (error) => error === f.state.hydrationError);
  assert.equal(f.calls.counts.length, 0);
});

test('My tasks rejects client-selected assignee and forged scope before composition', () => {
  const f = fixture();
  assert.throws(
    () => f.page({ ...query, scope: 'mine', filters: { assignee: 'creator' } }),
    status(400),
  );
  assert.throws(() => f.page({ ...query, actorPrincipalId: 'forged' }), status(400));
  assert.equal(f.calls.reads, 0);
});
