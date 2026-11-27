import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  sprintCloseDestinationSchema,
  type ClosingConsequence,
  type ExecutionContextResponse,
  type SprintClosePreview,
} from '@rielia/contracts';
import type { Project } from '../generated/prisma/client.js';
import type { Transaction } from '../principals/principal.service.js';
import { canonical } from './project-task-input.js';
import { closingPageCursorSchema } from './project-cursor-schemas.js';
import { sprintRow } from './sprint-read.js';
import { planningTasks, planningSnapshot } from './task-planning.js';
import { summarizeSnapshots } from './sprint-scope-read.js';

export function closeDestination(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const result = sprintCloseDestinationSchema.safeParse(value);
  if (!result.success) throw new BadRequestException('Invalid closing destination.');
  return result.data;
}
/** Continuation binds the entire consequence set and authority scope, never just visible rows. */
export function closingPage(binding: unknown, ids: string[], cursor?: string) {
  const hash = createHash('sha256')
    .update(JSON.stringify(canonical(binding)))
    .digest('hex');
  let offset = 0;
  if (cursor !== undefined) {
    let saved: unknown;
    try {
      saved = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid closing cursor.');
    }
    const result = closingPageCursorSchema.safeParse(saved);
    if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor) || !result.success)
      throw new BadRequestException('Invalid closing cursor.');
    if (result.data.binding !== hash)
      throw new ConflictException({
        code: 'page-changed',
        message: 'Closing data changed. Refresh before continuing.',
      });
    offset = ids.indexOf(result.data.anchor) + 1;
    if (!offset) throw new BadRequestException('Invalid closing anchor.');
  }
  const end = offset + 100;
  return {
    offset,
    end,
    nextCursor:
      ids.length > end
        ? Buffer.from(JSON.stringify({ v: 1, binding: hash, anchor: ids[end - 1] })).toString(
            'base64url',
          )
        : null,
  };
}
export function consequenceBinding(
  authority: unknown,
  project: Project,
  source: { id: string; version: number },
  target: { id: string; version: number } | null,
  destination: string | null,
  items: ClosingConsequence[],
) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        canonical({
          schema: 1,
          authority,
          workspaceId: project.workspaceId,
          projectId: project.id,
          projectVersion: project.version,
          taskRevision: project.taskRevision,
          sprintRevision: project.sprintRevision,
          source,
          target,
          destination,
          items,
        }),
      ),
    )
    .digest('hex');
}
export async function closePreview(
  tx: Transaction,
  actor: ExecutionContextResponse,
  canWrite: boolean,
  project: Project,
  s: string,
  destination: string | null,
  cursor?: string,
) {
  if (!canWrite) throw new ForbiddenException('Project/sprint write access is denied.');
  const source = await sprintRow(tx, project, s);
  if (project.archivedAt)
    throw new ConflictException({
      code: 'archived',
      message: 'Restore the project before closing.',
    });
  if (source.state !== 'active')
    throw new ConflictException({
      code: 'invalid-transition',
      message: 'Only an active sprint can close.',
    });
  const target =
    destination !== null && destination !== 'backlog'
      ? await sprintRow(tx, project, destination)
      : null;
  if (target && (target.id === s || target.state !== 'planned'))
    throw new ConflictException({
      code: 'invalid-transition',
      message: 'Choose a distinct planned sprint or unscheduled backlog.',
    });
  const where = { workspaceId: project.workspaceId, projectId: project.id, sprintId: s };
  const visits = await tx.sprintParticipation.findMany({
    where: { ...where, exitedAt: null },
    orderBy: { id: 'asc' },
  });
  const tasks = new Map(
    (
      await planningTasks(
        tx,
        project,
        visits.map((v) => v.taskId),
      )
    ).map((t) => [t.id, planningSnapshot(t)]),
  );
  const items: ClosingConsequence[] = visits.map((v) => {
    const snapshot = tasks.get(v.taskId)!;
    return {
      participationId: v.id,
      taskId: v.taskId,
      snapshot,
      disposition:
        snapshot.status === 'done'
          ? 'done'
          : snapshot.status === 'canceled'
            ? 'canceled'
            : destination === null
              ? 'pending'
              : destination === 'backlog'
                ? 'backlog'
                : 'carried',
    };
  });
  const grant = actor.grantId
    ? await tx.executionGrant.findUniqueOrThrow({ where: { id: actor.grantId } })
    : null;
  const authority = {
    actor,
    grant: grant
      ? {
          ...grant,
          createdAt: grant.createdAt.toISOString(),
          expiresAt: grant.expiresAt.toISOString(),
          revokedAt: grant.revokedAt?.toISOString() ?? null,
        }
      : null,
  };
  const previewHash = consequenceBinding(
    authority,
    project,
    { id: s, version: source.version },
    target ? { id: target.id, version: target.version } : null,
    destination,
    items,
  );
  const page = closingPage(
    { kind: 'close-preview', previewHash },
    items.map((x) => x.participationId),
    cursor,
  );
  const pendingParticipants = items.filter(
    (x) => x.snapshot.status !== 'done' && x.snapshot.status !== 'canceled',
  ).length;
  const preview: SprintClosePreview = {
    ...where,
    expectedVersion: source.version,
    expectedProjectVersion: project.version,
    expectedTaskRevision: project.taskRevision,
    expectedSprintRevision: project.sprintRevision,
    expectedTargetVersion: target?.version ?? null,
    destination,
    previewSchema: 1,
    previewHash,
    total: items.length,
    pendingParticipants,
    totals: summarizeSnapshots(items.map((x) => x.snapshot)),
    items: items.slice(page.offset, page.end),
    nextCursor: page.nextCursor,
    canClose: pendingParticipants === 0 || destination !== null,
  };
  return { preview, items, source, target };
}
