import assert from 'node:assert/strict';
import { createSprintController } from '../../src/lib/sprint-controller.ts';
import { createSprintPlanningTransport } from '../../src/lib/sprint-client.ts';
import { createTaskPlanningTransport } from '../../src/lib/task-planning-client.ts';

export const context = {
  userId: 'human',
  sessionId: 'session-human',
  workspaceId: 'w',
  projectId: 'p',
  expiresAt: '9999-01-01T00:00:00.000Z',
};
export const fields = {
  name: 'Sprint',
  goal: 'Goal',
  startDate: '2026-11-19',
  endDateExclusive: '2026-12-03',
};
export const settings = { mode: 'scrum', timeZone: 'UTC', pointScale: [0, 1, 2, 5] };
export const totals = {
  done: 0,
  canceled: 0,
  pending: 1,
  donePoints: 0,
  canceledPoints: 0,
  pendingPoints: 0,
  unestimated: 1,
  children: 0,
  archived: 0,
};
export const snapshot = {
  version: 3,
  status: 'todo',
  estimatePoints: null,
  parentTaskId: null,
  archivedAt: null,
};
export const planning = {
  ...settings,
  workspaceId: 'w',
  projectId: 'p',
  projectVersion: 2,
  sprintRevision: 4,
  archivedAt: null,
  capabilities: { canConfigurePlanning: true, canCreateSprint: true },
};
export const sprint = {
  ...fields,
  id: 's',
  workspaceId: 'w',
  projectId: 'p',
  state: 'active',
  version: 2,
  timeZone: 'UTC',
  startsAt: '2026-11-19T00:00:00.000Z',
  endsAt: '2026-12-03T00:00:00.000Z',
  createdAt: '2026-11-19T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
  startedAt: '2026-11-19T00:00:00.000Z',
  creator: { principalId: 'h', name: 'Human', kind: 'human', active: true },
  provenance: { actorPrincipalId: 'h', executionMode: 'human', source: 'web', grantId: null },
  capabilities: { canEdit: true, canStart: false, canChangeScope: true, canClose: true },
  url: '/api/v1/workspaces/w/projects/p/sprints/s',
};
export function plannedSprint(id = 'target') {
  const value = { ...sprint };
  delete value.startedAt;
  return {
    ...value,
    id,
    state: 'planned',
    version: 1,
    capabilities: { ...value.capabilities, canStart: true, canClose: false },
  };
}
export const task = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  taskRevision: 5,
  sprintRevision: 4,
  snapshot,
  currentParticipation: { id: 'visit', sprint },
  capabilities: { canEstimate: true, canChangeScope: true },
};
export const visit = {
  id: 'visit',
  taskId: 't',
  enteredAt: '2026-11-19T00:00:00.000Z',
  enteredOrdinal: 1,
  entry: snapshot,
  current: snapshot,
  start: snapshot,
  exitedAt: null,
  exitedOrdinal: null,
  exitReason: null,
  exit: null,
};
export const scope = {
  workspaceId: 'w',
  projectId: 'p',
  sprintId: 's',
  taskRevision: 5,
  sprintRevision: 4,
  sprintVersion: 2,
  items: [visit],
  total: 1,
  nextCursor: null,
  currentTotals: totals,
  startTotals: totals,
  removed: 0,
  transferred: 0,
  closingTotals: null,
};
export const history = {
  workspaceId: 'w',
  projectId: 'p',
  sprintId: 's',
  taskId: null,
  taskRevision: 5,
  sprintRevision: 4,
  items: [],
  total: 0,
  nextCursor: null,
};
export const list = {
  workspaceId: 'w',
  projectId: 'p',
  revision: 4,
  projectVersion: 2,
  items: [sprint, plannedSprint()],
  total: 2,
  nextCursor: null,
  capabilities: { canCreate: true },
};
export function preview(destination = null) {
  return {
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    expectedVersion: 2,
    expectedProjectVersion: 2,
    expectedTaskRevision: 5,
    expectedSprintRevision: 4,
    expectedTargetVersion: destination !== null && destination !== 'backlog' ? 1 : null,
    destination,
    previewSchema: 1,
    previewHash: 'a'.repeat(64),
    items: [
      {
        participationId: 'visit',
        taskId: 't',
        snapshot,
        disposition:
          destination === null ? 'pending' : destination === 'backlog' ? 'backlog' : 'carried',
      },
    ],
    total: 1,
    pendingParticipants: 1,
    totals,
    nextCursor: null,
    canClose: destination !== null,
  };
}
export function closeResult(input = preview('backlog')) {
  const closure = {
    id: 'closure',
    workspaceId: 'w',
    projectId: 'p',
    sprintId: 's',
    destination: input.destination,
    sourceOrdinal: input.expectedVersion + 1,
    targetOrdinal: input.expectedTargetVersion === null ? null : input.expectedTargetVersion + 1,
    closedAt: '2026-11-20T00:00:00.000Z',
    previewSchema: 1,
    previewHash: input.previewHash,
    activityId: 'activity',
    total: input.total,
    pendingParticipants: input.pendingParticipants,
    totals: input.totals,
  };
  return {
    operation: {
      type: 'close-sprint',
      activityId: 'activity',
      closureId: 'closure',
      sprintId: 's',
    },
    closure,
    current: {
      ...sprint,
      state: 'closed',
      version: closure.sourceOrdinal,
      closedAt: closure.closedAt,
      capabilities: { canEdit: false, canStart: false, canClose: false, canChangeScope: false },
    },
  };
}
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
/** Finite HTTP boundary only; the real transports/controller remain in use. */
export function sprintServer() {
  const server = {
    planning: globalThis.structuredClone(planning),
    sprint: globalThis.structuredClone(sprint),
    target: plannedSprint(),
    task: globalThis.structuredClone(task),
    scope: globalThis.structuredClone(scope),
    history: globalThis.structuredClone(history),
    list: globalThis.structuredClone(list),
    requests: [],
    get: null,
    post: null,
    closure: closeResult().closure,
    outcomes: {
      workspaceId: 'w',
      projectId: 'p',
      sprintId: 's',
      closureId: 'closure',
      total: 1,
      items: [
        {
          ...preview('backlog').items[0],
          id: 'outcome',
          closureId: 'closure',
          targetSprintId: null,
          targetParticipationId: null,
        },
      ],
      nextCursor: null,
    },
    fetch: async (url, init) => {
      const path = new URL(String(url), 'https://app.example.test');
      const request = { path: path.pathname, query: path.searchParams, init };
      server.requests.push(request);
      if (init.method === 'POST') {
        assert.ok(server.post, `Unconfigured POST ${request.path}`);
        return server.post(request);
      }
      const custom = await server.get?.(request);
      if (custom !== undefined) return custom;
      const suffix = request.path.replace(/^\/api\/v1\/workspaces\/[^/]+\/projects\/[^/]+\//, '');
      let value;
      if (suffix === 'planning') value = server.planning;
      else if (suffix === 'sprints') value = server.list;
      else if (suffix === 'sprints/s') value = server.sprint;
      else if (suffix === 'sprints/target') value = server.target;
      else if (suffix === 'tasks/t/planning') value = server.task;
      else if (suffix === 'sprints/s/scope') value = server.scope;
      else if (suffix === 'sprints/s/history') value = server.history;
      else if (suffix === 'tasks/t/sprint-history')
        value = { ...server.history, taskId: 't', sprintId: null };
      else if (suffix === 'sprints/s/close-preview')
        value = preview(request.query.get('destination'));
      else if (suffix === 'sprints/s/closure') value = server.closure;
      else if (suffix === 'sprints/s/closure/outcomes') value = server.outcomes;
      else throw new Error(`Unexpected GET ${suffix}`);
      return Response.json(value);
    },
  };
  return server;
}
export async function mountedSprint(
  t,
  { selected = true, server = sprintServer(), now, confirmed } = {},
) {
  t.mock.method(globalThis, 'fetch', server.fetch);
  let key = 0;
  const controller = createSprintController({
    planning: createSprintPlanningTransport(),
    tasks: createTaskPlanningTransport(),
    key: () => `00000000-0000-4000-8000-${String(++key).padStart(12, '0')}`,
    now,
    confirmed,
  });
  t.after(() => controller.dispose());
  await controller.setContext(context);
  if (selected) await controller.select('s', 't');
  return {
    controller,
    server,
    state: () => controller.getState(),
    posts: () => server.requests.filter((r) => r.init.method === 'POST'),
  };
}
