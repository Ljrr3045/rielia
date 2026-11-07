import 'reflect-metadata';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';
import { TaskCollaborationService } from '../../dist/projects/task-collaboration.service.js';

const now = Date.UTC(2026, 9, 1, 12);
const key = '11111111-1111-4111-8111-111111111111';
const status = (code, responseCode) => (error) => {
  assert.equal(error.getStatus(), code);
  if (responseCode) assert.equal(error.getResponse().code, responseCode);
  return true;
};

// Real project composition supplies archive/version/parent policy and DTOs.
// Repository methods return named records, not an in-memory ORM or SQL engine.
function fixture(t) {
  t.mock.timers.enable({ apis: ['Date'], now });
  let id = 0;
  t.mock.method(
    crypto,
    'randomUUID',
    () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
  );
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  const context = Object.freeze({ boundary: 'current actor composition' });
  const actor = {
    actorPrincipalId: 'author',
    workspaceId: 'w',
    principalKind: 'human',
    role: 'owner',
    executionMode: 'human',
    source: 'web',
    grantId: null,
  };
  const project = {
    id: 'p',
    workspaceId: 'w',
    key: 'UNIT',
    name: 'Project',
    visibility: 'workspace',
    version: 2,
    taskRevision: 7,
    archivedAt: null,
  };
  const task = {
    id: 'task',
    workspaceId: 'w',
    projectId: 'p',
    number: 1,
    title: 'Task',
    description: '',
    type: 'task',
    priority: 'none',
    status: 'backlog',
    version: 4,
    assigneePrincipalId: null,
    parentTaskId: null,
    dueDate: null,
    archivedAt: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    createdByPrincipalId: 'author',
    creationMode: 'human',
    creationSource: 'web',
    creationGrantId: null,
  };
  const comment = {
    id: 'comment',
    workspaceId: 'w',
    projectId: 'p',
    taskId: 'task',
    body: 'Original Markdown',
    version: 3,
    authorPrincipalId: 'author',
    creationMode: 'delegated',
    creationSource: 'mcp',
    creationGrantId: 'historical-grant',
    createdAt: new Date(now - 1000),
    updatedAt: new Date(now),
  };
  const state = {
    project,
    task,
    comment,
    canWrite: true,
    parent: { ...task, id: 'parent', number: 2, version: 6 },
    archivedParent: null,
    children: 0,
    checklist: [],
    authorActive: true,
    commentError: null,
  };
  const effects = {
    comments: [],
    tasks: [],
    checklist: [],
    activity: [],
    outbox: [],
    receipts: [],
  };
  const tx = {
    project: { findFirst: async () => state.project, findUniqueOrThrow: async () => state.project },
    task: {
      findUnique: async () => state.task,
      findFirst: async ({ where }) => {
        assert.equal(where.workspaceId, 'w');
        assert.equal(where.projectId, 'p');
        if (where.archivedAt?.not === null) return state.archivedParent;
        if (where.id === 'task') return state.task;
        assert.equal(where.id, 'parent');
        assert.equal(where.archivedAt, null);
        assert.equal(where.parentTaskId, null);
        return state.parent;
      },
      count: async () => state.children,
      update: async ({ data }) => {
        effects.tasks.push(data);
        return { ...state.task, version: 5 };
      },
    },
    membership: {
      findMany: async () => [
        {
          principalId: 'author',
          state: state.authorActive ? 'active' : 'revoked',
          role: 'member',
          principal: { displayName: 'Historical Author', kind: 'human', state: 'active' },
          projectAccesses: [],
        },
      ],
    },
    taskComment: {
      findFirst: async () => state.comment,
      create: async ({ data }) => {
        effects.comments.push(data);
        if (state.commentError) throw state.commentError;
      },
      update: async ({ data }) => {
        effects.comments.push(data);
        if (state.commentError) throw state.commentError;
      },
    },
    checklistItem: {
      findMany: async () => state.checklist,
      update: async ({ where, data }) => {
        effects.checklist.push({ id: where.id, ...data });
      },
    },
    projectTaskOperation: {
      findUnique: async () => null,
      create: async ({ data }) => {
        effects.receipts.push(data);
      },
    },
    activityEvent: {
      create: async ({ data }) => {
        effects.activity.push(data);
      },
    },
    outboxEvent: {
      create: async ({ data }) => {
        effects.outbox.push(data);
      },
    },
  };
  const principals = {
    domainOperation: async (received, w, operation, work) => {
      assert.equal(received, context);
      assert.equal(w, 'w');
      assert.ok(['read', 'write'].includes(operation));
      return work(tx, actor, state.canWrite);
    },
  };
  const projects = new ProjectTaskService(principals);
  const service = new TaskCollaborationService(projects);
  assert.deepEqual(Reflect.getMetadata('design:paramtypes', TaskCollaborationService), [
    ProjectTaskService,
  ]);
  const mutate = (
    action = 'edit-comment',
    input = { expectedVersion: 4, expectedCommentVersion: 3, body: 'Changed Markdown' },
    item,
  ) =>
    service.mutate(
      context,
      'w',
      'p',
      'task',
      key,
      'request',
      action,
      input,
      item ?? (action === 'edit-comment' ? 'comment' : undefined),
    );
  return { service, context, actor, state, effects, mutate };
}

test('own-author comment edit changes only body and journals the current actor', async (t) => {
  const f = fixture(t);
  const result = await f.mutate();
  assert.equal(result.id, 'task');
  assert.equal(result.version, 5);
  assert.deepEqual(f.effects.comments, [{ body: 'Changed Markdown' }]);
  assert.deepEqual(f.effects.tasks, [{ version: { increment: 1 } }]);
  assert.equal(f.effects.activity[0].actorPrincipalId, 'author');
  assert.deepEqual(f.effects.activity[0].changedFields, ['comment']);
  assert.equal(f.effects.outbox.length, 1);
  assert.equal(f.effects.receipts.length, 1);
});

for (const role of ['owner', 'admin'])
  test(`${role} cannot edit another immutable author's comment`, async (t) => {
    const f = fixture(t);
    f.actor.role = role;
    f.actor.actorPrincipalId = 'other';
    await assert.rejects(f.mutate(), status(403));
    assert.equal(f.effects.comments.length + f.effects.tasks.length + f.effects.activity.length, 0);
  });

test('comment version conflicts independently from the current task version', async (t) => {
  const f = fixture(t);
  await assert.rejects(
    f.mutate('edit-comment', { expectedVersion: 4, expectedCommentVersion: 2, body: 'Stale' }),
    status(409, 'comment-conflict'),
  );
  assert.equal(f.effects.comments.length + f.effects.tasks.length + f.effects.receipts.length, 0);
});

test('stale task version rejects before the otherwise current comment edit', async (t) => {
  const f = fixture(t);
  await assert.rejects(
    f.mutate('edit-comment', { expectedVersion: 3, expectedCommentVersion: 3, body: 'Stale' }),
    status(409, 'version-conflict'),
  );
  assert.equal(f.effects.comments.length + f.effects.tasks.length, 0);
});

for (const target of ['task', 'project'])
  test(`archived ${target} freezes collaboration writes through real project composition`, async (t) => {
    const f = fixture(t);
    f.state[target].archivedAt = new Date(now);
    await assert.rejects(f.mutate(), status(409, 'archived'));
    assert.equal(f.effects.comments.length + f.effects.tasks.length, 0);
  });

test('exact comment review preserves inactive historical authorship and denies edit to another current author', async (t) => {
  const f = fixture(t);
  f.actor.actorPrincipalId = 'other';
  f.state.authorActive = false;
  const result = await f.service.commentReview(f.context, 'w', 'p', 'task', 'comment');
  assert.equal(result.task.id, 'task');
  assert.deepEqual(result.comment.author, {
    principalId: 'author',
    name: 'Historical Author',
    kind: 'human',
    active: false,
  });
  assert.deepEqual(result.comment.provenance, {
    actorPrincipalId: 'author',
    executionMode: 'delegated',
    source: 'mcp',
    grantId: 'historical-grant',
  });
  assert.equal(result.comment.capabilities.canEdit, false);
  assert.equal(result.comment.editedAt, new Date(now).toISOString());
});

test('new comments attribute an autonomous subject, never the creator or custodian', async (t) => {
  const f = fixture(t);
  Object.assign(f.actor, {
    actorPrincipalId: 'agent',
    principalKind: 'agent',
    role: 'member',
    executionMode: 'autonomous',
    source: 'mcp',
    grantId: 'grant',
  });
  await f.mutate('add-comment', { expectedVersion: 4, body: 'Agent comment' }, undefined);
  const created = f.effects.comments[0];
  assert.equal(created.authorPrincipalId, 'agent');
  assert.equal(created.creationMode, 'autonomous');
  assert.equal(created.creationGrantId, 'grant');
  assert.equal('custodianPrincipalId' in created, false);
});

test('comment storage failure stops aggregate update and later journal effects', async (t) => {
  const f = fixture(t);
  f.state.commentError = new Error('comment storage unavailable');
  await assert.rejects(f.mutate(), (error) => error === f.state.commentError);
  assert.equal(f.effects.comments.length, 1);
  assert.equal(
    f.effects.tasks.length +
      f.effects.activity.length +
      f.effects.outbox.length +
      f.effects.receipts.length,
    0,
  );
});

test('linking a leaf to a current root succeeds through actual parent policy', async (t) => {
  const f = fixture(t);
  await f.mutate(
    'set-task-parent',
    { expectedVersion: 4, parentTaskId: 'parent', expectedParentVersion: 6 },
    undefined,
  );
  assert.deepEqual(f.effects.tasks, [{ parentTaskId: 'parent' }, { version: { increment: 1 } }]);
});

for (const [name, change, parentId, code, responseCode] of [
  ['self link', () => {}, 'task', 400],
  [
    'unavailable scoped root',
    (f) => {
      f.state.parent = null;
    },
    'parent',
    400,
  ],
  [
    'changed root version',
    (f) => {
      f.state.parent.version = 7;
    },
    'parent',
    409,
    'parent-changed',
  ],
  [
    'root already has children',
    (f) => {
      f.state.children = 1;
    },
    'parent',
    400,
  ],
  [
    'archived old relationship',
    (f) => {
      f.state.task.parentTaskId = 'old-parent';
      f.state.archivedParent = { id: 'old-parent' };
    },
    'parent',
    409,
  ],
])
  test(`single-level relation denies ${name} without changing task identity or parent`, async (t) => {
    const f = fixture(t);
    change(f);
    await assert.rejects(
      f.mutate(
        'set-task-parent',
        { expectedVersion: 4, parentTaskId: parentId, expectedParentVersion: 6 },
        undefined,
      ),
      status(code, responseCode),
    );
    assert.deepEqual(f.effects.tasks, []);
  });

test('checklist capacity and invalid movement anchor deny writes while removal is a retained tombstone', async (t) => {
  const f = fixture(t);
  f.state.checklist = Array.from({ length: 100 }, (_, index) => ({
    id: `item-${index}`,
    position: index + 1,
  }));
  await assert.rejects(
    f.mutate(
      'add-checklist-item',
      { expectedVersion: 4, text: 'Next', beforeItemId: null },
      undefined,
    ),
    status(400),
  );
  await assert.rejects(
    f.mutate('move-checklist-item', { expectedVersion: 4, beforeItemId: 'missing' }, 'item-0'),
    status(400),
  );
  assert.deepEqual(f.effects.checklist, []);
  await f.mutate('remove-checklist-item', { expectedVersion: 4 }, 'item-0');
  assert.deepEqual(f.effects.checklist, [{ id: 'item-0', removedAt: new Date(now) }]);
});

test('checklist page exposes canonical movement anchors and read-only capabilities', async (t) => {
  const f = fixture(t);
  f.state.canWrite = false;
  f.state.checklist = ['a', 'b', 'c'].map((id, index) => ({
    id,
    position: index + 1,
    text: id,
    completed: false,
    version: 1,
  }));
  const page = await f.service.page(f.context, 'w', 'p', 'task', 'checklist');
  assert.equal(page.total, 3);
  assert.equal(page.nextCursor, null);
  assert.deepEqual(page.capabilities, { canCreate: false, canEdit: false });
  assert.equal(page.items[1].moveUpBeforeItemId, 'a');
  assert.equal(page.items[0].moveDownBeforeItemId, 'c');
  assert.equal(
    page.items.every((item) => Object.values(item.capabilities).every((value) => value === false)),
    true,
  );
});
