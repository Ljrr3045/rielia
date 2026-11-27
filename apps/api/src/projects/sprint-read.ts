import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import type { Sprint as SprintDTO, ProjectPlanning, SprintPage } from '@rielia/contracts';
import type { Project, Sprint } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { sprintPageCursorSchema } from './project-cursor-schemas.js';
import { loadPeople } from './project-task-read.js';

export function planningView(project: Project, canWrite: boolean): ProjectPlanning {
  const editable = canWrite && !project.archivedAt;
  return {
    workspaceId: project.workspaceId,
    projectId: project.id,
    mode: project.mode as 'kanban' | 'scrum',
    timeZone: project.timeZone,
    pointScale: [...project.pointScale],
    projectVersion: project.version,
    sprintRevision: project.sprintRevision,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    capabilities: {
      canConfigurePlanning: editable,
      canCreateSprint: editable && project.mode === 'scrum',
    },
  };
}
export async function sprintRow(tx: Transaction, project: Project, id: string) {
  const row = await tx.sprint.findUnique({
    where: {
      workspaceId_projectId_id: { workspaceId: project.workspaceId, projectId: project.id, id },
    },
  });
  if (!row) throw new ForbiddenException('Project/sprint access is denied.');
  return row;
}
export async function sprintViews(
  tx: Transaction,
  project: Project,
  rows: Sprint[],
  canWrite: boolean,
): Promise<SprintDTO[]> {
  const people = await loadPeople(
    tx,
    project.workspaceId,
    rows.map((row) => row.createdByPrincipalId),
  );
  const active = await tx.sprint.findFirst({
    where: { workspaceId: project.workspaceId, projectId: project.id, state: 'active' },
    select: { id: true },
  });
  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    name: row.name,
    goal: row.goal,
    ...(row.state === 'closed'
      ? {
          state: 'closed' as const,
          startedAt: row.startedAt!.toISOString(),
          closedAt: row.closedAt!.toISOString(),
        }
      : row.state === 'active'
        ? { state: 'active' as const, startedAt: row.startedAt!.toISOString() }
        : { state: 'planned' as const }),
    version: row.version,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDateExclusive: row.endDateExclusive.toISOString().slice(0, 10),
    timeZone: row.timeZone,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    creator: people.get(row.createdByPrincipalId)!,
    provenance: {
      actorPrincipalId: row.createdByPrincipalId,
      executionMode: row.creationMode as SprintDTO['provenance']['executionMode'],
      source: row.creationSource as SprintDTO['provenance']['source'],
      grantId: row.creationGrantId,
    },
    capabilities: {
      canEdit: canWrite && !project.archivedAt && row.state !== 'closed',
      canChangeScope: canWrite && !project.archivedAt && row.state !== 'closed',
      canClose: canWrite && !project.archivedAt && row.state === 'active',
      canStart:
        canWrite &&
        !project.archivedAt &&
        project.mode === 'scrum' &&
        row.state === 'planned' &&
        !active,
    },
    url: `/api/v1/workspaces/${encodeURIComponent(row.workspaceId)}/projects/${encodeURIComponent(row.projectId)}/sprints/${encodeURIComponent(row.id)}`,
  }));
}
export async function sprintView(
  tx: Transaction,
  project: Project,
  row: Sprint,
  canWrite: boolean,
) {
  return (await sprintViews(tx, project, [row], canWrite))[0]!;
}
export async function sprintPage(
  tx: Transaction,
  project: Project,
  canWrite: boolean,
  cursor?: string,
): Promise<SprintPage> {
  const where = { workspaceId: project.workspaceId, projectId: project.id };
  let anchor: string | undefined;
  if (cursor !== undefined) {
    try {
      if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
      const result = sprintPageCursorSchema.safeParse(
        JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
      );
      if (!result.success) throw new Error();
      const value = result.data;
      if (value['w'] !== project.workspaceId || value['p'] !== project.id) throw new Error();
      if (
        value['revision'] !== project.sprintRevision ||
        value['projectVersion'] !== project.version
      )
        throw new ConflictException({
          code: 'page-changed',
          message: 'Sprint page changed. Refresh before continuing.',
        });
      anchor = value['anchor'];
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException('Invalid sprint page cursor.');
    }
  }
  if (
    anchor &&
    !(await tx.sprint.findUnique({
      where: { workspaceId_projectId_id: { ...where, id: anchor } },
      select: { id: true },
    }))
  )
    throw new BadRequestException('Invalid sprint page cursor.');
  const rows = await tx.sprint.findMany({
    where: { ...where, ...(anchor ? { id: { gt: anchor } } : {}) },
    orderBy: { id: 'asc' },
    take: 101,
  });
  const page = rows.slice(0, 100);
  return {
    ...where,
    revision: project.sprintRevision,
    projectVersion: project.version,
    items: await sprintViews(tx, project, page, canWrite),
    total: await tx.sprint.count({ where }),
    nextCursor:
      rows.length > 100
        ? Buffer.from(
            JSON.stringify({
              v: 1,
              w: project.workspaceId,
              p: project.id,
              revision: project.sprintRevision,
              projectVersion: project.version,
              anchor: page.at(-1)!.id,
            }),
          ).toString('base64url')
        : null,
    capabilities: { canCreate: planningView(project, canWrite).capabilities.canCreateSprint },
  };
}
