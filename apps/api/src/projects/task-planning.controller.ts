import { Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { ProjectTaskHttp } from './project-task-http.js';
import { TaskPlanningService } from './task-planning.service.js';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks/:taskId')
export class TaskPlanningController {
  constructor(
    @Inject(TaskPlanningService) private readonly planning: TaskPlanningService,
    @Inject(ProjectTaskHttp) private readonly http: ProjectTaskHttp,
  ) {}
  @Get('planning')
  get(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('taskId') t: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'planning-empty', (c) => this.planning.get(c, w, p, t));
  }
  @Get('sprint-history')
  history(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('taskId') t: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'planning-page', (c, _id, _v, cursor) =>
      this.planning.history(c, w, p, t, cursor),
    );
  }
  @Post('planning')
  estimate(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('taskId') t: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'planning-empty', (c, id) =>
      this.planning.estimate(c, w, p, t, req.headers['idempotency-key'] as string, id, req.body),
    );
  }
  @Post('sprint')
  setSprint(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('taskId') t: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'planning-empty', (c, id) =>
      this.planning.setSprint(c, w, p, t, req.headers['idempotency-key'] as string, id, req.body),
    );
  }
}
