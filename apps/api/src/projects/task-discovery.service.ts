import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isTaskDiscoveryQuery, type TaskDiscoveryPage, type TaskDiscoveryQuery } from '@rielia/contracts';
import type { Prisma } from '../generated/prisma/client.js';
import type { VerifiedExecution } from '../principals/principal.service.js';
import { object, ProjectTaskService } from './project-task.service.js';

export function normalizedDiscovery(query: TaskDiscoveryQuery): TaskDiscoveryQuery {
  return { scope: query.scope, q: query.q.trim(), view: query.view,
    filters: Object.fromEntries(Object.entries(query.filters).sort(([a], [b]) => a.localeCompare(b))), ...(query.projectId ? { projectId: query.projectId } : {}) };
}
@Injectable()
export class TaskDiscoveryService {
  constructor(@Inject(ProjectTaskService) private readonly tasks: ProjectTaskService) {}
  page(context: VerifiedExecution, workspaceId: string, query: TaskDiscoveryQuery, cursor?: string): Promise<TaskDiscoveryPage> {
    if (!isTaskDiscoveryQuery(query)) throw new BadRequestException('Invalid discovery query.');
    const normalized = normalizedDiscovery(query);
    return this.tasks.discoveryRead(context, workspaceId, async (tx, actor, canWrite, readable) => {
      if (normalized.projectId && !readable.some(p => p.id === normalized.projectId)) throw new ForbiddenException('Project/task access is denied.');
      const projects = readable.filter(p => !normalized.projectId || p.id === normalized.projectId);
      // Only currently readable project metadata influences this token. Private
      // and foreign writes cannot alter another reader's counts or page state.
      const revision = createHash('sha256').update(JSON.stringify([actor.actorPrincipalId, actor.role, canWrite, projects.map(p => [p.id, p.version, p.taskRevision])])).digest('hex');
      const filters = normalized.filters;
      const q = normalized.q;
      const key = /^([A-Za-z][A-Za-z0-9]{1,9})-([1-9][0-9]{0,9})$/.exec(q);
      const idMatch = key && Number(key[2]) <= 2147483647 ? projects.find(p => p.key === key[1]!.toUpperCase()) : undefined;
      const where: Prisma.TaskWhereInput = { workspaceId, projectId: { in: projects.map(p => p.id) },
        // Archived task view also includes tasks frozen by an archived project.
        ...(normalized.view === 'active' ? { archivedAt: null, NOT: { projectId: { in: projects.filter(p => p.archivedAt).map(p => p.id) } } }
          : { OR: [{ archivedAt: { not: null } }, { projectId: { in: projects.filter(p => p.archivedAt).map(p => p.id) } }] }),
        ...(filters.status ? { status: filters.status } : {}), ...(filters.priority ? { priority: filters.priority } : {}),
        ...(normalized.scope === 'mine' ? { assigneePrincipalId: actor.actorPrincipalId } : filters.assignee ? { assigneePrincipalId: filters.assignee === 'unassigned' ? null : filters.assignee } : {}),
        ...(q ? { AND: [{ OR: [{ title: { contains: q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' } }, { id: q }, ...(key && idMatch ? [{ projectId: idMatch.id, number: Number(key[2]) }] : [])] }] } : {}) };
      let after: Prisma.TaskWhereInput = {};
      if (cursor !== undefined) {
        let value: Record<string, unknown>;
        try {
          if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
          value = object(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')), ['v', 'w', 'actor', 'query', 'revision', 'anchor'], ['v', 'w', 'actor', 'query', 'revision', 'anchor']);
          if (value['v'] !== 1 || value['w'] !== workspaceId || value['actor'] !== actor.actorPrincipalId || JSON.stringify(value['query']) !== JSON.stringify(normalized)
            || typeof value['anchor'] !== 'string' || typeof value['revision'] !== 'string') throw new Error();
        } catch { throw new BadRequestException('Invalid page cursor.'); }
        if (value['revision'] !== revision) throw new ConflictException({ code: 'page-changed', message: 'Tasks changed. Refresh the collection.' });
        const anchor = await tx.task.findFirst({ where: { ...where, id: value['anchor'] as string }, select: { projectId: true, number: true } });
        if (!anchor) throw new BadRequestException('Invalid page cursor.');
        after = { OR: [{ projectId: { gt: anchor.projectId } }, { projectId: anchor.projectId, number: { gt: anchor.number } }] };
      }
      const rows = await tx.task.findMany({ where: { AND: [where, after] }, orderBy: [{ projectId: 'asc' }, { number: 'asc' }], take: 101 });
      const items = await this.tasks.discoveryItems(tx, rows.slice(0, 100), projects, canWrite);
      return { workspaceId, principalId: actor.actorPrincipalId, query: normalized, revision, items, total: await tx.task.count({ where }),
        nextCursor: rows.length > 100 ? Buffer.from(JSON.stringify({ v: 1, w: workspaceId, actor: actor.actorPrincipalId, query: normalized, revision, anchor: items[99]!.id })).toString('base64url') : null };
    });
  }
}
