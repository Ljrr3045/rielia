import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  workspacePages,
  memberPages,
  projectPages,
  taskPages,
  accessPages,
  assigneePages,
  discoveryPages,
  collaborationPages,
  canonicalDiscovery,
  sameDiscoveryRoot,
  admitPage,
} from '../../src/lib/project-task-query-pages.ts';
import { project, taskPage, discovery } from './project-task-fixtures.mjs';

test('page projections retain canonical totals, capabilities, original rows and the final continuation', () => {
  const rows = [{ id: 'a' }, { id: 'b' }];
  const pages = [
    { items: [rows[0]], total: 3, nextCursor: 'a' },
    { items: [rows[1]], total: 3, nextCursor: 'b' },
  ];
  const policy = workspacePages();
  const result = policy.compose(pages);
  assert.deepEqual(result, { items: rows, total: 3, nextCursor: 'b' });
  assert.equal(result.items[0], rows[0]);
  assert.equal(policy.cursor(result), 'b');
  assert.equal(policy.total(result), 3);
  assert.equal(policy.size(result), 2);
  assert.deepEqual(policy.identities(result), ['a', 'b']);
  assert.deepEqual(memberPages().identities({ items: [{ principalId: 'agent' }] }), ['agent']);
  assert.deepEqual(projectPages().identities({ items: [project] }), ['p']);
  assert.deepEqual(accessPages().identities({ items: [{ principalId: 'member' }] }), ['member']);
  assert.deepEqual(assigneePages().identities({ items: [{ principalId: 'candidate' }] }), [
    'candidate',
  ]);
  assert.deepEqual(discoveryPages().identities(discovery), ['t']);
  assert.equal(
    memberPages().binding(pages[0]),
    memberPages().binding(pages[1]),
    'unversioned page binding cannot invent a revision',
  );
  assert.throws(() => admitPage({ items: rows, total: 1 }), { status: 409, code: 'page-changed' });
  admitPage({ items: rows, total: 2 });
});

test('independent protocol metadata changes invalidate task, policy, discovery and collaboration continuation bindings', () => {
  const changed = (policy, first, second) =>
    assert.notEqual(policy.binding(first), policy.binding(second));
  changed(
    projectPages(),
    { ...taskPage, capabilities: { canCreate: true } },
    { ...taskPage, capabilities: { canCreate: false } },
  );
  for (const update of [
    { orderVersion: 2 },
    { total: 2 },
    { columnCounts: { ...taskPage.columnCounts, todo: 2 } },
    { selectedAssignee: { principalId: 'off-page', active: false } },
    { capabilities: { canCreate: false } },
  ])
    changed(taskPages(), taskPage, { ...taskPage, ...update });
  const access = { ...taskPage, workspaceId: 'w', projectId: 'p', projectVersion: 1 };
  changed(accessPages(), access, { ...access, projectVersion: 2 });
  changed(assigneePages(), access, { ...access, projectId: 'other' });
  for (const update of [
    { principalId: 'other' },
    { revision: 'b'.repeat(64) },
    { query: { ...discovery.query, q: 'new' } },
  ])
    changed(discoveryPages(), discovery, { ...discovery, ...update });
  const relations = {
    workspaceId: 'w',
    projectId: 'p',
    taskId: 't',
    revision: 1,
    items: [],
    total: 0,
    nextCursor: null,
    parent: null,
    open: 0,
    archivedOpen: 0,
    capabilities: { canLink: true },
  };
  for (const update of [
    { revision: 2 },
    { open: 1 },
    { archivedOpen: 1 },
    { parent: { id: 'parent' } },
    { capabilities: { canLink: false } },
  ])
    changed(collaborationPages(), relations, { ...relations, ...update });
  assert.deepEqual(collaborationPages().identities({ items: [{ id: 'comment' }] }), ['comment']);
});

test('discovery selectors canonicalize query order while retained roots require unchanged authorized content', () => {
  const first = {
    query: {
      scope: 'search',
      q: ' term ',
      view: 'active',
      filters: { status: 'todo', priority: 'high' },
    },
  };
  const second = {
    query: {
      scope: 'search',
      q: 'term',
      view: 'active',
      filters: { priority: 'high', status: 'todo' },
    },
  };
  assert.deepEqual(canonicalDiscovery(first), canonicalDiscovery(second));
  assert.equal(sameDiscoveryRoot(discovery, globalThis.structuredClone(discovery)), true);
  assert.equal(sameDiscoveryRoot(discovery, { ...discovery, nextCursor: 'new' }), false);
  assert.equal(sameDiscoveryRoot(discovery, { ...discovery, items: [] }), false);
});
