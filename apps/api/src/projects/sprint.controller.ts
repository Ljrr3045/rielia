import { Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { ProjectTaskHttp } from './project-task-http.js';
import { SprintService } from './sprint.service.js';

@Controller('workspaces/:workspaceId/projects/:projectId')
export class SprintController {
  constructor(
    @Inject(SprintService) private readonly sprints: SprintService,
    @Inject(ProjectTaskHttp) private readonly http: ProjectTaskHttp,
  ) {}
  @Post('sprints/:sprintId/start')
  start(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('sprintId') s: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c, id) =>
      this.sprints.start(c, w, p, s, req.headers['idempotency-key'] as string, id, req.body),
    );
  }
  @Get('sprints/:sprintId/scope')
  scope(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('sprintId') s: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'sprints', (c, _id, _v, cursor) =>
      this.sprints.scope(c, w, p, s, cursor),
    );
  }
  @Get('sprints/:sprintId/history')
  history(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('sprintId') s: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'sprints', (c, _id, _v, cursor) =>
      this.sprints.history(c, w, p, s, cursor),
    );
  }
  @Get('planning')
  planning(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c) => this.sprints.planning(c, w, p));
  }
  @Post('planning')
  configure(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c, id) =>
      this.sprints.configure(c, w, p, req.headers['idempotency-key'] as string, id, req.body),
    );
  }
  @Get('sprints')
  list(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, 'sprints', (c, _id, _view, cursor) =>
      this.sprints.list(c, w, p, cursor),
    );
  }
  @Get('sprints/:sprintId')
  get(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('sprintId') s: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c) => this.sprints.get(c, w, p, s));
  }
  @Post('sprints')
  create(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c, id) =>
      this.sprints.save(c, w, p, req.headers['idempotency-key'] as string, id, req.body),
    );
  }
  @Post('sprints/:sprintId')
  edit(
    @Param('workspaceId') w: string,
    @Param('projectId') p: string,
    @Param('sprintId') s: string,
    @Req() req: NodeRequest,
    @Res() res: NodeResponse,
  ) {
    return this.http.respond(req, res, w, false, (c, id) =>
      this.sprints.save(c, w, p, req.headers['idempotency-key'] as string, id, req.body, s),
    );
  }
}
