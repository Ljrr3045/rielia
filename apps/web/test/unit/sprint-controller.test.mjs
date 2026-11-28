import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changeSprintCommand } from '../../src/lib/sprint-commands.ts';
import { createSprintController } from '../../src/lib/sprint-controller.ts';
import { createSprintPlanningTransport } from '../../src/lib/sprint-client.ts';
import {
  createTaskPlanningTransport,
  TaskPlanningFailure,
} from '../../src/lib/task-planning-client.ts';
import {
  context,
  fields,
  settings,
  planning,
  sprint,
  task,
  scope,
  history,
  list,
  preview,
  closeResult,
  plannedSprint,
  deferred,
  mountedSprint,
  sprintServer,
} from './sprint-client-fixtures.mjs';

test('planning, selected task/sprint, canonical scope and histories load without a write or preview', async (t) => {
  const b = await mountedSprint(t);
  for (const name of [
    'planning',
    'sprints',
    'sprint',
    'task',
    'scope',
    'sprintHistory',
    'taskHistory',
  ]) {
    assert.equal(b.state().resources[name].status, 'ready', name);
    assert.equal(b.state().resources[name].stale, false, name);
  }
  assert.deepEqual(b.state().resources.scope.data.currentTotals, scope.currentTotals);
  assert.deepEqual(b.state().resources.task.data.snapshot, task.snapshot);
  assert.equal(b.state().resources.preview.status, 'idle');
  assert.equal(b.posts().length, 0);
  assert.throws(() => {
    b.state().resources.task.data.snapshot.estimatePoints = 8;
  }, TypeError);
});

test('editable settings capture project version and retain a copied scale through refresh and explicit review', async (t) => {
  const b = await mountedSprint(t);
  const value = { ...settings, mode: 'kanban', timeZone: 'America/Caracas', pointScale: [0, 3, 8] };
  assert.equal(b.controller.stage({ type: 'configure-planning', settings: value }), 'ready');
  value.pointScale.push(13);
  b.server.planning.projectVersion = 4;
  await b.controller.refresh();
  assert.equal(b.state().draft.expectedVersion, 2);
  assert.deepEqual(b.state().draft.settings.pointScale, [0, 3, 8]);
  assert.equal(await b.controller.submit(), 'review-required');
  assert.equal(b.controller.rebaseDraft(), 'ready');
  assert.equal(b.state().draft.expectedVersion, 4);
  b.server.post = ({ init }) => {
    assert.deepEqual(JSON.parse(init.body), {
      ...value,
      pointScale: [0, 3, 8],
      expectedVersion: 4,
    });
    b.server.planning = { ...b.server.planning, ...JSON.parse(init.body), projectVersion: 5 };
    delete b.server.planning.expectedVersion;
    return Response.json(b.server.planning);
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.planning.data.projectVersion, 5);
  assert.equal(b.state().draft, null);
  b.controller.dismissResult();
  assert.equal(b.state().mutation.status, 'idle');
});

for (const type of ['create-sprint', 'edit-sprint']) {
  test(`${type} keeps original concurrency preconditions while fields change; trims only at submit`, async (t) => {
    const b = await mountedSprint(t);
    assert.equal(b.controller.stage({ type, fields }), 'ready');
    assert.equal(
      b.controller.changeDraft({
        type,
        fields: { ...fields, name: '  A changed name  ', goal: '  A changed goal  ' },
      }),
      'ready',
    );
    assert.equal(b.state().draft.fields.name, '  A changed name  ');
    assert.equal(
      b.controller.changeDraft({ type: 'estimate-task', estimatePoints: 0 }),
      'unavailable',
    );
    b.server.post = ({ init }) => {
      const body = JSON.parse(init.body);
      assert.equal(body.name, 'A changed name');
      assert.equal(body.goal, 'A changed goal');
      assert.equal(
        body[type === 'create-sprint' ? 'expectedProjectVersion' : 'expectedVersion'],
        2,
      );
      return Response.json({ ...sprint, ...body, version: 3 });
    };
    await b.controller.submit();
    assert.equal(b.state().mutation.status, 'confirmed');
    assert.equal(b.posts().length, 1);
  });
}

for (const estimatePoints of [0, null, 2]) {
  test(`estimate ${estimatePoints} sends the captured task version, distinct zero/null, and reads confirmed state`, async (t) => {
    const b = await mountedSprint(t);
    assert.equal(b.controller.stage({ type: 'estimate-task', estimatePoints: 5 }), 'ready');
    assert.equal(b.controller.changeDraft({ type: 'estimate-task', estimatePoints }), 'ready');
    b.server.post = ({ init }) => {
      assert.deepEqual(JSON.parse(init.body), { expectedVersion: 3, estimatePoints });
      b.server.task.snapshot = { ...task.snapshot, version: 4, estimatePoints };
      return Response.json(b.server.task);
    };
    await b.controller.submit();
    assert.equal(b.state().mutation.status, 'confirmed');
    assert.equal(b.state().resources.task.data.snapshot.estimatePoints, estimatePoints);
    assert.equal(b.state().mutation.result.snapshot.version, 4);
  });
}

test('participation captures source visit/version and explicit target; task content remains canonical', async (t) => {
  const b = await mountedSprint(t);
  assert.equal(b.controller.stage({ type: 'set-task-sprint', targetSprintId: 'target' }), 'stale');
  await b.controller.selectTarget('target');
  assert.equal(b.controller.stage({ type: 'set-task-sprint', targetSprintId: 'target' }), 'ready');
  assert.deepEqual(b.state().draft.input, {
    expectedTaskVersion: 3,
    expectedCurrentParticipationId: 'visit',
    expectedSourceVersion: 2,
    targetSprintId: 'target',
    expectedTargetVersion: 1,
  });
  assert.equal(
    b.controller.changeDraft({ type: 'set-task-sprint', targetSprintId: null }),
    'ready',
  );
  b.server.post = ({ init }) => {
    assert.deepEqual(JSON.parse(init.body), {
      expectedTaskVersion: 3,
      expectedCurrentParticipationId: 'visit',
      expectedSourceVersion: 2,
      targetSprintId: null,
      expectedTargetVersion: null,
    });
    b.server.task.currentParticipation = null;
    return Response.json({
      operation: {
        activityId: 'activity',
        type: 'set-task-sprint',
        sprintId: 's',
        exitedVisitId: 'visit',
        enteredVisitId: null,
      },
      current: b.server.task,
    });
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.task.data.currentParticipation, null);
  assert.deepEqual(b.state().resources.task.data.snapshot, task.snapshot);
});

test('an unscheduled task joins an explicitly loaded planned target with null source preconditions', async (t) => {
  const b = await mountedSprint(t);
  b.server.task.currentParticipation = null;
  await b.controller.refresh();
  await b.controller.selectTarget('target');
  assert.equal(b.controller.stage({ type: 'set-task-sprint', targetSprintId: 'target' }), 'ready');
  b.server.post = ({ init }) => {
    assert.deepEqual(JSON.parse(init.body), {
      expectedTaskVersion: 3,
      expectedCurrentParticipationId: null,
      expectedSourceVersion: null,
      targetSprintId: 'target',
      expectedTargetVersion: 1,
    });
    b.server.task.currentParticipation = { id: 'new-visit', sprint: b.server.target };
    return Response.json({
      operation: {
        activityId: 'activity',
        type: 'set-task-sprint',
        sprintId: 'target',
        enteredVisitId: 'new-visit',
        exitedVisitId: null,
      },
      current: b.server.task,
    });
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().mutation.result.operation.enteredVisitId, 'new-visit');
});

test('start binds the selected sprint, project and canonical task revision; no date-based automatic start', async (t) => {
  const b = await mountedSprint(t);
  b.server.sprint = plannedSprint('s');
  b.server.scope.sprintVersion = 1;
  await b.controller.refresh();
  assert.equal(b.posts().length, 0);
  assert.equal(b.controller.stage({ type: 'start-sprint' }), 'ready');
  b.server.post = ({ init }) => {
    assert.deepEqual(JSON.parse(init.body), {
      expectedVersion: 1,
      expectedProjectVersion: 2,
      expectedTaskRevision: 5,
    });
    b.server.sprint = globalThis.structuredClone(sprint);
    return Response.json({
      operation: {
        activityId: 'activity',
        type: 'start-sprint',
        sprintId: 's',
        enteredVisitId: null,
        exitedVisitId: null,
      },
      current: sprint,
    });
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.sprint.data.state, 'active');
});

for (const [type, intent, deny] of [
  [
    'settings',
    { type: 'configure-planning', settings },
    (s) => {
      s.planning.capabilities.canConfigurePlanning = false;
    },
  ],
  [
    'creation',
    { type: 'create-sprint', fields },
    (s) => {
      s.planning.capabilities.canCreateSprint = false;
    },
  ],
  [
    'edit',
    { type: 'edit-sprint', fields },
    (s) => {
      s.sprint.capabilities.canEdit = false;
    },
  ],
  [
    'estimate',
    { type: 'estimate-task', estimatePoints: 2 },
    (s) => {
      s.task.capabilities.canEstimate = false;
    },
  ],
  [
    'scope',
    { type: 'set-task-sprint', targetSprintId: null },
    (s) => {
      s.task.capabilities.canChangeScope = false;
    },
  ],
  ['start', { type: 'start-sprint' }, () => {}],
  [
    'close',
    { type: 'close-sprint' },
    (s) => {
      s.sprint.capabilities.canClose = false;
    },
  ],
]) {
  test(`read-only ${type} exposes data and server capability denial without issuing a command`, async (t) => {
    const server = sprintServer();
    deny(server);
    const b = await mountedSprint(t, { server });
    assert.equal(b.state().resources.planning.status, 'ready');
    assert.equal(b.controller.stage(intent), 'forbidden');
    assert.equal(b.state().draft, null);
    assert.equal(b.posts().length, 0);
    b.controller.dismissResult();
    assert.equal(b.state().mutation.status, 'idle');
  });
}

test('invalid fields/settings/estimate retain editable drafts and do not create network requests', async (t) => {
  const b = await mountedSprint(t);
  for (const intent of [
    { type: 'create-sprint', fields: { ...fields, name: '  ' } },
    { type: 'configure-planning', settings: { ...settings, pointScale: [2, 1] } },
    { type: 'estimate-task', estimatePoints: 1001 },
  ]) {
    assert.equal(b.controller.stage(intent), 'ready');
    assert.equal(await b.controller.submit(), 'invalid');
    assert.ok(b.state().draft);
    assert.equal(b.controller.discardDraft(), true);
  }
  assert.equal(b.posts().length, 0);
  assert.equal(
    b.controller.changeDraft({ type: 'estimate-task', estimatePoints: 0 }),
    'unavailable',
  );
  assert.equal(b.controller.rebaseDraft(), 'unavailable');
  assert.equal(await b.controller.submit(), 'unavailable');
  assert.equal(await b.controller.retrySave(), 'unavailable');
});

test('pending guards suppress duplicate writes, draft replacement and navigation', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  b.server.post = () => held.promise;
  b.controller.stage({ type: 'edit-sprint', fields });
  const saving = b.controller.submit();
  assert.equal(b.state().mutation.status, 'pending');
  assert.equal(await b.controller.submit(), 'busy');
  assert.equal(await b.controller.retrySave(), 'busy');
  assert.equal(b.controller.stage({ type: 'create-sprint', fields }), 'busy');
  assert.equal(b.controller.changeDraft({ type: 'edit-sprint', fields }), 'busy');
  assert.equal(b.controller.rebaseDraft(), 'busy');
  assert.equal(await b.controller.select(null, null), false);
  assert.equal(await b.controller.selectTarget(null), false);
  assert.equal(await b.controller.preview('backlog'), false);
  assert.equal(b.controller.discardDraft(), false);
  assert.equal(b.posts().length, 1);
  held.resolve(Response.json(sprint));
  await saving;
  assert.equal(b.state().mutation.status, 'confirmed');
});

for (const response of ['network', 408, 500, 'malformed']) {
  test(`ambiguous ${response} preserves the exact normalized command/key through invalidation and retry`, async (t) => {
    const b = await mountedSprint(t);
    b.controller.stage({ type: 'edit-sprint', fields: { ...fields, name: '  Original  ' } });
    b.server.post = () => {
      if (response === 'network') throw new Error('Lost response');
      if (response === 'malformed') return Response.json({ invalid: true });
      return Response.json({ code: 'unavailable' }, { status: response });
    };
    await b.controller.submit();
    assert.equal(b.state().mutation.status, 'unknown');
    const original = b.posts()[0].init;
    const recovery = b.state().recovery;
    assert.equal(recovery.command.fields.name, 'Original');
    await b.controller.handleEvent({ type: 'reset' });
    assert.equal(b.state().recovery, recovery);
    assert.equal(b.controller.changeDraft({ type: 'edit-sprint', fields }), 'busy');
    assert.equal(await b.controller.submit(), 'busy');
    b.server.post = () =>
      Response.json({ ...sprint, version: 9, name: 'Later authorized current value' });
    await b.controller.retrySave();
    assert.equal(b.posts().length, 2);
    assert.equal(b.posts()[1].init.body, original.body);
    assert.equal(b.posts()[1].init.headers['Idempotency-Key'], original.headers['Idempotency-Key']);
    assert.equal(b.state().mutation.status, 'confirmed');
    assert.equal(b.state().mutation.result.version, 9);
    assert.equal(b.state().recovery, null);
  });
}

test('ordinary validation failure keeps draft editable; corrected submit receives a new key', async (t) => {
  const b = await mountedSprint(t);
  b.controller.stage({ type: 'estimate-task', estimatePoints: 2 });
  b.server.post = () =>
    Response.json(
      { code: 'validation-error' },
      { status: 400, headers: { 'x-request-id': 'request' } },
    );
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'failed');
  assert.equal(b.state().mutation.failure.requestId, 'request');
  assert.equal(b.state().recovery, null);
  assert.equal(b.controller.changeDraft({ type: 'estimate-task', estimatePoints: 0 }), 'ready');
  b.server.post = () => Response.json(task);
  await b.controller.submit();
  assert.notEqual(
    b.posts()[0].init.headers['Idempotency-Key'],
    b.posts()[1].init.headers['Idempotency-Key'],
  );
  assert.equal(b.state().mutation.status, 'confirmed');
});

test('409 displays authorized current values separately and requires explicit reload/rebase', async (t) => {
  const b = await mountedSprint(t);
  b.controller.stage({ type: 'edit-sprint', fields: { ...fields, goal: 'My retained goal' } });
  b.server.post = () =>
    Response.json(
      { code: 'version-conflict', current: { ...sprint, version: 4, goal: 'Other editor goal' } },
      { status: 409 },
    );
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'conflict');
  assert.equal(b.state().mutation.current.goal, 'Other editor goal');
  assert.equal(b.state().draft.fields.goal, 'My retained goal');
  assert.equal(b.state().draft.expectedVersion, 2);
  assert.equal(await b.controller.submit(), 'review-required');
  assert.equal(b.controller.rebaseDraft(), 'stale');
  b.server.sprint.version = 4;
  await b.controller.refresh();
  assert.equal(b.controller.rebaseDraft(), 'ready');
  assert.equal(b.state().draft.expectedVersion, 4);
  assert.equal(b.state().draft.fields.goal, 'My retained goal');
  assert.equal(b.posts().length, 1);
});

for (const status of [401, 403]) {
  for (const where of ['read', 'write']) {
    test(`${where} ${status} aborts obsolete requests and clears all private data, drafts, keys and previews`, async (t) => {
      const b = await mountedSprint(t);
      await b.controller.preview('backlog');
      b.controller.stage({ type: 'edit-sprint', fields });
      if (where === 'read') {
        b.server.get = ({ path }) =>
          path.endsWith('/planning') ? Response.json({ code: 'denied' }, { status }) : undefined;
        await b.controller.refresh();
      } else {
        b.server.post = () => Response.json({ code: 'denied' }, { status });
        await b.controller.submit();
      }
      assert.equal(b.state().status, status === 401 ? 'signed-out' : 'forbidden');
      assert.equal(b.state().draft, null);
      assert.equal(b.state().recovery, null);
      assert.equal(b.state().mutation.current, null);
      for (const r of Object.values(b.state().resources)) assert.equal(r.data, null);
      if (status === 403) {
        b.server.get = null;
        await b.controller.refresh();
        await b.controller.handleEvent({ type: 'reset' });
        assert.equal(b.state().status, 'forbidden');
        // Only the trusted parent verification port may establish fresh authority.
        await b.controller.setContext(context);
        assert.equal(b.state().status, 'ready');
      }
    });
  }
}

test('obsolete read completions cannot restore data after logout; unsubscribe and dispose cleanly abort', async (t) => {
  const b = await mountedSprint(t);
  let notifications = 0;
  const unsubscribe = b.controller.subscribe(() => notifications++);
  const held = deferred();
  let signal;
  b.server.get = ({ path, init }) => {
    if (path.endsWith('/planning')) {
      signal = init.signal;
      return held.promise;
    }
  };
  const loading = b.controller.refresh();
  await b.controller.setContext(null);
  assert.equal(signal.aborted, true);
  held.resolve(Response.json(planning));
  await loading;
  assert.equal(b.state().resources.planning.data, null);
  assert.equal(b.state().context, null);
  unsubscribe();
  const count = notifications;
  b.controller.dispose();
  assert.equal(notifications, count);
  assert.equal(await b.controller.select('s', null), false);
});

for (const change of [
  { userId: 'replacement' },
  { sessionId: 'replacement' },
  { workspaceId: 'other' },
  { projectId: 'other' },
]) {
  test(`context replacement ${Object.keys(change)[0]} clears recovery and ignores a late write`, async (t) => {
    const b = await mountedSprint(t);
    const held = deferred();
    b.server.post = () => held.promise;
    b.controller.stage({ type: 'edit-sprint', fields });
    const saving = b.controller.submit();
    b.server.get = () => Response.json({ unavailable: true }, { status: 503 });
    await b.controller.setContext({ ...context, ...change });
    assert.equal(b.posts()[0].init.signal.aborted, true);
    held.resolve(Response.json(sprint));
    await saving;
    assert.equal(b.state().draft, null);
    assert.equal(b.state().recovery, null);
    assert.equal(b.state().mutation.result, null);
    assert.deepEqual(b.state().selection, { sprintId: null, taskId: null, targetId: null });
  });
}

test('canceling a submission is an unknown outcome; a late success is ignored and retry retains key/body', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  b.server.post = () => held.promise;
  b.controller.stage({ type: 'edit-sprint', fields });
  const saving = b.controller.submit();
  b.controller.cancelPending();
  assert.equal(b.state().mutation.status, 'unknown');
  assert.equal(b.posts()[0].init.signal.aborted, true);
  held.resolve(Response.json(sprint));
  await saving;
  assert.equal(b.state().mutation.status, 'unknown');
  b.server.post = () => Response.json(sprint);
  await b.controller.retrySave();
  assert.equal(b.posts()[0].init.body, b.posts()[1].init.body);
  assert.equal(
    b.posts()[0].init.headers['Idempotency-Key'],
    b.posts()[1].init.headers['Idempotency-Key'],
  );
  b.controller.cancelPending();
});

test('session expiry blocks new operations; same-session renewal preserves a draft without refetch', async (t) => {
  let now = Date.parse('9998-01-01T00:00:00.000Z');
  const b = await mountedSprint(t, { now: () => now });
  b.controller.stage({ type: 'edit-sprint', fields });
  const count = b.server.requests.length;
  await b.controller.setContext({ ...context, expiresAt: '9999-02-01T00:00:00.000Z' });
  assert.ok(b.state().draft);
  assert.equal(b.server.requests.length, count);
  now = Date.parse('9999-03-01T00:00:00.000Z');
  assert.equal(await b.controller.submit(), 'unavailable');
  assert.equal(b.state().status, 'signed-out');
  assert.equal(b.state().draft, null);
  await b.controller.setContext({ ...context, expiresAt: 'invalid' });
  assert.equal(b.state().status, 'signed-out');
});

test('invalidation ignores unrelated projects/heartbeats, aborts obsolete reads and preserves draft versions', async (t) => {
  const b = await mountedSprint(t);
  const before = b.server.requests.length;
  await b.controller.handleEvent({ type: 'heartbeat' });
  await b.controller.handleEvent({
    type: 'invalidate',
    entity: 'project',
    id: 'foreign',
    projectId: 'foreign',
    version: 9,
  });
  assert.equal(b.server.requests.length, before);
  b.controller.stage({ type: 'edit-sprint', fields });
  const held = deferred();
  let signal;
  let first = true;
  b.server.get = ({ path, init }) => {
    if (path.endsWith('/sprints/s') && first) {
      first = false;
      signal = init.signal;
      return held.promise;
    }
  };
  const oldRead = b.controller.refresh();
  b.server.sprint.version = 4;
  await b.controller.handleEvent({
    type: 'invalidate',
    entity: 'project',
    id: 'p',
    projectId: 'p',
    version: 2,
  });
  held.resolve(Response.json(sprint));
  await oldRead;
  assert.equal(signal.aborted, true);
  assert.equal(b.state().resources.sprint.data.version, 4);
  assert.equal(b.state().draft.expectedVersion, 2);
  assert.equal(b.state().needsReview, true);
});

test('SSE while pending invalidates preview immediately and defers reads until confirmed', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.preview('backlog');
  b.controller.stage({ type: 'close-sprint' });
  const held = deferred();
  b.server.post = () => held.promise;
  const saving = b.controller.submit();
  const before = b.server.requests.length;
  await b.controller.handleEvent({ type: 'reset' });
  assert.equal(b.server.requests.length, before);
  assert.equal(b.state().resources.preview.stale, true);
  const result = closeResult();
  b.server.sprint = result.current;
  held.resolve(Response.json(result));
  await saving;
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.closure.status, 'ready');
});

test('confirmed writes remain confirmed when subsequent reads fail; retry never silently resubmits', async (t) => {
  const b = await mountedSprint(t);
  b.controller.stage({ type: 'edit-sprint', fields });
  b.server.post = () => {
    b.server.get = () => Response.json({ code: 'unavailable' }, { status: 503 });
    return Response.json(sprint);
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.sprint.status, 'error');
  assert.equal(b.state().resources.sprint.stale, true);
  assert.equal(await b.controller.retrySave(), 'unavailable');
  assert.equal(b.posts().length, 1);
  b.server.get = null;
  await b.controller.reload('sprint');
  assert.equal(b.state().resources.sprint.status, 'ready');
  assert.equal(b.posts().length, 1);
});

test('planned sprint pagination appends one stable revision and suppresses simultaneous load-more', async (t) => {
  const server = sprintServer();
  server.list = { ...list, items: [sprint], total: 2, nextCursor: 'next' };
  const b = await mountedSprint(t, { server });
  const held = deferred();
  server.get = ({ path, query }) =>
    path.endsWith('/sprints') && query.has('cursor') ? held.promise : undefined;
  const paging = b.controller.loadMore('sprints');
  assert.equal(b.state().resources.sprints.loadingMore, true);
  await b.controller.loadMore('sprints');
  assert.equal(server.requests.filter((r) => r.query.has('cursor')).length, 1);
  held.resolve(Response.json({ ...list, items: [plannedSprint()], total: 2, nextCursor: null }));
  await paging;
  assert.deepEqual(
    b.state().resources.sprints.data.items.map((s) => s.id),
    ['s', 'target'],
  );
  await b.controller.loadMore('sprints');
  assert.equal(server.requests.filter((r) => r.query.has('cursor')).length, 1);
});

for (const mismatch of ['revision', 'duplicate', 'cursor', 'server', 'overflow']) {
  test(`pagination ${mismatch} is changed, retains old rows as stale and requires a fresh first page`, async (t) => {
    const server = sprintServer();
    server.list = { ...list, items: [sprint], total: 2, nextCursor: 'next' };
    const b = await mountedSprint(t, { server });
    server.get = ({ path, query }) => {
      if (!path.endsWith('/sprints') || !query.has('cursor')) return;
      if (mismatch === 'server') return Response.json({ code: 'page-changed' }, { status: 409 });
      return Response.json({
        ...list,
        items:
          mismatch === 'duplicate'
            ? [sprint]
            : mismatch === 'overflow'
              ? [plannedSprint(), { ...plannedSprint(), id: 'another' }]
              : [plannedSprint()],
        total: 2,
        nextCursor: mismatch === 'cursor' ? 'next' : null,
        revision: mismatch === 'revision' ? 9 : 4,
      });
    };
    await b.controller.loadMore('sprints');
    assert.equal(b.state().resources.sprints.status, 'changed');
    assert.equal(b.state().resources.sprints.data.items.length, 1);
    const count = server.requests.length;
    await b.controller.loadMore('sprints');
    assert.equal(server.requests.length, count);
    server.get = null;
    await b.controller.reload('sprints');
    assert.equal(b.state().resources.sprints.status, 'ready');
    assert.equal(b.state().resources.sprints.stale, false);
  });
}

test('failed load-more retains rows and an explicit first-page retry recovers without a write', async (t) => {
  const server = sprintServer();
  server.list = { ...list, items: [sprint], total: 2, nextCursor: 'next' };
  const b = await mountedSprint(t, { server });
  server.get = ({ query }) => {
    if (query.has('cursor')) throw new Error('offline');
  };
  await b.controller.loadMore('sprints');
  assert.equal(b.state().resources.sprints.status, 'error');
  assert.equal(b.state().resources.sprints.data.items[0].id, 's');
  server.get = null;
  await b.controller.reload('sprints');
  assert.equal(b.state().resources.sprints.status, 'ready');
});

test('scope and task/sprint history expose bounded independent pages with canonical totals', async (t) => {
  const server = sprintServer();
  server.scope = { ...scope, total: 2, nextCursor: 'scope-next' };
  const fact = {
    id: 'fact',
    sprintId: 's',
    taskId: 't',
    participationId: 'visit',
    ordinal: 1,
    kind: 'entry',
    action: 'set-task-sprint',
    occurredAt: sprint.createdAt,
    before: null,
    after: task.snapshot,
    actor: sprint.creator,
    provenance: sprint.provenance,
  };
  server.history = { ...history, items: [fact], total: 2, nextCursor: 'history-next' };
  const b = await mountedSprint(t, { server });
  server.get = ({ path, query }) => {
    if (!query.has('cursor')) return;
    if (path.endsWith('/scope'))
      return Response.json({
        ...server.scope,
        items: [{ ...scope.items[0], id: 'visit-2', taskId: 't2' }],
        nextCursor: null,
      });
    return Response.json({
      ...server.history,
      sprintId: path.endsWith('/sprint-history') ? null : 's',
      taskId: path.endsWith('/sprint-history') ? 't' : null,
      items: [{ ...fact, id: 'fact-2', ordinal: 2 }],
      nextCursor: null,
    });
  };
  for (const name of ['scope', 'sprintHistory', 'taskHistory']) {
    await b.controller.loadMore(name);
    assert.equal(b.state().resources[name].data.items.length, 2);
    assert.equal(b.state().resources[name].status, 'ready');
  }
  assert.deepEqual(b.state().resources.scope.data.currentTotals, scope.currentTotals);
});

test('close requires explicit pending-work destination and uses the exact complete server binding', async (t) => {
  const b = await mountedSprint(t);
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'preview-required');
  assert.equal(await b.controller.preview(null), true);
  assert.equal(b.state().resources.preview.data.pendingParticipants, 1);
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'preview-required');
  await b.controller.preview('backlog');
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'ready');
  b.server.post = ({ init }) => {
    const input = JSON.parse(init.body);
    assert.deepEqual(input, {
      expectedVersion: 2,
      expectedProjectVersion: 2,
      expectedTaskRevision: 5,
      expectedSprintRevision: 4,
      expectedTargetVersion: null,
      destination: 'backlog',
      previewSchema: 1,
      previewHash: 'a'.repeat(64),
    });
    const result = closeResult();
    b.server.sprint = result.current;
    return Response.json(result);
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.sprint.data.state, 'closed');
  assert.equal(b.state().resources.closure.data.destination, 'backlog');
  assert.equal(b.state().resources.outcomes.data.items[0].disposition, 'backlog');
});

test('empty close preserves an explicit null destination; server totals are never recomputed', async (t) => {
  const b = await mountedSprint(t);
  const empty = { ...preview(), items: [], pendingParticipants: 0, total: 0, canClose: true };
  b.server.get = ({ path }) => (path.endsWith('/close-preview') ? Response.json(empty) : undefined);
  await b.controller.preview(null);
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'ready');
  b.server.post = ({ init }) => {
    assert.equal(JSON.parse(init.body).destination, null);
    const result = closeResult(empty);
    b.server.sprint = result.current;
    b.server.closure = result.closure;
    b.server.outcomes = { ...b.server.outcomes, total: 0, items: [] };
    return Response.json(result);
  };
  await b.controller.submit();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().resources.closure.data.total, 0);
});

test('destination replacement aborts obsolete previews; changed bindings cannot be appended', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  let signal;
  b.server.get = ({ path, query, init }) => {
    if (path.endsWith('/close-preview') && query.get('destination') === 'backlog') {
      signal = init.signal;
      return held.promise;
    }
  };
  const old = b.controller.preview('backlog');
  await b.controller.preview('target');
  held.resolve(Response.json(preview('backlog')));
  await old;
  assert.equal(signal.aborted, true);
  assert.equal(b.state().resources.preview.data.destination, 'target');
  b.server.get = ({ path, query }) =>
    path.endsWith('/close-preview')
      ? Response.json({
          ...preview('target'),
          total: 2,
          nextCursor: query.has('cursor') ? null : 'next',
          previewHash: (query.has('cursor') ? 'b' : 'a').repeat(64),
        })
      : undefined;
  await b.controller.preview('target');
  await b.controller.loadMore('preview');
  assert.equal(b.state().resources.preview.status, 'changed');
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'preview-required');
});

test('a stale staged close cannot submit or rebase; a new preview requires explicit discard and confirmation', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.preview('backlog');
  b.controller.stage({ type: 'close-sprint' });
  await b.controller.handleEvent({ type: 'reset' });
  assert.equal(b.state().resources.preview.stale, true);
  assert.equal(await b.controller.submit(), 'review-required');
  assert.equal(b.controller.rebaseDraft(), 'preview-required');
  assert.equal(await b.controller.preview('target'), false);
  await b.controller.reload('preview');
  assert.equal(b.state().resources.preview.stale, true);
  b.controller.discardDraft();
  await b.controller.preview('target');
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'ready');
  assert.equal(b.state().draft.input.destination, 'target');
  assert.equal(b.state().draft.input.expectedTargetVersion, 1);
  assert.equal(b.posts().length, 0);
});

test('unknown close retry keeps its original destination/hash even after stale preview and later reads', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.preview('target');
  b.controller.stage({ type: 'close-sprint' });
  b.server.post = () => {
    throw new Error('Committed response lost');
  };
  await b.controller.submit();
  await b.controller.handleEvent({ type: 'reset' });
  assert.equal(await b.controller.preview('backlog'), false);
  const result = closeResult(preview('target'));
  b.server.sprint = result.current;
  b.server.closure = result.closure;
  b.server.post = () => Response.json(result);
  await b.controller.retrySave();
  assert.equal(b.posts()[0].init.body, b.posts()[1].init.body);
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.state().mutation.result.closure.destination, 'target');
});

test('closed history/outcomes remain readable without close capability and cannot fabricate another closure', async (t) => {
  const server = sprintServer();
  server.sprint = closeResult().current;
  server.outcomes = { ...server.outcomes, total: 2, nextCursor: 'next' };
  server.closure.total = 2;
  const b = await mountedSprint(t, { server });
  assert.equal(b.state().resources.closure.status, 'ready');
  assert.equal(b.state().resources.outcomes.status, 'ready');
  assert.equal(await b.controller.preview('backlog'), false);
  server.get = ({ path, query }) =>
    path.endsWith('/outcomes') && query.has('cursor')
      ? Response.json({ ...server.outcomes, closureId: 'other', items: [], nextCursor: null })
      : undefined;
  await b.controller.loadMore('outcomes');
  assert.equal(b.state().resources.outcomes.status, 'changed');
  server.get = ({ path }) =>
    path.endsWith('/outcomes')
      ? Response.json({ ...server.outcomes, closureId: 'other', items: [] })
      : undefined;
  await b.controller.reload('outcomes');
  assert.equal(b.state().resources.outcomes.status, 'changed');
});

test('selection refuses dirty navigation, then clears entity data and obsolete reads after explicit discard', async (t) => {
  const b = await mountedSprint(t);
  b.controller.stage({ type: 'edit-sprint', fields });
  assert.equal(await b.controller.select(null, null), false);
  assert.equal(await b.controller.select('s', 't'), true);
  b.controller.discardDraft();
  assert.equal(await b.controller.select(null, null), true);
  assert.equal(b.state().resources.sprint.data, null);
  assert.equal(b.state().resources.taskHistory.data, null);
  await b.controller.selectTarget(null);
  assert.equal(b.state().resources.target.data, null);
  await b.controller.loadMore('scope');
  await b.controller.handleEvent({ type: 'denied', reason: 'forbidden' });
  assert.equal(b.state().status, 'forbidden');
  assert.equal(b.controller.stage({ type: 'create-sprint', fields }), 'unavailable');
});

test('suspending identity verification aborts pending work and preserves exact recovery only for the same session', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  b.server.post = () => held.promise;
  b.controller.stage({ type: 'edit-sprint', fields });
  const saving = b.controller.submit();
  const recovery = b.state().recovery;
  b.controller.suspend();
  assert.equal(b.state().status, 'verifying');
  assert.equal(b.state().mutation.status, 'unknown');
  assert.equal(await b.controller.retrySave(), 'unavailable');
  await b.controller.setContext(context);
  assert.equal(b.state().recovery, recovery);
  held.resolve(Response.json(sprint));
  await saving;
  assert.equal(b.state().mutation.status, 'unknown');
  b.server.post = () => Response.json(sprint);
  await b.controller.retrySave();
  assert.equal(b.posts()[0].init.body, b.posts()[1].init.body);
  assert.equal(
    b.posts()[0].init.headers['Idempotency-Key'],
    b.posts()[1].init.headers['Idempotency-Key'],
  );
  assert.equal(b.state().mutation.status, 'confirmed');
});

test('a relevant explicit reload invalidates a staged close without a stream hint', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.preview('backlog');
  b.controller.stage({ type: 'close-sprint' });
  await b.controller.reload('scope');
  assert.equal(b.state().resources.preview.stale, true);
  assert.equal(await b.controller.submit(), 'review-required');
  assert.equal(b.posts().length, 0);
});

test('retrying scope while preview is pending aborts it and leaves a reachable idle preview state', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  let signal;
  b.server.get = ({ path, init }) => {
    if (path.endsWith('/close-preview')) {
      signal = init.signal;
      return held.promise;
    }
  };
  const pending = b.controller.preview('backlog');
  await b.controller.reload('scope');
  assert.equal(signal.aborted, true);
  assert.equal(b.state().resources.preview.status, 'idle');
  held.resolve(Response.json(preview('backlog')));
  await pending;
  assert.equal(b.state().resources.preview.data, null);
  b.server.get = null;
  await b.controller.preview('backlog');
  assert.equal(b.state().resources.preview.status, 'ready');
});

test('a newer server preview cannot close metadata the client has not yet read and reviewed', async (t) => {
  const b = await mountedSprint(t);
  b.server.get = ({ path }) =>
    path.endsWith('/close-preview')
      ? Response.json({ ...preview('backlog'), expectedVersion: 3 })
      : undefined;
  await b.controller.preview('backlog');
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'stale');
  assert.equal(b.posts().length, 0);
});

test('editable intents cannot replace the authenticated project context or captured versions', async (t) => {
  const b = await mountedSprint(t);
  for (const intent of [
    { type: 'configure-planning', settings },
    { type: 'create-sprint', fields },
    { type: 'edit-sprint', fields },
  ]) {
    assert.equal(
      b.controller.stage({
        ...intent,
        workspaceId: 'foreign',
        projectId: 'foreign',
        expectedVersion: 99,
        expectedProjectVersion: 99,
        actor: 'forged',
      }),
      'ready',
    );
    assert.equal(b.state().draft.workspaceId, 'w');
    assert.equal(b.state().draft.projectId, 'p');
    assert.equal(b.state().draft.actor, undefined);
    assert.equal(
      b.state().draft[
        intent.type === 'create-sprint' ? 'expectedProjectVersion' : 'expectedVersion'
      ],
      2,
    );
    b.controller.discardDraft();
  }
});

test('target edits retain captured source/task concurrency and input extras/order even after canonical source resources advance', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.selectTarget('target');
  assert.equal(b.controller.stage({ type: 'set-task-sprint', targetSprintId: null }), 'ready');
  const command = {
    futureCommand: 'retained',
    ...b.state().draft,
    input: { futureInput: 'retained', ...b.state().draft.input },
  };
  b.server.task.snapshot.version = 10;
  b.server.task.currentParticipation = { id: 'later-visit', sprint: { ...sprint, version: 8 } };
  await b.controller.reload('task');
  assert.equal(b.state().needsReview, true);
  const changed = changeSprintCommand(
    command,
    { type: 'set-task-sprint', targetSprintId: 'target' },
    b.state(),
  );
  assert.deepEqual(changed.input, {
    ...command.input,
    targetSprintId: 'target',
    expectedTargetVersion: 1,
  });
  assert.deepEqual(Object.keys(changed), Object.keys(command));
  assert.deepEqual(Object.keys(changed.input), Object.keys(command.input));
  assert.equal(changed.futureCommand, command.futureCommand);
  assert.equal(changed.input.expectedTaskVersion, 3);
  assert.equal(changed.input.expectedCurrentParticipationId, 'visit');
  assert.equal(changed.input.expectedSourceVersion, 2);
  assert.equal(
    b.controller.changeDraft({ type: 'set-task-sprint', targetSprintId: 'target' }),
    'ready',
  );
  assert.equal(b.state().draft.input.expectedSourceVersion, 2);
  assert.equal(await b.controller.submit(), 'review-required');
  assert.equal(b.controller.rebaseDraft(), 'ready');
  assert.equal(b.state().draft.input.expectedTaskVersion, 10);
  assert.equal(b.state().draft.input.expectedCurrentParticipationId, 'later-visit');
  assert.equal(b.state().draft.input.expectedSourceVersion, 8);
});

test('unknown participation retry retains its immutable original command/body/key after later canonical source and destination reads', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.selectTarget('target');
  assert.equal(b.controller.stage({ type: 'set-task-sprint', targetSprintId: 'target' }), 'ready');
  b.server.post = () => {
    throw new Error('committed response lost');
  };
  await b.controller.submit();
  const recovery = b.state().recovery;
  assert.equal(b.state().mutation.status, 'unknown');
  assert.ok(Object.isFrozen(recovery.command.input));
  b.server.task.currentParticipation = null;
  b.server.task.snapshot.version = 12;
  b.server.target.version = 9;
  await b.controller.refresh();
  assert.equal(b.state().recovery, recovery);
  b.server.post = () =>
    Response.json({
      operation: {
        type: 'set-task-sprint',
        activityId: 'a',
        sprintId: 'target',
        exitedVisitId: 'visit',
        enteredVisitId: 'new-visit',
      },
      current: b.server.task,
    });
  await b.controller.retrySave();
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.posts().length, 2);
  assert.equal(b.posts()[0].init.body, b.posts()[1].init.body);
  assert.equal(
    b.posts()[0].init.headers['Idempotency-Key'],
    b.posts()[1].init.headers['Idempotency-Key'],
  );
  assert.equal(JSON.parse(b.posts()[1].init.body).expectedSourceVersion, 2);
  assert.equal(JSON.parse(b.posts()[1].init.body).expectedTargetVersion, 1);
});

test('close preview continuation rejects a changed target version even when the hash and destination stay unchanged', async (t) => {
  const b = await mountedSprint(t);
  b.server.get = ({ path, query }) =>
    path.endsWith('/close-preview')
      ? Response.json({
          ...preview('target'),
          total: 2,
          expectedTargetVersion: query.has('cursor') ? 2 : 1,
          nextCursor: query.has('cursor') ? null : 'next',
          items: [
            {
              ...preview('target').items[0],
              participationId: query.has('cursor') ? 'tail' : 'first',
            },
          ],
        })
      : undefined;
  await b.controller.preview('target');
  const before = b.state().resources.preview.data;
  await b.controller.loadMore('preview');
  assert.equal(b.state().resources.preview.status, 'changed');
  assert.equal(b.state().resources.preview.data, before);
  assert.equal(b.state().resources.preview.failure.code, 'page-changed');
  assert.equal(b.controller.stage({ type: 'close-sprint' }), 'preview-required');
  assert.equal(b.posts().length, 0);
});

test('a status-only planning transport conflict retains the participation draft and requires review without automatic write or retry', async (t) => {
  const server = sprintServer();
  t.mock.method(globalThis, 'fetch', server.fetch);
  const tasks = createTaskPlanningTransport();
  const send = t.mock.method(tasks, 'setSprint', async () => {
    throw new TaskPlanningFailure(409);
  });
  const controller = createSprintController({ planning: createSprintPlanningTransport(), tasks });
  t.after(() => controller.dispose());
  await controller.setContext(context);
  await controller.select('s', 't');
  await controller.selectTarget('target');
  assert.equal(controller.stage({ type: 'set-task-sprint', targetSprintId: 'target' }), 'ready');
  const draft = controller.getState().draft;
  await controller.submit();
  const state = controller.getState();
  assert.equal(state.draft, draft);
  assert.equal(state.mutation.status, 'conflict');
  assert.deepEqual(state.mutation.failure, { status: 409, code: null, requestId: null });
  assert.equal(state.mutation.current, null);
  assert.equal(state.recovery, null);
  assert.equal(state.needsReview, true);
  assert.equal(send.mock.callCount(), 1);
  assert.equal(await controller.submit(), 'review-required');
  assert.equal(await controller.retrySave(), 'unavailable');
  assert.equal(send.mock.callCount(), 1);
  assert.equal(server.requests.filter(({ init }) => init.method === 'POST').length, 0);
});

test('a former confirmed parent refresh cannot block or read into a replacement authenticated lifetime', async (t) => {
  const held = deferred();
  const started = deferred();
  const b = await mountedSprint(t, {
    confirmed: () => {
      started.resolve();
      return held.promise;
    },
  });
  b.server.post = () => Response.json(sprint);
  b.controller.stage({ type: 'create-sprint', fields });
  const saving = b.controller.submit();
  await started.promise;
  assert.equal(b.state().mutation.status, 'confirmed');
  b.server.planning.projectVersion = 9;
  await b.controller.setContext({ ...context, sessionId: 'new-session' });
  assert.equal(b.state().resources.planning.status, 'ready');
  assert.equal(b.state().resources.planning.data.projectVersion, 9);
  assert.equal(b.state().draft, null);
  assert.equal(b.state().recovery, null);
  assert.equal(b.state().mutation.status, 'idle');
  const requests = b.server.requests.length;
  held.resolve();
  await saving;
  assert.equal(b.server.requests.length, requests);
  assert.equal(b.state().resources.planning.data.projectVersion, 9);
});

test('a Query response completing after original expiry is discarded by the live controller authority fence', async (t) => {
  let time = 0;
  const b = await mountedSprint(t, { now: () => time });
  const held = deferred();
  const started = deferred();
  b.server.get = ({ path }) => {
    if (path.endsWith('/planning')) {
      started.resolve();
      return held.promise;
    }
  };
  const reading = b.controller.reload('planning');
  await started.promise;
  time = Date.parse(context.expiresAt);
  held.resolve(Response.json(planning));
  await reading;
  assert.equal(b.state().status, 'signed-out');
  assert.equal(b.state().context, null);
  for (const value of Object.values(b.state().resources)) assert.equal(value.data, null);
});

test('an expired Query create cannot expose its late receipt or request parent refresh', async (t) => {
  let time = 0;
  let refreshed = 0;
  const b = await mountedSprint(t, {
    now: () => time,
    confirmed: async () => {
      refreshed++;
    },
  });
  const held = deferred();
  const started = deferred();
  b.server.post = () => {
    started.resolve();
    return held.promise;
  };
  b.controller.stage({ type: 'create-sprint', fields });
  const saving = b.controller.submit();
  await started.promise;
  time = Date.parse(context.expiresAt);
  held.resolve(Response.json(sprint));
  await saving;
  assert.equal(b.state().status, 'signed-out');
  assert.equal(b.state().mutation.result, null);
  assert.equal(b.state().recovery, null);
  assert.equal(refreshed, 0);
});

test('duplicate held legacy scope paging sends once and leaves Query planning/list DTOs unchanged', async (t) => {
  const server = sprintServer();
  server.scope = { ...scope, total: 2, nextCursor: 'scope-next' };
  const b = await mountedSprint(t, { server });
  const planningBefore = b.state().resources.planning.data;
  const sprintsBefore = b.state().resources.sprints.data;
  const held = deferred();
  const started = deferred();
  server.get = ({ path, query }) => {
    if (path.endsWith('/scope') && query.has('cursor')) {
      started.resolve();
      return held.promise;
    }
  };
  const paging = b.controller.loadMore('scope');
  await started.promise;
  assert.equal(b.state().resources.scope.loadingMore, true);
  await b.controller.loadMore('scope');
  const pages = () =>
    server.requests.filter((r) => r.path.endsWith('/scope') && r.query.has('cursor'));
  assert.equal(pages().length, 1);
  assert.equal(b.state().resources.planning.data, planningBefore);
  assert.equal(b.state().resources.sprints.data, sprintsBefore);
  held.resolve(
    Response.json({
      ...server.scope,
      items: [{ ...scope.items[0], id: 'visit-2', taskId: 't2' }],
      nextCursor: null,
    }),
  );
  await paging;
  assert.equal(pages().length, 1);
  assert.equal(b.state().resources.scope.loadingMore, false);
  assert.equal(b.state().resources.scope.status, 'ready');
  assert.deepEqual(
    b.state().resources.scope.data.items.map((item) => item.id),
    ['visit', 'visit-2'],
  );
  assert.equal(b.state().resources.scope.data.total, 2);
  const requestsAfterTail = server.requests.length;
  await b.controller.loadMore('scope');
  assert.equal(server.requests.length, requestsAfterTail, 'an exhausted legacy page sends nothing');
  assert.equal(b.state().resources.scope.status, 'ready');
  assert.equal(b.state().resources.scope.data.items.length, 2);
  assert.equal(b.state().resources.planning.data, planningBefore);
  assert.equal(b.state().resources.sprints.data, sprintsBefore);
  assert.equal(b.posts().length, 0);
});
