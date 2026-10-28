import { BadRequestException, Controller, ForbiddenException, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { IdentityService } from '../identity/identity.service.js';
import { WorkspaceService } from './workspace.service.js';

@Controller()
export class WorkspaceController {
  constructor(@Inject(WorkspaceService) private readonly workspaces: WorkspaceService, @Inject(IdentityService) private readonly identity: IdentityService) {}

  private check(req: NodeRequest, res: NodeResponse, list = false): string | undefined {
    res.setHeader('Cache-Control', 'no-store');
    const identityFields = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    if (Object.keys(req.headers).some(key => identityFields.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')))) throw new BadRequestException('Execution identity is resolved by the server.');
    if (Object.keys(req.params ?? {}).some(key => !/^[A-Za-z0-9_-]{1,128}$/.test(String(req.params[key])))) throw new BadRequestException('Invalid resource identifier.');
    const query = req.query ?? {};
    if (Object.keys(query).some(key => !list || key !== 'cursor') || (query['cursor'] !== undefined && (typeof query['cursor'] !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(query['cursor'])))) throw new BadRequestException('Invalid workspace query.');
    if (req.method === 'GET') {
      if (req.headers['transfer-encoding'] !== undefined || (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0')) throw new BadRequestException('Read requests have no payload.');
    } else {
      if (req.headers.origin !== this.identity.config.origin || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site'])))) throw new ForbiddenException('Untrusted workspace request origin.');
      if (req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new BadRequestException('JSON is required.');
      if (typeof req.headers['idempotency-key'] !== 'string') throw new BadRequestException('Idempotency-Key is required.');
    }
    return query['cursor'] as string | undefined;
  }

  private async respond<T>(res: NodeResponse, result: Promise<{ data: T; headers: Headers }>) {
    const response = await result;
    for (const cookie of response.headers.getSetCookie()) res.append('Set-Cookie', cookie);
    res.json(response.data);
  }
  private key(req: NodeRequest): string { return req.headers['idempotency-key'] as string; }

  @Get('workspaces')
  list(@Req() req: NodeRequest, @Res() res: NodeResponse) { const cursor = this.check(req, res, true); return this.respond(res, this.workspaces.list(req.headers, cursor)); }

  @Post('workspaces')
  create(@Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.create(req.headers, this.key(req), req.body)); }

  @Get('workspaces/:workspaceId')
  detail(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.detail(req.headers, workspaceId)); }

  @Get('workspaces/:workspaceId/members')
  members(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { const cursor = this.check(req, res, true); return this.respond(res, this.workspaces.members(req.headers, workspaceId, cursor)); }

  @Post('workspaces/:workspaceId/members/:principalId')
  member(@Param('workspaceId') workspaceId: string, @Param('principalId') principalId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.updateMember(req.headers, workspaceId, principalId, this.key(req), req.body)); }

  @Get('workspaces/:workspaceId/invitations')
  invitations(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { const cursor = this.check(req, res, true); return this.respond(res, this.workspaces.invitations(req.headers, workspaceId, cursor)); }

  @Post('workspaces/:workspaceId/invitations')
  invite(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.invite(req.headers, workspaceId, this.key(req), req.body)); }

  @Post('workspaces/:workspaceId/invitations/:invitationId/revoke')
  revoke(@Param('workspaceId') workspaceId: string, @Param('invitationId') invitationId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.revokeInvitation(req.headers, workspaceId, invitationId, this.key(req), req.body)); }

  @Post('workspace-invitations/accept')
  accept(@Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.accept(req.headers, this.key(req), req.body)); }

  @Post('workspaces/:workspaceId/agents')
  register(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.registerAgent(req.headers, workspaceId, this.key(req), req.body)); }

  @Post('workspaces/:workspaceId/agents/:principalId')
  agent(@Param('workspaceId') workspaceId: string, @Param('principalId') principalId: string, @Req() req: NodeRequest, @Res() res: NodeResponse) { this.check(req, res); return this.respond(res, this.workspaces.manageAgent(req.headers, workspaceId, principalId, this.key(req), req.body)); }
}
