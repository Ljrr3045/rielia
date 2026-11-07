import assert from 'node:assert/strict';
import { test } from 'node:test';
import { act, deferred } from './dom-harness.mjs';
import { task } from './project-hook-harness.mjs';
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
