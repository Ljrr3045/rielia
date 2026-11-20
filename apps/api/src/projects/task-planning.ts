import { BadRequestException, ConflictException } from '@nestjs/common';
import type { PlanningSnapshot, TaskPlanning, TaskStatus } from '@rielia/contracts';
import type { Project, Task } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { taskRow } from './project-task-read.js';
import { sprintRow, sprintView } from './sprint-read.js';

/** Task owner supplies canonical semantic snapshots, never serialized Task DTOs. */
export function planningSnapshot(
  row: Task,
): PlanningSnapshot & Record<string, string | number | null> {
  return {
    version: row.version,
    status: row.status as TaskStatus,
    estimatePoints: row.estimatePoints,
    parentTaskId: row.parentTaskId,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}
export async function planningTasks(tx: Transaction, project: Project, ids: string[]) {
  return tx.task.findMany({
    where: { workspaceId: project.workspaceId, projectId: project.id, id: { in: ids } },
    orderBy: { id: 'asc' },
  });
}
export async function lockPlanningTasks(
  tx: Transaction,
  project: Project,
  ids: string[],
  destination: string | null = null,
) {
  if (ids.length || destination)
    await tx.$queryRaw`SELECT id FROM task WHERE "workspaceId"=${project.workspaceId} AND "projectId"=${project.id} AND (id=ANY(${[...new Set(ids)].sort()}::text[]) OR status=${destination}) ORDER BY id FOR UPDATE`;
}
export async function taskPlanningView(
  tx: Transaction,
  project: Project,
  id: string,
  canWrite: boolean,
): Promise<TaskPlanning> {
  const row = await taskRow(tx, project.workspaceId, project.id, id);
  const visit = await tx.sprintParticipation.findFirst({
    where: { workspaceId: project.workspaceId, projectId: project.id, taskId: id, exitedAt: null },
  });
  const editable = canWrite && !project.archivedAt && !row.archivedAt;
  return {
    workspaceId: project.workspaceId,
    projectId: project.id,
    taskId: id,
    taskRevision: project.taskRevision,
    sprintRevision: project.sprintRevision,
    snapshot: planningSnapshot(row),
    currentParticipation: visit
      ? {
          id: visit.id,
          sprint: await sprintView(
            tx,
            project,
            await sprintRow(tx, project, visit.sprintId),
            canWrite,
          ),
        }
      : null,
    capabilities: { canEstimate: editable, canChangeScope: editable },
  };
}
export async function writeEstimate(
  tx: Transaction,
  project: Project,
  task: Task,
  points: number | null,
) {
  if (project.archivedAt || task.archivedAt)
    throw new ConflictException({
      code: 'archived',
      message: 'Restore the task and project before estimating.',
    });
  if (points !== task.estimatePoints && points !== null && !project.pointScale.includes(points))
    throw new BadRequestException('Choose a value from the current project point scale.');
  return tx.task.update({
    where: {
      workspaceId_projectId_id: {
        workspaceId: project.workspaceId,
        projectId: project.id,
        id: task.id,
      },
    },
    data: { estimatePoints: points },
  });
}
