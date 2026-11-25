import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as c from '../dist/index.js';

const date = '2030-01-02T00:00:00.000Z';
const person = { principalId: 'author', name: 'Historical author', kind: 'human', active: false };
const provenance = {
  actorPrincipalId: 'author',
  executionMode: 'human',
  source: 'web',
  grantId: null,
};
const comment = {
  id: 'comment',
  body: '',
  version: 1,
  author: person,
  provenance,
  createdAt: date,
  updatedAt: date,
  editedAt: null,
  capabilities: { canEdit: false },
};
const reference = {
  id: 'related',
  key: '',
  title: '',
  status: 'todo',
  archivedAt: null,
  version: 1,
  url: '',
};
const item = {
  id: 'item',
  text: '',
  completed: false,
  position: 1,
  version: 1,
  moveUpBeforeItemId: null,
  moveDownBeforeItemId: 'outside-page',
  capabilities: { canEdit: true, canRemove: false, canMoveUp: false, canMoveDown: true },
};
const activity = {
  id: 'event',
  action: 'edit-task',
  fields: ['title'],
  actor: person,
  provenance,
  entityVersion: 1,
  createdAt: date,
  changes: [],
};
const envelope = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  revision: 1,
  total: 0,
  nextCursor: null,
};
const pages = {
  relations: {
    ...envelope,
    items: [reference],
    total: 1,
    parent: reference,
    open: 1,
    archivedOpen: 1,
    capabilities: { canCreate: false, canLink: true, canUnlink: false },
  },
  'parent-candidates': {
    ...envelope,
    items: [reference],
    total: 1,
    capabilities: { canSelect: true },
  },
  checklist: {
    ...envelope,
    items: [item],
    total: 1,
    capabilities: { canCreate: true, canEdit: true },
  },
  comments: { ...envelope, items: [comment], total: 1, capabilities: { canCreate: false } },
  history: { ...envelope, items: [activity], total: 1 },
};
const bodyCases = {
  'set-task-parent': { expectedVersion: 1, parentTaskId: 'parent', expectedParentVersion: 2 },
  'add-checklist-item': { expectedVersion: 1, text: '  Check this  ', beforeItemId: null },
  'edit-checklist-item': { expectedVersion: 1, completed: false },
  'move-checklist-item': { expectedVersion: 1, beforeItemId: 'next' },
  'remove-checklist-item': { expectedVersion: 1 },
  'add-comment': { expectedVersion: 1, body: ' \nMarkdown\n ' },
  'edit-comment': { expectedVersion: 1, expectedCommentVersion: 2, body: 'Edited' },
};

test('collaboration discriminators select partial commands while strict bodies retain exact alternatives', () => {
  for (const [action, body] of Object.entries(bodyCases)) {
    assert.equal(c.isCollaborationCommand({ type: action }), true);
    const schema = c.collaborationInputSchemas[action];
    assert.equal(schema.safeParse(body).success, true, action);
    assert.equal(schema.safeParse({ ...body, authorPrincipalId: 'forged' }).success, false, action);
    const target = { type: action, workspaceId: 'w', projectId: 'p', taskId: 't' };
    const selector =
      action === 'edit-comment'
        ? { commentId: 'comment' }
        : action.includes('checklist') && !action.startsWith('add-')
          ? { itemId: 'item' }
          : {};
    assert.equal(
      c.taskCollaborationCommandSchema.safeParse({ ...target, ...body, ...selector }).success,
      true,
      action,
    );
    assert.equal(
      c.taskCollaborationCommandSchema.safeParse({
        ...target,
        ...body,
        ...selector,
        taskId: 'bad id',
      }).success,
      false,
    );
  }
  assert.equal(c.isCollaborationCommand({ type: ['add-comment'] }), false);
  assert.equal(c.isCollaborationCommand(Object.create({ type: 'add-comment' })), true);
  assert.equal(c.isCollaborationCommand(null), false);
  assert.equal(c.isCollaborationCommand({ type: 'create-task' }), false);
  assert.equal(c.collaborationActionSchema.safeParse('history').success, false);
});

test('request normalization preserves pretrim UTF-16 bounds, exact presence and nullable correlations', () => {
  assert.equal(c.checklistTextInputSchema.parse('  Task  '), 'Task');
  assert.equal(c.commentBodyInputSchema.parse(' \nTask\n '), ' \nTask\n ');
  assert.equal(c.checklistTextInputSchema.safeParse('😀'.repeat(250)).success, true);
  assert.equal(c.checklistTextInputSchema.safeParse('😀'.repeat(250) + ' ').success, false);
  assert.equal(c.commentBodyInputSchema.safeParse('😀'.repeat(5000)).success, true);
  for (const text of ['', ' ', 'a\nb', 'a\rb', 'a\tb', 'a\0b'])
    assert.equal(c.checklistTextInputSchema.safeParse(text).success, false);
  for (const body of ['\n ', '\0', '😀'.repeat(5000) + 'x'])
    assert.equal(c.commentBodyInputSchema.safeParse(body).success, false);
  for (const value of [
    { expectedVersion: 1, parentTaskId: null, expectedParentVersion: undefined },
    { expectedVersion: 1, parentTaskId: null, expectedParentVersion: 2 },
    { expectedVersion: 1, parentTaskId: 'parent' },
  ])
    assert.equal(c.setTaskParentInputSchema.safeParse(value).success, false);
  assert.equal(
    c.setTaskParentInputSchema.safeParse({ expectedVersion: 1, parentTaskId: null }).success,
    true,
  );
  for (const patch of [{}, { text: undefined }, { completed: undefined }, { completed: null }])
    assert.equal(
      c.editChecklistItemInputSchema.safeParse({ expectedVersion: 1, ...patch }).success,
      false,
    );
  assert.equal(
    c.editChecklistItemInputSchema.safeParse({ expectedVersion: 1, text: ' x ', completed: false })
      .success,
    true,
  );
  assert.equal(
    c.addChecklistItemInputSchema.safeParse({ expectedVersion: 1, text: 'x' }).success,
    false,
  );
  assert.equal(
    c.removeChecklistItemInputSchema.safeParse({ expectedVersion: Number.MAX_SAFE_INTEGER + 1 })
      .success,
    false,
  );
});

test('historical comments preserve human and Agent authors and primitive correlated provenance', () => {
  for (const kind of ['human', 'agent'])
    for (const [mode, source, grantId] of [
      ['human', 'web', null],
      ['delegated', 'mcp', 'grant'],
      ['autonomous', 'mcp', 'grant'],
    ]) {
      const value = {
        ...comment,
        author: { ...person, kind },
        provenance: { ...provenance, executionMode: mode, source, grantId },
      };
      assert.equal(c.isTaskComment(value), true);
      assert.equal(
        c.isTaskComment({
          ...value,
          provenance: { ...value.provenance, actorPrincipalId: 'other' },
        }),
        false,
      );
    }
  for (const mode of [
    ['delegated'],
    ['autonomous'],
    new String('delegated'),
    { toString: () => 'autonomous' },
  ])
    assert.equal(
      c.isTaskComment({
        ...comment,
        provenance: { ...provenance, executionMode: mode, source: 'mcp', grantId: 'grant' },
      }),
      false,
    );
  assert.equal(c.isTaskComment({ ...comment, author: { ...person, kind: 'system' } }), false);
  assert.equal(c.isTaskComment({ ...comment, body: ' \0\n', editedAt: '2030-01-01' }), true);
  assert.equal(c.isTaskComment({ ...comment, body: '😀'.repeat(5000) + 'x' }), false);
  assert.equal(
    c.isTaskComment({
      ...comment,
      provenance: { ...provenance, executionMode: 'delegated', source: 'web', grantId: 'grant' },
    }),
    false,
  );
  assert.equal(
    c.isTaskComment({ ...comment, provenance: { ...provenance, grantId: 'grant' } }),
    false,
  );
  assert.equal(
    c.isTaskComment({
      ...comment,
      provenance: { ...provenance, executionMode: 'autonomous', source: 'mcp', grantId: null },
    }),
    false,
  );
});

test('all page projections preserve broad snapshots, duplicates and extras while bounding envelopes', () => {
  for (const [collection, page] of Object.entries(pages)) {
    const value = {
      ...page,
      items: [...page.items, ...page.items],
      total: 10,
      extra: { keep: true },
      nextCursor: 'opaque_1',
    };
    assert.equal(c.isCollaborationPage(value, collection), true, collection);
    assert.equal(
      c.isCollaborationPage({ ...value, items: Array(1) }, collection),
      false,
      collection,
    );
    assert.equal(c.isCollaborationPage({ ...value, total: 1 }, collection), false, collection);
    assert.equal(
      c.isCollaborationPage(
        { ...value, items: Array(101).fill(page.items[0]), total: 101 },
        collection,
      ),
      false,
    );
    assert.equal(
      c.isCollaborationPage({ ...value, revision: Number.MAX_SAFE_INTEGER + 1 }, collection),
      false,
    );
    assert.equal(
      c.isCollaborationPage({ ...value, nextCursor: 'x'.repeat(2049) }, collection),
      false,
    );
    assert.equal(c.isCollaborationPage({ ...value, nextCursor: undefined }, collection), false);
    assert.equal(c.isCollaborationPage(Object.create(value), collection), true, collection);
    const inheritedIndex = Array(1);
    Object.setPrototypeOf(
      inheritedIndex,
      Object.assign(Object.create(Array.prototype), { 0: page.items[0] }),
    );
    assert.equal(c.isCollaborationPage({ ...value, items: inheritedIndex }, collection), true);
  }
  assert.equal(c.isCollaborationPage(pages.history, 'typed-runtime-fallback'), true);
  assert.equal(c.isCollaborationPage({ ...pages.relations, archivedOpen: 2 }, 'relations'), false);
  assert.equal(
    c.isCollaborationPage({ ...pages.relations, open: 2, archivedOpen: 0 }, 'relations'),
    false,
  );
  assert.equal(
    c.isCollaborationPage(
      {
        ...pages.checklist,
        items: [{ ...item, capabilities: { ...item.capabilities, canMoveDown: null } }],
      },
      'checklist',
    ),
    false,
  );
  assert.equal(
    c.isCollaborationPage(
      { ...pages.checklist, items: [{ ...item, moveUpBeforeItemId: 'bad id' }] },
      'checklist',
    ),
    false,
  );
});

test('safe activity changes retain exact own keys, date format and historical actor/action snapshots', () => {
  for (const value of [
    { field: 'status', before: 'backlog', after: 'done' },
    { field: 'type', before: 'task', after: 'bug' },
    { field: 'priority', before: 'none', after: 'urgent' },
    { field: 'dueDate', before: null, after: '2030-99-99' },
  ]) {
    assert.equal(c.isActivityChange(value), true);
    assert.equal(c.isActivityChange(Object.create({ ...value, private: 'inherited' })), true);
    assert.equal(c.isActivityChange({ ...value, private: 'own' }), false);
    assert.equal(c.isActivityChange({ ...value, before: 'wrong-category' }), false);
  }
  const system = {
    ...activity,
    actor: { ...person, principalId: 'system', kind: 'system' },
    provenance: {
      actorPrincipalId: 'system',
      executionMode: 'system',
      source: 'internal',
      grantId: null,
    },
  };
  assert.equal(c.taskActivitySchema.safeParse(system).success, true);
  assert.equal(
    c.taskActivitySchema.safeParse({
      ...system,
      provenance: { ...system.provenance, grantId: 'grant' },
    }).success,
    false,
  );
  assert.equal(
    c.taskActivitySchema.safeParse({ ...activity, fields: ['title', 'title'] }).success,
    true,
  );
  for (const patch of [
    { action: ['edit-task'] },
    { fields: Array(1) },
    { changes: Array(1) },
    { changes: Array(5).fill({ field: 'dueDate', before: null, after: null }) },
    { provenance: { ...provenance, actorPrincipalId: 'other' } },
  ])
    assert.equal(
      c.isCollaborationPage({ ...pages.history, items: [{ ...activity, ...patch }] }, 'history'),
      false,
    );
  assert.equal(
    c.isCloseWarning({ open: 1, archivedOpen: 0, childrenVersion: 1, extra: true }),
    true,
  );
  assert.equal(c.isCloseWarning({ open: 0, archivedOpen: 0, childrenVersion: 1 }), false);
});

test('collaboration HTTP query validates cursor and legacy inherited selectors without decoding', () => {
  for (const value of [
    {},
    { cursor: undefined },
    { cursor: 'x'.repeat(2048) },
    Object.create({ view: 'archived', destination: 'target', status: 'todo', cursor: 'anchor' }),
    [],
    Object.assign(() => {}, { cursor: 'callable-query' }),
  ])
    assert.equal(c.collaborationHttpQuerySchema.safeParse(value).success, true);
  for (const value of [
    { view: 'active' },
    { cursor: null },
    { cursor: ['anchor'] },
    { cursor: 'bad cursor' },
    { cursor: 'x'.repeat(2049) },
    Object.create({ view: ['active'] }),
    Object.create({ destination: 'bad id' }),
    Object.create({ status: undefined }),
    null,
    undefined,
    0,
    'query',
  ])
    assert.equal(c.collaborationHttpQuerySchema.safeParse(value).success, false);
  const fields = { title: 'draft', parentTaskId: 'parent', expectedParentVersion: 1 };
  assert.equal(c.createTaskFieldsSchema.safeParse(fields).success, true);
  assert.equal(c.createTaskFieldsSchema.safeParse({ ...fields, type: undefined }).success, false);
  assert.equal(c.collaborationCollectionSchema.safeParse('history').success, true);
});

test('G04 validation ignores extra getters and strips only its parse copy while retaining original objects', () => {
  let reads = 0;
  const ignored = () => {
    reads++;
    throw new Error('Ignored getter must not execute');
  };
  const extra = { enumerable: true, get: ignored };
  const warning = Object.defineProperty(
    { open: 1, archivedOpen: 0, childrenVersion: 1 },
    'extra',
    extra,
  );
  assert.equal(c.isCloseWarning(warning), true);
  const warningCopy = c.closeWarningSchema.parse(warning);
  assert.equal('extra' in warningCopy, false);
  assert.equal(Object.getOwnPropertyDescriptor(warning, 'extra').get, ignored);
  const inherited = Object.create(
    Object.defineProperty({ open: 1, archivedOpen: 0, childrenVersion: 1 }, 'extra', extra),
  );
  assert.equal(c.isCloseWarning(inherited), true);
  Object.defineProperty(inherited, 'childrenVersion', { value: 2, enumerable: false });
  assert.equal(c.closeWarningSchema.parse(inherited).childrenVersion, 2);
  const historyProvenance = Object.defineProperty({ ...provenance }, 'extra', extra);
  const value = Object.defineProperty(
    { ...comment, provenance: historyProvenance },
    'extra',
    extra,
  );
  Object.defineProperty(value, 'body', { value: 'hidden known field', enumerable: false });
  assert.equal(c.isTaskComment(value), true);
  const copy = c.taskCommentSchema.parse(value);
  assert.equal(copy.body, 'hidden known field');
  assert.equal('extra' in copy, false);
  assert.equal('extra' in copy.provenance, false);
  assert.equal(value.provenance, historyProvenance);
  assert.equal(Object.getOwnPropertyDescriptor(value.provenance, 'extra').get, ignored);
  assert.equal(
    c.isTaskComment({ ...comment, provenance: { ...provenance, actorPrincipalId: 'foreign' } }),
    false,
  );
  const ordinary = { ...comment, extra: { keep: true } };
  assert.equal(c.isTaskComment(ordinary), true);
  assert.equal(ordinary.extra.keep, true);
  assert.equal('extra' in c.taskCommentSchema.parse(ordinary), false);
  assert.equal(reads, 0);
});

test('comment review validates both canonical projections while leaving requested scope correlation to transport', () => {
  const creator = { ...person, principalId: 'creator', kind: 'agent' };
  const task = {
    ...reference,
    id: 'task',
    workspaceId: 'w',
    projectId: 'p',
    projectKey: 'RIE',
    number: 1,
    orderVersion: 1,
    title: 'Task',
    description: '',
    type: 'task',
    priority: 'none',
    status: 'todo',
    parentTaskId: null,
    assigneePrincipalId: null,
    assignee: null,
    dueDate: null,
    projectArchivedAt: null,
    createdAt: date,
    updatedAt: date,
    creator,
    // G02 accepts this broad historical scalar combination; G04 does not add
    // its comment-provenance restrictions to the reused Task projection.
    provenance: {
      actorPrincipalId: 'creator',
      executionMode: 'human',
      source: 'mcp',
      grantId: null,
    },
    capabilities: { canEdit: true, canArchive: false, canRestore: true },
  };
  const review = { task, comment, extra: { keep: true } };
  assert.equal(c.isTaskCommentReview(review), true);
  assert.equal(review.task, task);
  assert.equal(review.comment, comment);
  assert.equal(review.extra.keep, true);
  assert.equal('extra' in c.taskCommentReviewSchema.parse(review), false);
  assert.equal(
    c.isTaskCommentReview({
      ...review,
      task: { ...task, workspaceId: 'another' },
      comment: { ...comment, id: 'another-comment' },
    }),
    true,
  );
  assert.equal(
    c.isTaskCommentReview({
      ...review,
      task: { ...task, provenance: { ...task.provenance, actorPrincipalId: 'forged' } },
    }),
    false,
  );
  assert.equal(
    c.isTaskCommentReview({
      ...review,
      comment: { ...comment, provenance: { ...provenance, actorPrincipalId: 'creator' } },
    }),
    false,
  );
  assert.equal(c.isTaskCommentReview({ ...review, comment: null }), false);
});
