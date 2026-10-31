import { Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import type { CollaborationCollection } from '@rielia/contracts';
import { ProjectTaskHttp } from './project-task-http.js';
import { TaskCollaborationService } from './task-collaboration.service.js';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks/:taskId')
export class TaskCollaborationController {
  constructor(@Inject(ProjectTaskHttp) private readonly http: ProjectTaskHttp, @Inject(TaskCollaborationService) private readonly domain: TaskCollaborationService) {}
  private page(req: NodeRequest, res: NodeResponse, collection: CollaborationCollection) {
    const { workspaceId: w, projectId: p, taskId: t } = req.params as Record<string, string>;
    return this.http.respond(req, res, w!, 'collaboration', (context, _id, _view, cursor) => this.domain.page(context, w!, p!, t!, collection, cursor));
  }
  private write(req: NodeRequest, res: NodeResponse, action: string, itemId?: string) {
    const { workspaceId: w, projectId: p, taskId: t } = req.params as Record<string, string>;
    return this.http.respond(req, res, w!, false, (context, id) => this.domain.mutate(context, w!, p!, t!, req.headers['idempotency-key'] as string, id, action, req.body, itemId));
  }
  @Get('relations') relations(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.page(req, res, 'relations'); }
  @Get('parent-candidates') candidates(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.page(req, res, 'parent-candidates'); }
  @Get('checklist') checklist(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.page(req, res, 'checklist'); }
  @Get('comments') comments(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.page(req, res, 'comments'); }
  @Get('history') history(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.page(req, res, 'history'); }
  @Get('comments/:commentId') comment(@Param('workspaceId') w: string, @Param('projectId') p: string, @Param('taskId') t: string, @Param('commentId') id: string, @Req() req: NodeRequest, @Res() res: NodeResponse) {
    return this.http.respond(req, res, w, false, context => this.domain.commentReview(context, w, p, t, id));
  }
  @Post('parent') parent(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'set-task-parent'); }
  @Post('checklist') addItem(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'add-checklist-item'); }
  @Post('checklist/:itemId') editItem(@Param('itemId') id: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'edit-checklist-item', id); }
  @Post('checklist/:itemId/move') moveItem(@Param('itemId') id: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'move-checklist-item', id); }
  @Post('checklist/:itemId/remove') removeItem(@Param('itemId') id: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'remove-checklist-item', id); }
  @Post('comments') addComment(@Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'add-comment'); }
  @Post('comments/:commentId') editComment(@Param('commentId') id: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { return this.write(req, res, 'edit-comment', id); }
}
