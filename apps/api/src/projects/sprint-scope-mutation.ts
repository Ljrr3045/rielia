import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import {
  isRecord,
  type ExecutionContextResponse,
  type Sprint,
  type TaskPlanning,
  type SprintTransitionResult,
} from '@rielia/contracts';
import type { Prisma, Project } from '../generated/prisma/client.js';
import type { Transaction, VerifiedExecution } from '../principals/principal.service.js';
import type { ProjectTaskService } from './project-task.service.js';
import { canonical, identifier } from './project-task-input.js';
import { sprintRow, sprintView } from './sprint-read.js';
import { taskPlanningView } from './task-planning.js';

type Action = 'start-sprint' | 'set-task-sprint' | 'estimate-task';
interface PreparedMutation {
  entity: 'task' | 'sprint';
  id: string;
  version: number;
  changes?: Prisma.InputJsonValue;
  journal(
    activityId: string,
  ): Promise<{ enteredVisitId: string | null; exitedVisitId: string | null }>;
}
/** New receipt formats keep immutable successful transition identity separate from current authorized state. */
export function mutateSprintScope(
  projects: ProjectTaskService,
  context: VerifiedExecution,
  w: string,
  p: string,
  key: string,
  requestId: string,
  action: Action,
  target: string,
  input: unknown,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    project: Project,
  ) => Promise<PreparedMutation>,
): Promise<SprintTransitionResult | TaskPlanning> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
    throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical([action, [p, target], input])))
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
      const current = async (
        entity: 'task' | 'sprint',
        id: string,
      ): Promise<Sprint | TaskPlanning> => {
        const fresh = await tx.project.findUniqueOrThrow({
          where: { workspaceId_id: { workspaceId: w, id: p } },
        });
        return entity === 'task'
          ? taskPlanningView(tx, fresh, id, true)
          : sprintView(tx, fresh, await sprintRow(tx, fresh, id), true);
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
        const saved = previous.response;
        if (
          !isRecord(saved) ||
          saved['id'] !== target ||
          saved['entity'] !== (action === 'start-sprint' ? 'sprint' : 'task')
        )
          throw new ServiceUnavailableException('Planning receipt is unavailable.');
        const value = await current(saved['entity'] as 'task' | 'sprint', saved['id']);
        if (action === 'estimate-task' && saved['kind'] === 'task-planning' && 'taskId' in value)
          return value;
        const op = saved['operation'];
        if (
          saved['kind'] !== 'sprint-transition' ||
          !isRecord(op) ||
          op['type'] !== action ||
          !identifier(op['activityId']) ||
          !(op['sprintId'] === null || identifier(op['sprintId'])) ||
          !(op['enteredVisitId'] === null || identifier(op['enteredVisitId'])) ||
          !(op['exitedVisitId'] === null || identifier(op['exitedVisitId']))
        )
          throw new ServiceUnavailableException('Planning receipt is unavailable.');
        return { operation: op as unknown as SprintTransitionResult['operation'], current: value };
      }
      const prepared = await work(tx, actor, project);
      const activityId = randomUUID();
      await tx.activityEvent.create({
        data: {
          id: activityId,
          workspaceId: w,
          projectId: p,
          taskId: prepared.entity === 'task' ? prepared.id : null,
          sprintId: prepared.entity === 'sprint' ? prepared.id : null,
          actorPrincipalId: actor.actorPrincipalId,
          executionMode: actor.executionMode,
          source: actor.source,
          grantId: actor.grantId,
          requestId,
          action,
          entityVersion: prepared.version,
          changedFields: [
            action === 'estimate-task'
              ? 'estimatePoints'
              : action === 'start-sprint'
                ? 'state'
                : 'participation',
          ],
          changes: prepared.changes ?? [],
        },
      });
      const visits = await prepared.journal(activityId);
      const operation = {
        activityId,
        type: action as 'start-sprint' | 'set-task-sprint',
        sprintId: prepared.entity === 'sprint' ? prepared.id : null,
        ...visits,
      };
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
          response: {
            kind: action === 'estimate-task' ? 'task-planning' : 'sprint-transition',
            entity: action === 'set-task-sprint' ? 'task' : prepared.entity,
            id: action === 'set-task-sprint' ? target : prepared.id,
            ...(action === 'estimate-task' ? {} : { operation }),
          },
        },
      });
      const value = await current(
        action === 'set-task-sprint' ? 'task' : prepared.entity,
        action === 'set-task-sprint' ? target : prepared.id,
      );
      return action === 'estimate-task' ? (value as TaskPlanning) : { operation, current: value };
    },
  );
}
