import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { randomUUID } from 'node:crypto';
import { isTaskFilters, type ArchiveView, type TaskFilters } from '@rielia/contracts';
import { IdentityService } from '../identity/identity.service.js';
import { PrincipalService, type VerifiedExecution } from '../principals/principal.service.js';

@Injectable()
export class ProjectTaskHttp {
  constructor(@Inject(PrincipalService) private readonly principals: PrincipalService, @Inject(IdentityService) private readonly identity: IdentityService) {}
  async respond<T>(req: NodeRequest, res: NodeResponse, workspaceId: string, list: boolean | 'cursor' | 'tasks' | 'collaboration',
    work: (context: VerifiedExecution, requestId: string, view: ArchiveView, cursor?: string, filters?: TaskFilters) => Promise<T>) {
    res.setHeader('Cache-Control', 'no-store');
    const existing = res.getHeader('X-Request-Id'); const requestId = typeof existing === 'string' ? existing : randomUUID(); res.setHeader('X-Request-Id', requestId);
    const forbidden = new Set(['actorprincipalid', 'authorprincipalid', 'subjectprincipalid', 'principalid', 'principalkind', 'executionmode', 'mode', 'source', 'grantid', 'connectionid']);
    if (Object.keys(req.headers).some(key => forbidden.has(key.replace(/^x-(?:rielia-)?/, '').replaceAll('-', '')))) throw new BadRequestException('Execution identity is resolved by the server.');
    if (Object.values(req.params ?? {}).some(value => typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))) throw new BadRequestException('Invalid resource identifier.');
    const query = req.query ?? {};
    const filters = Object.fromEntries(['status', 'assignee', 'priority'].filter(key => key in query).map(key => [key, query[key]]));
    if (Object.keys(query).some(key => !list || !(list === 'cursor' || list === 'collaboration' ? ['cursor'] : list === 'tasks' ? ['view', 'cursor', 'status', 'assignee', 'priority'] : ['view', 'cursor']).includes(key))
      || (query['view'] !== undefined && !['active', 'archived'].includes(String(query['view'])))
      || (query['view'] !== undefined && typeof query['view'] !== 'string')
      || (query['cursor'] !== undefined && (typeof query['cursor'] !== 'string' || !(list === 'tasks' || list === 'collaboration' ? /^[A-Za-z0-9_-]{1,2048}$/ : /^[A-Za-z0-9_-]{1,128}$/).test(query['cursor'])))
      || !isTaskFilters(filters)) throw new BadRequestException('Invalid project/task query.');
    if (req.method === 'GET') {
      if (req.headers['transfer-encoding'] !== undefined || (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0')) throw new BadRequestException('Read requests have no payload.');
    } else {
      if (req.headers.origin !== this.identity.config.origin || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site'])))) throw new ForbiddenException('Untrusted request origin.');
      if (req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new BadRequestException('JSON is required.');
      if (typeof req.headers['idempotency-key'] !== 'string') throw new BadRequestException('Idempotency-Key is required.');
    }
    const verified = await this.principals.webContext(req.headers, workspaceId);
    const data = await work(verified.context, requestId, query['view'] as ArchiveView ?? 'active', query['cursor'] as string | undefined, filters);
    for (const cookie of verified.headers.getSetCookie()) res.append('Set-Cookie', cookie);
    res.json(data);
  }
}
