import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTaskPrototype, getSprintSummary } from '../apps/web/src/lib/task-prototype/controller.ts';

const create = (options = {}) => createTaskPrototype({ settle: async () => {}, ...options });
const task = (adapter, id) => adapter.getSnapshot().tasks.find(item => item.id === id);
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('fictional seed uses one hierarchy; My tasks follows assignee, including tasks created by others', () => {
  const adapter = create();
  const state = adapter.getSnapshot();
  assert.equal(state.tasks.length, 18);
  assert.equal(new Set(state.tasks.map(item => item.id)).size, 18);
  assert.ok(state.tasks.every(item => item.workspaceId === state.workspace.id && item.projectId === state.project.id));
  assert.deepEqual(state.visibleTasks.map(item => item.id), ['demo-task-3', 'demo-task-6', 'demo-task-12', 'demo-task-15', 'demo-task-18']);
  assert.ok(state.visibleTasks.every(item => item.assigneeId === state.currentPrincipalId));
  assert.ok(state.visibleTasks.some(item => item.createdByPrincipalId !== state.currentPrincipalId));
  assert.ok(state.tasks.some(item => item.createdByPrincipalId === state.currentPrincipalId && !state.visibleTasks.includes(item)));
  assert.deepEqual(state.principals.map(item => item.kind), ['human', 'human', 'agent']);
  assert.ok(!state.principals.some(item => item.name.includes('Cursor')));
  assert.equal(task(adapter, 'demo-task-1').createdByPrincipalId, 'demo-luis');
  assert.equal(task(adapter, 'demo-task-1').provenance.mode, 'delegated');
  assert.equal(task(adapter, 'demo-task-3').createdByPrincipalId, 'demo-builder');
  assert.equal(task(adapter, 'demo-task-3').provenance.mode, 'autonomous');
});

test('filters compose, preserve selection/context across views, and distinguish unassigned/backlog/no results', () => {
  const adapter = create(); const a = adapter.actions;
  a.setView('list'); a.selectTask('demo-task-2');
  a.setFilters({ search: 'RIE-2', status: 'todo', assigneeId: 'demo-builder', priority: 'medium', labelId: 'engineering', sprintId: 'demo-sprint-1' });
  assert.deepEqual(adapter.getSnapshot().visibleTasks.map(item => item.id), ['demo-task-2']);
  a.setView('board');
  assert.equal(adapter.getSnapshot().selectedTask.id, 'demo-task-2');
  assert.equal(adapter.getSnapshot().filters.search, 'RIE-2');
  assert.deepEqual(adapter.getSnapshot().columns.flatMap(column => column.tasks).map(item => item.id), ['demo-task-2']);
  a.setFilters({ search: 'does not exist' });
  assert.equal(adapter.getSnapshot().visibleTasks.length, 0);
  assert.equal(adapter.getSnapshot().tasks.length, 18);
  a.clearFilters(); a.setFilters({ assigneeId: 'unassigned', sprintId: 'backlog' });
  assert.deepEqual(adapter.getSnapshot().visibleTasks.map(item => item.id), ['demo-task-9', 'demo-task-13', 'demo-task-17']);
  a.clearFilters(); a.setFilters({ search: '  LONG TASK TITLES  ' });
  assert.deepEqual(adapter.getSnapshot().visibleTasks.map(item => item.id), ['demo-task-10']);
  a.selectTask('unknown'); assert.equal(adapter.getSnapshot().selectedTask, null);
  assert.equal(adapter.getSnapshot().selectedTaskId, 'unknown');
});

test('title/project-context capture validates, blocks duplicate submission and does not auto-assign or accept forged author metadata', async () => {
  const gate = deferred();
  const adapter = create({ settle: () => gate.promise }); const a = adapter.actions;
  a.beginCreateTask('todo');
  const id = adapter.getSnapshot().taskDraft.taskId;
  a.simulateNextSaveFailure();
  assert.equal(await a.saveTask(), false);
  assert.equal(adapter.getSnapshot().save.error.field, 'title');
  assert.equal(adapter.getSnapshot().nextSaveWillFail, true);
  // This is an accidental/malicious JS payload, outside the typed editable fields.
  a.updateTaskDraft({ title: '  A new idea  ', taskId: 'foreign', expectedVersion: 99,
    createdByPrincipalId: 'demo-builder', provenance: { mode: 'autonomous' }, assigneeId: null });
  const saving = a.saveTask();
  assert.equal(adapter.getSnapshot().save.status, 'pending');
  assert.equal(await a.saveTask(), false);
  a.updateTaskDraft({ title: 'Changed during save' }); a.discardTaskDraft(); a.beginCreateTask();
  assert.equal(adapter.getSnapshot().taskDraft.title, '  A new idea  ');
  assert.equal(adapter.getSnapshot().tasks.length, 18);
  gate.resolve(); assert.equal(await saving, false);
  assert.equal(adapter.getSnapshot().save.error.code, 'simulated-save');
  assert.equal(adapter.getSnapshot().taskDraft.taskId, id);
  assert.equal(await a.retrySave(), true);
  const saved = task(adapter, id);
  assert.equal(saved.title, 'A new idea'); assert.equal(saved.status, 'todo');
  assert.equal(saved.assigneeId, null); assert.equal(saved.createdByPrincipalId, 'demo-luis');
  assert.deepEqual(saved.provenance, { mode: 'human', source: 'web' });
  assert.equal(saved.projectId, adapter.getSnapshot().project.id);
  assert.equal(adapter.getSnapshot().tasks.length, 19);
  assert.equal(await a.retrySave(), false); assert.equal(await a.saveTask(), false);
  assert.equal(adapter.getSnapshot().tasks.length, 19);
});

test('edit/status actions use canonical records, preserve provenance and retain failed drafts without confirming a save', async () => {
  const adapter = create(); const a = adapter.actions;
  a.setView('list'); a.selectTask('demo-task-1'); a.beginEditTask('demo-task-1');
  const original = task(adapter, 'demo-task-1');
  a.updateTaskDraft({ title: 'Edited shared record', assigneeId: 'demo-builder', description: 'Draft text' });
  a.simulateNextSaveFailure(); assert.equal(await a.saveTask(), false);
  assert.strictEqual(task(adapter, original.id), original);
  assert.equal(adapter.getSnapshot().taskDraft.description, 'Draft text');
  assert.equal(adapter.getSnapshot().save.status, 'error');
  assert.equal(await a.retrySave(), true);
  const edited = task(adapter, original.id);
  assert.equal(edited.version, original.version + 1);
  assert.equal(edited.createdByPrincipalId, original.createdByPrincipalId);
  assert.deepEqual(edited.provenance, original.provenance);
  a.simulateNextSaveFailure(); assert.equal(await a.moveTask(edited.id, 'done'), false);
  assert.equal(task(adapter, edited.id).status, 'in_progress');
  assert.equal(await a.retrySave(), true);
  a.setView('board');
  const state = adapter.getSnapshot(); const saved = task(adapter, edited.id);
  assert.strictEqual(state.selectedTask, saved);
  assert.strictEqual(state.visibleTasks.find(item => item.id === saved.id), saved);
  assert.strictEqual(state.columns.find(column => column.status === 'done').tasks.find(item => item.id === saved.id), saved);
  assert.equal(state.columns.filter(column => column.tasks.some(item => item.id === saved.id)).length, 1);
  assert.equal(saved.title, 'Edited shared record'); assert.equal(saved.assigneeId, 'demo-builder');
});

test('draft allowlist and validation reject impossible metadata, dates, estimates and channels as assignees', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginCreateTask(); a.updateTaskDraft({ title: 'Valid' });
  for (const [fields, field] of [
    [{ title: ' '.repeat(3) }, 'title'], [{ description: 'x'.repeat(5001) }, 'description'],
    [{ status: 'blocked' }, 'status'], [{ priority: 'unknown' }, 'priority'],
    [{ assigneeId: 'Cursor (demo)' }, 'assigneeId'], [{ labelIds: ['foreign'] }, 'labelIds'],
    [{ dueDate: '2026-02-30' }, 'dueDate'], [{ points: -1 }, 'points'],
  ]) {
    const before = adapter.getSnapshot().taskDraft;
    a.updateTaskDraft(fields); assert.equal(await a.saveTask(), false);
    assert.equal(adapter.getSnapshot().save.error.field, field);
    a.updateTaskDraft(before);
  }
  assert.equal(adapter.getSnapshot().tasks.length, 18);
  assert.equal(await a.moveTask('missing', 'done'), false);
  assert.equal(await a.moveTask('demo-task-1', 'blocked'), false);
  assert.equal(await a.saveTask(), true);
});

test('a stale local edit never overwrites a status change; error retains the draft for review', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginEditTask('demo-task-2'); a.updateTaskDraft({ title: 'Unsaved old edit' });
  assert.equal(await a.moveTask('demo-task-2', 'done'), true);
  assert.equal(await a.saveTask(), false);
  assert.equal(adapter.getSnapshot().save.error.code, 'version-conflict');
  assert.equal(adapter.getSnapshot().taskDraft.title, 'Unsaved old edit');
  assert.equal(task(adapter, 'demo-task-2').title, 'Review task row metadata');
  assert.equal(task(adapter, 'demo-task-2').status, 'done');
  a.discardTaskDraft(); a.beginEditTask('demo-task-2');
  assert.equal(adapter.getSnapshot().taskDraft.status, 'done');
});

test('malformed collection changes report field errors and retain usable typed drafts instead of throwing', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginCreateTask(); a.updateTaskDraft({ title: 'Keep this task draft' });
  for (const labelIds of [null, undefined, 42, {}, 'design', [null]]) {
    assert.doesNotThrow(() => a.updateTaskDraft({ labelIds }));
    assert.equal(adapter.getSnapshot().save.error.field, 'labelIds');
    assert.deepEqual(adapter.getSnapshot().taskDraft.labelIds, []);
    assert.equal(adapter.getSnapshot().taskDraft.title, 'Keep this task draft');
    assert.equal(adapter.getSnapshot().tasks.length, 18);
  }
  a.updateTaskDraft({ labelIds: ['design'] }); assert.equal(await a.saveTask(), true);
  a.beginCreateSprint(); a.updateSprintDraft({ name: 'Keep this sprint draft', goal: 'A demo goal', startsOn: '2026-12-01', endsOn: '2026-12-15' });
  for (const taskIds of [null, undefined, 42, {}, 'demo-task-9', [null]]) {
    assert.doesNotThrow(() => a.updateSprintDraft({ taskIds }));
    assert.equal(adapter.getSnapshot().save.error.field, 'taskIds');
    assert.deepEqual(adapter.getSnapshot().sprintDraft.taskIds, []);
    assert.equal(adapter.getSnapshot().sprintDraft.name, 'Keep this sprint draft');
    assert.equal(adapter.getSnapshot().sprints.length, 2);
  }
  a.updateSprintDraft({ taskIds: ['demo-task-9'], name: null });
  assert.equal(await a.saveSprint(), false); assert.equal(adapter.getSnapshot().save.error.field, 'name');
  a.updateSprintDraft({ name: 'Valid name', goal: null });
  assert.equal(await a.saveSprint(), false); assert.equal(adapter.getSnapshot().save.error.field, 'goal');
  a.updateSprintDraft({ goal: 'A demo goal' }); assert.equal(await a.saveSprint(), true);
});

test('rejected and no-op draft actions preserve a failed task/sprint save for one successful retry', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginCreateTask(); a.updateTaskDraft({ title: 'Retry this exact task' });
  const taskId = adapter.getSnapshot().taskDraft.taskId;
  a.simulateNextSaveFailure(); assert.equal(await a.saveTask(), false);
  for (const rejected of [() => a.updateTaskDraft({ labelIds: null }), () => a.beginCreateTask(), () => a.discardSprintDraft()]) {
    rejected(); assert.equal(adapter.getSnapshot().canRetry, true);
    assert.equal(adapter.getSnapshot().taskDraft.taskId, taskId);
    assert.equal(adapter.getSnapshot().taskDraft.title, 'Retry this exact task');
    assert.equal(adapter.getSnapshot().tasks.length, 18);
  }
  assert.equal(await a.retrySave(), true); assert.equal(adapter.getSnapshot().tasks.length, 19);
  assert.equal(task(adapter, taskId).title, 'Retry this exact task');
  assert.equal(await a.retrySave(), false);

  a.simulateNextSaveFailure(); assert.equal(await a.moveTask(taskId, 'done'), false);
  a.beginEditTask('missing'); assert.equal(adapter.getSnapshot().canRetry, true);
  assert.equal(await a.retrySave(), true); assert.equal(task(adapter, taskId).status, 'done');

  a.beginCreateSprint(); a.updateSprintDraft({ name: 'Retry this exact sprint', goal: 'Keep retry intent', startsOn: '2026-12-01', endsOn: '2026-12-15', taskIds: ['demo-task-9'] });
  const sprintId = adapter.getSnapshot().sprintDraft.sprintId;
  a.simulateNextSaveFailure(); assert.equal(await a.saveSprint(), false);
  for (const rejected of [() => a.updateSprintDraft({ taskIds: null }), () => a.beginCreateTask(), () => a.discardTaskDraft()]) {
    rejected(); assert.equal(adapter.getSnapshot().canRetry, true);
    assert.equal(adapter.getSnapshot().sprintDraft.sprintId, sprintId);
    assert.deepEqual(adapter.getSnapshot().sprintDraft.taskIds, ['demo-task-9']);
    assert.equal(adapter.getSnapshot().sprints.length, 2);
    assert.equal(task(adapter, 'demo-task-9').sprintId, null);
  }
  assert.equal(await a.retrySave(), true); assert.equal(adapter.getSnapshot().sprints.length, 3);
  assert.equal(task(adapter, 'demo-task-9').sprintId, sprintId);
  assert.equal(await a.retrySave(), false);

  a.beginEditTask(taskId); a.updateTaskDraft({ title: 'A fresh edit' });
  a.simulateNextSaveFailure(); assert.equal(await a.saveTask(), false);
  a.updateTaskDraft({ title: 'A corrected fresh edit' });
  assert.equal(adapter.getSnapshot().canRetry, false); assert.equal(await a.retrySave(), false);
  assert.equal(await a.saveTask(), true); assert.equal(task(adapter, taskId).title, 'A corrected fresh edit');
});

test('failed task A feedback and retry keep their target when detail selects B, including pending and saved states', async () => {
  const gate = deferred(); const adapter = create({ settle: () => gate.promise }); const a = adapter.actions;
  const context = { kind: 'task', taskId: 'demo-task-1' };
  a.beginEditTask(context.taskId); a.updateTaskDraft({ title: 'Only A changes' }); a.simulateNextSaveFailure();
  const saving = a.saveTask();
  a.selectTask('demo-task-2'); a.setView('board'); a.setFilters({ search: 'RIE-2' });
  assert.equal(adapter.getSnapshot().save.status, 'pending');
  assert.deepEqual(adapter.getSnapshot().save.context, context);
  assert.equal(adapter.getSnapshot().retryContext, null);
  gate.resolve(); assert.equal(await saving, false);
  const failed = adapter.getSnapshot();
  assert.equal(failed.selectedTask.id, 'demo-task-2');
  assert.deepEqual(failed.save.context, context); assert.deepEqual(failed.retryContext, context);
  assert.equal(failed.taskDraft.title, 'Only A changes');
  assert.equal(await a.retrySave(), true);
  a.selectTask('demo-task-2');
  const saved = adapter.getSnapshot();
  assert.equal(saved.save.status, 'saved'); assert.deepEqual(saved.save.context, context);
  assert.equal(saved.selectedTask.id, 'demo-task-2'); assert.equal(saved.retryContext, null);
  assert.equal(task(adapter, context.taskId).title, 'Only A changes');
  assert.equal(task(adapter, 'demo-task-2').title, 'Review task row metadata');
  assert.deepEqual(failed.retryContext, context); // Previous snapshots remain intact.
  assert.strictEqual(adapter.getSnapshot(), saved);
  assert.throws(() => { saved.save.context.taskId = 'demo-task-2'; }, TypeError);
});

test('status feedback targets the changed task after selection and a newer rejected action has independent retry context', async () => {
  const adapter = create(); const a = adapter.actions;
  const context = { kind: 'status', taskId: 'demo-task-12', status: 'in_progress' };
  assert.equal(await a.moveTask(context.taskId, context.status), true);
  a.selectTask('demo-task-15');
  assert.deepEqual(adapter.getSnapshot().save.context, context);
  a.simulateNextSaveFailure(); assert.equal(await a.moveTask(context.taskId, 'done'), false);
  const retryContext = { ...context, status: 'done' };
  a.selectTask('demo-task-15');
  assert.deepEqual(adapter.getSnapshot().save.context, retryContext);
  a.beginEditTask('missing');
  assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'task', taskId: 'missing' });
  assert.deepEqual(adapter.getSnapshot().retryContext, retryContext);
  assert.equal(adapter.getSnapshot().save.error.code, 'invalid-action');
  assert.equal(adapter.getSnapshot().canRetry, true);
  assert.equal(await a.retrySave(), true);
  assert.equal(task(adapter, context.taskId).status, 'done');
  assert.equal(task(adapter, 'demo-task-15').status, 'todo');
  assert.equal(adapter.getSnapshot().selectedTask.id, 'demo-task-15');
  assert.deepEqual(adapter.getSnapshot().save.context, retryContext);
});

test('unbound validation and rejected patches cannot relabel a captured task retry; accepted edits clear it', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginCreateTask(); a.updateTaskDraft({ title: 'Keep captured draft' });
  const context = { kind: 'task', taskId: adapter.getSnapshot().taskDraft.taskId };
  a.simulateNextSaveFailure(); assert.equal(await a.saveTask(), false);
  a.selectTask('demo-task-2'); a.beginCreateSprint();
  assert.equal(adapter.getSnapshot().save.kind, 'sprint');
  assert.equal(adapter.getSnapshot().save.context, null);
  assert.deepEqual(adapter.getSnapshot().retryContext, context);
  a.updateTaskDraft({ labelIds: null });
  assert.deepEqual(adapter.getSnapshot().save.context, context);
  assert.deepEqual(adapter.getSnapshot().retryContext, context);
  a.discardSprintDraft();
  assert.deepEqual(adapter.getSnapshot().retryContext, context);
  assert.equal(adapter.getSnapshot().tasks.length, 18);
  a.updateTaskDraft({ title: 'Accepted correction' });
  assert.equal(adapter.getSnapshot().save.context, null);
  assert.equal(adapter.getSnapshot().retryContext, null); assert.equal(adapter.getSnapshot().canRetry, false);
  assert.equal(await a.retrySave(), false);
  assert.equal(await a.saveTask(), true); assert.equal(adapter.getSnapshot().tasks.length, 19);
});

test('sprint contexts identify draft, start, and captured close destination independently of unrelated task feedback', async () => {
  const gate = deferred(); let pause = false;
  const adapter = create({ settle: () => pause ? gate.promise : Promise.resolve() }); const a = adapter.actions;
  a.beginEditSprint('demo-sprint-1'); a.updateSprintDraft({ goal: 'Context regression' });
  a.simulateNextSaveFailure(); assert.equal(await a.saveSprint(), false);
  assert.deepEqual(adapter.getSnapshot().retryContext, { kind: 'sprint', sprintId: 'demo-sprint-1' });
  a.updateSprintDraft({ taskIds: null });
  assert.deepEqual(adapter.getSnapshot().save.context, adapter.getSnapshot().retryContext);
  assert.equal(await a.retrySave(), true);
  assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'sprint', sprintId: 'demo-sprint-1' });
  assert.equal(await a.startSprint('demo-sprint-1'), true);
  assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'start-sprint', sprintId: 'demo-sprint-1' });
  assert.equal(await a.closeSprint('demo-sprint-1', undefined), false);
  assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'close-sprint', sprintId: 'demo-sprint-1', destination: null });
  const destination = { kind: 'sprint', sprintId: 'demo-sprint-2' };
  const context = { kind: 'close-sprint', sprintId: 'demo-sprint-1', destination: { ...destination } };
  pause = true; a.simulateNextSaveFailure(); const closing = a.closeSprint('demo-sprint-1', destination);
  destination.sprintId = 'missing';
  assert.deepEqual(adapter.getSnapshot().save.context, context);
  gate.resolve(); assert.equal(await closing, false);
  const captured = adapter.getSnapshot().retryContext;
  assert.deepEqual(captured, context);
  assert.throws(() => { captured.destination.sprintId = 'missing'; }, TypeError);
  a.beginEditTask('missing');
  assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'task', taskId: 'missing' });
  assert.deepEqual(adapter.getSnapshot().retryContext, context);
  assert.equal(await a.retrySave(), true);
  assert.deepEqual(adapter.getSnapshot().save.context, context);
  assert.deepEqual(adapter.getSnapshot().sprints[0].closure.destination, context.destination);
  assert.equal(task(adapter, 'demo-task-1').sprintId, context.destination.sprintId);
});

test('valid new operations replace unrelated retry context and reset blocks stale success or failure context', async () => {
  for (const fail of [false, true]) {
    const gate = deferred(); let pause = false;
    const adapter = create({ settle: () => pause ? gate.promise : Promise.resolve() }); const a = adapter.actions;
    a.simulateNextSaveFailure(); assert.equal(await a.moveTask('demo-task-12', 'done'), false);
    assert.deepEqual(adapter.getSnapshot().retryContext, { kind: 'status', taskId: 'demo-task-12', status: 'done' });
    assert.equal(await a.startSprint('demo-sprint-1'), true);
    assert.equal(adapter.getSnapshot().retryContext, null);
    pause = true; if (fail) a.simulateNextSaveFailure();
    const closing = a.closeSprint('demo-sprint-1', { kind: 'backlog' });
    assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'close-sprint', sprintId: 'demo-sprint-1', destination: { kind: 'backlog' } });
    a.reset(); const reset = adapter.getSnapshot();
    assert.equal(reset.save.context, null); assert.equal(reset.retryContext, null);
    gate.resolve(); assert.equal(await closing, false);
    assert.strictEqual(adapter.getSnapshot(), reset);
    assert.equal(await a.retrySave(), false);
    assert.equal(adapter.getSnapshot().tasks.length, 18);
    assert.equal(adapter.getSnapshot().sprints[0].state, 'planned');
  }
});

test('malformed runtime targets stay outside typed feedback context and cannot mutate or erase a valid retry', async () => {
  const adapter = create(); const a = adapter.actions;
  await a.startSprint('demo-sprint-1');
  a.simulateNextSaveFailure(); assert.equal(await a.moveTask('demo-task-12', 'done'), false);
  const retry = adapter.getSnapshot().retryContext;
  const malformed = { id: 'untrusted' };
  for (const act of [() => a.moveTask('demo-task-12', malformed), () => a.moveTask(malformed, 'done'),
    () => a.startSprint(malformed), () => a.closeSprint(malformed, { kind: 'backlog' }),
    () => a.beginEditTask(malformed), () => a.beginEditSprint(malformed)]) {
    await act();
    assert.equal(adapter.getSnapshot().save.context, null);
    assert.strictEqual(adapter.getSnapshot().retryContext, retry);
    assert.equal(Object.isFrozen(malformed), false);
  }
  for (const destination of [null, { kind: 'sprint', sprintId: malformed }, { kind: 'sprint', sprintId: null }, { kind: 'unknown' }]) {
    assert.equal(await a.closeSprint('demo-sprint-1', destination), false);
    assert.deepEqual(adapter.getSnapshot().save.context, { kind: 'close-sprint', sprintId: 'demo-sprint-1', destination: null });
    assert.strictEqual(adapter.getSnapshot().retryContext, retry);
    assert.equal(Object.isFrozen(malformed), false);
  }
  assert.equal(await a.retrySave(), true); assert.equal(task(adapter, 'demo-task-12').status, 'done');
});

test('planned sprint goal/dates/scope validate atomically and maintain at most one current sprint per task', async () => {
  const adapter = create(); const a = adapter.actions;
  a.beginCreateSprint(); a.updateSprintDraft({ name: 'Third demo sprint', goal: 'A bounded goal', startsOn: '2026-12-01', endsOn: '2026-12-01', taskIds: ['demo-task-9'] });
  assert.equal(await a.saveSprint(), false); assert.equal(adapter.getSnapshot().save.error.field, 'endsOn');
  a.updateSprintDraft({ endsOn: '2026-12-15', taskIds: ['demo-task-9', 'demo-task-9'] });
  assert.equal(await a.saveSprint(), false);
  a.updateSprintDraft({ taskIds: ['demo-task-1'] });
  assert.equal(await a.saveSprint(), false); assert.equal(task(adapter, 'demo-task-1').sprintId, 'demo-sprint-1');
  a.updateSprintDraft({ taskIds: ['demo-task-9'] });
  a.simulateNextSaveFailure(); assert.equal(await a.saveSprint(), false);
  assert.equal(task(adapter, 'demo-task-9').sprintId, null); assert.equal(adapter.getSnapshot().sprints.length, 2);
  assert.equal(await a.retrySave(), true); assert.equal(adapter.getSnapshot().sprints.length, 3);
  assert.equal(task(adapter, 'demo-task-9').sprintId, 'demo-sprint-3');
  a.beginEditSprint('demo-sprint-3'); a.updateSprintDraft({ taskIds: ['demo-task-10'] });
  assert.equal(await a.saveSprint(), true);
  assert.equal(task(adapter, 'demo-task-9').sprintId, null); assert.equal(task(adapter, 'demo-task-10').sprintId, 'demo-sprint-3');
  assert.equal(await a.startSprint('demo-sprint-3'), true);
  assert.equal(await a.startSprint('demo-sprint-1'), false);
  a.beginEditSprint('demo-sprint-3'); assert.equal(adapter.getSnapshot().sprintDraft, null);
  assert.equal(adapter.getSnapshot().sprints.filter(sprint => sprint.state === 'active').length, 1);
});

test('closure requires destination, distinguishes done/canceled, retries atomically and freezes the closing outcome', async () => {
  const adapter = create(); const a = adapter.actions;
  assert.deepEqual(getSprintSummary(adapter.getSnapshot(), 'demo-sprint-1'), {
    doneTaskIds: ['demo-task-3', 'demo-task-5'], canceledTaskIds: ['demo-task-6'], unfinishedTaskIds: ['demo-task-1', 'demo-task-2', 'demo-task-4'],
  });
  assert.equal(await a.closeSprint('demo-sprint-1', { kind: 'backlog' }), false);
  assert.equal(await a.startSprint('demo-sprint-1'), true);
  for (const destination of [undefined, { kind: 'sprint', sprintId: 'missing' }, { kind: 'sprint', sprintId: 'demo-sprint-1' }]) {
    assert.equal(await a.closeSprint('demo-sprint-1', destination), false);
    assert.equal(adapter.getSnapshot().sprints[0].state, 'active');
  }
  const target = { kind: 'sprint', sprintId: 'demo-sprint-2' };
  a.simulateNextSaveFailure(); const saving = a.closeSprint('demo-sprint-1', target);
  target.sprintId = 'missing'; assert.equal(await saving, false);
  assert.equal(adapter.getSnapshot().sprints[0].closure, null);
  assert.equal(task(adapter, 'demo-task-1').sprintId, 'demo-sprint-1');
  assert.equal(await a.retrySave(), true);
  const closure = adapter.getSnapshot().sprints[0].closure;
  assert.equal(closure.doneTaskIds.length, 2); assert.equal(closure.canceledTaskIds.length, 1);
  assert.equal(closure.unfinishedTaskIds.length, 3);
  assert.deepEqual(closure.destination, { kind: 'sprint', sprintId: 'demo-sprint-2' });
  for (const id of closure.unfinishedTaskIds) assert.equal(task(adapter, id).sprintId, 'demo-sprint-2');
  for (const id of [...closure.doneTaskIds, ...closure.canceledTaskIds]) assert.equal(task(adapter, id).sprintId, 'demo-sprint-1');
  assert.equal(await a.moveTask('demo-task-3', 'todo'), true);
  assert.deepEqual(getSprintSummary(adapter.getSnapshot(), 'demo-sprint-1').doneTaskIds, ['demo-task-3', 'demo-task-5']);
  assert.equal(await a.closeSprint('demo-sprint-1', { kind: 'backlog' }), false);
  assert.equal(await a.startSprint('demo-sprint-2'), true);
});

test('backlog carryover retains unfinished statuses and does not move completed/canceled work', async () => {
  const adapter = create(); const a = adapter.actions;
  await a.startSprint('demo-sprint-1');
  assert.equal(await a.closeSprint('demo-sprint-1', { kind: 'backlog' }), true);
  assert.equal(task(adapter, 'demo-task-1').sprintId, null);
  assert.equal(task(adapter, 'demo-task-1').status, 'in_progress');
  assert.equal(task(adapter, 'demo-task-6').sprintId, 'demo-sprint-1');
});

test('snapshots and input arrays cannot mutate the store; adapters, subscriptions and reset remain isolated', async () => {
  const adapter = create(); const other = create(); const a = adapter.actions;
  const first = adapter.getSnapshot(); assert.strictEqual(adapter.getSnapshot(), first);
  assert.throws(() => { first.tasks[0].title = 'External mutation'; }, TypeError);
  let calls = 0; const unsubscribe = adapter.subscribe(() => { calls++; });
  a.beginCreateTask(); const labelIds = ['design']; a.updateTaskDraft({ title: 'Memory only', labelIds });
  labelIds.push('foreign'); assert.deepEqual(adapter.getSnapshot().taskDraft.labelIds, ['design']);
  await a.saveTask(); assert.equal(other.getSnapshot().tasks.length, 18);
  a.reset('empty'); assert.equal(adapter.getSnapshot().tasks.length, 0);
  assert.equal(adapter.getSnapshot().taskDraft, null); assert.equal(adapter.getSnapshot().selectedTaskId, null);
  assert.equal(adapter.getSnapshot().save.status, 'idle'); assert.equal(adapter.getSnapshot().canRetry, false);
  assert.ok(calls > 0); unsubscribe(); const count = calls;
  a.reset(); assert.equal(calls, count); assert.equal(adapter.getSnapshot().tasks.length, 18);
});

test('reset during pending save invalidates the old completion, including when a new draft reuses the demo ID', async () => {
  const gate = deferred(); const adapter = create({ settle: () => gate.promise }); const a = adapter.actions;
  a.beginCreateTask(); a.updateTaskDraft({ title: 'Old session' }); const oldId = adapter.getSnapshot().taskDraft.taskId;
  const pending = a.saveTask(); a.reset('empty');
  a.beginCreateTask(); a.updateTaskDraft({ title: 'New session' });
  assert.equal(adapter.getSnapshot().taskDraft.taskId, oldId);
  gate.resolve(); assert.equal(await pending, false);
  assert.equal(adapter.getSnapshot().tasks.length, 0);
  assert.equal(adapter.getSnapshot().taskDraft.title, 'New session');
  assert.equal(adapter.getSnapshot().save.status, 'idle');
  assert.equal(await a.saveTask(), true); assert.equal(adapter.getSnapshot().tasks.length, 1);
  assert.equal(adapter.getSnapshot().tasks[0].title, 'New session');
});
