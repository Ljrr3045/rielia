import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { SprintCloseResult } from '@rielia/contracts';
import type { VerifiedExecution } from '../principals/principal.service.js';
import type { ProjectTaskService } from './project-task.service.js';
import { canonical } from './project-task-input.js';
import { closeSprintInput } from './sprint-closure-input.js';
import { closePreview } from './sprint-close-preview.js';
import {
  lockSprints,
  closeParticipations,
  scopeEvent,
  touchSprint,
} from './sprint-participation.js';
import { lockPlanningTasks } from './task-planning.js';
import { sprintRow, sprintView } from './sprint-read.js';
import { closureView } from './sprint-closure-read.js';
import { sprintCloseReceiptSchema } from './sprint-receipt-schemas.js';

/** A distinct receipt owner: close replays never enter the task-targeted transition journal. */
export function closeSprint(
  projects: ProjectTaskService,
  context: VerifiedExecution,
  w: string,
  p: string,
  s: string,
  key: string,
  requestId: string,
  payload: unknown,
): Promise<SprintCloseResult> {
  const input = closeSprintInput(payload);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
    throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical(['close-sprint', [p, s], input])))
    .digest('hex');
  return projects.planningOperation(
    context,
    w,
    p,
    'write',
    async (tx, actor, _canWrite, project) => {
      const scope = {
        workspaceId: w,
        actorPrincipalId: actor.actorPrincipalId,
        executionScope: actor.grantId ? `grant:${actor.grantId}` : 'web',
        key,
      };
      const result = async (closureId: string, activityId: string): Promise<SprintCloseResult> => {
        const closure = await closureView(tx, project, s);
        if (closure.id !== closureId || closure.activityId !== activityId)
          throw new ServiceUnavailableException('Closing receipt is unavailable.');
        const fresh = await tx.project.findUniqueOrThrow({
          where: { workspaceId_id: { workspaceId: w, id: p } },
        });
        return {
          operation: { type: 'close-sprint', sprintId: s, closureId, activityId },
          closure,
          current: await sprintView(tx, fresh, await sprintRow(tx, fresh, s), true),
        };
      };
      const previous = await tx.projectTaskOperation.findUnique({
        where: { workspaceId_actorPrincipalId_executionScope_key: scope },
      });
      if (previous) {
        if (previous.requestHash !== requestHash)
          throw new ConflictException({
            code: 'idempotency-conflict',
            message: 'Idempotency key belongs to another request.',
          });
        const saved = sprintCloseReceiptSchema(s).safeParse(previous.response);
        if (!saved.success)
          throw new ServiceUnavailableException('Closing receipt is unavailable.');
        return result(saved.data.closureId, saved.data.activityId);
      }
      await lockSprints(tx, project, [
        s,
        ...(input.destination && input.destination !== 'backlog' ? [input.destination] : []),
      ]);
      const visits = await tx.sprintParticipation.findMany({
        where: { workspaceId: w, projectId: p, sprintId: s, exitedAt: null },
        orderBy: { id: 'asc' },
      });
      await lockPlanningTasks(
        tx,
        project,
        visits.map((v) => v.taskId),
      );
      const full = await closePreview(tx, actor, true, project, s, input.destination);
      const expected = full.preview;
      if (
        [
          'expectedVersion',
          'expectedProjectVersion',
          'expectedTaskRevision',
          'expectedSprintRevision',
          'expectedTargetVersion',
          'previewHash',
          'previewSchema',
        ].some((k) => input[k as keyof typeof input] !== expected[k as keyof typeof expected])
      )
        throw new ConflictException({
          code: 'close-preview-changed',
          message: 'Closing consequences changed. Review a fresh complete preview.',
        });
      if (!expected.canClose)
        throw new ConflictException({
          code: 'destination-required',
          message: 'Choose a destination for every pending participant, including children.',
        });
      const at = new Date(),
        closureId = randomUUID(),
        activityId = randomUUID();
      const source = await tx.sprint.update({
        where: { workspaceId_projectId_id: { workspaceId: w, projectId: p, id: s } },
        data: { state: 'closed', closedAt: at },
      });
      const target = full.target
        ? await touchSprint(tx, { workspaceId: w, projectId: p, sprintId: full.target.id })
        : null;
      await tx.activityEvent.create({
        data: {
          id: activityId,
          workspaceId: w,
          projectId: p,
          sprintId: s,
          actorPrincipalId: actor.actorPrincipalId,
          executionMode: actor.executionMode,
          source: actor.source,
          grantId: actor.grantId,
          requestId,
          action: 'close-sprint',
          entityVersion: source.version,
          changedFields: ['state', 'participation'],
          changes: [],
        },
      });
      await tx.sprintClosure.create({
        data: {
          id: closureId,
          workspaceId: w,
          projectId: p,
          sprintId: s,
          destination: target ? 'sprint' : input.destination,
          targetSprintId: target?.id ?? null,
          sourceOrdinal: source.version,
          targetOrdinal: target?.version ?? null,
          closedAt: at,
          previewSchema: 1,
          previewHash: input.previewHash,
          activityId,
        },
      });
      await closeParticipations(tx, project, source, target, closureId, at, full.items);
      await scopeEvent(tx, project, s, source.version, activityId, 'close', at);
      if (target)
        await scopeEvent(tx, project, target.id, target.version, activityId, 'carryover', at);
      await tx.outboxEvent.create({
        data: {
          id: randomUUID(),
          workspaceId: w,
          activityId,
          type: 'domain.activity',
          payload: { activityId },
        },
      });
      await tx.projectTaskOperation.create({
        data: {
          ...scope,
          requestHash,
          response: { kind: 'sprint-close', sprintId: s, closureId, activityId },
        },
      });
      return result(closureId, activityId);
    },
  );
}
