import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as c from '../dist/index.js';

const query = { scope: 'search', q: '', view: 'active', filters: {} };
const item = {
  id: 'task',
  workspaceId: 'w',
  projectId: 'p',
  projectName: '',
  projectKey: '',
  version: 1,
  number: 1,
  key: '',
  orderVersion: 1,
  title: '',
  type: 'task',
  priority: 'none',
  status: 'todo',
  parentTaskId: null,
  assigneePrincipalId: null,
  assignee: null,
  dueDate: '0000-99-99',
  archivedAt: null,
  projectArchivedAt: null,
  createdAt: '2030-01-02',
  updatedAt: '2029-01-01',
  url: '',
  creator: { principalId: '', name: '', kind: 'human', active: false },
  provenance: { actorPrincipalId: '', executionMode: 'delegated', source: 'web', grantId: null },
  capabilities: { canEdit: false, canArchive: false, canRestore: false },
};
const page = {
  workspaceId: 'w',
  principalId: 'human',
  query,
  revision: 'a'.repeat(64),
  items: [item],
  total: 1,
  nextCursor: null,
};
const event = { type: 'invalidate', entity: 'task', id: 't', projectId: 'p', version: 1 };
const withHidden = (value, key, field) =>
  Object.defineProperty(value, key, { value: field, enumerable: false });

test('discovery raw parser retains nullish defaults, presence and ignored cursor independently of HTTP', () => {
  for (const value of [undefined, null]) {
    assert.deepEqual(c.parseTaskDiscoveryQuery({ scope: value, q: value, view: value }), query);
    assert.equal(
      c.taskDiscoveryHttpQuerySchema.safeParse({ view: value }).success,
      value === undefined,
    );
    assert.equal(
      c.taskDiscoveryHttpQuerySchema.safeParse({ cursor: value }).success,
      value === undefined,
    );
  }
  for (const cursor of [undefined, null, [], {}, 0, '', 'bad cursor', 'x'.repeat(2049)]) {
    assert.deepEqual(c.parseTaskDiscoveryQuery({ cursor }), query);
    assert.equal(
      c.taskDiscoveryHttpQuerySchema.safeParse({ cursor }).success,
      cursor === undefined,
    );
  }
  for (const cursor of ['valid_1-Ab', 'x'.repeat(2048)])
    assert.ok(c.taskDiscoveryHttpQuerySchema.safeParse({ cursor }).success);
  for (const value of [undefined, null, '', [], {}, 1]) {
    assert.equal(c.parseTaskDiscoveryQuery({ project: value }), null);
    for (const key of ['status', 'priority', 'assignee'])
      assert.equal(c.parseTaskDiscoveryQuery({ [key]: value }), null);
  }
  for (const value of [null, undefined, [], [1], false, 0, '', 'scope', () => {}])
    assert.equal(c.parseTaskDiscoveryQuery(value), null);
  assert.deepEqual(c.parseTaskDiscoveryQuery(Object.create(null)), query);
  assert.deepEqual(c.parseTaskDiscoveryQuery({ q: '  literal%_  ' }), {
    ...query,
    q: '  literal%_  ',
  });
  assert.equal(c.parseTaskDiscoveryQuery({ ignored: undefined }), null);
});

test('discovery search preserves exact UTF16 limits and C0/DEL policy without coercion', () => {
  for (const value of [
    '',
    ' '.repeat(100),
    '😀'.repeat(50),
    '\ud800',
    '\u0080\u009f',
    'literal %_',
  ])
    assert.ok(c.isTaskSearch(value));
  for (const value of ['😀'.repeat(50) + 'a', 'x'.repeat(101), null, [], { toString: () => '' }])
    assert.equal(c.isTaskSearch(value), false);
  for (const point of [...Array(32).keys(), 127])
    assert.equal(c.isTaskSearch(`a${String.fromCharCode(point)}b`), false);
  for (const value of ['', 'bad id', 'x'.repeat(129), [], null])
    assert.equal(c.discoveryIdentifier(value), false);
  assert.ok(c.discoveryIdentifier('x'.repeat(128)));
});

test('structured query keeps strict fields, mine-assignee prohibition and original property-presence semantics', () => {
  for (const patch of [
    { scope: ['search'] },
    { scope: 'project' },
    { q: undefined },
    { view: ['active'] },
    { filters: null },
    { projectId: undefined },
    { projectId: null },
    { cursor: 'ignored-only-in-raw' },
    { extra: undefined },
  ])
    assert.equal(c.isTaskDiscoveryQuery({ ...query, ...patch }), false);
  assert.ok(
    c.isTaskDiscoveryQuery({
      ...query,
      projectId: 'p',
      filters: { status: 'todo', priority: 'high', assignee: 'unassigned' },
    }),
  );
  for (const filters of [
    { assignee: 'other' },
    { assignee: undefined },
    Object.create({ assignee: 'other' }),
  ])
    assert.equal(c.isTaskDiscoveryQuery({ ...query, scope: 'mine', filters }), false);
  assert.equal(c.isTaskDiscoveryQuery({ scope: 'mine', q: '', view: 'active', filters: 1 }), false);
  const inherited = Object.assign(Object.create({ ...query, irrelevant: true }), {});
  assert.ok(c.isTaskDiscoveryQuery(inherited));
  assert.deepEqual(
    c.parseTaskDiscoveryQuery(
      Object.create({
        scope: 'mine',
        q: ' Title ',
        project: 'p',
        status: 'todo',
        irrelevant: true,
      }),
    ),
    { scope: 'mine', q: ' Title ', view: 'active', projectId: 'p', filters: { status: 'todo' } },
  );
  assert.ok(c.isTaskDiscoveryQuery(withHidden({ ...query }, 'ignored', true)));
  assert.equal(c.isTaskDiscoveryQuery(Object.create({ ...query, projectId: undefined })), false);
  assert.equal(c.parseTaskDiscoveryQuery(Object.create({ project: undefined })), null);
});

test('discovery projection shares Task constraints and creator correlation without a description field', () => {
  assert.ok(c.isTask({ ...item, description: '' }));
  assert.ok(c.taskDiscoveryItemSchema.safeParse(item).success);
  assert.ok(c.isTaskDiscoveryPage(page));
  for (const patch of [
    { creator: { ...item.creator, kind: ['human'] } },
    { provenance: { ...item.provenance, executionMode: ['human'] } },
    { provenance: { ...item.provenance, source: ['web'] } },
    { provenance: { ...item.provenance, actorPrincipalId: 'different' } },
    { version: Number.MAX_SAFE_INTEGER + 1 },
    { orderVersion: 0 },
    { projectName: [] },
  ])
    assert.equal(c.isTaskDiscoveryPage({ ...page, items: [{ ...item, ...patch }] }), false);
  for (const description of [undefined, null, '', 'private'])
    assert.equal(c.isTaskDiscoveryPage({ ...page, items: [{ ...item, description }] }), false);
  for (const description of [undefined, 'private']) {
    const row = Object.assign(Object.create({ description }), item);
    assert.equal(c.isTaskDiscoveryPage({ ...page, items: [row] }), false);
  }
  const hiddenDescription = withHidden({ ...item }, 'description', undefined);
  assert.equal(c.isTaskDiscoveryPage({ ...page, items: [hiddenDescription] }), false);
  const inheritedName = { ...item };
  delete inheritedName.projectName;
  Object.setPrototypeOf(inheritedName, { projectName: 'Inherited name' });
  assert.ok(c.isTaskDiscoveryPage({ ...page, items: [inheritedName] }));
  for (const key of ['title', 'creator', 'workspaceId', 'provenance']) {
    const inherited = { ...item };
    delete inherited[key];
    Object.setPrototypeOf(inherited, { [key]: item[key] });
    assert.equal(c.isTaskDiscoveryPage({ ...page, items: [inherited] }), false);
    assert.equal(
      c.isTaskDiscoveryPage({ ...page, items: [withHidden({ ...item }, key, item[key])] }),
      false,
    );
  }
  const extra = {
    ...page,
    extra: undefined,
    items: [{ ...item, extra: undefined, creator: { ...item.creator, extra: 1 } }],
  };
  assert.ok(c.isTaskDiscoveryPage(extra));
  assert.ok('extra' in extra.items[0]);
});

test('archived task metadata stays compatible across public detail, discovery and related-task projections', () => {
  const expected = {
    id: 'archived-task',
    title: 'Archived related task',
    key: 'RIE-17',
    url: '/projects?workspace=w&project=p&task=archived-task',
    version: 7,
    status: 'todo',
    archivedAt: '2030-01-02T12:34:56.000Z',
  };
  const detail = { ...item, ...expected, description: 'Available only in detail.' };
  const discovery = { ...item, ...expected };
  const reference = {
    id: 'archived-task',
    title: 'Archived related task',
    key: 'RIE-17',
    url: '/projects?workspace=w&project=p&task=archived-task',
    version: 7,
    status: 'todo',
    archivedAt: '2030-01-02T12:34:56.000Z',
  };
  const collection = {
    workspaceId: 'w',
    projectId: 'p',
    taskId: 'current-task',
    revision: 2,
    items: [reference],
    total: 1,
    nextCursor: null,
  };
  const relations = {
    ...collection,
    parent: null,
    open: 1,
    archivedOpen: 1,
    capabilities: { canCreate: false, canLink: true, canUnlink: true },
  };
  const candidates = { ...collection, capabilities: { canSelect: true } };
  assert.ok(c.isTask(detail));
  assert.ok(c.taskDiscoveryItemSchema.safeParse(discovery).success);
  assert.ok(c.isTaskDiscoveryPage({ ...page, items: [discovery] }));
  assert.ok(c.isCollaborationPage(relations, 'relations'));
  assert.ok(c.isCollaborationPage(candidates, 'parent-candidates'));
  for (const projection of [detail, discovery, reference])
    assert.deepEqual(
      Object.fromEntries(Object.keys(expected).map((key) => [key, projection[key]])),
      expected,
    );
  assert.equal('description' in discovery, false);
  assert.equal('description' in reference, false);
  assert.equal(c.isTask({ ...detail, archivedAt: 'invalid date' }), false);
  assert.equal(
    c.taskDiscoveryItemSchema.safeParse({ ...discovery, archivedAt: 'invalid date' }).success,
    false,
  );
  assert.equal(
    c.isTaskDiscoveryPage({ ...page, items: [{ ...discovery, archivedAt: 'invalid date' }] }),
    false,
  );
  for (const [value, kind] of [
    [relations, 'relations'],
    [candidates, 'parent-candidates'],
  ])
    assert.equal(
      c.isCollaborationPage(
        { ...value, items: [{ ...reference, archivedAt: 'invalid date' }] },
        kind,
      ),
      false,
    );
});

test('discovery page bounds retain uniqueness, workspace, safe totals and cursor policy', () => {
  const hundred = Array.from({ length: 100 }, (_, n) => ({ ...item, id: `t-${n}` }));
  assert.ok(
    c.isTaskDiscoveryPage({ ...page, items: hundred, total: 100, nextCursor: 'a'.repeat(2048) }),
  );
  assert.ok(c.isTaskDiscoveryPage({ ...page, items: [], total: 0, nextCursor: 'still-allowed' }));
  for (const patch of [
    { items: new Array(1) },
    { items: new Array(1).concat(item), total: 2 },
    { items: [null] },
    { items: [undefined] },
    { items: [...hundred, { ...item, id: '101' }], total: 101 },
    { items: [item, item], total: 2 },
    { items: [{ ...item, workspaceId: 'other' }] },
    { workspaceId: 'bad id' },
    { principalId: [] },
    { revision: 'A'.repeat(64) },
    { total: 0 },
    { total: 1.5 },
    { total: Number.MAX_SAFE_INTEGER + 1 },
    { nextCursor: '' },
    { nextCursor: 'bad cursor' },
    { nextCursor: 'a'.repeat(2049) },
  ])
    assert.equal(c.isTaskDiscoveryPage({ ...page, ...patch }), false);
});

test('event alternatives require exact own enumerable protocol fields while ignoring symbols and inherited extras', () => {
  for (const value of [
    { type: 'reset' },
    { type: 'heartbeat' },
    { type: 'denied', reason: 'signed-out' },
    { type: 'denied', reason: 'forbidden' },
    event,
    { ...event, entity: 'project', version: Number.MAX_SAFE_INTEGER },
  ]) {
    assert.ok(c.isTaskInvalidation(value));
    assert.ok(c.isTaskInvalidation({ ...value, [Symbol('legacy ignored')]: 'extra' }));
    assert.ok(c.isTaskInvalidation(Object.assign(Object.create({ irrelevant: true }), value)));
    for (const key of Object.keys(value)) {
      const inherited = { ...value };
      delete inherited[key];
      Object.setPrototypeOf(inherited, { [key]: value[key] });
      assert.equal(c.isTaskInvalidation(inherited), false);
      assert.equal(c.isTaskInvalidation({ ...inherited, replacement: true }), false);
      assert.equal(c.isTaskInvalidation(withHidden({ ...value }, key, value[key])), false);
    }
    assert.equal(c.isTaskInvalidation({ ...value, extra: undefined }), false);
  }
  for (const value of [
    null,
    [],
    undefined,
    {},
    { type: ['reset'] },
    { type: 'denied', reason: ['forbidden'] },
    { ...event, entity: ['task'] },
    { ...event, version: '1' },
    { ...event, version: 0 },
    { ...event, version: 1.5 },
    { ...event, version: Infinity },
    { ...event, version: Number.MAX_SAFE_INTEGER + 1 },
    { ...event, id: '' },
    { ...event, projectId: 'bad id' },
  ])
    assert.equal(c.isTaskInvalidation(value), false);
});
