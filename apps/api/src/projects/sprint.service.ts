import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SprintPlanningResult } from '@rielia/contracts';
import type { VerifiedExecution } from '../principals/principal.service.js';
import { ProjectTaskService } from './project-task.service.js';
import { attribution } from './project-task-dto.js';
import { planningInput, sprintInput, sprintInterval } from './sprint-input.js';
import { mutateSprint } from './sprint-mutation.js';
import { planningView, sprintPage, sprintRow, sprintView } from './sprint-read.js';

function matchVersion(actual: number, expected: number, current: SprintPlanningResult) {
  if (actual !== expected)
    throw new ConflictException({
      code: 'version-conflict',
      message: 'Planning changed. Review current data before saving.',
      current,
    });
}
function mutable(archivedAt: Date | null, current: SprintPlanningResult) {
  if (archivedAt)
    throw new ConflictException({
      code: 'archived',
      message: 'Restore the project before editing planning.',
      current,
    });
}
@Injectable()
export class SprintService {
  constructor(@Inject(ProjectTaskService) private readonly projects: ProjectTaskService) {}
  planning(context: VerifiedExecution, w: string, p: string) {
    return this.projects.planningOperation(
      context,
      w,
      p,
      'read',
      async (_tx, _actor, canWrite, project) => planningView(project, canWrite),
    );
  }
  list(context: VerifiedExecution, w: string, p: string, cursor?: string) {
    return this.projects.planningOperation(context, w, p, 'read', (tx, _actor, canWrite, project) =>
      sprintPage(tx, project, canWrite, cursor),
    );
  }
  get(context: VerifiedExecution, w: string, p: string, id: string) {
    return this.projects.planningOperation(
      context,
      w,
      p,
      'read',
      async (tx, _actor, canWrite, project) =>
        sprintView(tx, project, await sprintRow(tx, project, id), canWrite),
    );
  }
  configure(
    context: VerifiedExecution,
    w: string,
    p: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    const input = planningInput(payload);
    return mutateSprint(
      this.projects,
      context,
      w,
      p,
      key,
      requestId,
      'configure-planning',
      null,
      input,
      async (tx, _actor, project) => {
        const current = planningView(project, true);
        matchVersion(project.version, input.expectedVersion, current);
        mutable(project.archivedAt, current);
        const changedFields = (['mode', 'timeZone', 'pointScale'] as const).filter(
          (field) => JSON.stringify(project[field]) !== JSON.stringify(input[field]),
        );
        return {
          result: planningView(
            await this.projects.configurePlanning(tx, project, {
              mode: input.mode,
              timeZone: input.timeZone,
              pointScale: input.pointScale,
            }),
            true,
          ),
          changedFields,
        };
      },
    );
  }
  save(
    context: VerifiedExecution,
    w: string,
    p: string,
    key: string,
    requestId: string,
    payload: unknown,
    id?: string,
  ) {
    const input = sprintInput(payload, id === undefined);
    return mutateSprint(
      this.projects,
      context,
      w,
      p,
      key,
      requestId,
      id === undefined ? 'create-sprint' : 'edit-sprint',
      id ?? null,
      input,
      async (tx, actor, project) => {
        const old = id === undefined ? null : await sprintRow(tx, project, id);
        const current = old
          ? await sprintView(tx, project, old, true)
          : planningView(project, true);
        matchVersion(old?.version ?? project.version, input.version, current);
        mutable(project.archivedAt, current);
        if (!old && project.mode !== 'scrum')
          throw new ConflictException({
            code: 'invalid-transition',
            message: 'Enable Scrum before creating a sprint.',
            current,
          });
        const timeZone = old?.timeZone ?? project.timeZone;
        const data = {
          ...input.fields,
          startDate: new Date(`${input.fields.startDate}T00:00:00.000Z`),
          endDateExclusive: new Date(`${input.fields.endDateExclusive}T00:00:00.000Z`),
          ...sprintInterval(input.fields.startDate, input.fields.endDateExclusive, timeZone),
        };
        const row = old
          ? await tx.sprint.update({
              where: { workspaceId_projectId_id: { workspaceId: w, projectId: p, id: old.id } },
              data,
            })
          : await tx.sprint.create({
              data: {
                id: randomUUID(),
                workspaceId: w,
                projectId: p,
                ...data,
                timeZone,
                ...attribution(actor),
              },
            });
        const changedFields = (['name', 'goal', 'startDate', 'endDateExclusive'] as const).filter(
          (field) =>
            !old ||
            (field === 'startDate' || field === 'endDateExclusive'
              ? old[field].toISOString().slice(0, 10)
              : old[field]) !== input.fields[field],
        );
        return { result: await sprintView(tx, project, row, true), changedFields };
      },
    );
  }
}
