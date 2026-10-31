import { Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { ProjectTaskService } from './project-task.service.js';
import { ProjectTaskHttp } from './project-task-http.js';

@Controller('workspaces/:workspaceId/projects')
export class ProjectTaskController {
  constructor(@Inject(ProjectTaskService) private readonly domain: ProjectTaskService, @Inject(ProjectTaskHttp) private readonly http: ProjectTaskHttp) {}
  private key(req: NodeRequest) { return req.headers['idempotency-key'] as string; }
  @Get()
  projects(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, true, (c, _id, view, cursor) => this.domain.projects(c, w, view, cursor)); }
  @Post()
  createProject(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.createProject(c, w, this.key(req), id, req.body)); }
  @Get(':projectId')
  project(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, c => this.domain.project(c, w, p)); }
  @Post(':projectId')
  editProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'edit-project', req.body)); }
  @Post(':projectId/archive')
  archiveProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'archive-project', req.body)); }
  @Post(':projectId/restore')
  restoreProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'restore-project', req.body)); }
  @Post(':projectId/visibility')
  visibility(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeVisibility(c, w, p, this.key(req), id, req.body)); }
  @Get(':projectId/access')
  access(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, 'cursor', (c, _id, _view, cursor) => this.domain.access(c, w, p, cursor)); }
  @Post(':projectId/access/:principalId')
  changeAccess(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('principalId') principalId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeAccess(c, w, p, principalId, this.key(req), id, req.body)); }
  @Get(':projectId/access/:principalId')
  accessReview(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('principalId') principalId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, c => this.domain.accessReview(c, w, p, principalId)); }
  @Get(':projectId/assignees')
  assignees(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, 'cursor', (c, _id, _view, cursor) => this.domain.assignees(c, w, p, cursor)); }
  @Get(':projectId/tasks')
  tasks(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, 'tasks', (c, _id, view, cursor, filters) => this.domain.tasks(c, w, p, view, cursor, filters)); }
  @Post(':projectId/tasks')
  createTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.createTask(c, w, p, this.key(req), id, req.body)); }
  @Get(':projectId/tasks/:taskId')
  task(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, c => this.domain.task(c, w, p, task)); }
  @Post(':projectId/tasks/:taskId')
  editTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'edit-task', req.body)); }
  @Post(':projectId/tasks/:taskId/move')
  moveTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.moveTask(c, w, p, task, this.key(req), id, req.body)); }
  @Post(':projectId/tasks/:taskId/archive')
  archiveTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'archive-task', req.body)); }
  @Post(':projectId/tasks/:taskId/restore')
  restoreTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.http.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'restore-task', req.body)); }
}
