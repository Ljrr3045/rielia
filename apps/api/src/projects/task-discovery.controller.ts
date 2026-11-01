import { Controller, Get, Inject, Param, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { parseTaskDiscoveryQuery } from '@rielia/contracts';
import { ProjectTaskHttp } from './project-task-http.js';
import { TaskDiscoveryService } from './task-discovery.service.js';
import { TaskEventsService } from './task-events.service.js';
@Controller('workspaces/:workspaceId')
export class TaskDiscoveryController {
  constructor(@Inject(ProjectTaskHttp) private readonly http: ProjectTaskHttp, @Inject(TaskDiscoveryService) private readonly discovery: TaskDiscoveryService, @Inject(TaskEventsService) private readonly events: TaskEventsService) {}
  @Get('task-discovery')
  page(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) {
    return this.http.respond(req, res, w, 'discovery', (c, _id, _view, cursor) => this.discovery.page(c, w, parseTaskDiscoveryQuery(req.query ?? {})!, cursor));
  }
  @Get('events')
  stream(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) {
    return this.http.respond(req, res, w, 'events', c => this.events.serve(c, w, res, req.headers['last-event-id'] as string | undefined));
  }
}
