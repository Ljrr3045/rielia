import assert from 'node:assert/strict';
import { test } from 'node:test';
import { act, deferred } from './dom-harness.mjs';
import { task, project } from './project-hook-harness.mjs';
import { mountProjectInteractions } from './project-interaction-harness.mjs';

for (const strict of [false, true]) {
  test(
    `edit captures version N through a real refresh to N+1; StrictMode=${strict}`,
    { timeout: 30_000 },
    async (t) => {
      const b = await mountProjectInteractions(t, {
        search: '?workspace=a&project=p&task=t1',
        strict,
      });
      assert.equal(b.state.canonical.status, 'ready');
      b.server.mutate = () => Response.json(task(1, 'a', 'p', 2));
      await act(async () => b.state.content.openTaskEdit());
      b.server.version = 2;
      await act(async () => b.state.canonical.refresh());
      assert.equal(b.state.canonical.task.version, 2);
      await act(async () => b.state.content.stageTask({ title: '  Captured version  ' }));
      assert.equal(b.state.canonical.draft.expectedVersion, 1);
      assert.equal(b.state.canonical.draft.taskId, 't1');
      assert.equal(b.state.canonical.draft.fields.title, '  Captured version  ');
      await act(async () => b.state.content.submitTaskForm());
      const post = b.posts().at(-1);
      assert.equal(JSON.parse(post.options.body).expectedVersion, 1);
      assert.equal(JSON.parse(post.options.body).title, 'Captured version');
      assert.equal(b.state.content.form, null);
      await b.framesUntilIdle();
    },
  );
}

test(
  'workspace Stay retains controlled form state and suppresses destination reads',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    await act(async () => b.state.content.openTaskEdit());
    await act(async () => b.state.content.stageTask({ title: 'Retained workspace draft' }));
    await act(async () => b.state.canonical.selectWorkspace('b'));
    assert.equal(b.state.canonical.workspaceNavigation.workspaceId, 'b');
    assert.equal(b.state.content.form.kind, 'task-edit');
    assert.equal(b.state.content.taskValue.title, 'Retained workspace draft');
    assert.equal(b.reads('/api/v1/workspaces/b').length, 0);
    await act(async () => b.state.canonical.resolveWorkspaceNavigation('stay'));
    assert.equal(b.state.content.taskValue.title, 'Retained workspace draft');
    assert.equal(b.state.canonical.selection.workspaceId, 'a');
    assert.equal(b.window.location.search.includes('workspace=a'), true);
  },
);

test(
  'unknown response preserves exact key and captured payload; explicit retry posts once more',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    await act(async () => b.state.content.openTaskEdit());
    await act(async () => b.state.content.stageTask({ title: 'Unknown outcome' }));
    b.server.mutate = () => {
      throw new Error('Lost response at HTTP boundary');
    };
    await act(async () => b.state.content.submitTaskForm());
    assert.equal(b.state.canonical.outcome, 'error');
    assert.equal(b.state.canonical.retryTarget.expectedVersion, 1);
    const first = b.posts()[0];
    await act(async () => b.state.content.stageTask({ title: 'Must not replace recovery' }));
    assert.equal(b.state.canonical.retryTarget.fields.title, 'Unknown outcome');
    assert.equal(b.posts().length, 1);
    b.server.mutate = () => Response.json(task(1));
    await act(async () => b.state.canonical.retrySave());
    assert.equal(b.posts().length, 2);
    assert.equal(b.posts()[1].options.body, first.options.body);
    assert.equal(
      b.posts()[1].options.headers['Idempotency-Key'],
      first.options.headers['Idempotency-Key'],
    );
    await b.framesUntilIdle();
  },
);

test(
  'pending duplicate submit cannot create another HTTP write',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    await act(async () => b.state.content.openTaskEdit());
    await act(async () => b.state.content.stageTask({ title: 'Pending intent' }));
    const response = deferred();
    b.server.mutate = () => response.promise;
    await act(async () => b.state.content.submitTaskForm());
    assert.equal(b.state.canonical.mutationPending, 'edit-task');
    await act(async () => {
      b.state.content.submitTaskForm();
      b.state.content.submitTaskForm();
    });
    assert.equal(b.posts().length, 1);
    await act(async () => response.resolve(Response.json(task(1))));
    await b.framesUntilIdle();
  },
);

test(
  'capture uses current list status, keeps unassigned creation and captures the chosen board column',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t);
    b.server.rows = 0;
    await act(async () => b.state.canonical.refresh());
    assert.equal(b.state.canonical.status, 'ready');
    await act(async () => b.state.canonical.setTaskFilters({ status: 'todo' }));
    await act(async () => b.state.content.stageCapture('  List capture  '));
    assert.equal(b.state.canonical.draft.fields.status, 'todo');
    assert.equal('assigneePrincipalId' in b.state.canonical.draft.fields, false);
    await act(async () => b.state.content.discardCurrentDraft());
    await act(async () => b.state.canonical.setTaskFilters({}));
    await act(async () => b.state.canonical.setTaskLayout('board'));
    await act(async () => b.state.content.beginColumnCapture('in_progress'));
    await act(async () => b.state.content.stageCapture('Board capture'));
    assert.equal(b.state.canonical.draft.fields.status, 'in_progress');
    assert.equal(b.state.content.columnCaptureOpen, true);
    await b.framesUntilIdle();
  },
);

test(
  'real controller task/workspace replacement closes an off-target form; session replacement clears prior private rows',
  { timeout: 30_000 },
  async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    await act(async () => b.state.content.openTaskEdit());
    await act(async () => b.state.canonical.selectTask('t2'));
    assert.equal(b.state.content.form, null);
    assert.equal(b.state.canonical.task.id, 't2');
    b.server.session = {
      ...b.server.session,
      session: { ...b.server.session.session, id: 'replacement-session' },
    };
    await act(async () => b.state.canonical.refresh());
    assert.equal(b.state.canonical.task, null);
    assert.equal(b.state.content.form, null);
    assert.equal(b.state.canonical.selection.taskId, null);
  },
);

test('terminal lifecycle denial erases old intent and a newly opened form captures current authority', async (t) => {
  const b = await mountProjectInteractions(t);
  b.server.mutate = () => Response.json({ code: 'FORBIDDEN' }, { status: 403 });
  await act(async () => b.state.content.requestProjectArchive(false));
  await act(async () => b.state.content.confirmLifecycle());
  assert.equal(b.state.canonical.status, 'forbidden');
  assert.equal(b.state.content.form, null);
  await act(async () => b.state.content.resumeCurrentDraft());
  assert.equal(b.state.content.form, null);
  b.server.version = 2;
  await act(async () => b.state.canonical.refresh());
  await act(async () => b.state.content.resumeCurrentDraft());
  assert.equal(b.state.content.form, null);
  await act(async () => b.state.content.requestProjectArchive(false));
  assert.equal(b.state.content.form.kind, 'project-archive');
  assert.equal(b.state.content.form.version, 2);
  b.server.mutate = () =>
    Response.json({ ...project('p', 'a', 3), archivedAt: '2026-11-06T12:00:00.000Z' });
  await act(async () => b.state.content.confirmLifecycle());
  assert.equal(JSON.parse(b.posts()[1].options.body).expectedVersion, 2);
  assert.equal(b.posts().length, 2);
  await b.framesUntilIdle();
});

for (const operation of ['project', 'task'])
  test(`captured ${operation} archive can resume under current authority and explicitly review a conflict before a new key`, async (t) => {
    const b = await mountProjectInteractions(t, { search: '?workspace=a&project=p&task=t1' });
    if (operation === 'project')
      await act(async () => b.state.content.requestProjectArchive(false));
    else await act(async () => b.state.content.requestTaskArchive(false));
    const current = operation === 'project' ? project('p', 'a', 2) : task(1, 'a', 'p', 2);
    b.server.mutate = () => Response.json({ code: 'version-conflict', current }, { status: 409 });
    await act(async () => b.state.content.confirmLifecycle());
    assert.equal(b.state.canonical.outcome, 'conflict');
    const first = b.posts()[0];
    await act(async () => b.state.content.closeForm());
    await act(async () => b.state.content.resumeCurrentDraft());
    assert.equal(
      b.state.content.form.kind,
      operation === 'project' ? 'project-archive' : 'task-archive',
    );
    assert.equal(b.state.content.form.version, 1);
    b.server.version = 2;
    await act(async () => b.state.canonical.reloadConflict());
    assert.equal(
      b.state.content.form?.kind,
      operation === 'project' ? 'project-archive' : 'task-archive',
      'a canonical review probe cannot close the captured form',
    );
    await act(async () => b.state.content.keepDraftAfterConflict());
    await b.framesUntilIdle();
    assert.equal(b.state.canonical.draft.expectedVersion, 2);
    assert.equal(b.posts().length, 1, 'review does not resubmit');
    b.server.mutate = () =>
      Response.json({ ...current, version: 3, archivedAt: '2026-11-06T00:00:00.000Z' });
    await act(async () => b.state.content.confirmLifecycle());
    assert.equal(JSON.parse(b.posts()[1].options.body).expectedVersion, 2);
    assert.notEqual(
      b.posts()[1].options.headers['Idempotency-Key'],
      first.options.headers['Idempotency-Key'],
    );
  });

test('column capture cancellation discards only its local command and explicit submission uses the chosen column', async (t) => {
  const b = await mountProjectInteractions(t);
  b.server.rows = 0;
  await act(async () => b.state.canonical.refresh());
  await act(async () => b.state.canonical.setTaskLayout('board'));
  await act(async () => b.state.content.beginColumnCapture('todo'));
  await act(async () => b.state.content.stageCapture('Cancelled column title'));
  await act(async () => b.state.content.cancelColumnCapture());
  await b.framesUntilIdle();
  assert.equal(b.state.canonical.draft, null);
  assert.equal(b.state.content.captureTitle, '');
  assert.equal(b.state.content.columnCaptureOpen, false);
  assert.equal(b.posts().length, 0);
  await act(async () => b.state.content.beginColumnCapture('todo'));
  await act(async () => b.state.content.stageCapture('New column title'));
  b.server.mutate = () => Response.json({ ...task(1), status: 'todo' });
  await act(async () => b.state.content.submitColumnCapture());
  await b.framesUntilIdle();
  assert.equal(b.posts().length, 1);
  assert.equal(JSON.parse(b.posts()[0].options.body).status, 'todo');
});

test('same-session capture return restores its current scope before editable memory and replacement clears private refs', async (t) => {
  const b = await mountProjectInteractions(t);
  await act(async () => b.state.content.stageCapture('Return to this capture'));
  await act(async () => b.state.canonical.selectTask('t1'));
  await act(async () => b.state.content.resumeCurrentDraft());
  await b.framesUntilIdle();
  assert.equal(b.state.canonical.selection.projectId, 'p');
  assert.equal(b.state.content.captureTitle, 'Return to this capture');
  b.server.session = {
    ...b.server.session,
    session: { ...b.server.session.session, id: 'new-verified-session' },
  };
  await act(async () => b.state.canonical.refresh());
  await b.framesUntilIdle();
  assert.equal(b.state.content.captureTitle, '');
  assert.equal(b.state.lastCommandRef.current, null);
  assert.equal(b.state.canonical.draft, null);
});
