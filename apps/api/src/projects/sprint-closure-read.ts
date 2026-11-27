import { ForbiddenException } from '@nestjs/common';
import type { SprintClosure, SprintClosingOutcomePage } from '@rielia/contracts';
import type { Project, SprintClosingOutcome } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { closingPage } from './sprint-close-preview.js';
import { summarizeSnapshots } from './sprint-scope-read.js';
import { storedPlanningSnapshot } from './planning-snapshot-read.js';
export async function closureRows(tx: Transaction, project: Project, s: string) {
  const where = { workspaceId: project.workspaceId, projectId: project.id, sprintId: s };
  const row = await tx.sprintClosure.findUnique({
    where: { workspaceId_projectId_sprintId: where },
  });
  if (!row) throw new ForbiddenException('Project/sprint closure access is denied.');
  const outcomes = await tx.sprintClosingOutcome.findMany({ where, orderBy: { id: 'asc' } });
  return { row, outcomes, where };
}
export async function closureView(
  tx: Transaction,
  project: Project,
  s: string,
): Promise<SprintClosure> {
  const { row, outcomes } = await closureRows(tx, project, s);
  const snapshots = outcomes.map((o) => storedPlanningSnapshot(o.snapshot));
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    sprintId: s,
    destination: row.destination === 'sprint' ? row.targetSprintId : row.destination,
    sourceOrdinal: row.sourceOrdinal,
    targetOrdinal: row.targetOrdinal,
    closedAt: row.closedAt.toISOString(),
    previewSchema: 1,
    previewHash: row.previewHash,
    activityId: row.activityId,
    total: outcomes.length,
    pendingParticipants: outcomes.filter(
      (o) => o.disposition === 'backlog' || o.disposition === 'carried',
    ).length,
    totals: summarizeSnapshots(snapshots),
  };
}
export function outcomeView(row: SprintClosingOutcome) {
  return {
    id: row.id,
    closureId: row.closureId,
    participationId: row.participationId,
    taskId: row.taskId,
    snapshot: storedPlanningSnapshot(row.snapshot),
    disposition: row.disposition as 'done' | 'canceled' | 'backlog' | 'carried',
    targetSprintId: row.targetSprintId,
    targetParticipationId: row.targetParticipationId,
  };
}
export async function closureOutcomes(
  tx: Transaction,
  project: Project,
  s: string,
  cursor?: string,
): Promise<SprintClosingOutcomePage> {
  const { row, outcomes, where } = await closureRows(tx, project, s);
  const page = closingPage(
    { kind: 'closing-outcomes', ...where, closureId: row.id },
    outcomes.map((o) => o.id),
    cursor,
  );
  return {
    ...where,
    closureId: row.id,
    total: outcomes.length,
    items: outcomes.slice(page.offset, page.end).map(outcomeView),
    nextCursor: page.nextCursor,
  };
}
