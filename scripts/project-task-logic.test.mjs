import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers';
import { createProjectTaskController } from '../apps/web/src/lib/project-task-controller.ts';
import { ProjectTaskFailure } from '../apps/web/src/lib/project-task-client.ts';
import { parseSafeMarkdown, safeMarkdownLink } from '../apps/web/src/lib/safe-markdown.ts';

const session = { user: { id: 'human', name: 'Human', email: 'human@example.test', emailVerified: true }, session: { id: 'session', expiresAt: '2035-01-01T00:00:00.000Z' } };
const page = items => ({ items, total: items.length, nextCursor: null, capabilities: { canCreate: true }, orderVersion: 1, columnCounts: { backlog: items.length, todo: 0, in_progress: 0, done: 0, canceled: 0 }, selectedAssignee: null });
const workspace = id => ({ id, name: id, role: 'member', ownerPrincipalId: 'owner', createdAt: '2026-01-01T00:00:00.000Z' });
const creator = { principalId: 'human', name: 'Human', kind: 'human', active: true };
const project = (id = 'p', workspaceId = 'a', version = 1) => ({ id, workspaceId, key: 'RIE', name: 'Project', description: '', version, visibility: 'workspace', archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', creator, provenance: { actorPrincipalId: 'human', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: true, canArchive: true, canRestore: false, canManageAccess: false, canChangeVisibility: false, canGrantAccess: false, canRevokeAccess: false }, url: `/projects?workspace=${workspaceId}&project=${id}` });
const task = (id = 't', projectId = 'p', workspaceId = 'a', version = 1) => ({ ...project(id, workspaceId, version), projectId, projectKey: 'RIE', key: 'RIE-1', number: 1,
  title: 'Original', description: '', type: 'task', priority: 'none', status: 'backlog', assigneePrincipalId: null, assignee: null, dueDate: null, projectArchivedAt: null, orderVersion: 1 });
const draft = () => ({ type: 'edit-task', workspaceId: 'a', projectId: 'p', taskId: 't', expectedVersion: 1, fields: { title: 'Unsent draft' } });
function deferred() { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function fixture(overrides = {}) {
  let keys = 0; const calls = []; const values = { session, configuration: { enabled: true, providers: [] }, ...overrides.values };
  const transport = { projects: async w => page([project('p', w)]), project: async (w, p) => project(p, w), tasks: async (w, p) => page([task('t', p, w)]),
    task: async (w, p, t) => task(t, p, w), assignees: async (w, p) => ({ ...page([]), workspaceId: w, projectId: p }), access: async (w, p) => ({ ...page([]), workspaceId: w, projectId: p, projectVersion: 1 }), mutate: async (command, key) => { calls.push({ command, key }); return 'taskId' in command ? task(command.taskId, command.projectId, command.workspaceId, 2) : project('new', command.workspaceId); }, ...overrides.transport };
  const workspaces = { workspaces: async () => page([workspace('a'), workspace('b')]), detail: async w => workspace(w), members: async () => page([]), ...overrides.workspaces };
  const controller = createProjectTaskController({ identity: { configuration: async () => values.configuration, session: async () => values.session }, workspaces, transport, key: () => `key-${++keys}`, ...overrides.options });
  return { controller, values, transport, workspaces, calls };
}

test('real-data controller distinguishes disabled/auth/empty/forbidden/error and server creation capabilities', async () => {
  const f = fixture({ values: { configuration: { enabled: false, providers: [] } } }); await f.controller.refresh(); assert.equal(f.controller.getState().status, 'disabled');
  f.values.configuration.enabled = true; f.values.session = null; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'signed-out');
  f.values.session = session; f.workspaces.workspaces = async () => page([]); await f.controller.refresh(); assert.equal(f.controller.getState().status, 'empty');
  f.workspaces.workspaces = async () => page([workspace('a')]); f.transport.projects = async () => ({ ...page([]), capabilities: { canCreate: false } }); await f.controller.refresh();
  assert.equal(f.controller.getState().status, 'empty'); assert.equal(f.controller.getState().projects.capabilities.canCreate, false);
  f.transport.projects = async () => { throw new ProjectTaskFailure(403); }; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'forbidden'); assert.equal(f.controller.getState().projects, null);
  f.values.session = { bad: true }; await f.controller.refresh(); assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().session, null);
});
test('T08 validated board/filter/column URLs survive refresh, Back and detail outside filters without changing drafts', async () => {
  const calls = []; const locations = [];
  const f = fixture({ transport: { tasks: async (w, p, view, signal, cursor, filters) => { calls.push({ filters, cursor }); return page([]); } }, options: { navigate: url => locations.push(url) } });
  await f.controller.openLocation('?workspace=a&project=p&task=t&taskLayout=board&column=done&priority=urgent&assignee=unassigned');
  assert.equal(f.controller.getState().taskView.layout, 'board'); assert.equal(f.controller.getState().taskView.column, 'done'); assert.equal(f.controller.getState().task.id, 't');
  assert.equal(calls.length, 5); assert.ok(calls.every(call => call.filters.priority === 'urgent' && call.filters.assignee === 'unassigned'));
  f.controller.stage(draft()); await f.controller.setTaskFilters({ status: 'done' });
  assert.equal(f.controller.getState().selection.taskId, 't'); assert.equal(f.controller.getState().draft.fields.title, 'Unsent draft');
  assert.equal(new URL(locations.at(-1), 'https://test').searchParams.get('status'), 'done');
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=list'); assert.equal(f.controller.getState().taskView.layout, 'list');
  for (const query of ['taskLayout=board&taskLayout=list', 'column=custom', 'status=custom', 'priority=urgent&priority=low', 'assignee=bad%20id']) {
    await f.controller.openLocation(`?workspace=a&project=p&${query}`); assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().task, null);
  }
});
test('T08 mixed board revisions retain original rows and block moves without promoting source versions', async () => {
  const f = fixture({ transport: { tasks: async (w, p, view, signal, cursor, filters) => ({ ...page([{ ...task(filters.status, p, w), status: filters.status, orderVersion: filters.status === 'done' ? 2 : 1 }]), orderVersion: filters.status === 'done' ? 2 : 1 }) } });
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=board');
  assert.equal(f.controller.getState().taskColumnsChanged, true); assert.equal(f.controller.getState().taskColumns.backlog.items[0].orderVersion, 1);
  f.controller.stageMove('backlog', 'done', null); assert.equal(f.controller.getState().draft, null);
  assert.equal(f.controller.getState().taskColumns.done.items[0].orderVersion, 2);
  assert.equal(f.controller.getState().taskSummary.status, 'changed'); assert.equal(f.controller.getState().taskSummary.total, null);
});
test('T08 selected assignee metadata survives off-page/historical filters and board totals require coherent authoritative pages', async () => {
  const f = fixture({ transport: { tasks: async (w, p, v, s, c, filters) => ({ ...page([]), selectedAssignee: filters.assignee === 'old' ? { ...creator, principalId: 'old', name: 'Historical Person', active: false } : null }) } });
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=board&assignee=old');
  assert.equal(f.controller.getState().selectedTaskAssignee.name, 'Historical Person'); assert.equal(f.controller.getState().selectedTaskAssignee.active, false);
  assert.equal(f.controller.getState().taskFilterAssigneeStatus, 'resolved'); assert.equal(f.controller.getState().taskSummary.total, 0); assert.equal(f.controller.getState().taskSummary.status, 'ready');
  await f.controller.setTaskFilters({ assignee: 'unavailable' }); assert.equal(f.controller.getState().selectedTaskAssignee, null); assert.equal(f.controller.getState().taskFilterAssigneeStatus, 'unavailable');
  assert.equal(f.controller.getState().taskView.filters.assignee, 'unavailable');
  f.transport.tasks = async (w, p, v, s, c, filters) => { if (filters.status === 'done') throw new ProjectTaskFailure(503); return page([]); };
  await f.controller.refresh(); assert.equal(f.controller.getState().taskSummary.status, 'partial'); assert.equal(f.controller.getState().taskSummary.total, null); assert.equal(f.controller.getState().taskSummary.canCreate, false);
});
test('T08 status-filtered board loads authorized destinations without clearing filters; another detail has explicit eligibility', async () => {
  const calls = [];
  const f = fixture({ transport: { tasks: async (w, p, v, s, c, filters) => { calls.push(filters); return page([{ ...task(filters.status, p, w), status: filters.status }]); } } });
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=board&status=todo&priority=urgent');
  assert.equal(calls.length, 5); assert.ok(calls.every(filters => filters.priority === 'urgent'));
  assert.equal(f.controller.moveEligibility('todo', 'done', null), 'ready'); assert.equal(f.controller.stageMove('todo', 'done', 'done'), 'ready');
  assert.equal(f.controller.getState().taskView.filters.status, 'todo'); assert.equal(f.controller.getState().draft.beforeTaskId, 'done');
  await f.controller.submit(); assert.equal(f.controller.getState().selection.taskId, null); assert.equal(f.controller.getState().taskView.filters.status, 'todo');
  await f.controller.selectTask('another'); assert.equal(f.controller.moveEligibility('todo', 'done', null), 'different-detail');
  assert.equal(f.controller.stageMove('todo', 'done', null), 'different-detail'); assert.equal(f.controller.getState().draft, null);
});
test('T08 board paging and auxiliary errors recover independently; changed pages require Refresh and auth denial clears siblings', async () => {
  let fail = true; const slow = deferred();
  const f = fixture({ transport: { assignees: async () => { throw new ProjectTaskFailure(503); }, tasks: async (w, p, view, signal, cursor, filters) => {
    if (filters.status === 'todo' && fail) throw new ProjectTaskFailure(503, null, null, 'todo-error');
    return { ...page([{ ...task(filters.status, p, w), status: filters.status }]), nextCursor: filters.status === 'backlog' ? 'cursor' : null };
  } } });
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=board');
  assert.equal(f.controller.getState().status, 'ready'); assert.equal(f.controller.getState().taskColumnErrors.todo.requestId, 'todo-error'); assert.ok(f.controller.getState().policyPageErrors.assignees);
  fail = false; await f.controller.loadTaskColumn('todo'); assert.ok(f.controller.getState().taskColumns.todo); assert.ok(f.controller.getState().policyPageErrors.assignees);
  f.transport.tasks = async () => { throw new ProjectTaskFailure(409, 'page-changed'); };
  const old = f.controller.getState().taskColumns.backlog; await f.controller.loadTaskColumn('backlog');
  assert.equal(f.controller.getState().taskColumns.backlog, old); assert.equal(f.controller.getState().taskColumnErrors.backlog.reason, 'changed');
  f.transport.tasks = async (w, p, v, s, c, filters) => filters.status === 'todo' ? slow.promise : Promise.reject(new ProjectTaskFailure(403));
  const refresh = f.controller.refresh(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.controller.getState().status, 'forbidden'); slow.resolve(page([task()])); await refresh;
  assert.deepEqual(f.controller.getState().taskColumns, {}); assert.equal(f.controller.getState().project, null);
});
test('T08 actual row move shares exact-key unknown recovery, keeps board selection and requires fresh conflict destination', async () => {
  const f = fixture({ transport: { tasks: async (w, p, view, signal, cursor, filters) => page(filters.status === 'backlog' ? [task('source', p, w)] : filters.status === 'done' ? [{ ...task('anchor', p, w), status: 'done' }] : []) } });
  await f.controller.openLocation('?workspace=a&project=p&taskLayout=board'); f.controller.stageMove('source', 'done', 'anchor');
  const command = f.controller.getState().draft; assert.equal(command.type, 'move-task'); assert.equal(command.expectedOrderVersion, 1);
  f.transport.mutate = async (command, key) => { f.calls.push({ command, key }); throw new Error('outcome unknown'); };
  await f.controller.submit(); const captured = f.controller.getState().retryTarget;
  await f.controller.selectTask('different'); await f.controller.retrySave(); assert.equal(f.calls.length, 1);
  await f.controller.returnToDraft(); f.transport.mutate = async (command, key) => { f.calls.push({ command, key }); return { ...task('source'), status: 'done', version: 2 }; };
  await f.controller.retrySave(); assert.equal(f.calls[0].key, f.calls[1].key); assert.deepEqual(f.calls[1].command, captured);
  await f.controller.selectTask(null); f.controller.stageMove('source', 'done', null);
  f.transport.mutate = async () => { throw new ProjectTaskFailure(409, 'order-conflict', { ...task('source'), orderVersion: 4 }); };
  await f.controller.submit(); assert.equal(f.controller.getState().moveNeedsDestination, true); f.controller.rebaseDraft();
  assert.equal(f.controller.getState().draft.expectedOrderVersion, 1); assert.equal(f.controller.getState().draft.beforeTaskId, null);
  f.controller.discardDraft(); assert.equal(f.controller.getState().draft, null);
});
test('T08 list mixed-version or page-changed append retains rows/cursor and labelled Refresh state', async () => {
  const f = fixture({ transport: { tasks: async () => ({ ...page([task()]), nextCursor: 'cursor' }) } }); await f.controller.refresh();
  const previous = f.controller.getState().tasks;
  f.transport.tasks = async () => ({ ...page([{ ...task('new'), orderVersion: 2 }]), orderVersion: 2 }); await f.controller.loadMore('tasks');
  assert.equal(f.controller.getState().tasks, previous); assert.equal(f.controller.getState().pageError.reason, 'changed');
  f.transport.tasks = async () => { throw new ProjectTaskFailure(409, 'page-changed'); }; await f.controller.loadMore('tasks');
  assert.equal(f.controller.getState().tasks, previous); assert.equal(f.controller.getState().pageError.reason, 'changed');
});
test('scoped stable URL roundtrip and stale project/task responses cannot replace a new selection', async () => {
  const slow = deferred(); let delay = false; const locations = [];
  const f = fixture({ transport: { task: async (w, p, t) => delay && t === 't' ? slow.promise : task(t, p, w) }, options: { navigate: url => locations.push(url) } });
  await f.controller.openLocation('?workspace=a&project=p&task=t'); assert.equal(f.controller.getState().task.id, 't'); assert.equal(f.controller.getState().url, '/projects?workspace=a&project=p&task=t');
  delay = true; const stale = f.controller.selectTask('t'); await f.controller.selectWorkspace('b'); slow.resolve(task()); await stale;
  assert.equal(f.controller.getState().workspace.id, 'b'); assert.equal(f.controller.getState().task, null); assert.equal(locations.at(-1), '/projects?workspace=b');
  await f.controller.openLocation('?workspace=bad%20id&project=p'); assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().task, null);
});
test('same form retains captured target/version/draft while refresh replaces current data', async () => {
  const f = fixture(); await f.controller.refresh(); const original = draft(); f.controller.stage(original); original.fields.title = 'Caller mutated';
  f.transport.task = async () => task('t', 'p', 'a', 8); await f.controller.selectTask('t');
  f.controller.stage({ ...draft(), expectedVersion: 8, fields: { title: 'Continued' } });
  assert.equal(f.controller.getState().draft.expectedVersion, 1); assert.equal(f.controller.getState().draft.fields.title, 'Continued');
  await f.controller.selectWorkspace('b'); assert.equal(f.controller.getState().draft.workspaceId, 'a'); await f.controller.submit(); assert.equal(f.calls.length, 0);
});
test('saving task A from detail B is rejected until explicit return to captured target, including unknown retry', async () => {
  const f = fixture(); await f.controller.openLocation('?workspace=a&project=p&task=t'); f.controller.stage(draft());
  await f.controller.selectTask('other'); await f.controller.submit(); assert.equal(f.calls.length, 0); assert.equal(f.controller.getState().outcome, 'invalid');
  await f.controller.returnToDraft(); assert.equal(f.controller.getState().selection.taskId, 't');
  f.transport.mutate = async (command, key) => { f.calls.push({ command, key }); throw new Error('unknown'); }; await f.controller.submit();
  await f.controller.selectTask('other'); await f.controller.retrySave(); assert.equal(f.calls.length, 1);
  await f.controller.returnToDraft(); f.transport.mutate = async (command, key) => { f.calls.push({ command, key }); return task('t', 'p', 'a', 2); }; await f.controller.retrySave();
  assert.equal(f.calls.length, 2); assert.equal(f.calls[0].key, f.calls[1].key);
});
test('archived project/task return context roundtrips through detail URL and browser location', async () => {
  const f = fixture(); await f.controller.refresh(); await f.controller.setView('projects', 'archived'); await f.controller.setView('tasks', 'archived'); await f.controller.selectTask('t');
  const url = new URL(f.controller.getState().url, 'https://app.example.test'); assert.equal(url.searchParams.get('projectsView'), 'archived'); assert.equal(url.searchParams.get('tasksView'), 'archived');
  const restored = fixture(); await restored.controller.openLocation(url.search); assert.deepEqual(restored.controller.getState().views, { projects: 'archived', tasks: 'archived' }); assert.equal(restored.controller.getState().task.id, 't');
  await restored.controller.selectTask(null); assert.equal(new URL(restored.controller.getState().url, url.origin).searchParams.get('tasksView'), 'archived');
});
test('unknown committed outcome keeps original key/target and blocks replacement or duplicate submissions', async () => {
  const pending = deferred(); const calls = []; const f = fixture({ transport: { mutate: async (command, key) => { calls.push({ command, key }); if (calls.length === 1) return pending.promise; return task('t', 'p', 'a', 2); } } });
  await f.controller.refresh(); await f.controller.selectTask("t"); f.controller.stage(draft()); const saving = f.controller.submit(); await f.controller.submit(); assert.equal(calls.length, 1);
  pending.reject(new Error('Commit outcome unknown')); await saving; assert.equal(f.controller.getState().outcome, 'error'); assert.equal(f.controller.getState().retryTarget.taskId, 't');
  f.controller.stage({ type: 'create-project', workspaceId: 'a', key: 'NEW', name: 'New' }); assert.equal(f.controller.getState().draft.taskId, 't');
  await f.controller.retrySave(); assert.equal(calls.length, 2); assert.equal(calls[1].key, calls[0].key); assert.deepEqual(calls[1].command, calls[0].command);
  assert.equal(f.controller.getState().outcome, 'success'); assert.equal(f.controller.getState().retryTarget, null);
});
test('navigation/cancellation during save ignores late success and retains original recovery until explicit retry/discard', async () => {
  const pending = deferred(); const calls = []; const f = fixture({ transport: { mutate: async (command, key) => { calls.push({ command, key }); return calls.length === 1 ? pending.promise : task('t', 'p', 'a', 2); } } });
  await f.controller.refresh(); await f.controller.selectTask("t"); f.controller.stage(draft()); const saving = f.controller.submit(); await f.controller.selectWorkspace('b'); pending.resolve(task()); await saving;
  assert.equal(f.controller.getState().workspace.id, 'b'); assert.equal(f.controller.getState().result, null); assert.equal(f.controller.getState().retryTarget.workspaceId, 'a');
  await f.controller.retrySave(); assert.equal(calls.length, 1); await f.controller.returnToDraft(); await f.controller.retrySave(); assert.equal(calls[0].key, calls[1].key);
  f.transport.mutate = async () => { throw new Error(); }; f.controller.stage(draft()); await f.controller.submit(); f.controller.cancelPending();
  assert.ok(f.controller.getState().retryTarget); f.controller.discardDraft(); assert.equal(f.controller.getState().retryTarget, null); assert.equal(f.controller.getState().draft, null);
});
test('conflict compare/reload retains unsent values and explicit rebase adopts only the matching current version', async () => {
  const f = fixture({ transport: { mutate: async () => { throw new ProjectTaskFailure(409, 'version-conflict', task('t', 'p', 'a', 3)); } } });
  await f.controller.refresh(); await f.controller.selectTask("t"); f.controller.stage(draft()); await f.controller.submit(); assert.equal(f.controller.getState().conflict.version, 3); assert.equal(f.controller.getState().draft.expectedVersion, 1);
  f.transport.task = async () => task('t', 'p', 'a', 5); await f.controller.reloadConflict(); assert.equal(f.controller.getState().conflict.version, 5);
  assert.equal(f.controller.getState().draft.fields.title, 'Unsent draft'); f.controller.rebaseDraft(); assert.equal(f.controller.getState().draft.expectedVersion, 5); assert.equal(f.controller.getState().draft.fields.title, 'Unsent draft');
  assert.equal(f.controller.getState().conflict, null); f.transport.mutate = async () => task('t', 'p', 'a', 6); await f.controller.submit(); assert.equal(f.controller.getState().outcome, 'success');
});
test('successful mutation remains successful with result after a failed refresh and never becomes a retry', async () => {
  const f = fixture(); await f.controller.refresh(); await f.controller.selectTask("t"); f.controller.stage(draft()); f.transport.projects = async () => { throw new Error(); }; await f.controller.submit();
  assert.equal(f.controller.getState().status, 'error'); assert.equal(f.controller.getState().outcome, 'success'); assert.equal(f.controller.getState().result.version, 2);
  assert.equal(f.controller.getState().retryTarget, null); assert.equal(f.controller.getState().draft, null);
});
test('session loss preserves same-human draft/key, another account clears private data and selection', async () => {
  const f = fixture({ transport: { mutate: async () => { throw new ProjectTaskFailure(401); } } }); await f.controller.refresh(); await f.controller.selectTask("t"); f.controller.stage(draft()); await f.controller.submit();
  assert.equal(f.controller.getState().status, 'signed-out'); assert.equal(f.controller.getState().task, null); assert.ok(f.controller.getState().draft); assert.ok(f.controller.getState().retryTarget);
  await f.controller.refresh(); assert.equal(f.controller.getState().draft.fields.title, 'Unsent draft');
  f.values.session = { ...session, user: { ...session.user, id: 'other' } }; await f.controller.refresh();
  for (const key of ['draft', 'retryTarget', 'conflict', 'result', 'outcome']) assert.equal(f.controller.getState()[key], null);
});
test('archived views and paging retain server capabilities, de-duplicate pages and ignore old-scope pages', async () => {
  const slow = deferred(); const calls = [];
  const f = fixture({ transport: { projects: async (w, view, _signal, cursor) => { calls.push({ w, view, cursor }); return cursor ? slow.promise : { ...page([project('p', w)]), total: 2, nextCursor: 'p' }; } } });
  await f.controller.refresh(); const paging = f.controller.loadMore('projects'); await f.controller.selectWorkspace('b'); slow.resolve(page([project('old', 'a')])); await paging;
  assert.deepEqual(f.controller.getState().projects.items.map(row => row.id), ['p']);
  await f.controller.setView('projects', 'archived'); assert.equal(calls.at(-1).view, 'archived'); assert.equal(f.controller.getState().views.projects, 'archived');
});
test('transient next-page failure preserves list/detail/success and cursor for retry; auth denial still clears private data', async () => {
  const f = fixture({ transport: { projects: async (_w, _view, _signal, cursor) => { if (cursor) throw new ProjectTaskFailure(503, null, null, 'page-request'); return { ...page([project()]), total: 2, nextCursor: 'next' }; } } });
  await f.controller.openLocation('?workspace=a&project=p&task=t'); f.controller.stage(draft()); await f.controller.submit(); const before = f.controller.getState();
  await f.controller.loadMore('projects'); const after = f.controller.getState();
  assert.equal(after.project, before.project); assert.equal(after.task, before.task); assert.equal(after.projects, before.projects); assert.equal(after.status, 'ready');
  assert.equal(after.outcome, 'success'); assert.equal(after.result, before.result); assert.equal(after.projects.nextCursor, 'next'); assert.deepEqual(after.pageError, { collection: 'projects', requestId: 'page-request' });
  f.transport.projects = async () => page([project('p2')]); await f.controller.loadMore('projects'); assert.equal(f.controller.getState().projects.items.length, 2); assert.equal(f.controller.getState().pageError, null);
  for (const denial of [403, 401]) {
    f.transport.projects = async (_w, _v, _s, cursor) => { if (cursor) throw new ProjectTaskFailure(denial); return { ...page([project()]), total: 2, nextCursor: 'next' }; };
    await f.controller.refresh(); await f.controller.loadMore('projects'); assert.equal(f.controller.getState().project, null); assert.equal(f.controller.getState().status, denial === 401 ? 'signed-out' : 'forbidden');
  }
});
test('safe Markdown AST preserves useful formatting and treats executable content as inert text', () => {
  const source = '# Heading\n\n**Strong** and *emphasis* with `code` and [safe](https://example.test/a)\n\n- first\n- second\n\n```js\n<script>evil()</script>\n```\n\n<img src=x onerror=evil()> [bad](javascript:evil) ![image](https://evil.test/image)';
  const ast = parseSafeMarkdown(source); assert.equal(ast[0].type, 'heading'); assert.equal(ast[2].type, 'list'); assert.equal(ast[3].type, 'code');
  const links = ast.filter(row => 'content' in row).flatMap(row => row.content).filter(row => row.type === 'link'); assert.deepEqual(links.map(row => row.href), ['https://example.test/a']);
  assert.ok(JSON.stringify(ast).includes('<img src=x onerror=evil()>'));
  for (const value of ['javascript:evil', 'data:text/html,x', 'vbscript:x', '//evil.test', '/\\evil.test', 'https://user:pass@evil.test', ' https://evil.test', 'java\nscript:evil']) assert.equal(safeMarkdownLink(value), null);
  assert.equal(safeMarkdownLink('/projects?workspace=a'), '/projects?workspace=a'); assert.equal(safeMarkdownLink('#heading'), '#heading');
  assert.ok(JSON.stringify(parseSafeMarkdown('x'.repeat(100000))).length < 21000);
});

test('403 after confirmed save or later refresh clears the full result and policy collections while preserving acknowledgement', async () => {
  for (const later of [false, true]) {
    const f = fixture(); await f.controller.openLocation('?workspace=a&project=p&task=t'); f.controller.stage(draft());
    if (!later) f.transport.projects = async () => { throw new ProjectTaskFailure(403); };
    await f.controller.submit();
    if (later) { assert.ok(f.controller.getState().result); f.transport.projects = async () => { throw new ProjectTaskFailure(403); }; await f.controller.refresh(); }
    const state = f.controller.getState(); assert.equal(state.status, 'forbidden'); assert.equal(state.outcome, 'success');
    for (const key of ['project', 'task', 'projects', 'tasks', 'result', 'conflict', 'projectAccess', 'assignees']) assert.equal(state[key], null, key);
    assert.equal(state.retryTarget, null); assert.equal(state.draft, null);
  }
});
test('policy draft version and principal target are captured; unknown outcomes share exact-key scoped recovery', async () => {
  let fail = true;
  const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w, 8), capabilities: { ...project().capabilities, canManageAccess: true } }),
    mutate: async (command, key) => { f.calls.push({ command, key }); if (fail) throw new Error('unknown outcome'); return project('p', 'a', 9); } } });
  await f.controller.refresh(); assert.ok(f.controller.getState().projectAccess); assert.ok(f.controller.getState().assignees);
  const command = { type: 'change-access', workspaceId: 'a', projectId: 'p', principalId: 'agent', expectedVersion: 1, state: 'active' };
  f.controller.stage(command); await f.controller.refresh(); f.controller.stage({ ...command, expectedVersion: 8, state: 'revoked' }); assert.equal(f.controller.getState().draft.expectedVersion, 1);
  f.controller.stage({ ...command, principalId: 'different', expectedVersion: 8 }); assert.equal(f.controller.getState().draft.expectedVersion, 8);
  await f.controller.submit(); const captured = f.calls[0]; f.controller.stage(command); assert.equal(f.controller.getState().draft.principalId, 'different');
  await f.controller.selectWorkspace('b'); await f.controller.retrySave(); assert.equal(f.calls.length, 1);
  await f.controller.returnToDraft(); fail = false; await f.controller.retrySave(); assert.deepEqual(f.calls[1], captured); assert.equal(f.controller.getState().outcome, 'success');
});
test('stale access/assignee completion cannot replace a different workspace and their page denial clears server data', async () => {
  const slow = deferred(); let delayed = false;
  const f = fixture({ transport: { assignees: async (w, p) => delayed && w === 'a' ? slow.promise : { ...page([]), workspaceId: w, projectId: p } } });
  await f.controller.refresh(); delayed = true; const stale = f.controller.selectProject('p'); await f.controller.selectWorkspace('b');
  slow.resolve({ ...page([creator]), workspaceId: 'a', projectId: 'p' }); await stale; assert.equal(f.controller.getState().assignees.workspaceId, 'b');
  f.transport.assignees = async (w, p, _s, cursor) => { if (cursor) throw new ProjectTaskFailure(403); return { ...page([creator]), workspaceId: w, projectId: p, nextCursor: 'human' }; };
  await f.controller.refresh(); await f.controller.loadMore('assignees'); assert.equal(f.controller.getState().status, 'forbidden'); assert.equal(f.controller.getState().assignees, null); assert.equal(f.controller.getState().result, null);
});
test('access paging never promotes stale rows to a new aggregate version', async () => {
  const entry = { ...creator, role: 'member', explicitAccess: 'active', implicitAccess: false, effectiveAccess: true, capabilities: { canGrant: false, canRevoke: true } };
  const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w, 5), capabilities: { ...project().capabilities, canManageAccess: true } }),
    access: async (w, p, _s, cursor) => ({ ...page([cursor ? { ...entry, principalId: 'later' } : entry]), workspaceId: w, projectId: p, projectVersion: cursor ? 6 : 5, nextCursor: cursor ? null : 'human' }) } });
  await f.controller.refresh(); const before = f.controller.getState().projectAccess; await f.controller.loadMore('projectAccess');
  const state = f.controller.getState(); assert.equal(state.projectAccess, before); assert.equal(state.projectAccess.projectVersion, 5); assert.equal(state.projectAccess.nextCursor, 'human');
  assert.deepEqual(state.pageError, { collection: 'projectAccess', requestId: null, reason: 'changed' });
});
test('access conflict rebase requires actual target state and reload fetches that target beyond page one', async () => {
  const accessCurrent = { ...creator, principalId: 'beyond-first-page', role: 'member', explicitAccess: 'revoked', implicitAccess: false, effectiveAccess: false, capabilities: { canGrant: true, canRevoke: false } }; let includeTarget = false; const reviews = [];
  const f = fixture({ transport: { mutate: async () => { throw new ProjectTaskFailure(409, 'version-conflict', project('p', 'a', 5), null, includeTarget ? accessCurrent : null); },
    accessReview: async (w, p, principalId) => { reviews.push({ w, p, principalId }); return { project: project('p', 'a', 7), member: accessCurrent }; } } });
  await f.controller.refresh(); f.controller.stage({ type: 'change-access', workspaceId: 'a', projectId: 'p', principalId: accessCurrent.principalId, expectedVersion: 1, state: 'active' });
  await f.controller.submit(); f.controller.rebaseDraft(); assert.equal(f.controller.getState().draft.expectedVersion, 1);
  await f.controller.reloadConflict(); assert.deepEqual(reviews, [{ w: 'a', p: 'p', principalId: accessCurrent.principalId }]); assert.equal(f.controller.getState().accessConflict.explicitAccess, 'revoked');
  assert.equal(f.controller.getState().conflict.version, 7); f.controller.rebaseDraft(); assert.equal(f.controller.getState().draft.expectedVersion, 7);
  includeTarget = true; await f.controller.submit(); assert.equal(f.controller.getState().accessConflict.principalId, accessCurrent.principalId); f.controller.rebaseDraft(); assert.equal(f.controller.getState().draft.expectedVersion, 5);
});
test('transient initial policy page failure preserves confirmed content and success, and first-page retry recovers', async () => {
  for (const collection of ['projectAccess', 'assignees']) {
    let failing = true;
    const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w), capabilities: { ...project().capabilities, canManageAccess: true } }),
      [collection === 'projectAccess' ? 'access' : 'assignees']: async (w, p) => { if (failing) throw new ProjectTaskFailure(503, null, null, 'aux-request'); return { ...page([]), workspaceId: w, projectId: p, projectVersion: 1 }; } } });
    await f.controller.openLocation('?workspace=a&project=p&task=t');
    assert.equal(f.controller.getState().status, 'ready'); assert.equal(f.controller.getState().task.id, 't'); assert.equal(f.controller.getState()[collection], null);
    assert.deepEqual(f.controller.getState().pageError, { collection, requestId: 'aux-request' });
    f.controller.stage(draft()); await f.controller.submit(); assert.equal(f.controller.getState().outcome, 'success'); assert.ok(f.controller.getState().result); assert.equal(f.controller.getState().status, 'ready');
    failing = false; await f.controller.loadMore(collection); assert.ok(f.controller.getState()[collection]); assert.equal(f.controller.getState().pageError, null); assert.equal(f.calls.length, 1);
  }
});
test('policy page auth failure clears content immediately and a late sibling cannot repopulate it', async () => {
  for (const denial of [401, 403]) {
    const denied = deferred(); const late = deferred();
    const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w), capabilities: { ...project().capabilities, canManageAccess: true } }), access: () => denied.promise, assignees: () => late.promise } });
    const loading = f.controller.refresh(); await new Promise(setImmediate); assert.equal(f.controller.getState().project.id, 'p');
    denied.reject(new ProjectTaskFailure(denial)); await new Promise(setImmediate); assert.equal(f.controller.getState().project, null); assert.equal(f.controller.getState().status, denial === 401 ? 'signed-out' : 'forbidden');
    late.resolve({ ...page([creator]), workspaceId: 'a', projectId: 'p' }); await loading; assert.equal(f.controller.getState().assignees, null); assert.equal(f.controller.getState().result, null);
  }
});
test('simultaneous policy page failures retain independent retry errors', async () => {
  let failAccess = true; let failAssignees = true;
  const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w), capabilities: { ...project().capabilities, canManageAccess: true } }),
    access: async (w, p) => { if (failAccess) throw new ProjectTaskFailure(503, null, null, 'access-request'); return { ...page([]), workspaceId: w, projectId: p, projectVersion: 1 }; },
    assignees: async (w, p) => { if (failAssignees) throw new ProjectTaskFailure(503, null, null, 'assignees-request'); return { ...page([]), workspaceId: w, projectId: p }; } } });
  await f.controller.refresh(); assert.equal(f.controller.getState().status, 'ready'); assert.equal(f.controller.getState().policyPageErrors.projectAccess.requestId, 'access-request'); assert.equal(f.controller.getState().policyPageErrors.assignees.requestId, 'assignees-request');
  failAssignees = false; await f.controller.loadMore('assignees'); assert.deepEqual(f.controller.getState().policyPageErrors, { projectAccess: { requestId: 'access-request' } }); assert.equal(f.controller.getState().pageError.collection, 'projectAccess');
  failAccess = false; await f.controller.loadMore('projectAccess'); assert.deepEqual(f.controller.getState().policyPageErrors, {}); assert.equal(f.controller.getState().pageError, null);
});
test('dismissing feedback preserves missing-page recovery and a successful follow-up clears obsolete errors', async () => {
  let failing = true;
  const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w), capabilities: { ...project().capabilities, canManageAccess: true } }),
    access: async (w, p) => { if (failing) throw new ProjectTaskFailure(503, null, null, 'old-error'); return { ...page([]), workspaceId: w, projectId: p, projectVersion: 2 }; } } });
  await f.controller.openLocation('?workspace=a&project=p&task=t'); assert.ok(f.controller.getState().policyPageErrors.projectAccess);
  f.controller.dismissPageError(); assert.equal(f.controller.getState().pageError, null); assert.ok(f.controller.getState().policyPageErrors.projectAccess); assert.equal(f.controller.getState().projectAccess, null);
  failing = false; f.controller.stage(draft()); await f.controller.submit(); assert.equal(f.controller.getState().status, 'ready'); assert.ok(f.controller.getState().projectAccess); assert.deepEqual(f.controller.getState().policyPageErrors, {}); assert.equal(f.controller.getState().pageError, null); assert.equal(f.controller.getState().outcome, 'success');
});
test('content and policy pager failures coexist through independent retry in either response order', async () => {
  for (const collection of ['projectAccess', 'assignees']) for (const order of ['content-first', 'policy-first']) {
    let failContent = true; let failPolicy = true;
    const policyEntry = { ...creator, role: 'member', explicitAccess: 'active', implicitAccess: false, effectiveAccess: true, capabilities: { canGrant: false, canRevoke: true } };
    const f = fixture({ transport: { project: async (w, p) => ({ ...project(p, w), capabilities: { ...project().capabilities, canManageAccess: true } }),
      tasks: async (w, p, _view, _signal, cursor) => { if (cursor && failContent) throw new ProjectTaskFailure(503, null, null, 'content-request'); return { ...page([task(cursor ? 't2' : 't', p, w)]), total: 2, nextCursor: cursor ? null : '1' }; },
      [collection === 'projectAccess' ? 'access' : 'assignees']: async (w, p, _signal, cursor) => { if (cursor && failPolicy) throw new ProjectTaskFailure(503, null, null, 'policy-request'); return { ...page([policyEntry]), workspaceId: w, projectId: p, projectVersion: 1, total: 2, nextCursor: cursor ? null : 'human' }; } } });
    await f.controller.openLocation('?workspace=a&project=p&task=t');
    for (const target of order === 'content-first' ? ['tasks', collection] : [collection, 'tasks']) await f.controller.loadMore(target);
    let state = f.controller.getState(); assert.equal(state.pageError.collection, 'tasks'); assert.equal(state.pageError.requestId, 'content-request'); assert.equal(state.policyPageErrors[collection].requestId, 'policy-request'); assert.equal(state.task.id, 't'); assert.equal(state.tasks.nextCursor, '1');
    failPolicy = false; await f.controller.loadMore(collection); state = f.controller.getState(); assert.equal(state.pageError.collection, 'tasks'); assert.equal(state.policyPageErrors[collection], undefined); assert.equal(state.tasks.nextCursor, '1');
    failContent = false; await f.controller.loadMore('tasks'); state = f.controller.getState(); assert.equal(state.pageError, null); assert.deepEqual(state.tasks.items.map(row => row.id), ['t', 't2']); assert.equal(state.task.id, 't');
  }
});
