import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { ProjectTaskService } from '../../dist/projects/project-task.service.js';
import { SprintService } from '../../dist/projects/sprint.service.js';
import { sprintMidnight } from '../../dist/projects/sprint-policy.js';
import { planningInput, sprintInput, sprintInterval } from '../../dist/projects/sprint-input.js';
import { canonical } from '../../dist/projects/project-task-input.js';

const w = 'w',
  p = 'p',
  s = 's',
  key = '11111111-1111-4111-8111-111111111111';
const settings = { mode: 'scrum', timeZone: 'America/New_York', pointScale: [0, 1, 3, 5] };
const fields = {
  name: 'Iteration',
  goal: 'Ship planning',
  startDate: '2026-03-08',
  endDateExclusive: '2026-03-09',
};
const actor = {
  actorPrincipalId: 'human',
  principalKind: 'human',
  workspaceId: w,
  executionMode: 'human',
  source: 'web',
  role: 'member',
  grantId: null,
};
const project = (patch = {}) => ({
  id: p,
  workspaceId: w,
  key: 'RIE',
  version: 2,
  taskRevision: 8,
  sprintRevision: 3,
  archivedAt: null,
  ...settings,
  ...patch,
});
const row = (patch = {}) => ({
  id: s,
  workspaceId: w,
  projectId: p,
  ...fields,
  state: 'planned',
  version: 1,
  startDate: new Date('2026-03-08T00:00:00Z'),
  endDateExclusive: new Date('2026-03-09T00:00:00Z'),
  timeZone: settings.timeZone,
  startsAt: new Date('2026-03-08T05:00:00Z'),
  endsAt: new Date('2026-03-09T04:00:00Z'),
  createdByPrincipalId: 'human',
  creationMode: 'human',
  creationSource: 'web',
  creationGrantId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...patch,
});
const people = [
  {
    principalId: 'human',
    state: 'active',
    principal: { displayName: 'Human', kind: 'human', state: 'active' },
  },
];
const step = (name, value, inspect) => ({ name, value, inspect });
function fixture(options = {}) {
  const pending = [],
    calls = [],
    context = Object.freeze({ verified: true });
  const consume = async (name, args) => {
    calls.push(name);
    const next = pending.shift();
    assert.ok(next, 'Unexpected ' + name);
    assert.equal(next.name, name);
    next.inspect?.(args);
    if (next.error) throw next.error;
    return globalThis.structuredClone(next.value);
  };
  const tx = {
    $queryRaw: (...args) =>
      args[0].join('').includes('FROM sprint')
        ? Promise.resolve([])
        : consume('project-lock', args),
    sprintScopeEvent: { create: async () => undefined },
  };
  for (const model of [
    'project',
    'sprint',
    'membership',
    'activityEvent',
    'outboxEvent',
    'projectTaskOperation',
  ])
    tx[model] = Object.fromEntries(
      ['findFirst', 'findUnique', 'findMany', 'count', 'create', 'update'].map((method) => [
        method,
        (...args) => consume(`${model}.${method}`, args),
      ]),
    );
  tx.sprint.findFirst = async () => null;
  let operations = 0;
  const principals = {
    domainOperation: async (c, workspace, operation, work) => {
      assert.equal(c, context);
      assert.equal(workspace, w);
      operations++;
      if (options.denied) throw new ForbiddenException();
      return work(tx, { ...actor, ...options.actor }, options.canWrite ?? true);
    },
  };
  const service = new SprintService(new ProjectTaskService(principals));
  return {
    service,
    context,
    calls,
    script: (...answers) => pending.push(...answers),
    done: () => {
      assert.deepEqual(pending, []);
      assert.equal(operations, 1);
    },
  };
}
const begin = (proj = project(), receipt = null) => [
  step('project.findFirst', proj),
  step('project-lock', []),
  step('projectTaskOperation.findUnique', receipt),
];
const hydrate = () => step('membership.findMany', people);
const journal = (changedFields) => [
  step('activityEvent.create', undefined, (args) => {
    if (changedFields) assert.deepEqual(args[0].data.changedFields, changedFields);
  }),
  step('outboxEvent.create'),
  step('projectTaskOperation.create'),
];
const denied = (status, code) => (error) => {
  assert.equal(error.getStatus(), status);
  if (code) assert.equal(error.getResponse().code, code);
  return true;
};
const hash = (action, target, input) =>
  createHash('sha256')
    .update(JSON.stringify(canonical([action, [p, target], input])))
    .digest('hex');

test('sprint local boundaries retain calendar dates through UTC/DST and reject invalid or ambiguous midnight', () => {
  for (const [date, zone, expected] of [
    ['2026-11-19', 'America/Caracas', '2026-11-19T04:00:00.000Z'],
    ['2026-03-08', 'America/New_York', '2026-03-08T05:00:00.000Z'],
    ['2026-03-09', 'America/New_York', '2026-03-09T04:00:00.000Z'],
    ['2026-11-01', 'America/New_York', '2026-11-01T04:00:00.000Z'],
    ['2026-11-02', 'America/New_York', '2026-11-02T05:00:00.000Z'],
    ['0001-04-01', 'UTC', '0001-04-01T00:00:00.000Z'],
    ['0001-01-01', 'Etc/GMT-1', '0000-12-31T23:00:00.000Z'],
    ['2024-02-29', 'UTC', '2024-02-29T00:00:00.000Z'],
  ])
    assert.equal(sprintMidnight(date, zone).toISOString(), expected);
  for (const [date, zone] of [
    ['2026-02-30', 'UTC'],
    ['0000-01-01', 'UTC'],
    ['2026-01-01', 'invalid/zone'],
    ['2011-12-30', 'Pacific/Apia'],
    ['2026-03-08', 'America/Havana'],
    ['2026-11-01', 'America/Havana'],
  ])
    assert.throws(() => sprintMidnight(date, zone));
  assert.equal(
    (sprintInterval('2026-03-08', '2026-03-09', settings.timeZone).endsAt -
      sprintInterval('2026-03-08', '2026-03-09', settings.timeZone).startsAt) /
      3600000,
    23,
  );
  assert.throws(() => sprintInterval('2026-03-09', '2026-03-08', 'UTC'), BadRequestException);
  assert.throws(() => sprintInterval('0001-01-01', '0001-01-02', 'Etc/GMT-1'), BadRequestException);
});
test('planning input captures the scale independently of later caller mutation', () => {
  const input = { expectedVersion: 2, ...settings, pointScale: [...settings.pointScale] };
  const captured = planningInput(input);
  input.pointScale.push(999);
  assert.deepEqual(captured.pointScale, settings.pointScale);
});
test('shared Sprint input parsing preserves strict admission and exact error precedence', () => {
  const outer = 'Invalid project/task request.';
  const version = 'A positive expectedVersion is required.';
  const planning = 'Invalid planning settings.';
  const sprint = 'Invalid sprint name, goal or exclusive date interval.';
  const rejects = (parse, payload, message) =>
    assert.throws(
      () => parse(payload),
      (error) => {
        assert.equal(error.getStatus(), 400);
        assert.equal(error.message, message);
        assert.equal(error.getResponse().message, message);
        return true;
      },
    );
  for (const parse of [
    planningInput,
    (value) => sprintInput(value, true),
    (value) => sprintInput(value, false),
  ])
    for (const value of [null, [], 'request', {}]) rejects(parse, value, outer);
  for (const [parse, valid, key, fieldsError] of [
    [planningInput, { expectedVersion: 2, ...settings }, 'expectedVersion', planning],
    [
      (value) => sprintInput(value, true),
      { expectedProjectVersion: 2, ...fields },
      'expectedProjectVersion',
      sprint,
    ],
    [
      (value) => sprintInput(value, false),
      { expectedVersion: 2, ...fields },
      'expectedVersion',
      sprint,
    ],
  ]) {
    for (const invalid of [
      undefined,
      null,
      '2',
      [2],
      {},
      0,
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ])
      rejects(parse, { ...valid, [key]: invalid }, version);
    const invalidFields =
      key === 'expectedProjectVersion' || 'name' in valid
        ? { ...valid, name: '' }
        : { ...valid, mode: 'invalid' };
    rejects(parse, { ...invalidFields, [key]: 0 }, fieldsError);
    const missingVersion = { ...invalidFields };
    delete missingVersion[key];
    rejects(parse, missingVersion, outer);
    rejects(parse, { ...invalidFields, [key]: 0, actorPrincipalId: 'forged' }, outer);
  }
  assert.deepEqual(planningInput({ ...settings, expectedVersion: 2 }), {
    expectedVersion: 2,
    ...settings,
  });
  for (const create of [true, false]) {
    const key = create ? 'expectedProjectVersion' : 'expectedVersion';
    const value = { ...fields, name: '😀'.repeat(100), goal: '😀'.repeat(1000) };
    assert.deepEqual(sprintInput({ ...value, [key]: 2 }, create), { version: 2, fields: value });
    rejects(
      (payload) => sprintInput(payload, create),
      { ...value, [key]: 2, name: '😀'.repeat(101) },
      sprint,
    );
    rejects(
      (payload) => sprintInput(payload, create),
      { ...value, [key]: 2, goal: '😀'.repeat(1001) },
      sprint,
    );
    rejects(
      (payload) => sprintInput(payload, create),
      { ...value, [key]: 2, startDate: '2026-02-30' },
      sprint,
    );
  }
});
test('planning settings use one current scoped authority, owner write and awaited atomic journal', async () => {
  const f = fixture();
  f.script(
    ...begin(project({ mode: 'kanban', timeZone: 'UTC', pointScale: [0] })),
    step('project.update', project({ version: 3 }), (args) =>
      assert.deepEqual(args[0].data, { ...settings, version: { increment: 1 } }),
    ),
    ...journal(['mode', 'timeZone', 'pointScale']),
  );
  const result = await f.service.configure(f.context, w, p, key, 'request', {
    expectedVersion: 2,
    ...settings,
  });
  assert.equal(result.projectVersion, 3);
  assert.equal(result.capabilities.canCreateSprint, true);
  f.done();
});
test('an explicit same-value planning write advances its version without inventing changed fields', async () => {
  const f = fixture();
  f.script(...begin(), step('project.update', project({ version: 3 })), ...journal([]));
  assert.equal(
    (
      await f.service.configure(f.context, w, p, key, 'request', {
        expectedVersion: 2,
        ...settings,
      })
    ).projectVersion,
    3,
  );
  f.done();
});
test('create captures project zone, UTC interval, actual actor and planned-only capabilities', async () => {
  const f = fixture();
  f.script(
    ...begin(),
    step('sprint.create', row(), (args) => {
      const d = args[0].data;
      assert.equal(d.timeZone, settings.timeZone);
      assert.equal(d.startsAt.toISOString(), '2026-03-08T05:00:00.000Z');
      assert.equal(d.endsAt - d.startsAt, 23 * 3600000);
      assert.equal(d.createdByPrincipalId, 'human');
      assert.ok(!('assigneePrincipalId' in d));
    }),
    hydrate(),
    ...journal(),
  );
  const result = await f.service.save(f.context, w, p, key, 'request', {
    expectedProjectVersion: 2,
    ...fields,
  });
  assert.equal(result.state, 'planned');
  assert.deepEqual(result.capabilities, {
    canEdit: true,
    canStart: true,
    canChangeScope: true,
    canClose: false,
  });
  f.done();
});
test('edit keeps captured zone even after project changes and while project is Kanban', async () => {
  const f = fixture();
  f.script(
    ...begin(project({ mode: 'kanban', timeZone: 'UTC' })),
    step('sprint.findUnique', row()),
    hydrate(),
    step('sprint.update', row({ version: 2, name: 'Revised' }), (args) => {
      assert.equal(args[0].data.startsAt.toISOString(), '2026-03-08T05:00:00.000Z');
      assert.ok(!('timeZone' in args[0].data));
    }),
    hydrate(),
    ...journal(['name']),
  );
  assert.equal(
    (
      await f.service.save(
        f.context,
        w,
        p,
        key,
        'request',
        { expectedVersion: 1, ...fields, name: 'Revised' },
        s,
      )
    ).version,
    2,
  );
  f.done();
});
test('reads retain current capabilities, scoped creator and never expose raw rows', async () => {
  const f = fixture({ canWrite: false });
  f.script(step('project.findFirst', project()), step('sprint.findUnique', row()), hydrate());
  const result = await f.service.get(f.context, w, p, s);
  assert.equal(result.capabilities.canEdit, false);
  assert.equal(result.creator.name, 'Human');
  assert.ok(!('createdByPrincipalId' in result));
  f.done();
  const g = fixture({ canWrite: false });
  g.script(step('project.findFirst', project({ archivedAt: new Date('2026-11-19T00:00:00Z') })));
  const planning = await g.service.planning(g.context, w, p);
  assert.deepEqual(planning.capabilities, { canConfigurePlanning: false, canCreateSprint: false });
  g.done();
});
test('same-key replay precedes stale versions/archive and rehydrates current content after current authority', async () => {
  const input = { version: 2, fields };
  const f = fixture();
  f.script(
    ...begin(project({ archivedAt: new Date() }), {
      requestHash: hash('create-sprint', null, input),
      response: { kind: 'planned-sprint', id: s },
    }),
    step('sprint.findUnique', row({ version: 4, name: 'Changed later' })),
    hydrate(),
  );
  const result = await f.service.save(f.context, w, p, key, 'retry', {
    expectedProjectVersion: 2,
    ...fields,
  });
  assert.equal(result.version, 4);
  assert.equal(result.name, 'Changed later');
  assert.equal(result.capabilities.canEdit, false);
  assert.ok(!f.calls.includes('activityEvent.create'));
  f.done();
  const g = fixture();
  const settingsInput = { expectedVersion: 2, ...settings };
  g.script(
    ...begin(project({ version: 8 }), {
      requestHash: hash('configure-planning', null, settingsInput),
      response: { kind: 'project-planning' },
    }),
  );
  assert.equal(
    (await g.service.configure(g.context, w, p, key, 'retry', settingsInput)).projectVersion,
    8,
  );
  g.done();
});
test('denial, invalid input, version/archive/mode conflicts and missing scope cause no journal', async (t) => {
  for (const [name, proj, body, status, code] of [
    ['version', project(), { expectedProjectVersion: 1, ...fields }, 409, 'version-conflict'],
    [
      'archive',
      project({ archivedAt: new Date() }),
      { expectedProjectVersion: 2, ...fields },
      409,
      'archived',
    ],
    [
      'mode',
      project({ mode: 'kanban' }),
      { expectedProjectVersion: 2, ...fields },
      409,
      'invalid-transition',
    ],
    [
      'midnight',
      project({ timeZone: 'America/Havana' }),
      { expectedProjectVersion: 2, ...fields },
      400,
    ],
  ])
    await t.test(name, async () => {
      const f = fixture();
      f.script(...begin(proj));
      await assert.rejects(
        f.service.save(f.context, w, p, key, 'request', body),
        denied(status, code),
      );
      f.done();
    });
  const f = fixture({ denied: true });
  await assert.rejects(
    f.service.save(f.context, w, p, key, 'request', { expectedProjectVersion: 2, ...fields }),
    denied(403),
  );
  f.done();
  assert.deepEqual(f.calls, []);
  const missing = fixture();
  missing.script(step('project.findFirst', null));
  await assert.rejects(missing.service.get(missing.context, w, p, s), denied(403));
  missing.done();
  const absent = fixture();
  absent.script(step('project.findFirst', project()), step('sprint.findUnique', null));
  await assert.rejects(absent.service.get(absent.context, w, p, s), denied(403));
  absent.done();
  for (const body of [
    { expectedProjectVersion: 0, ...fields },
    { expectedProjectVersion: 2, ...fields, actorPrincipalId: 'forged' },
    { expectedProjectVersion: 2, ...fields, endDateExclusive: fields.startDate },
  ])
    assert.throws(
      () => fixture().service.save({}, w, p, key, 'request', body),
      BadRequestException,
    );
  for (const patch of [
    { timeZone: 'invalid/zone' },
    { pointScale: [1, 1] },
    { pointScale: [-1] },
    { mode: 'invalid' },
    { pointScale: Array.from({ length: 33 }, (_, i) => i) },
    { source: 'mcp' },
  ])
    assert.throws(
      () =>
        fixture().service.configure({}, w, p, key, 'request', {
          expectedVersion: 2,
          ...settings,
          ...patch,
        }),
      BadRequestException,
    );
  assert.throws(
    () =>
      fixture().service.save({}, w, p, 'bad', 'request', { expectedProjectVersion: 2, ...fields }),
    BadRequestException,
  );
});
test('different hash and corrupt tagged receipt fail without work', async () => {
  for (const [receipt, status, code] of [
    [{ requestHash: 'different', response: {} }, 409, 'idempotency-conflict'],
    [
      {
        requestHash: hash('create-sprint', null, { version: 2, fields }),
        response: { kind: 'unknown' },
      },
      503,
    ],
  ]) {
    const f = fixture();
    f.script(...begin(project(), receipt));
    await assert.rejects(
      f.service.save(f.context, w, p, key, 'request', { expectedProjectVersion: 2, ...fields }),
      denied(status, code),
    );
    f.done();
  }
});
test('journal failures propagate and cannot write a later durable stage', async () => {
  for (const failure of [
    'activityEvent.create',
    'outboxEvent.create',
    'projectTaskOperation.create',
  ]) {
    const f = fixture();
    const steps = journal();
    const n = steps.findIndex((x) => x.name === failure);
    steps[n] = { name: failure, error: new Error('Injected journal failure') };
    f.script(...begin(), step('sprint.create', row()), hydrate(), ...steps.slice(0, n + 1));
    await assert.rejects(
      f.service.save(f.context, w, p, key, 'request', { expectedProjectVersion: 2, ...fields }),
      /Injected/,
    );
    f.done();
  }
});
test('bounded lists bind cursor to project/revision and validate scoped anchor', async () => {
  const f = fixture();
  const rows = Array.from({ length: 101 }, (_, i) => row({ id: String(i).padStart(3, '0') }));
  f.script(
    step('project.findFirst', project()),
    step('sprint.findMany', rows, (args) => assert.equal(args[0].take, 101)),
    hydrate(),
    step('sprint.count', 101),
  );
  const page = await f.service.list(f.context, w, p);
  assert.equal(page.items.length, 100);
  assert.equal(page.total, 101);
  assert.ok(page.nextCursor);
  f.done();
  const g = fixture();
  g.script(
    step('project.findFirst', project()),
    step('sprint.findUnique', { id: '099' }),
    step('sprint.findMany', [rows[100]]),
    hydrate(),
    step('sprint.count', 101),
  );
  assert.equal((await g.service.list(g.context, w, p, page.nextCursor)).items.length, 1);
  g.done();
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const original = JSON.parse(Buffer.from(page.nextCursor, 'base64url'));
  for (const [cursor, status] of [
    ['!', 400],
    [encode({ ...original, w: 'foreign' }), 400],
    [encode({ ...original, revision: 2 }), 409],
    [encode({ ...original, projectVersion: 1 }), 409],
    [encode({ ...original, extra: true }), 400],
    [encode({ ...original, revision: 0 }), 400],
    [encode({ ...original, projectVersion: -1 }), 400],
  ]) {
    const h = fixture();
    h.script(step('project.findFirst', project()));
    await assert.rejects(
      h.service.list(h.context, w, p, cursor),
      denied(status, status === 409 ? 'page-changed' : undefined),
    );
    h.done();
  }
  const h = fixture();
  h.script(step('project.findFirst', project()), step('sprint.findUnique', null));
  await assert.rejects(h.service.list(h.context, w, p, page.nextCursor), denied(400));
  h.done();
});
