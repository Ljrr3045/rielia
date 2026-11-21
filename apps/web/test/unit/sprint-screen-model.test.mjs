import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sprintScreenModel, sprintNavigationGuard } from '../../src/lib/sprint-screen-model.ts';
import {
  beginSprintForm,
  parseSprintForm,
  submitSprintForm,
  sprintEstimateOptions,
} from '../../src/lib/sprint-form-state.ts';
import {
  context,
  mountedSprint,
  plannedSprint,
  sprint,
  task,
  deferred,
} from './sprint-client-fixtures.mjs';

function parent() {
  return {
    status: 'ready',
    session: {
      user: { id: context.userId },
      session: { id: context.sessionId, expiresAt: context.expiresAt },
    },
    selection: { workspaceId: 'w', projectId: 'p', taskId: 't' },
    project: { id: 'p', workspaceId: 'w' },
    task: { id: 't', workspaceId: 'w', projectId: 'p' },
    draftGuard: { kind: 'none' },
    sprintLocation: { view: 'sprints', sprintId: 's' },
  };
}
const model = (b, p = parent(), now) => sprintScreenModel(b.state(), p, now);
const edit = (form, changes) => ({ ...form, fields: { ...form.fields, ...changes } });

test('screen ports expose canonical data and independent public capabilities without issuing writes', async (t) => {
  const b = await mountedSprint(t);
  const view = model(b);
  assert.equal(view.visible, true);
  assert.equal(view.resources.scope.data, b.state().resources.scope.data);
  assert.equal(view.sprint.goal, sprint.goal);
  assert.equal(view.task.snapshot.estimatePoints, null);
  assert.deepEqual(view.actions, {
    configure: true,
    create: true,
    edit: true,
    start: false,
    close: true,
    estimate: true,
    participation: true,
  });
  assert.equal(view.startReview, null);
  assert.equal(b.posts().length, 0);
  assert.equal(
    b.server.requests.some((r) => r.path.endsWith('close-preview')),
    false,
  );
});

for (const status of ['loading', 'error', 'signed-out', 'forbidden', 'disabled', 'empty']) {
  test(`parent ${status} cannot expose any sprint resources, recovery, comparisons or action`, async (t) => {
    const b = await mountedSprint(t);
    beginSprintForm(b.controller, b.state(), 'edit-sprint');
    const view = model(b, { ...parent(), status });
    assert.equal(view.visible, false);
    for (const key of [
      'resources',
      'planning',
      'sprint',
      'task',
      'recovery',
      'mutation',
      'startReview',
      'closeReview',
      'conflictReview',
    ])
      assert.equal(view[key], null, key);
    assert.ok(Object.values(view.actions).every((value) => value === false));
    assert.equal(
      view.guard,
      'none',
      'hidden drafts must not be rendered in a new execution lifetime',
    );
  });
}

test('replaced session, principal, workspace, project, task and expired lifetimes are fenced synchronously', async (t) => {
  const b = await mountedSprint(t);
  const p = parent();
  const variants = [
    { ...p, session: null },
    { ...p, session: { ...p.session, user: { id: 'other' } } },
    { ...p, session: { ...p.session, session: { ...p.session.session, id: 'other' } } },
    { ...p, selection: { ...p.selection, workspaceId: 'other' } },
    { ...p, selection: { ...p.selection, projectId: 'other' } },
    { ...p, selection: { ...p.selection, taskId: 'other' } },
    { ...p, project: { id: 'other', workspaceId: 'w' } },
    { ...p, session: { ...p.session, session: { ...p.session.session, expiresAt: 'invalid' } } },
  ];
  for (const variant of variants) {
    const view = model(b, variant);
    assert.equal(view.visible, false);
    assert.equal(view.resources, null);
    assert.equal(view.mutation, null);
  }
  assert.equal(model(b, p, Date.parse(context.expiresAt)).visible, false);
  const missingTask = model(b, { ...p, task: null });
  assert.equal(missingTask.resources.task.data, null);
  assert.equal(missingTask.resources.taskHistory.data, null);
  assert.equal(missingTask.actions.estimate, false);
});

test('authorized read-only DTOs keep scope/history and have no mutation affordances', async (t) => {
  const b = await mountedSprint(t);
  b.server.planning.capabilities = { canConfigurePlanning: false, canCreateSprint: false };
  b.server.sprint.capabilities = {
    canEdit: false,
    canStart: false,
    canClose: false,
    canChangeScope: false,
  };
  b.server.task.capabilities = { canEstimate: false, canChangeScope: false };
  await b.controller.refresh();
  const view = model(b);
  assert.equal(view.visible, true);
  assert.ok(view.resources.scope.data);
  assert.ok(view.resources.sprintHistory.data);
  assert.ok(view.resources.taskHistory.data);
  assert.ok(Object.values(view.actions).every((value) => value === false));
  assert.equal(beginSprintForm(b.controller, b.state(), 'edit-sprint').reason, 'forbidden');
  assert.equal(b.posts().length, 0);
});

test('parent drafts and stale resources suppress new mutations without replacing captured commands', async (t) => {
  const b = await mountedSprint(t);
  const view = model(b, { ...parent(), draftGuard: { kind: 'draft' } });
  assert.ok(Object.values(view.actions).every((value) => value === false));
  assert.ok(view.resources.sprint.data);
  const { form } = beginSprintForm(b.controller, b.state(), 'edit-sprint');
  assert.ok(form);
  assert.equal(model(b).guard, 'draft');
  assert.ok(Object.values(model(b).actions).every((value) => value === false));
  b.controller.discardDraft();
  b.server.get = () => Response.json({ code: 'unavailable' }, { status: 503 });
  await b.controller.refresh();
  assert.ok(Object.values(model(b).actions).every((value) => value === false));
});

test('start review binds canonical complete totals and current public versions and never auto-submits', async (t) => {
  const b = await mountedSprint(t);
  b.server.sprint = plannedSprint('s');
  b.server.scope.sprintVersion = 1;
  b.server.scope.currentTotals.pending = 103;
  await b.controller.refresh();
  const view = model(b);
  assert.equal(view.actions.start, true);
  assert.equal(view.startReview.totals.pending, 103, 'visible row count is not canonical scope');
  assert.equal(view.startReview.command.input.expectedVersion, 1);
  assert.equal(view.startReview.command.input.expectedTaskRevision, b.server.scope.taskRevision);
  assert.equal(
    view.startReview.command.input.expectedProjectVersion,
    b.server.planning.projectVersion,
  );
  assert.equal(view.startReview.timeZone, b.server.sprint.timeZone);
  assert.equal(b.state().draft, null);
  assert.equal(b.posts().length, 0);
  b.server.scope.sprintVersion = 3;
  await b.controller.reload('scope');
  assert.equal(model(b).startReview, null);
});

test('close review stays bound to the reviewed destination and rejects stale/incomplete decisions', async (t) => {
  const b = await mountedSprint(t);
  await b.controller.preview('backlog');
  const view = model(b);
  assert.equal(view.closeReview.canConfirm, true);
  assert.equal(view.closeReview.reviewedDestination, 'backlog');
  assert.equal(view.closeReview.preview.pendingParticipants, 1);
  // A raw form select is intentionally independent of the server-issued binding.
  const raw = { destination: 'target' };
  assert.equal(raw.destination, 'target');
  assert.equal(model(b).closeReview.reviewedDestination, 'backlog');
  b.server.get = () => Response.json({ code: 'unavailable' }, { status: 503 });
  await b.controller.refresh();
  assert.equal(model(b).closeReview.canConfirm, false);
  assert.equal(b.posts().length, 0);
});

for (const status of [401, 403]) {
  test(`sprint ${status} clears private ports and offers the correct parent/access recovery`, async (t) => {
    const b = await mountedSprint(t);
    b.server.get = () => Response.json({ code: 'denied' }, { status });
    await b.controller.refresh();
    const view = model(b);
    assert.equal(view.visible, false);
    assert.equal(view.resources, null);
    assert.equal(view.recoveryAction, status === 401 ? 'verify-parent' : 'recheck-access');
    assert.equal(b.posts().length, 0);
  });
}

for (const type of [
  'create-sprint',
  'edit-sprint',
  'configure-planning',
  'estimate-task',
  'set-task-sprint',
]) {
  test(`opening ${type} captures a draft before editing and does not submit`, async (t) => {
    const b = await mountedSprint(t);
    const opened = beginSprintForm(b.controller, b.state(), type);
    assert.equal(opened.reason, 'ready');
    assert.equal(opened.form.type, type);
    assert.equal(b.state().draft.type, type);
    assert.equal(sprintNavigationGuard(b.state()), 'draft');
    assert.equal(b.posts().length, 0);
  });
}

test('raw metadata errors keep the form and captured version; explicit review preserves values', async (t) => {
  const b = await mountedSprint(t);
  const { form } = beginSprintForm(b.controller, b.state(), 'edit-sprint');
  const invalid = edit(form, { name: ' ', startDate: '2026-02-30', goal: 'Human draft' });
  const rejected = await submitSprintForm(b.controller, b.state(), invalid);
  assert.equal(rejected.reason, 'invalid');
  assert.equal(rejected.errors.name, 'required');
  assert.equal(rejected.errors.startDate, 'invalid');
  assert.equal(b.posts().length, 0);
  b.server.sprint.version = 4;
  b.server.sprint.goal = 'Other author';
  await b.controller.refresh();
  const corrected = edit(form, { name: ' Revised ', goal: ' Human draft ' });
  assert.equal(
    (await submitSprintForm(b.controller, b.state(), corrected)).reason,
    'review-required',
  );
  assert.equal(b.state().draft.expectedVersion, 2);
  assert.equal(b.state().draft.fields.goal, 'Human draft');
  assert.equal(b.posts().length, 0);
  assert.equal(b.controller.rebaseDraft(), 'ready');
  b.server.post = ({ init }) => {
    const input = JSON.parse(init.body);
    assert.equal(input.expectedVersion, 4);
    assert.equal(input.goal, 'Human draft');
    return Response.json({ ...b.server.sprint, ...input, version: 5 });
  };
  assert.equal((await submitSprintForm(b.controller, b.state(), corrected)).reason, 'ready');
  assert.equal(b.state().mutation.status, 'confirmed');
});

test('settings conversion rejects empty/coercible/unsorted scales and uses public zone validation', async (t) => {
  const b = await mountedSprint(t);
  const { form } = beginSprintForm(b.controller, b.state(), 'configure-planning');
  for (const pointScale of ['', '0,,1', '0,1,', '1e2', '0,1.5', '1,0', '0,0', '1001']) {
    const result = await submitSprintForm(b.controller, b.state(), edit(form, { pointScale }));
    assert.equal(result.errors.pointScale, 'invalid', pointScale);
    assert.equal(b.posts().length, 0);
  }
  const invalid = parseSprintForm(edit(form, { mode: 'other', timeZone: 'not-a-zone' }));
  assert.deepEqual(invalid.errors, { mode: 'invalid', timeZone: 'invalid' });
  b.server.post = ({ init }) => {
    const input = JSON.parse(init.body);
    assert.deepEqual(input, {
      expectedVersion: 2,
      mode: 'kanban',
      timeZone: 'America/Caracas',
      pointScale: [0, 2, 8],
    });
    return Response.json({ ...b.server.planning, ...input, projectVersion: 3 });
  };
  await submitSprintForm(
    b.controller,
    b.state(),
    edit(form, {
      mode: 'kanban',
      timeZone: ' America/Caracas ',
      pointScale: '0, 2, 8',
    }),
  );
  assert.equal(b.state().mutation.status, 'confirmed');
});

for (const [raw, value] of [
  ['', null],
  ['0', 0],
  ['13', 13],
]) {
  test(`raw estimate '${raw}' remains distinct and retains the original Task version`, async (t) => {
    const b = await mountedSprint(t);
    b.server.task.snapshot.estimatePoints = 13;
    await b.controller.reload('task');
    const { form } = beginSprintForm(b.controller, b.state(), 'estimate-task');
    assert.deepEqual(sprintEstimateOptions([0, 1, 5], 13), ['0', '1', '5', '13']);
    assert.deepEqual(sprintEstimateOptions([0, 1], null), ['0', '1']);
    b.server.post = ({ init }) => {
      assert.deepEqual(JSON.parse(init.body), { expectedVersion: 3, estimatePoints: value });
      return Response.json({
        ...task,
        snapshot: { ...task.snapshot, version: 4, estimatePoints: value },
      });
    };
    await submitSprintForm(b.controller, b.state(), edit(form, { estimate: raw }));
    assert.equal(b.state().mutation.status, 'confirmed');
    assert.equal(b.posts().length, 1);
  });
}

test('participation requires an explicit current target read and retains source preconditions', async (t) => {
  const b = await mountedSprint(t);
  const { form } = beginSprintForm(b.controller, b.state(), 'set-task-sprint');
  assert.equal(form.fields.destination, 's');
  const changed = edit(form, { destination: 'target' });
  assert.equal((await submitSprintForm(b.controller, b.state(), changed)).reason, 'unavailable');
  assert.equal(b.posts().length, 0);
  await b.controller.selectTarget('target');
  assert.equal(b.posts().length, 0);
  b.server.post = ({ init }) => {
    assert.deepEqual(JSON.parse(init.body), {
      expectedTaskVersion: 3,
      expectedCurrentParticipationId: 'visit',
      expectedSourceVersion: 2,
      targetSprintId: 'target',
      expectedTargetVersion: 1,
    });
    return Response.json({
      operation: {
        type: 'set-task-sprint',
        activityId: 'a',
        sprintId: 'target',
        enteredVisitId: 'new',
        exitedVisitId: 'visit',
      },
      current: { ...task, currentParticipation: { id: 'new', sprint: b.server.target } },
    });
  };
  await submitSprintForm(b.controller, b.state(), changed);
  assert.equal(b.state().mutation.status, 'confirmed');
  assert.equal(b.posts().length, 1);
});

test('form submit cannot replace pending/unknown intent and retry retains exact normalized body/key', async (t) => {
  const b = await mountedSprint(t);
  const held = deferred();
  b.server.post = () => held.promise;
  const { form } = beginSprintForm(b.controller, b.state(), 'edit-sprint');
  const changed = edit(form, { goal: 'Original goal' });
  const saving = submitSprintForm(b.controller, b.state(), changed);
  assert.equal(sprintNavigationGuard(b.state()), 'pending');
  assert.equal(
    (await submitSprintForm(b.controller, b.state(), edit(form, { goal: 'Replacement' }))).reason,
    'busy',
  );
  held.reject(new Error('Committed response lost'));
  await saving;
  assert.equal(sprintNavigationGuard(b.state()), 'recovery');
  const recovery = b.state().recovery;
  assert.equal(
    (await submitSprintForm(b.controller, b.state(), edit(form, { goal: 'Replacement' }))).reason,
    'busy',
  );
  assert.equal(b.state().recovery, recovery);
  b.server.post = () => Response.json(sprint);
  await b.controller.retrySave();
  assert.equal(b.posts().length, 2);
  assert.equal(b.posts()[1].init.body, b.posts()[0].init.body);
  assert.equal(
    b.posts()[1].init.headers['Idempotency-Key'],
    b.posts()[0].init.headers['Idempotency-Key'],
  );
  assert.equal(sprintNavigationGuard(b.state()), 'none');
});

test('409 comparison keeps public current separate from form and rebase never saves by itself', async (t) => {
  const b = await mountedSprint(t);
  const { form } = beginSprintForm(b.controller, b.state(), 'edit-sprint');
  b.server.sprint.version = 8;
  b.server.sprint.goal = 'Other author';
  b.server.post = () =>
    Response.json({ code: 'version-conflict', current: b.server.sprint }, { status: 409 });
  await submitSprintForm(b.controller, b.state(), edit(form, { goal: 'My value' }));
  const view = model(b);
  assert.equal(view.conflictReview.draft.fields.goal, 'My value');
  assert.equal(view.conflictReview.current.goal, 'Other author');
  assert.equal(
    view.conflictReview.canRebase,
    false,
    'conflict needs an explicit canonical refresh',
  );
  assert.equal(b.posts().length, 1);
  await b.controller.refresh();
  assert.equal(model(b).conflictReview.canRebase, true);
  b.controller.rebaseDraft();
  assert.equal(b.posts().length, 1);
  assert.equal(b.state().draft.fields.goal, 'My value');
  assert.equal(b.state().draft.expectedVersion, 8);
});

test('forms from another context or selected task cannot be applied to a new captured draft', async (t) => {
  const b = await mountedSprint(t);
  const { form } = beginSprintForm(b.controller, b.state(), 'estimate-task');
  const foreign = { ...form, identity: 'former-session' };
  assert.equal((await submitSprintForm(b.controller, b.state(), foreign)).reason, 'unavailable');
  b.controller.discardDraft();
  await b.controller.select('s', null);
  assert.equal((await submitSprintForm(b.controller, b.state(), form)).reason, 'unavailable');
  assert.equal(b.posts().length, 0);
});
