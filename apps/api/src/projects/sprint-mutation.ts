import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import {
  isRecord,
  type ExecutionContextResponse,
  type SprintPlanningResult,
} from '@rielia/contracts';
import type { Project } from '../generated/prisma/client.js';
import type { Transaction, VerifiedExecution } from '../principals/principal.service.js';
import type { ProjectTaskService } from './project-task.service.js';
import { canonical, identifier } from './project-task-input.js';
import { planningView, sprintRow, sprintView } from './sprint-read.js';

export function mutateSprint(
  projects: ProjectTaskService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  key: string,
  requestId: string,
  action: 'configure-planning' | 'create-sprint' | 'edit-sprint',
  target: string | null,
  input: unknown,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    project: Project,
  ) => Promise<{ result: SprintPlanningResult; changedFields: string[] }>,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
    throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
  const requestHash = createHash('sha256')
    .update(JSON.stringify(canonical([action, [projectId, target], input])))
    .digest('hex');
  return projects.planningOperation(
    context,
    workspaceId,
    projectId,
    'write',
    async (tx, actor, _canWrite, project) => {
      const scope = {
        workspaceId,
        actorPrincipalId: actor.actorPrincipalId,
        executionScope: actor.grantId ? `grant:${actor.grantId}` : 'web',
        key,
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
        const saved = isRecord(previous.response) ? previous.response : {};
        if (action === 'configure-planning' && saved['kind'] === 'project-planning')
          return planningView(project, true);
        if (saved['kind'] !== 'planned-sprint' || !identifier(saved['id']))
          throw new ServiceUnavailableException('Planning receipt is unavailable.');
        return sprintView(tx, project, await sprintRow(tx, project, saved['id']), true);
      }
      const { result, changedFields } = await work(tx, actor, project);
      const sprintId = 'id' in result ? result.id : null;
      const activityId = randomUUID();
      await tx.activityEvent.create({
        data: {
          id: activityId,
          workspaceId,
          projectId,
          sprintId,
          actorPrincipalId: actor.actorPrincipalId,
          executionMode: actor.executionMode,
          source: actor.source,
          grantId: actor.grantId,
          requestId,
          action,
          entityVersion: 'version' in result ? result.version : result.projectVersion,
          changedFields,
          changes: [],
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
        data: {
          ...scope,
          requestHash,
          response: sprintId
            ? { kind: 'planned-sprint', id: sprintId }
            : { kind: 'project-planning' },
        },
      });
      return result;
    },
  );
}
