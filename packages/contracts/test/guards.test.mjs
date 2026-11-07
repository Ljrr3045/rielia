import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isHealthResponse,
  isRecord,
  isWorkspaceSummary,
  isWorkspaceMember,
  isWorkspaceInvitation,
  isPage,
  isDomainPerson,
  isProject,
  isTask,
  isTaskPage,
  isTaskFilters,
  isProjectAccessMember,
  projectURL,
  taskURL,
  isCloseWarning,
  isActivityChange,
  isTaskComment,
  isCollaborationPage,
  isCollaborationCommand,
  isTaskDiscoveryQuery,
  parseTaskDiscoveryQuery,
  isTaskDiscoveryPage,
  isTaskInvalidation,
  discoveryIdentifier,
  isTaskSearch,
} from '../dist/index.js';

const date = '2030-01-02T00:00:00.000Z';
const person = { principalId: 'human', name: 'Fixture', kind: 'human', active: true };
const provenance = {
  actorPrincipalId: 'human',
  executionMode: 'human',
  source: 'web',
  grantId: null,
};
const capabilities = { canEdit: true, canArchive: true, canRestore: false };
const common = {
  id: 'project',
  workspaceId: 'workspace',
  version: 1,
  archivedAt: null,
  createdAt: date,
  updatedAt: date,
  creator: person,
  provenance,
  capabilities,
  url: '/projects',
};
const project = {
  ...common,
  name: 'Project',
  key: 'RIE',
  description: '',
  visibility: 'workspace',
  capabilities: {
    ...capabilities,
    canManageAccess: true,
    canChangeVisibility: true,
    canGrantAccess: true,
    canRevokeAccess: true,
  },
};
const taskFixture = {
  ...common,
  id: 'task',
  parentTaskId: null,
  projectId: 'project',
  projectKey: 'RIE',
  number: 1,
  key: 'RIE-1',
  orderVersion: 1,
  title: 'A task',
  description: '',
  type: 'task',
  priority: 'none',
  status: 'todo',
  assigneePrincipalId: null,
  assignee: null,
  dueDate: null,
  projectArchivedAt: null,
};
const basePage = {
  workspaceId: 'workspace',
  projectId: 'project',
  taskId: 'task',
  revision: 1,
  items: [],
  total: 0,
  nextCursor: null,
};
const reference = {
  id: 'related',
  key: 'RIE-2',
  title: 'Related',
  status: 'todo',
  archivedAt: null,
  version: 1,
  url: '/projects',
};
const comment = {
  id: 'comment',
  body: 'A comment',
  version: 1,
  author: person,
  provenance,
  createdAt: date,
  updatedAt: date,
  editedAt: null,
  capabilities: { canEdit: true },
};
const query = { scope: 'mine', q: '', view: 'active', filters: {} };
function rejects(guard, valid, patches, emptyAllowed = false) {
  assert.equal(guard(valid), true, 'Valid public fixture');
  for (const value of [
    null,
    [],
    ...(emptyAllowed ? [] : [{}]),
    'invalid',
    1,
    ...patches.map((patch) => ({ ...valid, ...patch })),
  ])
    assert.equal(guard(value), false, JSON.stringify(value));
}

test(
  'health and workspace guards accept public projections and reject malformed identity, state, dates and pages',
  { timeout: 5000 },
  () => {
    rejects(isHealthResponse, { status: 'ok', service: 'rielia-api' }, [
      { status: 'ready' },
      { service: 'web' },
    ]);
    assert.equal(isRecord({}), true);
    assert.equal(isRecord([]), false);
    assert.equal(isRecord(null), false);
    const workspace = {
      id: 'workspace',
      name: 'Workspace',
      ownerPrincipalId: 'human',
      role: 'owner',
      createdAt: date,
    };
    rejects(isWorkspaceSummary, workspace, [
      { role: ['admin'] },
      { createdAt: 'invalid' },
      { name: '' },
    ]);
    const member = {
      principalId: 'human',
      kind: 'human',
      name: 'Fixture',
      role: 'member',
      state: 'active',
      principalState: 'active',
      custodianPrincipalId: null,
      version: 1,
    };
    rejects(isWorkspaceMember, member, [
      { kind: 'connection' },
      { state: 'expired' },
      { principalState: false },
      { role: 'root' },
      { version: 0 },
      { version: 1.5 },
      { custodianPrincipalId: '' },
    ]);
    assert.ok(
      isWorkspaceMember({
        ...member,
        kind: 'agent',
        custodianPrincipalId: 'custodian',
        state: 'suspended',
      }),
    );
    const invitation = {
      id: 'invite',
      workspaceId: 'workspace',
      recipientEmail: 'fixture@example.test',
      role: 'viewer',
      issuerPrincipalId: 'human',
      createdAt: date,
      expiresAt: date,
      state: 'pending',
    };
    rejects(isWorkspaceInvitation, invitation, [
      { role: 'owner' },
      { state: 'used' },
      { expiresAt: 'invalid' },
      { issuerPrincipalId: '' },
    ]);
    const page = { items: [workspace], total: 1, nextCursor: null };
    rejects((v) => isPage(v, isWorkspaceSummary), page, [
      { total: 0 },
      { total: '1' },
      { items: [member] },
      { nextCursor: '' },
    ]);
  },
);

test(
  'project and task projections reject forged provenance, invalid enums, versions and pagination',
  { timeout: 5000 },
  () => {
    rejects(isDomainPerson, person, [{ kind: 'channel' }, { active: 'true' }]);
    rejects(isProject, project, [
      { visibility: 'public' },
      { version: -1 },
      { createdAt: 'invalid' },
      { provenance: { ...provenance, actorPrincipalId: 'foreign' } },
      { capabilities: { ...capabilities, canManageAccess: 'yes' } },
    ]);
    rejects(isTask, taskFixture, [
      { type: 'sprint' },
      { priority: 'critical' },
      { status: 'blocked' },
      { version: 0 },
      { orderVersion: 1.5 },
      { number: 0 },
      { dueDate: 'next week' },
      { projectArchivedAt: 'invalid' },
      { assignee: {} },
    ]);
    assert.ok(
      isTask({
        ...taskFixture,
        dueDate: '2030-01-03',
        assigneePrincipalId: 'agent',
        assignee: { ...person, principalId: 'agent', kind: 'agent' },
      }),
    );
    const page = {
      items: [taskFixture],
      total: 1,
      nextCursor: null,
      capabilities: { canCreate: true },
      orderVersion: 1,
      columnCounts: { backlog: 0, todo: 1, in_progress: 0, done: 0, canceled: 0 },
      selectedAssignee: null,
    };
    rejects(isTaskPage, page, [
      { total: 2 },
      { orderVersion: 2 },
      { nextCursor: 'bad cursor' },
      { nextCursor: 'x'.repeat(2049) },
      { selectedAssignee: {} },
      { columnCounts: { ...page.columnCounts, todo: -1 } },
      { items: Array.from({ length: 101 }, () => taskFixture) },
    ]);
    rejects(
      isTaskFilters,
      { status: 'todo', priority: 'high', assignee: 'human' },
      [{ status: ['todo'] }, { priority: 1 }, { assignee: 'bad id' }, { sprint: 'sprint' }],
      true,
    );
    assert.equal(isTaskFilters({}), true);
    const access = {
      ...person,
      role: 'member',
      explicitAccess: null,
      implicitAccess: true,
      effectiveAccess: true,
      capabilities: { canGrant: false, canRevoke: false },
    };
    rejects(isProjectAccessMember, access, [
      { role: 'superuser' },
      { explicitAccess: 'pending' },
      { effectiveAccess: 'true' },
      { capabilities: {} },
    ]);
    assert.equal(projectURL('space x', 'p&1'), '/projects?workspace=space%20x&project=p%261');
    assert.equal(taskURL('w', 'p', 't?1'), '/projects?workspace=w&project=p&task=t%3F1');
  },
);

test(
  'collaboration guards retain typed comments, relation/checklist capabilities and close warnings',
  { timeout: 5000 },
  () => {
    rejects(isCloseWarning, { open: 2, archivedOpen: 1, childrenVersion: 3 }, [
      { open: 0 },
      { archivedOpen: 3 },
      { childrenVersion: 0 },
    ]);
    rejects(isActivityChange, { field: 'status', before: 'todo', after: 'done' }, [
      { field: 'title' },
      { before: 'blocked' },
      { secret: 'unexpected' },
    ]);
    assert.ok(isActivityChange({ field: 'dueDate', before: null, after: '2030-01-03' }));
    assert.equal(isActivityChange({ field: 'dueDate', before: null, after: 'invalid' }), false);
    rejects(isTaskComment, comment, [
      { body: 'x'.repeat(10001) },
      { version: 0 },
      { editedAt: 'invalid' },
      { provenance: { ...provenance, source: 'mcp' } },
      { author: { ...person, principalId: 'foreign' } },
    ]);
    assert.ok(
      isTaskComment({
        ...comment,
        provenance: { ...provenance, executionMode: 'delegated', source: 'mcp', grantId: 'grant' },
      }),
    );
    const relations = {
      ...basePage,
      items: [reference],
      total: 1,
      parent: null,
      open: 1,
      archivedOpen: 0,
      capabilities: { canCreate: true, canLink: true, canUnlink: false },
    };
    rejects((v) => isCollaborationPage(v, 'relations'), relations, [
      { parent: {} },
      { archivedOpen: 2 },
      { revision: 0 },
      { nextCursor: 'bad cursor' },
      { items: [{ ...reference, version: 0 }] },
    ]);
    const candidates = {
      ...basePage,
      items: [reference],
      total: 1,
      capabilities: { canSelect: true },
    };
    rejects((v) => isCollaborationPage(v, 'parent-candidates'), candidates, [
      { capabilities: {} },
      { total: 0 },
    ]);
    const item = {
      id: 'item',
      text: 'Check this',
      completed: false,
      position: 1,
      version: 1,
      moveUpBeforeItemId: null,
      moveDownBeforeItemId: 'next',
      capabilities: { canEdit: true, canRemove: true, canMoveUp: false, canMoveDown: true },
    };
    const checklist = {
      ...basePage,
      items: [item],
      total: 1,
      capabilities: { canCreate: true, canEdit: true },
    };
    rejects((v) => isCollaborationPage(v, 'checklist'), checklist, [
      { items: [{ ...item, completed: 'yes' }] },
      { items: [{ ...item, text: 'x'.repeat(501) }] },
      { items: [{ ...item, position: 0 }] },
    ]);
    rejects(
      (v) => isCollaborationPage(v, 'comments'),
      { ...basePage, items: [comment], total: 1, capabilities: { canCreate: true } },
      [{ items: [{ ...comment, version: 0 }] }],
    );
    assert.equal(isCollaborationCommand({ type: 'add-comment' }), true);
    assert.equal(isCollaborationCommand({ type: 'create-sprint' }), false);
    assert.equal(isCollaborationCommand(null), false);
  },
);

test(
  'history validates system and human authors and bounded public change records',
  { timeout: 5000 },
  () => {
    const activity = {
      id: 'activity',
      action: 'edit-task',
      fields: ['status'],
      actor: person,
      provenance,
      entityVersion: 2,
      createdAt: date,
      changes: [{ field: 'status', before: 'todo', after: 'done' }],
    };
    const history = { ...basePage, items: [activity], total: 1 };
    rejects((v) => isCollaborationPage(v, 'history'), history, [
      { items: [{ ...activity, action: 'drop-database' }] },
      { items: [{ ...activity, fields: ['secret'] }] },
      { items: [{ ...activity, entityVersion: 0 }] },
      { items: [{ ...activity, changes: Array(5).fill(activity.changes[0]) }] },
    ]);
    assert.ok(
      isCollaborationPage(
        {
          ...history,
          items: [
            {
              ...activity,
              actor: { ...person, principalId: 'system', kind: 'system' },
              provenance: {
                actorPrincipalId: 'system',
                executionMode: 'system',
                source: 'internal',
                grantId: null,
              },
            },
          ],
        },
        'history',
      ),
    );
  },
);

test(
  'discovery parsing preserves allowed filters and rejects coercion, controls and unsupported query keys',
  { timeout: 5000 },
  () => {
    assert.deepEqual(parseTaskDiscoveryQuery({}), {
      scope: 'search',
      q: '',
      view: 'active',
      filters: {},
    });
    assert.deepEqual(
      parseTaskDiscoveryQuery({
        scope: 'search',
        q: 'literal%',
        project: 'project',
        status: 'todo',
        priority: 'high',
        assignee: 'human',
        cursor: 'opaque',
      }),
      {
        scope: 'search',
        q: 'literal%',
        view: 'active',
        filters: { status: 'todo', assignee: 'human', priority: 'high' },
        projectId: 'project',
      },
    );
    for (const params of [
      { scope: ['mine'] },
      { q: ['title'] },
      { view: 'all' },
      { limit: '999' },
      { sprint: 'sprint' },
      { scope: 'mine', assignee: 'other' },
      { project: 'bad id' },
      { q: '\nprivate' },
      { q: 'x'.repeat(101) },
    ])
      assert.equal(parseTaskDiscoveryQuery(params), null);
    rejects(isTaskDiscoveryQuery, query, [
      { scope: ['mine'] },
      { filters: { assignee: 'other' } },
      { filters: { status: ['todo'] } },
      { unknown: true },
    ]);
    assert.ok(discoveryIdentifier('a_b-1'));
    assert.equal(discoveryIdentifier('x'.repeat(129)), false);
    assert.ok(isTaskSearch('literal %_'));
    assert.equal(isTaskSearch('\u007f'), false);
  },
);

test(
  'discovery pages and invalidations reject foreign scope, duplicate rows and forged payload fields',
  { timeout: 5000 },
  () => {
    const item = { ...taskFixture };
    delete item.description;
    const discovery = {
      workspaceId: 'workspace',
      query,
      principalId: 'human',
      revision: 'a'.repeat(64),
      items: [{ ...item, projectName: 'Project' }],
      total: 1,
      nextCursor: null,
    };
    rejects(isTaskDiscoveryPage, discovery, [
      { workspaceId: 'foreign' },
      { revision: 'invalid' },
      { total: 0 },
      { items: [discovery.items[0], discovery.items[0]], total: 2 },
      { items: [{ ...discovery.items[0], description: 'private' }] },
      { nextCursor: ['bad'] },
    ]);
    for (const valid of [
      { type: 'reset' },
      { type: 'heartbeat' },
      { type: 'denied', reason: 'forbidden' },
      { type: 'denied', reason: 'signed-out' },
      { type: 'invalidate', entity: 'task', id: 'task', projectId: 'project', version: 2 },
      { type: 'invalidate', entity: 'project', id: 'project', projectId: 'project', version: 1 },
    ])
      assert.ok(isTaskInvalidation(valid));
    for (const invalid of [
      null,
      [],
      { type: ['reset'] },
      { type: 'reset', title: 'private' },
      { type: 'denied', reason: ['forbidden'] },
      { type: 'invalidate', entity: ['task'], id: 'task', projectId: 'project', version: 1 },
      { type: 'invalidate', entity: 'task', id: 'task', projectId: 'project', version: 0 },
    ])
      assert.equal(isTaskInvalidation(invalid), false);
  },
);

test('T10 strict discovery/invalidation guards reject array/coercion and forged scalar values', () => {
  const query = { scope: 'mine', q: '', view: 'active', filters: {} };
  assert.ok(isTaskDiscoveryQuery(query));
  for (const patch of [
    { scope: ['mine'] },
    { view: ['active'] },
    { q: ['title'] },
    { filters: { status: ['todo'] } },
    { filters: { assignee: 'other' } },
  ])
    assert.equal(isTaskDiscoveryQuery({ ...query, ...patch }), false);
  assert.equal(parseTaskDiscoveryQuery({ scope: ['mine'] }), null);
  assert.equal(parseTaskDiscoveryQuery({ q: 'x', limit: '999' }), null);
  assert.equal(isTaskInvalidation({ type: ['reset'] }), false);
  assert.equal(isTaskInvalidation({ type: 'denied', reason: ['forbidden'] }), false);
  assert.equal(
    isTaskInvalidation({
      type: 'invalidate',
      entity: ['task'],
      id: 't',
      projectId: 'p',
      version: 1,
    }),
    false,
  );
});
