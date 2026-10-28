import { BadRequestException, Controller, Get, Inject, Param, Req, Res } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { PrincipalService } from './principal.service.js';

@Controller('workspaces')
export class PrincipalController {
  constructor(@Inject(PrincipalService) private readonly principals: PrincipalService) {}

  @Get(':workspaceId/execution-context')
  async context(@Param('workspaceId') workspaceId: string, @Req() req: NodeRequest, @Res() res: NodeResponse): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');
    // This endpoint has no payload/query contract. Context fields cannot become
    // selectors, even when they happen to name the authenticated human.
    const identityFields = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    const forgedHeader = Object.keys(req.headers).some(key => identityFields.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')));
    const hasBody = req.headers['transfer-encoding'] !== undefined || (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0')
      || (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0);
    if (Object.keys(req.query ?? {}).length || hasBody || forgedHeader) throw new BadRequestException('Execution identity is resolved by the server.');
    const result = await this.principals.webContext(req.headers, workspaceId);
    for (const cookie of result.headers.getSetCookie()) res.append('Set-Cookie', cookie);
    res.json(result.context);
  }
}
