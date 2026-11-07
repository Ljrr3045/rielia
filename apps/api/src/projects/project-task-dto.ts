import {
  projectURL,
  taskURL,
  type DomainPerson,
  type ExecutionContextResponse,
  type MembershipRole,
  type Project,
  type Task,
} from '@rielia/contracts';
import type { Prisma, Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import { canManage } from './project-task-policy.js';

export type ReadableTaskProject = Pick<
  ProjectRow,
  'id' | 'workspaceId' | 'key' | 'name' | 'version' | 'taskRevision' | 'visibility' | 'archivedAt'
>;

const provenance = (row: ProjectRow | TaskRow) => ({
  actorPrincipalId: row.createdByPrincipalId,
  executionMode: row.creationMode as 'human' | 'delegated' | 'autonomous',
  source: row.creationSource as 'web' | 'mcp',
  grantId: row.creationGrantId,
});
export const attribution = (current: ExecutionContextResponse) => ({
  createdByPrincipalId: current.actorPrincipalId,
  creationMode: current.executionMode,
  creationSource: current.source,
  creationGrantId: current.grantId,
});
const iso = (date: Date | null) => date?.toISOString() ?? null;

export function projectDto(
  row: ProjectRow,
  people: Map<string, DomainPerson>,
  canWrite: boolean,
  actor: ExecutionContextResponse,
): Project {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    key: row.key,
    name: row.name,
    description: row.description,
    visibility: row.visibility as Project['visibility'],
    version: row.version,
    archivedAt: iso(row.archivedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    creator: people.get(row.createdByPrincipalId)!,
    provenance: provenance(row),
    capabilities: {
      canEdit: canWrite && !row.archivedAt,
      canArchive: canWrite && !row.archivedAt,
      canRestore: canWrite && !!row.archivedAt,
      canManageAccess: canManage(actor),
      canChangeVisibility: canManage(actor) && !row.archivedAt,
      canGrantAccess: canManage(actor) && !row.archivedAt,
      canRevokeAccess: canManage(actor),
    },
    url: projectURL(row.workspaceId, row.id),
  };
}

export function taskDto(
  row: TaskRow,
  project: ReadableTaskProject,
  people: Map<string, DomainPerson>,
  canWrite: boolean,
  eligible: Set<string>,
): Task {
  const active = !project.archivedAt && !row.archivedAt;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    projectKey: project.key,
    number: row.number,
    key: `${project.key}-${row.number}`,
    title: row.title,
    description: row.description,
    type: row.type as Task['type'],
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    assigneePrincipalId: row.assigneePrincipalId,
    assignee: row.assigneePrincipalId
      ? { ...people.get(row.assigneePrincipalId)!, active: eligible.has(row.assigneePrincipalId) }
      : null,
    parentTaskId: row.parentTaskId,
    dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null,
    version: row.version,
    orderVersion: project.taskRevision,
    archivedAt: iso(row.archivedAt),
    projectArchivedAt: iso(project.archivedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    creator: people.get(row.createdByPrincipalId)!,
    provenance: provenance(row),
    capabilities: {
      canEdit: canWrite && active,
      canArchive: canWrite && active,
      canRestore: canWrite && !project.archivedAt && !!row.archivedAt,
    },
    url: taskURL(row.workspaceId, row.projectId, row.id),
  };
}

export function accessDto(
  row: Prisma.MembershipGetPayload<{ include: { principal: true; projectAccesses: true } }>,
  project: ProjectRow,
) {
  const active = row.state === 'active' && row.principal.state === 'active';
  const explicitAccess = row.projectAccesses[0]?.state as 'active' | 'revoked' | undefined;
  const implicitAccess =
    active && row.principal.kind === 'human' && ['owner', 'admin'].includes(row.role);
  return {
    principalId: row.principalId,
    name: row.principal.displayName,
    kind: row.principal.kind as 'human' | 'agent',
    active,
    role: row.role as MembershipRole,
    explicitAccess: explicitAccess ?? null,
    implicitAccess,
    effectiveAccess:
      active &&
      (project.visibility === 'workspace' || implicitAccess || explicitAccess === 'active'),
    capabilities: {
      canGrant: active && !project.archivedAt && explicitAccess !== 'active',
      canRevoke: explicitAccess === 'active',
    },
  };
}
