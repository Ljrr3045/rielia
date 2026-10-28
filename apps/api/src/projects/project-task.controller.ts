import { BadRequestException, Controller, ForbiddenException, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { randomUUID } from 'node:crypto';
import type { ArchiveView } from '@rielia/contracts';
import { IdentityService } from '../identity/identity.service.js';
import { PrincipalService, type VerifiedExecution } from '../principals/principal.service.js';
import { ProjectTaskService } from './project-task.service.js';

@Controller('workspaces/:workspaceId/projects')
export class ProjectTaskController {
  constructor(@Inject(ProjectTaskService) private readonly domain: ProjectTaskService, @Inject(PrincipalService) private readonly principals: PrincipalService,
    @Inject(IdentityService) private readonly identity: IdentityService) {}

  private async respond<T>(req: NodeRequest, res: NodeResponse, workspaceId: string, list: boolean,
    work: (context: VerifiedExecution, requestId: string, view: ArchiveView, cursor?: string) => Promise<T>) {
    res.setHeader('Cache-Control', 'no-store');
    const existing = res.getHeader('X-Request-Id'); const requestId = typeof existing === 'string' ? existing : randomUUID(); res.setHeader('X-Request-Id', requestId);
    const forbidden = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    if (Object.keys(req.headers).some(key => forbidden.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')))) throw new BadRequestException('Execution identity is resolved by the server.');
    if (Object.values(req.params ?? {}).some(value => typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))) throw new BadRequestException('Invalid resource identifier.');
    const query = req.query ?? {};
    if (Object.keys(query).some(key => !list || !['view', 'cursor'].includes(key))
      || (query['view'] !== undefined && !['active', 'archived'].includes(String(query['view'])))
      || (query['view'] !== undefined && typeof query['view'] !== 'string')
      || (query['cursor'] !== undefined && (typeof query['cursor'] !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(query['cursor'])))) throw new BadRequestException('Invalid project/task query.');
    if (req.method === 'GET') {
      if (req.headers['transfer-encoding'] !== undefined || (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0')) throw new BadRequestException('Read requests have no payload.');
    } else {
      if (req.headers.origin !== this.identity.config.origin || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site'])))) throw new ForbiddenException('Untrusted request origin.');
      if (req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new BadRequestException('JSON is required.');
      if (typeof req.headers['idempotency-key'] !== 'string') throw new BadRequestException('Idempotency-Key is required.');
    }
    const verified = await this.principals.webContext(req.headers, workspaceId);
    const data = await work(verified.context, requestId, query['view'] as ArchiveView ?? 'active', query['cursor'] as string | undefined);
    for (const cookie of verified.headers.getSetCookie()) res.append('Set-Cookie', cookie);
    res.json(data);
  }
  private key(req: NodeRequest) { return req.headers['idempotency-key'] as string; }

  @Get()
  projects(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, true, (c, _id, view, cursor) => this.domain.projects(c, w, view, cursor)); }
  @Post()
  createProject(@Param('workspaceId') w: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.createProject(c, w, this.key(req), id, req.body)); }
  @Get(':projectId')
  project(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, c => this.domain.project(c, w, p)); }
  @Post(':projectId')
  editProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'edit-project', req.body)); }
  @Post(':projectId/archive')
  archiveProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'archive-project', req.body)); }
  @Post(':projectId/restore')
  restoreProject(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeProject(c, w, p, this.key(req), id, 'restore-project', req.body)); }
  @Get(':projectId/tasks')
  tasks(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, true, (c, _id, view, cursor) => this.domain.tasks(c, w, p, view, cursor)); }
  @Post(':projectId/tasks')
  createTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.createTask(c, w, p, this.key(req), id, req.body)); }
  @Get(':projectId/tasks/:taskId')
  task(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, c => this.domain.task(c, w, p, task)); }
  @Post(':projectId/tasks/:taskId')
  editTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'edit-task', req.body)); }
  @Post(':projectId/tasks/:taskId/archive')
  archiveTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'archive-task', req.body)); }
  @Post(':projectId/tasks/:taskId/restore')
  restoreTask(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') task: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.respond(req, res, w, false, (c, id) => this.domain.changeTask(c, w, p, task, this.key(req), id, 'restore-task', req.body)); }
}
