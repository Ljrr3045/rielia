import { ConflictException } from '@nestjs/common';
import type { VerifiedExecution } from '../principals/principal.service.js';
import type { ProjectTaskService } from './project-task.service.js';
import { startSprintInput } from './task-planning-input.js';
import { sprintRow } from './sprint-read.js';
import { lockSprints, scopeEvent } from './sprint-participation.js';
import { lockPlanningTasks, planningTasks, planningSnapshot } from './task-planning.js';
import { mutateSprintScope } from './sprint-scope-mutation.js';

export function startSprint(
  projects: ProjectTaskService,
  context: VerifiedExecution,
  w: string,
  p: string,
  s: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = startSprintInput(payload);
  return mutateSprintScope(
    projects,
    context,
    w,
    p,
    key,
    requestId,
    'start-sprint',
    s,
    input,
    async (tx, _actor, project) => {
      await lockSprints(tx, project, [s]);
      const sprint = await sprintRow(tx, project, s);
      const visits = await tx.sprintParticipation.findMany({
        where: { workspaceId: w, projectId: p, sprintId: s, exitedAt: null },
        orderBy: { id: 'asc' },
      });
      await lockPlanningTasks(
        tx,
        project,
        visits.map((v) => v.taskId),
      );
      if (project.archivedAt)
        throw new ConflictException({
          code: 'archived',
          message: 'Restore the project before starting.',
        });
      if (
        sprint.version !== input.expectedVersion ||
        project.version !== input.expectedProjectVersion ||
        project.taskRevision !== input.expectedTaskRevision
      )
        throw new ConflictException({
          code: 'version-conflict',
          message: 'Planning changed. Review the complete scope before starting.',
        });
      if (project.mode !== 'scrum' || sprint.state !== 'planned')
        throw new ConflictException({
          code: 'invalid-transition',
          message: 'Only a planned sprint in Scrum can start.',
        });
      if (
        await tx.sprint.findFirst({
          where: { workspaceId: w, projectId: p, state: 'active' },
          select: { id: true },
        })
      )
        throw new ConflictException({
          code: 'active-sprint-exists',
          message: 'The project already has an active sprint.',
        });
      const tasks = await planningTasks(
        tx,
        project,
        visits.map((v) => v.taskId),
      );
      const snapshots = new Map(tasks.map((t) => [t.id, planningSnapshot(t)]));
      // Capture actual time only after authority, policy fence and every row lock.
      const at = new Date();
      const active = await tx.sprint.update({
        where: { workspaceId_projectId_id: { workspaceId: w, projectId: p, id: s } },
        data: { state: 'active', startedAt: at },
      });
      return {
        entity: 'sprint',
        id: s,
        version: active.version,
        journal: async (activityId) => {
          await scopeEvent(tx, project, s, active.version, activityId, 'start', at);
          if (visits.length)
            await tx.sprintStartReference.createMany({
              data: visits.map((v) => ({
                workspaceId: w,
                projectId: p,
                sprintId: s,
                participationId: v.id,
                taskId: v.taskId,
                startOrdinal: active.version,
                snapshot: snapshots.get(v.taskId)!,
              })),
            });
          return { enteredVisitId: null, exitedVisitId: null };
        },
      };
    },
  );
}
