import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import type { VerifiedExecution } from '../principals/principal.service.js';
import { ProjectTaskService } from './project-task.service.js';
import { expected, identifier, object } from './project-task-input.js';
import { taskRow } from './project-task-read.js';
import { sprintRow } from './sprint-read.js';
import { mutateSprintScope } from './sprint-scope-mutation.js';
import {
  lockSprints,
  transferParticipation,
  prepareTaskObservation,
  observeTask,
} from './sprint-participation.js';
import {
  lockPlanningTasks,
  planningSnapshot,
  taskPlanningView,
  writeEstimate,
} from './task-planning.js';
import { planningHistory } from './sprint-scope-read.js';

@Injectable()
export class TaskPlanningService {
  constructor(@Inject(ProjectTaskService) private readonly projects: ProjectTaskService) {}
  get(c: VerifiedExecution, w: string, p: string, t: string) {
    return this.projects.planningOperation(c, w, p, 'read', (tx, _a, write, project) =>
      taskPlanningView(tx, project, t, write),
    );
  }
  history(c: VerifiedExecution, w: string, p: string, t: string, cursor?: string) {
    return this.projects.planningOperation(c, w, p, 'read', async (tx, _a, _write, project) => {
      await taskRow(tx, w, p, t);
      return planningHistory(tx, project, { taskId: t }, cursor);
    });
  }
  estimate(
    c: VerifiedExecution,
    w: string,
    p: string,
    t: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    const raw = object(
      payload,
      ['expectedVersion', 'estimatePoints'],
      ['expectedVersion', 'estimatePoints'],
    );
    const points = raw['estimatePoints'];
    if (
      points !== null &&
      !(Number.isInteger(points) && Number(points) >= 0 && Number(points) <= 1000)
    )
      throw new BadRequestException('Invalid estimate.');
    const input = {
      expectedVersion: expected(raw['expectedVersion']),
      estimatePoints: points as number | null,
    };
    return mutateSprintScope(
      this.projects,
      c,
      w,
      p,
      key,
      requestId,
      'estimate-task',
      t,
      input,
      async (tx, _actor, project) => {
        const observation = await prepareTaskObservation(tx, project, t, 'estimate-task', input);
        const task = await taskRow(tx, w, p, t);
        if (task.version !== input.expectedVersion)
          throw new ConflictException({
            code: 'version-conflict',
            message: 'Task changed. Review before estimating.',
            current: await taskPlanningView(tx, project, t, true),
          });
        const final = await writeEstimate(tx, project, task, input.estimatePoints);
        return {
          entity: 'task',
          id: t,
          version: final.version,
          changes: [
            { planningBefore: planningSnapshot(task), planningAfter: planningSnapshot(final) },
          ],
          journal: async (activityId) => {
            await observeTask(tx, project, observation, final, activityId);
            return { enteredVisitId: null, exitedVisitId: null };
          },
        };
      },
    );
  }
  setSprint(
    c: VerifiedExecution,
    w: string,
    p: string,
    t: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    const fields = [
      'expectedTaskVersion',
      'expectedCurrentParticipationId',
      'expectedSourceVersion',
      'targetSprintId',
      'expectedTargetVersion',
    ];
    const raw = object(payload, fields, fields);
    if (
      !(
        raw['expectedCurrentParticipationId'] === null ||
        identifier(raw['expectedCurrentParticipationId'])
      ) ||
      !(raw['targetSprintId'] === null || identifier(raw['targetSprintId']))
    )
      throw new BadRequestException('Invalid sprint participation.');
    const input = {
      expectedTaskVersion: expected(raw['expectedTaskVersion']),
      expectedCurrentParticipationId: raw['expectedCurrentParticipationId'] as string | null,
      expectedSourceVersion:
        raw['expectedSourceVersion'] === null ? null : expected(raw['expectedSourceVersion']),
      targetSprintId: raw['targetSprintId'] as string | null,
      expectedTargetVersion:
        raw['expectedTargetVersion'] === null ? null : expected(raw['expectedTargetVersion']),
    };
    if (
      (input.expectedCurrentParticipationId === null) !== (input.expectedSourceVersion === null) ||
      (input.targetSprintId === null) !== (input.expectedTargetVersion === null)
    )
      throw new BadRequestException(
        'Sprint versions must match the explicit source and destination.',
      );
    return mutateSprintScope(
      this.projects,
      c,
      w,
      p,
      key,
      requestId,
      'set-task-sprint',
      t,
      input,
      async (tx, _actor, project) => {
        const where = { workspaceId: w, projectId: p };
        const visit = await tx.sprintParticipation.findFirst({
          where: { ...where, taskId: t, exitedAt: null },
        });
        await lockSprints(
          tx,
          project,
          [visit?.sprintId, input.targetSprintId].filter((v): v is string => !!v),
        );
        await lockPlanningTasks(tx, project, [t]);
        const task = await taskRow(tx, w, p, t);
        const source = visit ? await sprintRow(tx, project, visit.sprintId) : null;
        const target = input.targetSprintId
          ? await sprintRow(tx, project, input.targetSprintId)
          : null;
        if (
          task.version !== input.expectedTaskVersion ||
          (visit?.id ?? null) !== input.expectedCurrentParticipationId ||
          (source?.version ?? null) !== input.expectedSourceVersion ||
          (target?.version ?? null) !== input.expectedTargetVersion
        )
          throw new ConflictException({
            code: 'current-sprint-conflict',
            message: 'Task planning changed. Review before changing scope.',
            current: await taskPlanningView(tx, project, t, true),
          });
        if (project.archivedAt || task.archivedAt)
          throw new ConflictException({
            code: 'archived',
            message: 'Restore the task and project before changing scope.',
          });
        if ((source?.id ?? null) === (target?.id ?? null))
          throw new ConflictException({
            code: 'invalid-transition',
            message: 'Choose a different sprint or remove the current participation.',
          });
        const transition = await transferParticipation(tx, project, task, visit, source, target);
        return {
          entity: 'sprint',
          id: transition.sprint.id,
          version: transition.sprint.version,
          journal: transition.journal,
        };
      },
    );
  }
}
