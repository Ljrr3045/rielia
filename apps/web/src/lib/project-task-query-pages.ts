import type {
  Page,
  WorkspaceSummary,
  WorkspaceMember,
  DomainPage,
  Project,
  TaskPage,
  ProjectAccessPage,
  ProjectAssigneePage,
  TaskDiscoveryPage,
  TaskCollaborationPages,
  CollaborationCollection,
} from '@rielia/contracts';
import { ProjectTaskFailure } from './project-task-client.ts';

/** Admission composes validated pages; it does not manufacture server revisions. */
function chain<Item, Value extends { items: Item[]; total: number; nextCursor: string | null }>(
  identity: (row: Item) => string,
  binding: (value: Value) => unknown,
) {
  return {
    cursor: (value: Value) => value.nextCursor,
    binding: (value: Value) => JSON.stringify([value.total, binding(value)]),
    identities: (value: Value) => value.items.map(identity),
    size: (value: Value) => value.items.length,
    total: (value: Value) => value.total,
    compose: (values: Value[]): Value => ({
      ...values[0]!,
      items: values.flatMap((value) => value.items),
      nextCursor: values.at(-1)!.nextCursor,
    }),
  };
}

export const workspacePages = () =>
  chain<WorkspaceSummary, Page<WorkspaceSummary>>(
    (row) => row.id,
    () => null,
  );
export const memberPages = () =>
  chain<WorkspaceMember, Page<WorkspaceMember>>(
    (row) => row.principalId,
    () => null,
  );
export const projectPages = () =>
  chain<Project, DomainPage<Project>>(
    (row) => row.id,
    (page) => page.capabilities,
  );
export const taskPages = () =>
  chain<TaskPage['items'][number], TaskPage>(
    (row) => row.id,
    (page) => [page.orderVersion, page.columnCounts, page.selectedAssignee, page.capabilities],
  );
export const accessPages = () =>
  chain<ProjectAccessPage['items'][number], ProjectAccessPage>(
    (row) => row.principalId,
    (page) => [page.workspaceId, page.projectId, page.projectVersion],
  );
export const assigneePages = () =>
  chain<ProjectAssigneePage['items'][number], ProjectAssigneePage>(
    (row) => row.principalId,
    (page) => [page.workspaceId, page.projectId],
  );
export const discoveryPages = () =>
  chain<TaskDiscoveryPage['items'][number], TaskDiscoveryPage>(
    (row) => row.id,
    (page) => [page.workspaceId, page.principalId, canonicalDiscovery(page), page.revision],
  );

export function canonicalDiscovery(page: Pick<TaskDiscoveryPage, 'query'>) {
  const query = page.query;
  return [
    query.scope,
    query.q.trim(),
    query.view,
    query.projectId ?? null,
    Object.entries(query.filters).sort(),
  ];
}

export function collaborationPages<K extends CollaborationCollection>() {
  return chain<{ id: string }, TaskCollaborationPages[K]>(
    (row) => row.id,
    (page) => {
      const { items, nextCursor, ...binding } = page;
      // Every non-row field participates: relation counts/parent and capabilities
      // cannot drift independently of the admitted revision/total.
      void items;
      void nextCursor;
      return binding;
    },
  );
}

export function admitPage(value: { items: unknown[]; total: number }) {
  if (value.items.length > value.total) throw new ProjectTaskFailure(409, 'page-changed');
}

/** A fresh root proves the existing Query chain, never a copied return-context page. */
export function sameDiscoveryRoot(previous: TaskDiscoveryPage, next: TaskDiscoveryPage) {
  return JSON.stringify(previous) === JSON.stringify(next);
}
