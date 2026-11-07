import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import {
  taskStatuses,
  type TaskFilters,
  type TaskStatus,
  type TaskPage,
  type TaskColumnCounts,
  type ArchiveView,
  type DomainPage,
  type DomainPerson,
  type ExecutionContextResponse,
  type Task,
  type ProjectAccessPage,
  type ProjectAssigneePage,
  type ProjectAccessReview,
  type MembershipRole,
  type TaskDiscoveryItem,
} from '@rielia/contracts';
import type { Prisma, Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { identifier, object, canonical } from './project-task-input.js';
import { administrator, canManage } from './project-task-policy.js';
import { projectDto, taskDto, accessDto, type ReadableTaskProject } from './project-task-dto.js';

function page<T>(
  rows: T[],
  total: number,
  cursor: (row: T) => string,
  canCreate: boolean,
): DomainPage<T> {
  const items = rows.slice(0, 100);
  return {
    items,
    total,
    nextCursor: rows.length > 100 ? cursor(items[items.length - 1]!) : null,
    capabilities: { canCreate },
  };
}

export function requireManagement(actor: ExecutionContextResponse) {
  if (!canManage(actor)) throw new ForbiddenException('Human project administration is required.');
}

export function readableProjects(actor: ExecutionContextResponse): Prisma.ProjectWhereInput {
  return {
    workspaceId: actor.workspaceId,
    ...(administrator(actor)
      ? {}
      : {
          OR: [
            { visibility: 'workspace' },
            { accesses: { some: { principalId: actor.actorPrincipalId, state: 'active' } } },
          ],
        }),
  };
}

export function eligibleMembers(project: ReadableTaskProject): Prisma.MembershipWhereInput {
  return {
    workspaceId: project.workspaceId,
    state: 'active',
    principal: { state: 'active', kind: { in: ['human', 'agent'] } },
    ...(project.visibility === 'workspace'
      ? {}
      : {
          OR: [
            { role: { in: ['owner', 'admin'] }, principal: { kind: 'human' } },
            { projectAccesses: { some: { projectId: project.id, state: 'active' } } },
          ],
        }),
  };
}

export async function projectRow(
  tx: Transaction,
  workspaceId: string,
  projectId: string,
  actor: ExecutionContextResponse,
) {
  const row = await tx.project.findFirst({
    where: { ...readableProjects(actor), workspaceId, id: projectId },
  });
  if (!row) throw new ForbiddenException('Project/task access is denied.');
  return row;
}

export async function taskRow(
  tx: Transaction,
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  const row = await tx.task.findUnique({
    where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } },
  });
  if (!row) throw new ForbiddenException('Project/task access is denied.');
  return row;
}

export async function loadPeople(
  tx: Transaction,
  workspaceId: string,
  ids: string[],
): Promise<Map<string, DomainPerson>> {
  const rows = await tx.membership.findMany({
    where: { workspaceId, principalId: { in: [...new Set(ids)] } },
    include: { principal: true },
  });
  return new Map(
    rows.map((row) => [
      row.principalId,
      {
        principalId: row.principalId,
        name: row.principal.displayName,
        kind: row.principal.kind as 'human' | 'agent',
        active: row.state === 'active' && row.principal.state === 'active',
      },
    ]),
  );
}

export async function projectView(
  tx: Transaction,
  row: ProjectRow,
  canWrite: boolean,
  actor: ExecutionContextResponse,
) {
  return projectDto(
    row,
    await loadPeople(tx, row.workspaceId, [row.createdByPrincipalId]),
    canWrite,
    actor,
  );
}

export async function loadTaskPeople(
  tx: Transaction,
  project: ReadableTaskProject,
  rows: TaskRow[],
) {
  const result = await loadTaskPeopleBatch(tx, [project], rows);
  return {
    people: result.people,
    eligible: result.eligible.get(project.id) ?? new Set<string>(),
  };
}

export async function loadTaskPeopleBatch(
  tx: Transaction,
  projects: ReadableTaskProject[],
  rows: TaskRow[],
) {
  const people = new Map<string, DomainPerson>();
  const eligible = new Map<string, Set<string>>();
  if (!rows.length) return { people, eligible };
  const byProject = new Map(projects.map((project) => [project.id, project]));
  const members = await tx.membership.findMany({
    where: {
      workspaceId: rows[0]!.workspaceId,
      principalId: {
        in: [
          ...new Set(
            rows.flatMap((row) => [
              row.createdByPrincipalId,
              ...(row.assigneePrincipalId ? [row.assigneePrincipalId] : []),
            ]),
          ),
        ],
      },
    },
    include: {
      principal: true,
      projectAccesses: {
        where: { projectId: { in: [...byProject.keys()] }, state: 'active' },
        select: { projectId: true },
      },
    },
  });
  const byMember = new Map(members.map((member) => [member.principalId, member]));
  for (const member of members)
    people.set(member.principalId, {
      principalId: member.principalId,
      name: member.principal.displayName,
      kind: member.principal.kind as 'human' | 'agent',
      active: member.state === 'active' && member.principal.state === 'active',
    });
  // Same backend assignment projection for detail/list/discovery; a historical
  // assignee remains named without regaining current project eligibility.
  for (const row of rows) {
    if (!row.assigneePrincipalId) continue;
    const member = byMember.get(row.assigneePrincipalId);
    const project = byProject.get(row.projectId)!;
    if (
      !member ||
      member.state !== 'active' ||
      member.principal.state !== 'active' ||
      !['human', 'agent'].includes(member.principal.kind)
    )
      continue;
    if (
      project.visibility !== 'workspace' &&
      !administrator({
        principalKind: member.principal.kind as 'human' | 'agent',
        role: member.role as MembershipRole,
      }) &&
      !member.projectAccesses.some((access) => access.projectId === project.id)
    )
      continue;
    const group = eligible.get(project.id) ?? new Set<string>();
    group.add(member.principalId);
    eligible.set(project.id, group);
  }
  return { people, eligible };
}

export async function taskView(
  tx: Transaction,
  row: TaskRow,
  project: ProjectRow,
  canWrite: boolean,
) {
  // Mutation triggers may have advanced the aggregate since project was read.
  const current = await tx.project.findUniqueOrThrow({
    where: { workspaceId_id: { workspaceId: project.workspaceId, id: project.id } },
  });
  const { people, eligible } = await loadTaskPeople(tx, current, [row]);
  return taskDto(row, current, people, canWrite, eligible);
}

export async function memberAnchor(
  tx: Transaction,
  where: Prisma.MembershipWhereInput,
  cursor?: string,
) {
  if (
    cursor !== undefined &&
    (!identifier(cursor) ||
      !(await tx.membership.findFirst({
        where: { ...where, principalId: cursor },
        select: { principalId: true },
      })))
  )
    throw new BadRequestException('Invalid page cursor.');
}

export async function accessMember(tx: Transaction, project: ProjectRow, principalId: string) {
  const row = await tx.membership.findUnique({
    where: { workspaceId_principalId: { workspaceId: project.workspaceId, principalId } },
    include: { principal: true, projectAccesses: { where: { projectId: project.id } } },
  });
  if (!row) throw new ForbiddenException('Project access is denied.');
  return accessDto(row, project);
}

export async function projects(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  view: ArchiveView,
  cursor?: string,
) {
  // The global allocation key never leaves the backend. A cursor names an
  // already visible public ID and resolves only within current scope. Keep
  // archived anchors valid; records cannot be deleted or moved.
  const anchor =
    cursor === undefined
      ? null
      : await tx.project.findFirst({
          where: { ...readableProjects(actor), id: cursor },
          select: { sequence: true },
        });
  if (cursor !== undefined && !anchor) throw new BadRequestException('Invalid page cursor.');
  const where = {
    ...readableProjects(actor),
    archivedAt: view === 'active' ? null : { not: null },
  };
  const rows = await tx.project.findMany({
    where: { ...where, ...(anchor ? { sequence: { gt: anchor.sequence } } : {}) },
    orderBy: { sequence: 'asc' },
    take: 101,
  });
  const people = await loadPeople(
    tx,
    workspaceId,
    rows.map((row) => row.createdByPrincipalId),
  );
  const result = page(rows, await tx.project.count({ where }), (row) => row.id, canWrite);
  return {
    ...result,
    capabilities: { ...result.capabilities, canCreatePrivate: canManage(actor) },
    items: result.items.map((row) => projectDto(row, people, canWrite, actor)),
  };
}

export async function project(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  projectId: string,
) {
  return projectView(tx, await projectRow(tx, workspaceId, projectId, actor), canWrite, actor);
}

export async function discoveryRead<T>(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    canWrite: boolean,
    projects: ReadableTaskProject[],
  ) => Promise<T>,
) {
  return work(
    tx,
    actor,
    canWrite,
    await tx.project.findMany({
      where: readableProjects(actor),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        workspaceId: true,
        key: true,
        name: true,
        version: true,
        taskRevision: true,
        visibility: true,
        archivedAt: true,
      },
    }),
  );
}

export async function eventsRead<T>(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    canWrite: boolean,
    projects: Pick<ProjectRow, 'id' | 'version'>[],
  ) => Promise<T>,
) {
  return work(
    tx,
    actor,
    canWrite,
    await tx.project.findMany({
      where: readableProjects(actor),
      orderBy: { id: 'asc' },
      select: { id: true, version: true },
    }),
  );
}

export async function discoveryItems(
  tx: Transaction,
  rows: TaskRow[],
  projects: ReadableTaskProject[],
  canWrite: boolean,
): Promise<TaskDiscoveryItem[]> {
  const byProject = new Map(projects.map((project) => [project.id, project]));
  const represented = [...new Set(rows.map((row) => row.projectId))].map((id) =>
    byProject.get(id)!,
  );
  const { people, eligible } = await loadTaskPeopleBatch(tx, represented, rows);
  return rows.map((row) => {
    const project = byProject.get(row.projectId)!;
    const item = Object.fromEntries(
      Object.entries(
        taskDto(row, project, people, canWrite, eligible.get(project.id) ?? new Set()),
      ).filter(([key]) => key !== 'description'),
    ) as Omit<Task, 'description'>;
    return { ...item, projectName: project.name };
  });
}

export async function tasks(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  projectId: string,
  view: ArchiveView,
  cursor: string | undefined,
  filters: TaskFilters,
  normalized: unknown,
): Promise<TaskPage> {
  const project = await projectRow(tx, workspaceId, projectId, actor);
  const where: Prisma.TaskWhereInput = {
    workspaceId,
    projectId,
    archivedAt: view === 'active' ? null : { not: null },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.assignee
      ? { assigneePrincipalId: filters.assignee === 'unassigned' ? null : filters.assignee }
      : {}),
  };
  let anchor: TaskRow | null = null;
  if (cursor !== undefined) {
    let decoded: Record<string, unknown>;
    try {
      if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
      decoded = object(
        JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
        ['v', 'w', 'p', 'view', 'filters', 'revision', 'anchor'],
        ['v', 'w', 'p', 'view', 'filters', 'revision', 'anchor'],
      );
      if (
        decoded['v'] !== 1 ||
        decoded['w'] !== workspaceId ||
        decoded['p'] !== projectId ||
        decoded['view'] !== view ||
        JSON.stringify(canonical(decoded['filters'])) !== JSON.stringify(normalized) ||
        !identifier(decoded['anchor']) ||
        !Number.isSafeInteger(decoded['revision']) ||
        Number(decoded['revision']) < 1
      )
        throw new Error();
    } catch {
      throw new BadRequestException('Invalid page cursor.');
    }
    if (decoded['revision'] !== project.taskRevision)
      throw new ConflictException({
        code: 'page-changed',
        message: 'Task order changed. Refresh the collection.',
      });
    anchor = await tx.task.findFirst({
      where: { ...where, id: decoded['anchor'] as string },
    });
    if (!anchor) throw new BadRequestException('Invalid page cursor.');
  }
  // At most 101 records total, using the same per-status order in both views.
  const rows: TaskRow[] = [];
  for (const status of taskStatuses) {
    if (filters.status && status !== filters.status) continue;
    if (anchor && taskStatuses.indexOf(status) < taskStatuses.indexOf(anchor.status as TaskStatus))
      continue;
    const sameColumn = anchor?.status === status;
    rows.push(
      ...(await tx.task.findMany({
        where: { ...where, status, ...(sameColumn ? { rank: { gt: anchor!.rank } } : {}) },
        orderBy: [{ rank: 'asc' }, { number: 'asc' }],
        take: 101 - rows.length,
      })),
    );
    if (rows.length === 101) break;
  }
  const { people, eligible } = await loadTaskPeople(tx, project, rows);
  const counts = Object.fromEntries(taskStatuses.map((status) => [status, 0])) as TaskColumnCounts;
  for (const group of await tx.task.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  }))
    counts[group.status as TaskStatus] = group._count._all;
  let selectedAssignee: DomainPerson | null = null;
  if (filters.assignee && filters.assignee !== 'unassigned') {
    const eligible = !!(await tx.membership.findFirst({
      where: { ...eligibleMembers(project), principalId: filters.assignee },
      select: { principalId: true },
    }));
    // Eligibility and historical task authorship/assignment are separate.
    // Reveal a noneligible identity only if it already appears as assignee
    // in this authorized project, never by arbitrary workspace/foreign ID.
    const historical =
      eligible ||
      !!(await tx.task.findFirst({
        where: { workspaceId, projectId, assigneePrincipalId: filters.assignee },
        select: { id: true },
      }));
    if (historical) {
      const person = (await loadPeople(tx, workspaceId, [filters.assignee])).get(filters.assignee);
      if (person) selectedAssignee = { ...person, active: eligible };
    }
  }
  const items = rows.slice(0, 100).map((row) => taskDto(row, project, people, canWrite, eligible));
  return {
    items,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    orderVersion: project.taskRevision,
    columnCounts: counts,
    selectedAssignee,
    capabilities: { canCreate: canWrite && !project.archivedAt },
    nextCursor:
      rows.length > 100
        ? Buffer.from(
            JSON.stringify({
              v: 1,
              w: workspaceId,
              p: projectId,
              view,
              filters: normalized,
              revision: project.taskRevision,
              anchor: items[99]!.id,
            }),
          ).toString('base64url')
        : null,
  };
}

export async function task(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  const project = await projectRow(tx, workspaceId, projectId, actor);
  return taskView(tx, await taskRow(tx, workspaceId, projectId, taskId), project, canWrite);
}

export async function collaborationRead<T>(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  projectId: string,
  taskId: string,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    canWrite: boolean,
    project: ProjectRow,
    task: TaskRow,
    view: () => Promise<Task>,
  ) => Promise<T>,
) {
  const project = await projectRow(tx, workspaceId, projectId, actor);
  const task = await taskRow(tx, workspaceId, projectId, taskId);
  return work(tx, actor, canWrite, project, task, () => taskView(tx, task, project, canWrite));
}

export async function accessReview(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  workspaceId: string,
  projectId: string,
  principalId: string,
): Promise<ProjectAccessReview> {
  requireManagement(actor);
  const project = await projectRow(tx, workspaceId, projectId, actor);
  return {
    project: await projectView(tx, project, canWrite, actor),
    member: await accessMember(tx, project, principalId),
  };
}

export async function access(
  tx: Transaction,
  actor: ExecutionContextResponse,
  workspaceId: string,
  projectId: string,
  cursor?: string,
): Promise<ProjectAccessPage> {
  requireManagement(actor);
  const project = await projectRow(tx, workspaceId, projectId, actor);
  const where = { workspaceId };
  await memberAnchor(tx, where, cursor);
  const rows = await tx.membership.findMany({
    where: { ...where, ...(cursor ? { principalId: { gt: cursor } } : {}) },
    orderBy: { principalId: 'asc' },
    take: 101,
    include: { principal: true, projectAccesses: { where: { projectId } } },
  });
  return {
    workspaceId,
    projectId,
    total: await tx.membership.count({ where }),
    nextCursor: rows.length > 100 ? rows[99]!.principalId : null,
    projectVersion: project.version,
    items: rows.slice(0, 100).map((row) => accessDto(row, project)),
  };
}

export async function assignees(
  tx: Transaction,
  actor: ExecutionContextResponse,
  workspaceId: string,
  projectId: string,
  cursor?: string,
): Promise<ProjectAssigneePage> {
  const project = await projectRow(tx, workspaceId, projectId, actor);
  const where = eligibleMembers(project);
  await memberAnchor(tx, where, cursor);
  const rows = await tx.membership.findMany({
    where: { ...where, ...(cursor ? { principalId: { gt: cursor } } : {}) },
    orderBy: { principalId: 'asc' },
    take: 101,
    include: { principal: true },
  });
  return {
    workspaceId,
    projectId,
    total: await tx.membership.count({ where }),
    nextCursor: rows.length > 100 ? rows[99]!.principalId : null,
    items: rows.slice(0, 100).map((row) => ({
      principalId: row.principalId,
      name: row.principal.displayName,
      kind: row.principal.kind as 'human' | 'agent',
      active: true,
    })),
  };
}
