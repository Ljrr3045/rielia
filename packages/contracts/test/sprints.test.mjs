import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isSprintDate,
  isPlanningTimeZone,
  isPlanningSettings,
  isProjectPlanning,
  isSprintFields,
  isPlannedSprint,
  isSprintPage,
  isSprint,
  isDomainPerson,
  planningSettingsSchema,
  sprintFieldsSchema,
  configurePlanningInputSchema,
  createSprintInputSchema,
  editSprintInputSchema,
  projectPlanningSchema,
  sprintSchema,
  sprintPageSchema,
} from '../dist/index.js';
const settings = { mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 2, 5] };
const fields = {
  name: 'Sprint',
  goal: 'Goal',
  startDate: '2026-11-19',
  endDateExclusive: '2026-12-03',
};
const creator = { principalId: 'h', name: 'Human', kind: 'human', active: true };
const row = {
  ...fields,
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  state: 'planned',
  version: 1,
  timeZone: 'UTC',
  startsAt: '2026-11-19T00:00:00.000Z',
  endsAt: '2026-12-03T00:00:00.000Z',
  createdAt: '2026-11-19T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
  creator,
  provenance: { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: true },
  url: '/api/v1/workspaces/w/projects/p/sprints/s',
};
test('planning validators reject malformed dates/settings/capabilities and nonplanned data', () => {
  assert.ok(isPlanningSettings(settings));
  assert.ok(isPlanningTimeZone('America/Caracas'));
  assert.ok(isSprintDate('2024-02-29'));
  assert.ok(isSprintFields(fields));
  assert.ok(isPlannedSprint(row));
  assert.equal(isPlannedSprint(null), false);
  assert.equal(isPlannedSprint({ ...row, startDate: 'malformed' }), false);
  assert.equal(isPlannedSprint({ ...row, startsAt: '0000-12-31T23:00:00.000Z' }), false);
  for (const v of [null, [], {}, '2026-02-30', '0000-01-01', '2026-1-01'])
    assert.equal(isSprintDate(v), false);
  for (const v of ['No/Zone', '+04:00', '', null, 'a'.repeat(101)])
    assert.equal(isPlanningTimeZone(v), false);
  for (const patch of [
    { mode: 'bad' },
    { pointScale: [] },
    { pointScale: [1, 0] },
    { pointScale: [1, 1] },
    { pointScale: [-1] },
    { pointScale: [1001] },
    { pointScale: [NaN] },
    { pointScale: [1.2] },
    { pointScale: Array.from({ length: 33 }, (_, i) => i) },
    { unknown: true },
  ])
    assert.equal(isPlanningSettings({ ...settings, ...patch }), false);
  for (const patch of [
    { name: ' ' },
    { name: 'x'.repeat(201) },
    { name: 'a\nb' },
    { goal: '' },
    { goal: 'x'.repeat(2001) },
    { goal: 'x\0' },
    { startDate: '2026-02-30' },
    { endDateExclusive: fields.startDate },
    { extra: true },
  ])
    assert.equal(isSprintFields({ ...fields, ...patch }), false);
  for (const patch of [
    { state: 'active' },
    { workspaceId: '' },
    { version: 0 },
    { startsAt: 'invalid' },
    { endsAt: row.startsAt },
    { updatedAt: '2026-02-30T00:00:00.000Z' },
    { creator: null },
    { provenance: { ...row.provenance, actorPrincipalId: 'other' } },
    { provenance: { ...row.provenance, executionMode: 'delegated' } },
    { capabilities: { canEdit: 'true' } },
  ])
    assert.equal(isPlannedSprint({ ...row, ...patch }), false);
  assert.ok(
    isPlannedSprint({
      ...row,
      provenance: {
        actorPrincipalId: 'h',
        executionMode: 'delegated',
        source: 'mcp',
        grantId: 'g',
      },
    }),
  );
  const planning = {
    ...settings,
    workspaceId: 'w',
    projectId: 'p',
    projectVersion: 1,
    sprintRevision: 1,
    archivedAt: null,
    capabilities: { canConfigurePlanning: true, canCreateSprint: true },
  };
  assert.ok(isProjectPlanning(planning));
  assert.equal(isProjectPlanning({ ...planning, archivedAt: 'invalid' }), false);
  assert.equal(isProjectPlanning({ ...planning, capabilities: {} }), false);
  const page = {
    workspaceId: 'w',
    projectId: 'p',
    revision: 1,
    projectVersion: 1,
    items: [row],
    total: 1,
    nextCursor: null,
    capabilities: { canCreate: true },
  };
  assert.ok(isSprintPage(page));
  for (const patch of [
    { items: [{ ...row, projectId: 'foreign' }] },
    { items: [row, row] },
    { total: 0 },
    { revision: 0 },
    { nextCursor: '!' },
    { capabilities: {} },
  ])
    assert.equal(isSprintPage({ ...page, ...patch }), false);
});

test('Sprint request schemas preserve strict required fields, safe versions and UTF-16 limits', () => {
  for (const [schema, value, version] of [
    [configurePlanningInputSchema, { ...settings, expectedVersion: 1 }, 'expectedVersion'],
    [createSprintInputSchema, { ...fields, expectedProjectVersion: 1 }, 'expectedProjectVersion'],
    [editSprintInputSchema, { ...fields, expectedVersion: 1 }, 'expectedVersion'],
  ]) {
    assert.deepEqual(schema.parse(value), value);
    for (const key of Object.keys(value)) {
      const missing = { ...value };
      delete missing[key];
      for (const invalid of [missing, { ...value, [key]: null }, { ...value, [key]: undefined }])
        assert.equal(schema.safeParse(invalid).success, false, key);
    }
    for (const invalid of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1', [1]])
      assert.equal(schema.safeParse({ ...value, [version]: invalid }).success, false);
    for (const extra of ['actorPrincipalId', 'source', 'expectedTaskVersion'])
      assert.equal(schema.safeParse({ ...value, [extra]: 'forged' }).success, false);
    assert.equal(schema.safeParse({ ...value, [version]: Number.MAX_SAFE_INTEGER }).success, true);
    for (const invalid of [null, [], 'request'])
      assert.equal(schema.safeParse(invalid).success, false);
  }
  const astral = { ...fields, name: '😀'.repeat(100), goal: '😀'.repeat(1000) };
  assert.deepEqual(sprintFieldsSchema.parse(astral), astral);
  for (const patch of [
    { name: '😀'.repeat(101) },
    { goal: '😀'.repeat(1001) },
    { name: ' trimmed' },
    { goal: 'trimmed ' },
    { name: 'tab\there' },
    { name: 'carriage\rreturn' },
    { name: 'nul\0' },
  ])
    assert.equal(sprintFieldsSchema.safeParse({ ...fields, ...patch }).success, false);
  assert.equal(
    sprintFieldsSchema.safeParse({ ...fields, goal: 'Allowed\nmultiline\tgoal' }).success,
    true,
  );
  assert.equal(
    planningSettingsSchema.safeParse({ ...settings, pointScale: [0, 1000] }).success,
    true,
  );
});

test('Sprint response schemas retain unknown keys while enforcing exact presence and state', () => {
  const enriched = {
    ...row,
    future: { retained: true },
    creator: { ...creator, future: true },
    provenance: { ...row.provenance, future: true },
    capabilities: { ...row.capabilities, future: true },
  };
  assert.deepEqual(sprintSchema.parse(enriched), enriched);
  assert.ok(isPlannedSprint(enriched));
  for (const patch of [{ startedAt: undefined }, { closedAt: undefined }, { startedAt: null }])
    assert.equal(isSprint({ ...row, ...patch }), false);
  for (const key of ['canStart', 'canChangeScope', 'canClose']) {
    assert.equal(isSprint({ ...row, capabilities: { canEdit: true, [key]: undefined } }), false);
    assert.ok(isSprint({ ...row, capabilities: { canEdit: true, [key]: false } }));
  }
  const active = { ...enriched, state: 'active', startedAt: row.startsAt };
  assert.ok(isSprint(active));
  assert.equal(isSprint({ ...active, closedAt: undefined }), false);
  const closed = {
    ...active,
    state: 'closed',
    closedAt: row.endsAt,
    capabilities: { canEdit: false, canStart: false, canChangeScope: false, canClose: false },
  };
  assert.ok(isSprint(closed));
  for (const key of Object.keys(closed.capabilities)) {
    const missing = { ...closed.capabilities };
    delete missing[key];
    assert.equal(isSprint({ ...closed, capabilities: missing }), false);
    assert.equal(
      isSprint({ ...closed, capabilities: { ...closed.capabilities, [key]: true } }),
      false,
    );
  }
  const planning = {
    ...settings,
    workspaceId: 'w',
    projectId: 'p',
    projectVersion: 1,
    sprintRevision: 1,
    archivedAt: null,
    capabilities: { canConfigurePlanning: true, canCreateSprint: true, future: true },
    future: { retained: true },
  };
  assert.deepEqual(projectPlanningSchema.parse(planning), planning);
  const page = {
    workspaceId: 'w',
    projectId: 'p',
    revision: 1,
    projectVersion: 1,
    items: [enriched, { ...active, id: 'active' }, { ...closed, id: 'closed' }],
    total: 3,
    nextCursor: 'opaque_cursor',
    capabilities: { canCreate: true, future: true },
    future: true,
  };
  assert.deepEqual(sprintPageSchema.parse(page), page);
});

test('Sprint scalars reject legacy-coercible person and provenance values without changing G02', () => {
  for (const state of ['planned', 'active', 'closed']) {
    const value = {
      ...row,
      state,
      ...(state === 'planned' ? {} : { startedAt: row.startsAt }),
      ...(state === 'closed'
        ? {
            closedAt: row.endsAt,
            capabilities: {
              canEdit: false,
              canStart: false,
              canChangeScope: false,
              canClose: false,
            },
          }
        : {}),
    };
    for (const kind of ['human', 'agent']) {
      assert.ok(isSprint({ ...value, creator: { ...creator, kind } }));
      for (const malformed of [[kind], { toString: () => kind }]) {
        const person = { ...creator, kind: malformed };
        assert.ok(isDomainPerson(person), 'G02 legacy coercion remains outside this migration');
        assert.equal(isSprint({ ...value, creator: person }), false);
      }
    }
    for (const mode of ['delegated', 'autonomous']) {
      const provenance = { ...row.provenance, executionMode: mode, source: 'mcp', grantId: 'g' };
      assert.ok(isSprint({ ...value, provenance }));
      for (const malformed of [[mode], { toString: () => mode }])
        assert.equal(
          isSprint({ ...value, provenance: { ...provenance, executionMode: malformed } }),
          false,
        );
    }
    for (const patch of [
      { source: 'mcp' },
      { grantId: 'g' },
      { executionMode: 'system' },
      { executionMode: 'delegated', source: 'mcp', grantId: null },
      { executionMode: 'autonomous', source: 'web', grantId: 'g' },
      { executionMode: 'delegated', source: 'mcp', grantId: '../grant' },
    ])
      assert.equal(isSprint({ ...value, provenance: { ...row.provenance, ...patch } }), false);
  }
});

test('Sprint dates, identifiers, counts and page correlations retain their bounded wire rules', () => {
  for (const date of ['0001-01-01', '9999-12-31', '2000-02-29']) assert.ok(isSprintDate(date));
  for (const date of ['1900-02-29', '2026-04-31', '2026-01-01Z', '10000-01-01'])
    assert.equal(isSprintDate(date), false);
  for (const key of ['id', 'workspaceId', 'projectId'])
    for (const value of ['../foreign', 'x'.repeat(129), [], null])
      assert.equal(isSprint({ ...row, [key]: value }), false);
  for (const key of ['startsAt', 'endsAt', 'createdAt', 'updatedAt'])
    for (const value of [
      '2026-11-19T00:00:00Z',
      '2026-11-19T00:00:00.000+00:00',
      '2026-02-30T00:00:00.000Z',
    ])
      assert.equal(isSprint({ ...row, [key]: value }), false);
  const page = {
    workspaceId: 'w',
    projectId: 'p',
    revision: 1,
    projectVersion: 1,
    items: [row],
    total: 1,
    nextCursor: null,
    capabilities: { canCreate: true },
  };
  for (const patch of [
    { items: [{ ...row, workspaceId: 'foreign' }] },
    { items: [row, row] },
    { items: Array.from({ length: 101 }, (_, id) => ({ ...row, id: String(id) })), total: 101 },
    { total: Number.MAX_SAFE_INTEGER + 1 },
    { total: -1 },
    { total: 1.5 },
    { nextCursor: 'x'.repeat(2049) },
    { projectVersion: 0 },
    { revision: Number.MAX_SAFE_INTEGER + 1 },
  ])
    assert.equal(isSprintPage({ ...page, ...patch }), false);
});
