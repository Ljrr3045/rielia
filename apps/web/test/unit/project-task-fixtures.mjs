export const person = { principalId: 'human', name: 'Human', kind: 'human', active: true };
export const provenance = {
  actorPrincipalId: 'human',
  executionMode: 'human',
  source: 'web',
  grantId: null,
};
export const project = {
  id: 'p',
  workspaceId: 'w',
  key: 'PR',
  name: 'Project',
  description: '',
  visibility: 'workspace',
  version: 1,
  archivedAt: null,
  createdAt: '2030-01-02',
  updatedAt: '2030-01-02',
  creator: person,
  provenance,
  url: '',
  capabilities: {
    canEdit: true,
    canArchive: true,
    canRestore: false,
    canManageAccess: false,
    canChangeVisibility: false,
    canGrantAccess: false,
    canRevokeAccess: false,
  },
};
export const task = {
  ...project,
  id: 't',
  projectId: 'p',
  projectKey: 'PR',
  number: 1,
  key: 'PR-1',
  title: 'Task',
  type: 'task',
  priority: 'none',
  status: 'todo',
  parentTaskId: null,
  orderVersion: 1,
  projectArchivedAt: null,
  assigneePrincipalId: null,
  assignee: null,
  dueDate: null,
};
export const taskPage = {
  items: [task],
  total: 1,
  nextCursor: null,
  capabilities: { canCreate: true },
  orderVersion: 1,
  columnCounts: { backlog: 0, todo: 1, in_progress: 0, done: 0, canceled: 0 },
  selectedAssignee: null,
};
export const comment = {
  id: 'comment',
  body: 'Comment',
  version: 1,
  author: person,
  provenance,
  createdAt: '2030-01-02',
  updatedAt: '2030-01-02',
  editedAt: null,
  capabilities: { canEdit: true },
};
export const history = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  revision: 1,
  total: 1,
  nextCursor: null,
  items: [
    {
      id: 'activity',
      action: 'create-task',
      fields: [],
      actor: person,
      provenance,
      entityVersion: 1,
      createdAt: '2030-01-02',
      changes: [],
    },
  ],
};
export const planningHistory = {
  workspaceId: 'w',
  projectId: 'p',
  taskId: 't',
  sprintId: null,
  taskRevision: 1,
  sprintRevision: 1,
  total: 1,
  nextCursor: null,
  items: [
    {
      id: 'event',
      taskId: 't',
      sprintId: null,
      participationId: null,
      ordinal: 1,
      kind: 'metadata',
      action: 'create-sprint',
      occurredAt: '2030-01-02T00:00:00.000Z',
      before: null,
      after: null,
      actor: person,
      provenance,
    },
  ],
};
export const discovery = {
  workspaceId: 'w',
  principalId: 'human',
  revision: 'a'.repeat(64),
  total: 1,
  nextCursor: null,
  query: { scope: 'search', q: '', view: 'active', filters: {} },
  items: [
    Object.fromEntries(
      Object.entries({ ...task, projectName: 'Project' }).filter(([key]) => key !== 'description'),
    ),
  ],
};

// Source-bound differential inputs: scalar JSON arrays and custom objects are distinct.
export function scalarWitnesses() {
  const cases = [];
  for (const kind of ['human', 'agent'])
    for (const value of [[kind], { toString: () => kind }]) {
      const malformed = { ...person, kind: value };
      cases.push(['isDomainPerson', malformed]);
      cases.push(['isProject', { ...project, creator: malformed }]);
      cases.push(['isTask', { ...task, assignee: malformed }]);
      cases.push(['isTaskComment', { ...comment, author: malformed }]);
      cases.push([
        'isCollaborationPage',
        {
          ...history,
          items: [{ ...history.items[0], actor: malformed }],
        },
        'history',
      ]);
      cases.push([
        'isPlanningHistoryPage',
        {
          ...planningHistory,
          items: [{ ...planningHistory.items[0], actor: malformed }],
        },
      ]);
      cases.push([
        'isTaskDiscoveryPage',
        {
          ...discovery,
          items: [{ ...discovery.items[0], creator: malformed }],
        },
      ]);
    }
  for (const [key, values] of [
    ['executionMode', ['human', 'delegated', 'autonomous']],
    ['source', ['web', 'mcp']],
  ]) {
    for (const scalar of values)
      for (const value of [[scalar], { toString: () => scalar }]) {
        cases.push(['isProject', { ...project, provenance: { ...provenance, [key]: value } }]);
        cases.push(['isTask', { ...task, provenance: { ...provenance, [key]: value } }]);
      }
  }
  return cases;
}
