import { createSeed, currentPrincipalId, labels, principals, project, statuses, workspace } from './seed.ts';
import type { ClosureDestination, DemoSprint, DemoTask, PrototypeError, PrototypeScenario, PrototypeState, SaveKind, SprintDraft, SprintSummary, TaskFields, TaskFilters, TaskPrototypeAdapter } from './types.ts';

const defaultFilters: TaskFilters = { search: '', status: 'all', priority: 'all', assigneeId: 'all', labelId: 'all', sprintId: 'all' };
const idle: PrototypeState['save'] = { status: 'idle', kind: null, error: null };
const priorities = ['low', 'medium', 'high', 'urgent'];

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function derive(state: PrototypeState): PrototypeState {
  const f = state.filters;
  const query = f.search.trim().toLowerCase();
  const visibleTasks = state.tasks.filter(task =>
    (state.view !== 'my-tasks' || task.assigneeId === state.currentPrincipalId)
    && (!query || `${task.key} ${task.title}`.toLowerCase().includes(query))
    && (f.status === 'all' || task.status === f.status)
    && (f.priority === 'all' || task.priority === f.priority)
    && (f.assigneeId === 'all' || (f.assigneeId === 'unassigned' ? task.assigneeId === null : task.assigneeId === f.assigneeId))
    && (f.labelId === 'all' || task.labelIds.includes(f.labelId))
    && (f.sprintId === 'all' || (f.sprintId === 'backlog' ? task.sprintId === null : task.sprintId === f.sprintId)));
  return freeze({ ...state, visibleTasks,
    columns: statuses.map(status => ({ status: status.id, tasks: visibleTasks.filter(task => task.status === status.id) })),
    selectedTask: state.tasks.find(task => task.id === state.selectedTaskId) ?? null,
  });
}

function initial(scenario: PrototypeScenario): PrototypeState {
  const seed = createSeed();
  return derive({ workspace, project, currentPrincipalId, principals, statuses, labels,
    tasks: scenario === 'empty' ? [] : seed.tasks, sprints: seed.sprints,
    view: 'my-tasks', filters: defaultFilters, visibleTasks: [], columns: [], selectedTaskId: null, selectedTask: null,
    taskDraft: null, sprintDraft: null, save: idle, canRetry: false, nextSaveWillFail: false, scenario });
}

function error(code: PrototypeError['code'], message: string, field: string | null = null): PrototypeError {
  return { code, message, field };
}
function validDate(value: string): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function stringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && Array.from(value).every(item => typeof item === 'string');
}
function taskFields(value: TaskFields): TaskFields {
  // Explicit allowlist: a UI payload cannot replace creator/provenance/IDs/version.
  return { title: value.title, description: value.description, status: value.status, priority: value.priority,
    assigneeId: value.assigneeId, labelIds: [...value.labelIds], dueDate: value.dueDate, points: value.points };
}
function validateTask(value: TaskFields): PrototypeError | null {
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 200)
    return error('validation', 'Enter a title between 1 and 200 characters.', 'title');
  if (typeof value.description !== 'string' || value.description.length > 5000)
    return error('validation', 'Keep the description within 5,000 characters.', 'description');
  if (!statuses.some(status => status.id === value.status)) return error('validation', 'Choose a demo status.', 'status');
  if (!priorities.includes(value.priority)) return error('validation', 'Choose a demo priority.', 'priority');
  if (value.assigneeId !== null && !principals.some(principal => principal.id === value.assigneeId))
    return error('validation', 'Choose a demo human or agent, or leave unassigned.', 'assigneeId');
  if (!Array.isArray(value.labelIds) || value.labelIds.some(id => !labels.some(label => label.id === id)))
    return error('validation', 'Choose demo labels.', 'labelIds');
  if (value.dueDate !== null && !validDate(value.dueDate)) return error('validation', 'Use a valid date (YYYY-MM-DD).', 'dueDate');
  if (value.points !== null && (!Number.isInteger(value.points) || value.points < 0 || value.points > 100))
    return error('validation', 'Use whole points from 0 to 100, or leave unestimated.', 'points');
  return null;
}

/** Closed summaries stay frozen when a finished task is later reopened. */
export function getSprintSummary(state: Pick<PrototypeState, 'tasks' | 'sprints'>, sprintId: string): SprintSummary {
  const closed = state.sprints.find(sprint => sprint.id === sprintId)?.closure;
  if (closed) return closed;
  const scope = state.tasks.filter(task => task.sprintId === sprintId);
  return freeze({ doneTaskIds: scope.filter(task => task.status === 'done').map(task => task.id),
    canceledTaskIds: scope.filter(task => task.status === 'canceled').map(task => task.id),
    unfinishedTaskIds: scope.filter(task => task.status !== 'done' && task.status !== 'canceled').map(task => task.id) });
}

interface Attempt { kind: SaveKind; validate(): PrototypeError | null; commit(): void }

/** No network, auth, storage or domain services. Create one adapter per demo session. */
export function createTaskPrototype(options: { scenario?: PrototypeScenario; settle?: () => Promise<void> } = {}): TaskPrototypeAdapter {
  let state = initial(options.scenario ?? 'seeded');
  let nextTaskNumber = 19;
  let nextSprintNumber = 3;
  let generation = 0;
  let lastAttempt: Attempt | null = null;
  const listeners = new Set<() => void>();
  const settle = options.settle ?? (() => new Promise<void>(resolve => setTimeout(resolve, 350)));
  function publish(patch: Partial<PrototypeState>) {
    state = derive({ ...state, ...patch });
    listeners.forEach(listener => listener());
  }
  function reject(kind: SaveKind, problem: PrototypeError): false {
    // Reporting a rejected action changes no draft/data and cannot erase a prior retry.
    publish({ save: { status: 'error', kind, error: problem } });
    return false;
  }
  function clearFeedback() {
    lastAttempt = null;
    publish({ save: idle, canRetry: false });
  }
  function canOpenDraft(kind: 'task' | 'sprint'): boolean {
    if (state.save.status === 'pending') return false;
    if (state.taskDraft || state.sprintDraft) return reject(kind, error('invalid-action', 'Save or discard the current draft first.'));
    return true;
  }
  async function run(attempt: Attempt): Promise<boolean> {
    if (state.save.status === 'pending') return false;
    const problem = attempt.validate();
    if (problem) return reject(attempt.kind, problem);
    const token = generation;
    const fail = state.nextSaveWillFail;
    lastAttempt = attempt;
    publish({ save: { status: 'pending', kind: attempt.kind, error: null }, canRetry: false, nextSaveWillFail: false });
    try {
      await settle();
    } catch {
      if (token !== generation) return false;
      publish({ save: { status: 'error', kind: attempt.kind, error: error('simulated-save', 'Demo save failed. Your draft is retained; retry when ready.') }, canRetry: true });
      return false;
    }
    if (token !== generation) return false;
    if (fail) {
      publish({ save: { status: 'error', kind: attempt.kind, error: error('simulated-save', 'Simulated save failure. Nothing was saved; your draft is retained.') }, canRetry: true });
      return false;
    }
    const changed = attempt.validate();
    if (changed) return reject(attempt.kind, changed);
    attempt.commit();
    lastAttempt = null;
    publish({ save: { status: 'saved', kind: attempt.kind, error: null }, canRetry: false });
    return true;
  }
  const findTask = (id: string) => state.tasks.find(task => task.id === id);
  const findSprint = (id: string) => state.sprints.find(sprint => sprint.id === id);
  function checkSprintDraft(draft: SprintDraft): PrototypeError | null {
    const existing = findSprint(draft.sprintId);
    if (existing && existing.state !== 'planned') return error('invalid-action', 'Only planned sprint details and scope can be edited.');
    if (typeof draft.name !== 'string' || !draft.name.trim() || draft.name.trim().length > 100) return error('validation', 'Enter a sprint name within 100 characters.', 'name');
    if (typeof draft.goal !== 'string' || !draft.goal.trim() || draft.goal.trim().length > 500) return error('validation', 'Enter a sprint goal within 500 characters.', 'goal');
    if (!validDate(draft.startsOn)) return error('validation', 'Enter a valid start date.', 'startsOn');
    if (!validDate(draft.endsOn) || draft.endsOn <= draft.startsOn)
      return error('validation', 'End date must be after start (exclusive end).', 'endsOn');
    if (!stringArray(draft.taskIds)) return error('validation', 'Task scope must be a list of demo task IDs.', 'taskIds');
    if (new Set(draft.taskIds).size !== draft.taskIds.length) return error('validation', 'Select each task once.', 'taskIds');
    if (draft.taskIds.some(id => { const task = findTask(id); return !task || (task.sprintId !== null && task.sprintId !== draft.sprintId); }))
      return error('validation', 'Scope can include only backlog tasks or tasks already in this sprint.', 'taskIds');
    return null;
  }

  const actions: TaskPrototypeAdapter['actions'] = {
    setView(view) { publish({ view }); },
    setFilters(filters) { publish({ filters: { ...state.filters, ...filters } }); },
    clearFilters() { publish({ filters: defaultFilters }); },
    selectTask(taskId) { publish({ selectedTaskId: taskId }); },
    beginCreateTask(status = 'backlog') {
      if (!canOpenDraft('task')) return;
      clearFeedback();
      const taskId = `demo-task-${nextTaskNumber++}`;
      publish({ taskDraft: { taskId, expectedVersion: null, title: '', description: '', status, priority: 'medium',
        assigneeId: null, labelIds: [], dueDate: null, points: null } });
    },
    beginEditTask(taskId) {
      if (!canOpenDraft('task')) return;
      const task = findTask(taskId);
      if (!task) { reject('task', error('invalid-action', 'Demo task was not found.')); return; }
      clearFeedback();
      publish({ taskDraft: { ...taskFields(task), taskId, expectedVersion: task.version } });
    },
    updateTaskDraft(fields) {
      if (state.save.status === 'pending' || !state.taskDraft) return;
      const draft = state.taskDraft;
      const candidate = { ...draft, ...fields };
      if (!stringArray(candidate.labelIds)) {
        reject('task', error('validation', 'Labels must be a list of demo label IDs.', 'labelIds'));
        return;
      }
      clearFeedback();
      publish({ taskDraft: { ...taskFields(candidate), taskId: draft.taskId, expectedVersion: draft.expectedVersion } });
    },
    discardTaskDraft() {
      if (state.save.status === 'pending' || !state.taskDraft) return;
      clearFeedback(); publish({ taskDraft: null });
    },
    async saveTask() {
      const draft = state.taskDraft;
      if (!draft) return false;
      return run({ kind: 'task', validate() {
        const invalid = validateTask(draft);
        if (invalid) return invalid;
        const task = findTask(draft.taskId);
        if (draft.expectedVersion === null) return task ? error('version-conflict', 'This demo task already exists.') : null;
        return task?.version === draft.expectedVersion ? null : error('version-conflict', 'The task changed. Keep your draft, then discard and reopen to review current data.');
      }, commit() {
        const existing = findTask(draft.taskId);
        const task: DemoTask = existing
          ? { ...existing, ...taskFields(draft), title: draft.title.trim(), labelIds: [...new Set(draft.labelIds)], version: existing.version + 1 }
          : { ...taskFields(draft), title: draft.title.trim(), labelIds: [...new Set(draft.labelIds)], id: draft.taskId,
            key: `RIE-${draft.taskId.slice('demo-task-'.length)}`, workspaceId: workspace.id, projectId: project.id,
            createdByPrincipalId: currentPrincipalId, provenance: { mode: 'human', source: 'web' }, sprintId: null, version: 1 };
        publish({ tasks: existing ? state.tasks.map(item => item.id === task.id ? task : item) : [...state.tasks, task],
          taskDraft: null, selectedTaskId: task.id });
      } });
    },
    async moveTask(taskId, status) {
      const version = findTask(taskId)?.version;
      return run({ kind: 'status', validate() {
        if (!statuses.some(item => item.id === status)) return error('validation', 'Choose a demo status.', 'status');
        const task = findTask(taskId);
        if (!task) return error('invalid-action', 'Demo task was not found.');
        return task.version === version ? null : error('version-conflict', 'The task changed. Review its current state.');
      }, commit() { publish({ tasks: state.tasks.map(task => task.id === taskId ? { ...task, status, version: task.version + 1 } : task) }); } });
    },
    beginCreateSprint() {
      if (!canOpenDraft('sprint')) return;
      clearFeedback();
      publish({ sprintDraft: { sprintId: `demo-sprint-${nextSprintNumber++}`, name: '', goal: '', startsOn: '', endsOn: '', taskIds: [] } });
    },
    beginEditSprint(sprintId) {
      if (!canOpenDraft('sprint')) return;
      const sprint = findSprint(sprintId);
      if (!sprint || sprint.state !== 'planned') { reject('sprint', error('invalid-action', 'Choose a planned demo sprint.')); return; }
      clearFeedback();
      publish({ sprintDraft: { sprintId, name: sprint.name, goal: sprint.goal, startsOn: sprint.startsOn, endsOn: sprint.endsOn,
        taskIds: state.tasks.filter(task => task.sprintId === sprintId).map(task => task.id) } });
    },
    updateSprintDraft(fields) {
      if (state.save.status === 'pending' || !state.sprintDraft) return;
      const draft = { ...state.sprintDraft, ...fields };
      const sprintId = state.sprintDraft.sprintId;
      if (!stringArray(draft.taskIds)) {
        reject('sprint', error('validation', 'Task scope must be a list of demo task IDs.', 'taskIds'));
        return;
      }
      clearFeedback();
      publish({ sprintDraft: { sprintId, name: draft.name, goal: draft.goal, startsOn: draft.startsOn, endsOn: draft.endsOn, taskIds: [...draft.taskIds] } });
    },
    discardSprintDraft() {
      if (state.save.status === 'pending' || !state.sprintDraft) return;
      clearFeedback(); publish({ sprintDraft: null });
    },
    async saveSprint() {
      const draft = state.sprintDraft;
      if (!draft) return false;
      return run({ kind: 'sprint', validate: () => checkSprintDraft(draft), commit() {
        const sprint: DemoSprint = { id: draft.sprintId, name: draft.name.trim(), goal: draft.goal.trim(), startsOn: draft.startsOn, endsOn: draft.endsOn, state: 'planned', closure: null };
        const selected = new Set(draft.taskIds);
        publish({ sprints: findSprint(sprint.id) ? state.sprints.map(item => item.id === sprint.id ? sprint : item) : [...state.sprints, sprint],
          tasks: state.tasks.map(task => {
            const sprintId = selected.has(task.id) ? sprint.id : task.sprintId === sprint.id ? null : task.sprintId;
            return sprintId === task.sprintId ? task : { ...task, sprintId, version: task.version + 1 };
          }), sprintDraft: null });
      } });
    },
    async startSprint(sprintId) {
      return run({ kind: 'start-sprint', validate() {
        if (findSprint(sprintId)?.state !== 'planned') return error('invalid-action', 'Only a planned sprint can start.');
        if (state.sprints.some(sprint => sprint.state === 'active')) return error('invalid-action', 'Close the active sprint before starting another.');
        return null;
      }, commit() { publish({ sprints: state.sprints.map(sprint => sprint.id === sprintId ? { ...sprint, state: 'active' } : sprint) }); } });
    },
    async closeSprint(sprintId, destination: ClosureDestination) {
      // Snapshot caller input, so changing a selection during pending cannot redirect carryover.
      const target = destination?.kind === 'sprint' ? { kind: 'sprint' as const, sprintId: destination.sprintId } : destination?.kind === 'backlog' ? { kind: 'backlog' as const } : null;
      return run({ kind: 'close-sprint', validate() {
        if (findSprint(sprintId)?.state !== 'active') return error('invalid-action', 'Only an active sprint can close.');
        if (!target) return error('validation', 'Choose an explicit destination for unfinished tasks.', 'destination');
        if (target.kind === 'sprint' && (target.sprintId === sprintId || findSprint(target.sprintId)?.state !== 'planned'))
          return error('validation', 'Choose another planned sprint or backlog.', 'destination');
        return null;
      }, commit() {
        if (!target) return;
        const summary = getSprintSummary(state, sprintId);
        const unfinished = new Set(summary.unfinishedTaskIds);
        publish({ sprints: state.sprints.map(sprint => sprint.id === sprintId ? { ...sprint, state: 'closed', closure: { ...summary, destination: target } } : sprint),
          tasks: state.tasks.map(task => unfinished.has(task.id) ? { ...task, sprintId: target.kind === 'backlog' ? null : target.sprintId, version: task.version + 1 } : task) });
      } });
    },
    async retrySave() { return state.canRetry && lastAttempt ? run(lastAttempt) : false; },
    simulateNextSaveFailure() { if (state.save.status !== 'pending') publish({ nextSaveWillFail: true }); },
    reset(scenario = 'seeded') {
      generation++; lastAttempt = null; nextTaskNumber = 19; nextSprintNumber = 3;
      state = initial(scenario); listeners.forEach(listener => listener());
    },
  };
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }, actions };
}
