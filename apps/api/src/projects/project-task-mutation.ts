import { BadRequestException, ConflictException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { ExecutionContextResponse, ProjectTaskResult } from '@rielia/contracts';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  PrincipalService,
  Transaction,
  VerifiedExecution,
} from '../principals/principal.service.js';
import { canonical } from './project-task-input.js';
import * as reads from './project-task-read.js';

export function mutateProjectTask(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  key: string,
  requestId: string,
  action: string,
  target: string[],
  input: unknown,
  work: (tx: Transaction, actor: ExecutionContextResponse) => Promise<ProjectTaskResult>,
  administration = false,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
    throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical([action, target, input])))
    .digest('hex');
  return principals.domainOperation(context, workspaceId, 'write', async (tx, actor) => {
    if (administration) reads.requireManagement(actor);
    if (target[0]) await reads.projectRow(tx, workspaceId, target[0], actor);
    const scope = {
      workspaceId,
      actorPrincipalId: actor.actorPrincipalId,
      executionScope: actor.grantId ? `grant:${actor.grantId}` : 'web',
      key,
    };
    const previous = await tx.projectTaskOperation.findUnique({
      where: { workspaceId_actorPrincipalId_executionScope_key: scope },
    });
    // Current execution and target access are rechecked before every replay.
    // Stored results are never authorization or a source of current content.
    if (previous) {
      if (previous.requestHash !== requestHash)
        throw new ConflictException('Idempotency key belongs to another request.');
      const saved = previous.response as unknown as ProjectTaskResult;
      if ('projectId' in saved)
        return reads.taskView(
          tx,
          await reads.taskRow(tx, workspaceId, saved.projectId, saved.id),
          await reads.projectRow(tx, workspaceId, saved.projectId, actor),
          true,
        );
      return reads.projectView(
        tx,
        await reads.projectRow(tx, workspaceId, saved.id, actor),
        true,
        actor,
      );
    }
    const before =
      target[1] && action !== 'change-access'
        ? await tx.task.findFirst({
            where: { workspaceId, projectId: target[0]!, id: target[1] },
          })
        : null;
    const result = await work(tx, actor);
    // Only bounded categorical/date snapshots. Never store user text, related
    // entity contents, credential information or arbitrary input metadata.
    const changes =
      before && 'projectId' in result
        ? (['status', 'type', 'priority', 'dueDate'] as const).flatMap((field) => {
            const old =
              field === 'dueDate'
                ? (before.dueDate?.toISOString().slice(0, 10) ?? null)
                : before[field];
            return old === result[field] ? [] : [{ field, before: old, after: result[field] }];
          })
        : [];
    const changedFields = action.includes('checklist')
      ? ['checklist']
      : action.endsWith('comment')
        ? ['comment']
        : action === 'set-task-parent'
          ? ['parentTaskId']
          : action === 'move-task'
            ? ['status', 'rank']
            : Object.keys(input as object).filter(
                (field) =>
                  ![
                    'expectedVersion',
                    'expectedParentVersion',
                    'acknowledgedChildrenVersion',
                  ].includes(field),
              );
    const activityId = randomUUID();
    await tx.activityEvent.create({
      data: {
        id: activityId,
        workspaceId,
        projectId: 'projectId' in result ? result.projectId : result.id,
        taskId: 'projectId' in result ? result.id : null,
        actorPrincipalId: actor.actorPrincipalId,
        executionMode: actor.executionMode,
        source: actor.source,
        grantId: actor.grantId,
        requestId,
        action,
        entityVersion: result.version,
        accessPrincipalId: action === 'change-access' ? target[1]! : null,
        changedFields,
        changes,
      },
    });
    await tx.outboxEvent.create({
      data: {
        id: randomUUID(),
        workspaceId,
        activityId,
        type: 'domain.activity',
        payload: { activityId },
      },
    });
    await tx.projectTaskOperation.create({
      data: { ...scope, requestHash, response: result as unknown as Prisma.InputJsonValue },
    });
    return result;
  });
}
