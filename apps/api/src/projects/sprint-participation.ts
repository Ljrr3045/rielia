import { randomUUID } from 'node:crypto';
import type { PlanningSnapshot, ClosingConsequence } from '@rielia/contracts';
import {
  Prisma,
  type Project,
  type Sprint,
  type SprintParticipation,
  type Task,
} from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { lockPlanningTasks, planningSnapshot } from './task-planning.js';

export async function lockSprints(tx: Transaction, project: Project, ids: string[]) {
  if (ids.length)
    await tx.$queryRaw`SELECT id FROM sprint WHERE "workspaceId"=${project.workspaceId} AND "projectId"=${project.id} AND id=ANY(${[...new Set(ids)].sort()}::text[]) ORDER BY id FOR UPDATE`;
}
export async function touchSprint(
  tx: Transaction,
  visit: Pick<SprintParticipation, 'workspaceId' | 'projectId' | 'sprintId'>,
) {
  return tx.sprint.update({
    where: {
      workspaceId_projectId_id: {
        workspaceId: visit.workspaceId,
        projectId: visit.projectId,
        id: visit.sprintId,
      },
    },
    data: { version: { increment: 1 } },
  });
}
export async function scopeEvent(
  tx: Transaction,
  project: Project,
  sprintId: string,
  ordinal: number,
  activityId: string,
  kind: 'entry' | 'exit' | 'task-change' | 'metadata' | 'start' | 'close' | 'carryover',
  at: Date,
  visit: SprintParticipation | null = null,
  before: PlanningSnapshot | null = null,
  after: PlanningSnapshot | null = null,
) {
  return tx.sprintScopeEvent.create({
    data: {
      id: randomUUID(),
      workspaceId: project.workspaceId,
      projectId: project.id,
      sprintId,
      ordinal,
      activityId,
      kind,
      occurredAt: at,
      participationId: visit?.id ?? null,
      taskId: visit?.taskId ?? null,
      beforeSnapshot: before ? { ...before } : Prisma.DbNull,
      afterSnapshot: after ? { ...after } : Prisma.DbNull,
    },
  });
}
/** Membership-only aggregate close port, including archived participants. No Task writes. */
export async function closeParticipations(
  tx: Transaction,
  project: Project,
  source: Sprint,
  target: Sprint | null,
  closureId: string,
  at: Date,
  items: ClosingConsequence[],
) {
  const where = { workspaceId: project.workspaceId, projectId: project.id };
  const outcomes = items.map((x) => ({
    id: x.participationId,
    ...where,
    sprintId: source.id,
    closureId,
    participationId: x.participationId,
    taskId: x.taskId,
    snapshot: { ...x.snapshot },
    disposition: x.disposition,
    targetSprintId: x.disposition === 'carried' ? target!.id : null,
    targetParticipationId: x.disposition === 'carried' ? randomUUID() : null,
  }));
  if (!outcomes.length) return;
  await tx.sprintClosingOutcome.createMany({ data: outcomes });
  await tx.$executeRaw`UPDATE sprint_participation v SET "exitedAt"=${at},"exitedOrdinal"=${source.version},"exitReason"='closed',"exitSnapshot"=o.snapshot FROM sprint_closing_outcome o WHERE o."workspaceId"=${project.workspaceId} AND o."projectId"=${project.id} AND o."closureId"=${closureId} AND v."workspaceId"=o."workspaceId" AND v."projectId"=o."projectId" AND v."sprintId"=o."sprintId" AND v.id=o."participationId"`;
  const carried = outcomes.filter((o) => o.targetParticipationId !== null);
  if (carried.length)
    await tx.sprintParticipation.createMany({
      data: carried.map((o) => ({
        id: o.targetParticipationId!,
        ...where,
        sprintId: target!.id,
        taskId: o.taskId,
        enteredAt: at,
        enteredOrdinal: target!.version,
        entrySnapshot: o.snapshot,
      })),
    });
}
/** Sprint owner performs membership-only writes on the caller's verified transaction. */
export async function transferParticipation(
  tx: Transaction,
  project: Project,
  task: Task,
  visit: SprintParticipation | null,
  source: Sprint | null,
  target: Sprint | null,
) {
  const at = new Date(),
    snapshot = planningSnapshot(task),
    where = { workspaceId: project.workspaceId, projectId: project.id };
  const sourceNext = source ? await touchSprint(tx, { ...where, sprintId: source.id }) : null;
  const targetNext = target ? await touchSprint(tx, { ...where, sprintId: target.id }) : null;
  if (visit)
    await tx.sprintParticipation.update({
      where: { id: visit.id },
      data: {
        exitedAt: at,
        exitedOrdinal: sourceNext!.version,
        exitReason: target ? 'transferred' : 'removed',
        exitSnapshot: snapshot,
      },
    });
  const entered = targetNext
    ? await tx.sprintParticipation.create({
        data: {
          id: randomUUID(),
          ...where,
          sprintId: targetNext.id,
          taskId: task.id,
          enteredAt: at,
          enteredOrdinal: targetNext.version,
          entrySnapshot: snapshot,
        },
      })
    : null;
  return {
    sprint: targetNext ?? sourceNext!,
    journal: async (activityId: string) => {
      if (visit)
        await scopeEvent(
          tx,
          project,
          visit.sprintId,
          sourceNext!.version,
          activityId,
          'exit',
          at,
          visit,
          snapshot,
          snapshot,
        );
      if (entered)
        await scopeEvent(
          tx,
          project,
          entered.sprintId,
          targetNext!.version,
          activityId,
          'entry',
          at,
          entered,
          null,
          snapshot,
        );
      return { enteredVisitId: entered?.id ?? null, exitedVisitId: visit?.id ?? null };
    },
  };
}
export function semanticChange(before: PlanningSnapshot, after: PlanningSnapshot) {
  return (
    before.status !== after.status ||
    before.estimatePoints !== after.estimatePoints ||
    before.parentTaskId !== after.parentTaskId ||
    before.archivedAt !== after.archivedAt
  );
}
/** Called after authority/replay, before Task work. Covers rank compaction's entire destination, including archived rows. */
export async function prepareTaskObservation(
  tx: Transaction,
  project: Project,
  taskId: string | undefined,
  action: string,
  input: Record<string, unknown>,
  loaded?: Task | null,
) {
  const scope = { workspaceId: project.workspaceId, projectId: project.id };
  const before =
    loaded === undefined
      ? taskId
        ? await tx.task.findFirst({ where: { ...scope, id: taskId } })
        : null
      : loaded;
  const visit = before
    ? await tx.sprintParticipation.findFirst({
        where: { ...scope, taskId: before.id, exitedAt: null },
      })
    : null;
  const ids = [
    taskId,
    before?.parentTaskId,
    typeof input['parentTaskId'] === 'string' ? input['parentTaskId'] : null,
  ].filter((id): id is string => !!id);
  const destination =
    action === 'create-task'
      ? String(input['status'] ?? 'backlog')
      : (action === 'move-task' || action === 'edit-task') && typeof input['status'] === 'string'
        ? input['status']
        : null;
  const affected = destination
    ? await tx.$queryRaw<
        Array<{ sprintId: string }>
      >`SELECT DISTINCT v."sprintId" FROM sprint_participation v JOIN task t ON t."workspaceId"=v."workspaceId" AND t."projectId"=v."projectId" AND t.id=v."taskId" WHERE v."workspaceId"=${project.workspaceId} AND v."projectId"=${project.id} AND v."exitedAt" IS NULL AND t.status=${destination}`
    : [];
  await lockSprints(tx, project, [
    ...affected.map((v) => v.sprintId),
    ...(visit ? [visit.sprintId] : []),
  ]);
  await lockPlanningTasks(tx, project, ids, destination);
  return { before, visit };
}
/** Task owner passes its final row, after every Task write (including parent aggregate update). */
export async function observeTask(
  tx: Transaction,
  project: Project,
  observation: { before: Task | null; visit: SprintParticipation | null },
  final: Task,
  activityId: string,
) {
  if (!observation.before || !observation.visit) return;
  const before = planningSnapshot(observation.before),
    after = planningSnapshot(final);
  if (!semanticChange(before, after)) return;
  const sprint = await touchSprint(tx, observation.visit);
  await scopeEvent(
    tx,
    project,
    sprint.id,
    sprint.version,
    activityId,
    'task-change',
    new Date(),
    observation.visit,
    before,
    after,
  );
}
