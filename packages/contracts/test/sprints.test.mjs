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
