import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { isTaskFilters, projectURL, taskURL, taskStatuses, taskTypes, taskPriorities, type TaskFilters, type TaskStatus, type TaskPage, type TaskColumnCounts, type ArchiveView, type DomainPage, type DomainPerson, type ExecutionContextResponse, type Project, type ProjectTaskResult, type Task, type ProjectAccessPage, type ProjectAssigneePage, type MembershipRole, type ProjectAccessReview } from '@rielia/contracts';
import type { Prisma, Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import { PrincipalService, type Transaction, type VerifiedExecution } from '../principals/principal.service.js';
import type { TaskDiscoveryItem } from '@rielia/contracts';
export type ReadableTaskProject = Pick<ProjectRow, 'id' | 'workspaceId' | 'key' | 'name' | 'version' | 'taskRevision' | 'visibility' | 'archivedAt'>;

const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function object(value: unknown, allowed: string[], required: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))
    || required.some(key => !(key in value))) throw new BadRequestException('Invalid project/task request.');
  return { ...value as Record<string, unknown> };
}
export function text(value: unknown, limit: number, required = false): string {
  if (typeof value !== 'string' || value.includes('\0') || value.length > limit || (required && (!value.trim() || /[\r\n\t]/.test(value)))) throw new BadRequestException('Invalid text.');
  return required ? value.trim() : value;
}
export function expected(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new BadRequestException('A positive expectedVersion is required.');
  return Number(value);
}
function taskFields(input: Record<string, unknown>, create: boolean) {
  const result: { title?: string; description?: string; type?: string; priority?: string; status?: string; assigneePrincipalId?: string | null; dueDate?: Date | null } = {};
  if (create || 'title' in input) result.title = text(input['title'], 300, true);
  if (create || 'description' in input) result.description = text(input['description'] ?? (create ? '' : undefined), 20000);
  for (const [key, choices, fallback] of [['type', taskTypes, 'task'], ['priority', taskPriorities, 'none'], ['status', taskStatuses, 'backlog']] as const) {
    if (create || key in input) {
      const value = input[key] === undefined && create ? fallback : input[key];
      if (typeof value !== 'string' || !(choices as readonly string[]).includes(value)) throw new BadRequestException('Invalid task property.');
      result[key] = value;
    }
  }
  if ('assigneePrincipalId' in input || create) {
    const value = input['assigneePrincipalId'] ?? null;
    if (value !== null && !identifier(value)) throw new BadRequestException('Invalid assignee.');
    result.assigneePrincipalId = value;
  }
  if ('dueDate' in input || create) {
    const value = input['dueDate'] ?? null;
    if (value === null) result.dueDate = null;
    else {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) throw new BadRequestException('Invalid date-only due date.');
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestException('Invalid date-only due date.');
      result.dueDate = date;
    }
  }
  return result;
}
const taskProperties = ['title', 'description', 'type', 'priority', 'status', 'assigneePrincipalId', 'dueDate'];
const provenance = (row: ProjectRow | TaskRow) => ({ actorPrincipalId: row.createdByPrincipalId, executionMode: row.creationMode as 'human' | 'delegated' | 'autonomous', source: row.creationSource as 'web' | 'mcp', grantId: row.creationGrantId });
const attribution = (current: ExecutionContextResponse) => ({ createdByPrincipalId: current.actorPrincipalId, creationMode: current.executionMode, creationSource: current.source, creationGrantId: current.grantId });
const iso = (date: Date | null) => date?.toISOString() ?? null;
function page<T>(rows: T[], total: number, cursor: (row: T) => string, canCreate: boolean): DomainPage<T> {
  const items = rows.slice(0, 100); return { items, total, nextCursor: rows.length > 100 ? cursor(items[items.length - 1]!) : null, capabilities: { canCreate } };
}
function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

@Injectable()
export class ProjectTaskService {
  constructor(@Inject(PrincipalService) private readonly principals: PrincipalService) {}

  private administrator(actor: Pick<ExecutionContextResponse, 'principalKind' | 'role'>) { return actor.principalKind === 'human' && ['owner', 'admin'].includes(actor.role); }
  private canManage(actor: ExecutionContextResponse) { return actor.executionMode === 'human' && this.administrator(actor); }
  private requireManagement(actor: ExecutionContextResponse) { if (!this.canManage(actor)) throw new ForbiddenException('Human project administration is required.'); }
  private readable(actor: ExecutionContextResponse): Prisma.ProjectWhereInput {
    return { workspaceId: actor.workspaceId, ...(this.administrator(actor) ? {} : { OR: [{ visibility: 'workspace' }, { accesses: { some: { principalId: actor.actorPrincipalId, state: 'active' } } }] }) };
  }
  private eligible(project: ReadableTaskProject): Prisma.MembershipWhereInput {
    return { workspaceId: project.workspaceId, state: 'active', principal: { state: 'active', kind: { in: ['human', 'agent'] } },
      ...(project.visibility === 'workspace' ? {} : { OR: [
        { role: { in: ['owner', 'admin'] }, principal: { kind: 'human' } },
        { projectAccesses: { some: { projectId: project.id, state: 'active' } } },
      ] }) };
  }
  private async projectRow(tx: Transaction, workspaceId: string, projectId: string, actor: ExecutionContextResponse) {
    const row = await tx.project.findFirst({ where: { ...this.readable(actor), workspaceId, id: projectId } });
    if (!row) throw new ForbiddenException('Project/task access is denied.'); return row;
  }
  private async taskRow(tx: Transaction, workspaceId: string, projectId: string, taskId: string) {
    const row = await tx.task.findUnique({ where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } } });
    if (!row) throw new ForbiddenException('Project/task access is denied.'); return row;
  }
  private async people(tx: Transaction, workspaceId: string, ids: string[]): Promise<Map<string, DomainPerson>> {
    const rows = await tx.membership.findMany({ where: { workspaceId, principalId: { in: [...new Set(ids)] } }, include: { principal: true } });
    return new Map(rows.map(row => [row.principalId, { principalId: row.principalId, name: row.principal.displayName, kind: row.principal.kind as 'human' | 'agent', active: row.state === 'active' && row.principal.state === 'active' }]));
  }
  private projectDto(row: ProjectRow, people: Map<string, DomainPerson>, canWrite: boolean, actor: ExecutionContextResponse): Project {
    return { id: row.id, workspaceId: row.workspaceId, key: row.key, name: row.name, description: row.description, visibility: row.visibility as Project['visibility'], version: row.version,
      archivedAt: iso(row.archivedAt), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), creator: people.get(row.createdByPrincipalId)!, provenance: provenance(row),
      capabilities: { canEdit: canWrite && !row.archivedAt, canArchive: canWrite && !row.archivedAt, canRestore: canWrite && !!row.archivedAt, canManageAccess: this.canManage(actor), canChangeVisibility: this.canManage(actor) && !row.archivedAt, canGrantAccess: this.canManage(actor) && !row.archivedAt, canRevokeAccess: this.canManage(actor) }, url: projectURL(row.workspaceId, row.id) };
  }
  private taskDto(row: TaskRow, project: ReadableTaskProject, people: Map<string, DomainPerson>, canWrite: boolean, eligible: Set<string>): Task {
    const active = !project.archivedAt && !row.archivedAt;
    return { id: row.id, workspaceId: row.workspaceId, projectId: row.projectId, projectKey: project.key, number: row.number, key: `${project.key}-${row.number}`,
      title: row.title, description: row.description, type: row.type as Task['type'], priority: row.priority as Task['priority'], status: row.status as Task['status'],
      assigneePrincipalId: row.assigneePrincipalId, assignee: row.assigneePrincipalId ? { ...people.get(row.assigneePrincipalId)!, active: eligible.has(row.assigneePrincipalId) } : null,
      parentTaskId: row.parentTaskId, dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null, version: row.version, orderVersion: project.taskRevision, archivedAt: iso(row.archivedAt), projectArchivedAt: iso(project.archivedAt),
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), creator: people.get(row.createdByPrincipalId)!, provenance: provenance(row),
      capabilities: { canEdit: canWrite && active, canArchive: canWrite && active, canRestore: canWrite && !project.archivedAt && !!row.archivedAt }, url: taskURL(row.workspaceId, row.projectId, row.id) };
  }
  private async projectView(tx: Transaction, row: ProjectRow, canWrite: boolean, actor: ExecutionContextResponse) { return this.projectDto(row, await this.people(tx, row.workspaceId, [row.createdByPrincipalId]), canWrite, actor); }
  private async taskPeople(tx: Transaction, project: ReadableTaskProject, rows: TaskRow[]) {
    const result = await this.taskPeopleBatch(tx, [project], rows);
    return { people: result.people, eligible: result.eligible.get(project.id) ?? new Set<string>() };
  }
  private async taskPeopleBatch(tx: Transaction, projects: ReadableTaskProject[], rows: TaskRow[]) {
    const people = new Map<string, DomainPerson>(); const eligible = new Map<string, Set<string>>();
    if (!rows.length) return { people, eligible };
    const byProject = new Map(projects.map(project => [project.id, project]));
    const members = await tx.membership.findMany({ where: { workspaceId: rows[0]!.workspaceId,
      principalId: { in: [...new Set(rows.flatMap(row => [row.createdByPrincipalId, ...(row.assigneePrincipalId ? [row.assigneePrincipalId] : [])]))] } },
      include: { principal: true, projectAccesses: { where: { projectId: { in: [...byProject.keys()] }, state: 'active' }, select: { projectId: true } } } });
    const byMember = new Map(members.map(member => [member.principalId, member]));
    for (const member of members) people.set(member.principalId, { principalId: member.principalId, name: member.principal.displayName,
      kind: member.principal.kind as 'human' | 'agent', active: member.state === 'active' && member.principal.state === 'active' });
    // Same backend assignment projection for detail/list/discovery; a historical
    // assignee remains named without regaining current project eligibility.
    for (const row of rows) {
      if (!row.assigneePrincipalId) continue;
      const member = byMember.get(row.assigneePrincipalId); const project = byProject.get(row.projectId)!;
      if (!member || member.state !== 'active' || member.principal.state !== 'active' || !['human', 'agent'].includes(member.principal.kind)) continue;
      if (project.visibility !== 'workspace' && !this.administrator({ principalKind: member.principal.kind as 'human' | 'agent', role: member.role as MembershipRole })
        && !member.projectAccesses.some(access => access.projectId === project.id)) continue;
      const group = eligible.get(project.id) ?? new Set<string>(); group.add(member.principalId); eligible.set(project.id, group);
    }
    return { people, eligible };
  }
  private async taskView(tx: Transaction, row: TaskRow, project: ProjectRow, canWrite: boolean) {
    // Mutation triggers may have advanced the aggregate since project was read.
    const current = await tx.project.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: project.workspaceId, id: project.id } } });
    const { people, eligible } = await this.taskPeople(tx, current, [row]); return this.taskDto(row, current, people, canWrite, eligible);
  }
  private conflict(current: ProjectTaskResult, version: number) {
    if (version !== current.version) throw new ConflictException({ code: 'version-conflict', message: 'Record changed. Compare the current record before saving again.', current });
  }
  private archived(current: ProjectTaskResult) { throw new ConflictException({ code: 'archived', message: 'Restore the archived record or its project before editing.', current }); }

  projects(context: VerifiedExecution, workspaceId: string, view: ArchiveView = 'active', cursor?: string) {
    if (cursor !== undefined && !identifier(cursor)) throw new BadRequestException('Invalid page cursor.');
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => {
      // The global allocation key never leaves the backend. A cursor names an
      // already visible public ID and resolves only within current scope. Keep
      // archived anchors valid; records cannot be deleted or moved.
      const anchor = cursor === undefined ? null : await tx.project.findFirst({ where: { ...this.readable(actor), id: cursor }, select: { sequence: true } });
      if (cursor !== undefined && !anchor) throw new BadRequestException('Invalid page cursor.');
      const where = { ...this.readable(actor), archivedAt: view === 'active' ? null : { not: null } };
      const rows = await tx.project.findMany({ where: { ...where, ...(anchor ? { sequence: { gt: anchor.sequence } } : {}) }, orderBy: { sequence: 'asc' }, take: 101 });
      const people = await this.people(tx, workspaceId, rows.map(row => row.createdByPrincipalId));
      const result = page(rows, await tx.project.count({ where }), row => row.id, canWrite);
      return { ...result, capabilities: { ...result.capabilities, canCreatePrivate: this.canManage(actor) }, items: result.items.map(row => this.projectDto(row, people, canWrite, actor)) };
    });
  }
  project(context: VerifiedExecution, workspaceId: string, projectId: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => this.projectView(tx, await this.projectRow(tx, workspaceId, projectId, actor), canWrite, actor));
  }
  /** Internal discovery composition; one current fenced authority snapshot,
   * with the exact same readable-project predicate used by detail and writes. */
  discoveryRead<T>(context: VerifiedExecution, workspaceId: string,
    work: (tx: Transaction, actor: ExecutionContextResponse, canWrite: boolean, projects: ReadableTaskProject[]) => Promise<T>) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => work(tx, actor, canWrite,
      await tx.project.findMany({ where: this.readable(actor), orderBy: { id: 'asc' }, select: { id: true, workspaceId: true, key: true, name: true, version: true, taskRevision: true, visibility: true, archivedAt: true } })));
  }
  /** Events need only current project IDs and policy versions; keep the same
   * authorization predicate and one-second reevaluation without an access cache. */
  eventsRead<T>(context: VerifiedExecution, workspaceId: string,
    work: (tx: Transaction, actor: ExecutionContextResponse, canWrite: boolean, projects: Pick<ProjectRow, 'id' | 'version'>[]) => Promise<T>) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => work(tx, actor, canWrite,
      await tx.project.findMany({ where: this.readable(actor), orderBy: { id: 'asc' }, select: { id: true, version: true } })));
  }
  async discoveryItems(tx: Transaction, rows: TaskRow[], projects: ReadableTaskProject[], canWrite: boolean): Promise<TaskDiscoveryItem[]> {
    const byProject = new Map(projects.map(project => [project.id, project]));
    const represented = [...new Set(rows.map(row => row.projectId))].map(id => byProject.get(id)!);
    const { people, eligible } = await this.taskPeopleBatch(tx, represented, rows);
    return rows.map(row => {
      const project = byProject.get(row.projectId)!;
      const item = Object.fromEntries(Object.entries(this.taskDto(row, project, people, canWrite, eligible.get(project.id) ?? new Set())).filter(([key]) => key !== 'description')) as Omit<Task, 'description'>;
      return { ...item, projectName: project.name };
    });
  }
  tasks(context: VerifiedExecution, workspaceId: string, projectId: string, view: ArchiveView = 'active', cursor?: string, filters: TaskFilters = {}): Promise<TaskPage> {
    if (!isTaskFilters(filters)) throw new BadRequestException('Invalid task filters.');
    const normalized = canonical(filters);
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor);
      const where: Prisma.TaskWhereInput = { workspaceId, projectId, archivedAt: view === 'active' ? null : { not: null },
        ...(filters.status ? { status: filters.status } : {}), ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.assignee ? { assigneePrincipalId: filters.assignee === 'unassigned' ? null : filters.assignee } : {}) };
      let anchor: TaskRow | null = null;
      if (cursor !== undefined) {
        let decoded: Record<string, unknown>;
        try {
          if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
          decoded = object(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')), ['v', 'w', 'p', 'view', 'filters', 'revision', 'anchor'], ['v', 'w', 'p', 'view', 'filters', 'revision', 'anchor']);
          if (decoded['v'] !== 1 || decoded['w'] !== workspaceId || decoded['p'] !== projectId || decoded['view'] !== view || JSON.stringify(canonical(decoded['filters'])) !== JSON.stringify(normalized)
            || !identifier(decoded['anchor']) || !Number.isSafeInteger(decoded['revision']) || Number(decoded['revision']) < 1) throw new Error();
        } catch { throw new BadRequestException('Invalid page cursor.'); }
        if (decoded['revision'] !== project.taskRevision) throw new ConflictException({ code: 'page-changed', message: 'Task order changed. Refresh the collection.' });
        anchor = await tx.task.findFirst({ where: { ...where, id: decoded['anchor'] as string } });
        if (!anchor) throw new BadRequestException('Invalid page cursor.');
      }
      // At most 101 records total, using the same per-status order in both views.
      const rows: TaskRow[] = [];
      for (const status of taskStatuses) {
        if (filters.status && status !== filters.status) continue;
        if (anchor && taskStatuses.indexOf(status) < taskStatuses.indexOf(anchor.status as TaskStatus)) continue;
        const sameColumn = anchor?.status === status;
        rows.push(...await tx.task.findMany({ where: { ...where, status, ...(sameColumn ? { rank: { gt: anchor!.rank } } : {}) }, orderBy: [{ rank: 'asc' }, { number: 'asc' }], take: 101 - rows.length }));
        if (rows.length === 101) break;
      }
      const { people, eligible } = await this.taskPeople(tx, project, rows);
      const counts = Object.fromEntries(taskStatuses.map(status => [status, 0])) as TaskColumnCounts;
      for (const group of await tx.task.groupBy({ by: ['status'], where, _count: { _all: true } })) counts[group.status as TaskStatus] = group._count._all;
      let selectedAssignee: DomainPerson | null = null;
      if (filters.assignee && filters.assignee !== 'unassigned') {
        const eligible = !!await tx.membership.findFirst({ where: { ...this.eligible(project), principalId: filters.assignee }, select: { principalId: true } });
        // Eligibility and historical task authorship/assignment are separate.
        // Reveal a noneligible identity only if it already appears as assignee
        // in this authorized project, never by arbitrary workspace/foreign ID.
        const historical = eligible || !!await tx.task.findFirst({ where: { workspaceId, projectId, assigneePrincipalId: filters.assignee }, select: { id: true } });
        if (historical) {
          const person = (await this.people(tx, workspaceId, [filters.assignee])).get(filters.assignee);
          if (person) selectedAssignee = { ...person, active: eligible };
        }
      }
      const items = rows.slice(0, 100).map(row => this.taskDto(row, project, people, canWrite, eligible));
      return { items, total: Object.values(counts).reduce((sum, n) => sum + n, 0), orderVersion: project.taskRevision, columnCounts: counts, selectedAssignee,
        capabilities: { canCreate: canWrite && !project.archivedAt }, nextCursor: rows.length > 100 ? Buffer.from(JSON.stringify({ v: 1, w: workspaceId, p: projectId, view, filters: normalized, revision: project.taskRevision, anchor: items[99]!.id })).toString('base64url') : null };
    });
  }
  task(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => { const project = await this.projectRow(tx, workspaceId, projectId, actor); return this.taskView(tx, await this.taskRow(tx, workspaceId, projectId, taskId), project, canWrite); });
  }
  /** Internal composition seam: collaborators share current project policy and
   * the same fenced transaction, never reuse a DTO as authority. */
  collaborationRead<T>(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string,
    work: (tx: Transaction, actor: ExecutionContextResponse, canWrite: boolean, project: ProjectRow, task: TaskRow, view: () => Promise<Task>) => Promise<T>) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor);
      const task = await this.taskRow(tx, workspaceId, projectId, taskId);
      return work(tx, actor, canWrite, project, task, () => this.taskView(tx, task, project, canWrite));
    });
  }
  collaborationMutation(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string, key: string, requestId: string, action: string, input: Record<string, unknown>,
    work: (tx: Transaction, actor: ExecutionContextResponse, project: ProjectRow, task: TaskRow) => Promise<void>) {
    return this.mutation(context, workspaceId, key, requestId, action, [projectId, taskId], input, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const row = await this.taskRow(tx, workspaceId, projectId, taskId);
      const current = await this.taskView(tx, row, project, true); this.conflict(current, expected(input['expectedVersion']));
      if (project.archivedAt || row.archivedAt) this.archived(current);
      await work(tx, actor, project, row);
      // One aggregate version covers checklist, comments and relationship edits.
      const updated = await tx.task.update({ where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } }, data: { version: { increment: 1 } } });
      return this.taskView(tx, updated, project, true);
    });
  }
  async assertParent(tx: Transaction, workspaceId: string, projectId: string, parentTaskId: string, version: number, taskId?: string) {
    const parent = await tx.task.findFirst({ where: { workspaceId, projectId, id: parentTaskId, archivedAt: null, parentTaskId: null } });
    if (!parent || parentTaskId === taskId) throw new BadRequestException('Invalid parent task.');
    if (parent.version !== version) throw new ConflictException({ code: 'parent-changed', message: 'Parent changed. Refresh and choose the parent again.' });
    if (taskId && await tx.task.count({ where: { workspaceId, projectId, parentTaskId: taskId } })) throw new BadRequestException('A parent cannot become a child.');
  }
  private async closing(tx: Transaction, row: TaskRow, project: ProjectRow, current: Task, status: string | undefined, acknowledgment: number | undefined) {
    if (!status || status === row.status || !['done', 'canceled'].includes(status)) return;
    const where = { workspaceId: row.workspaceId, projectId: row.projectId, parentTaskId: row.id, status: { notIn: ['done', 'canceled'] } };
    const open = await tx.task.count({ where });
    if (open && acknowledgment !== project.taskRevision) throw new ConflictException({ code: 'open-children', message: 'Open children remain unchanged. Review them before closing the parent.', current,
      closeWarning: { open, archivedOpen: await tx.task.count({ where: { ...where, archivedAt: { not: null } } }), childrenVersion: project.taskRevision } });
  }
  private async rank(tx: Transaction, workspaceId: string, projectId: string, status: string, beforeTaskId: string | null, taskId: string) {
    const rows = await tx.$queryRaw<Array<{ rank: bigint }>>`SELECT task_rank_before(${workspaceId},${projectId},${status},${beforeTaskId},${taskId}) AS rank`;
    return rows[0]!.rank;
  }
  moveTask(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, ['expectedVersion', 'expectedOrderVersion', 'status', 'beforeTaskId', 'acknowledgedChildrenVersion'], ['expectedVersion', 'expectedOrderVersion', 'status', 'beforeTaskId']);
    const version = expected(input['expectedVersion']); const orderVersion = expected(input['expectedOrderVersion']);
    if (!taskStatuses.includes(input['status'] as TaskStatus) || (input['beforeTaskId'] !== null && !identifier(input['beforeTaskId']))) throw new BadRequestException('Invalid task move.');
    const status = input['status'] as TaskStatus; const beforeTaskId = input['beforeTaskId'] as string | null;
    const acknowledgment = 'acknowledgedChildrenVersion' in input ? expected(input['acknowledgedChildrenVersion']) : undefined;
    return this.mutation(context, workspaceId, key, requestId, 'move-task', [projectId, taskId], { expectedVersion: version, expectedOrderVersion: orderVersion, status, beforeTaskId, ...(acknowledgment ? { acknowledgedChildrenVersion: acknowledgment } : {}) }, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const row = await this.taskRow(tx, workspaceId, projectId, taskId); const current = await this.taskView(tx, row, project, true);
      this.conflict(current, version);
      if (project.archivedAt || row.archivedAt) this.archived(current);
      if (project.taskRevision !== orderVersion) throw new ConflictException({ code: 'order-conflict', message: 'Task order changed. Refresh and choose a destination again.', current });
      await this.closing(tx, row, project, current, status, acknowledgment);
      if (beforeTaskId !== null && (beforeTaskId === taskId || !await tx.task.findFirst({ where: { workspaceId, projectId, id: beforeTaskId, status, archivedAt: null }, select: { id: true } }))) throw new BadRequestException('Invalid move anchor.');
      const rank = await this.rank(tx, workspaceId, projectId, status, beforeTaskId, taskId);
      const updated = await tx.task.update({ where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } }, data: { status, rank } });
      return this.taskView(tx, updated, project, true);
    });
  }

  private async assertAssignable(tx: Transaction, project: ProjectRow, principalId: string) {
    await this.principals.assertAssignable(tx, project.workspaceId, principalId);
    if (!await tx.membership.findFirst({ where: { ...this.eligible(project), principalId }, select: { principalId: true } })) throw new ForbiddenException('Assignment is denied.');
  }
  private async memberAnchor(tx: Transaction, where: Prisma.MembershipWhereInput, cursor?: string) {
    if (cursor !== undefined && (!identifier(cursor) || !await tx.membership.findFirst({ where: { ...where, principalId: cursor }, select: { principalId: true } }))) throw new BadRequestException('Invalid page cursor.');
  }
  private accessDto(row: Prisma.MembershipGetPayload<{ include: { principal: true; projectAccesses: true } }>, project: ProjectRow) {
    const active = row.state === 'active' && row.principal.state === 'active';
    const explicitAccess = row.projectAccesses[0]?.state as 'active' | 'revoked' | undefined;
    const implicitAccess = active && row.principal.kind === 'human' && ['owner', 'admin'].includes(row.role);
    return { principalId: row.principalId, name: row.principal.displayName, kind: row.principal.kind as 'human' | 'agent', active, role: row.role as MembershipRole,
      explicitAccess: explicitAccess ?? null, implicitAccess, effectiveAccess: active && (project.visibility === 'workspace' || implicitAccess || explicitAccess === 'active'),
      capabilities: { canGrant: active && !project.archivedAt && explicitAccess !== 'active', canRevoke: explicitAccess === 'active' } };
  }
  private async accessMember(tx: Transaction, project: ProjectRow, principalId: string) {
    const row = await tx.membership.findUnique({ where: { workspaceId_principalId: { workspaceId: project.workspaceId, principalId } }, include: { principal: true, projectAccesses: { where: { projectId: project.id } } } });
    if (!row) throw new ForbiddenException('Project access is denied.'); return this.accessDto(row, project);
  }
  accessReview(context: VerifiedExecution, workspaceId: string, projectId: string, principalId: string): Promise<ProjectAccessReview> {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor, canWrite) => {
      this.requireManagement(actor); const project = await this.projectRow(tx, workspaceId, projectId, actor);
      return { project: await this.projectView(tx, project, canWrite, actor), member: await this.accessMember(tx, project, principalId) };
    });
  }
  access(context: VerifiedExecution, workspaceId: string, projectId: string, cursor?: string): Promise<ProjectAccessPage> {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor) => {
      this.requireManagement(actor); const project = await this.projectRow(tx, workspaceId, projectId, actor);
      const where = { workspaceId }; await this.memberAnchor(tx, where, cursor);
      const rows = await tx.membership.findMany({ where: { ...where, ...(cursor ? { principalId: { gt: cursor } } : {}) }, orderBy: { principalId: 'asc' }, take: 101,
        include: { principal: true, projectAccesses: { where: { projectId } } } });
      return { workspaceId, projectId, total: await tx.membership.count({ where }), nextCursor: rows.length > 100 ? rows[99]!.principalId : null, projectVersion: project.version,
        items: rows.slice(0, 100).map(row => this.accessDto(row, project)) };
    });
  }
  assignees(context: VerifiedExecution, workspaceId: string, projectId: string, cursor?: string): Promise<ProjectAssigneePage> {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const where = this.eligible(project); await this.memberAnchor(tx, where, cursor);
      const rows = await tx.membership.findMany({ where: { ...where, ...(cursor ? { principalId: { gt: cursor } } : {}) }, orderBy: { principalId: 'asc' }, take: 101, include: { principal: true } });
      return { workspaceId, projectId, total: await tx.membership.count({ where }), nextCursor: rows.length > 100 ? rows[99]!.principalId : null,
        items: rows.slice(0, 100).map(row => ({ principalId: row.principalId, name: row.principal.displayName, kind: row.principal.kind as 'human' | 'agent', active: true })) };
    });
  }
  changeVisibility(context: VerifiedExecution, workspaceId: string, projectId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, ['expectedVersion', 'visibility'], ['expectedVersion', 'visibility']); const version = expected(input['expectedVersion']);
    if (typeof input['visibility'] !== 'string' || !['workspace', 'private'].includes(input['visibility'])) throw new BadRequestException('Invalid project visibility.');
    const visibility = input['visibility'] as 'workspace' | 'private';
    return this.mutation(context, workspaceId, key, requestId, 'change-visibility', [projectId], { expectedVersion: version, visibility }, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const current = await this.projectView(tx, project, true, actor); this.conflict(current, version);
      if (project.archivedAt) this.archived(current);
      const row = await tx.project.update({ where: { workspaceId_id: { workspaceId, id: projectId } }, data: { visibility, version: { increment: 1 } } });
      return this.projectView(tx, row, true, actor);
    }, true);
  }
  changeAccess(context: VerifiedExecution, workspaceId: string, projectId: string, principalId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, ['expectedVersion', 'state'], ['expectedVersion', 'state']); const version = expected(input['expectedVersion']);
    if (!identifier(principalId) || typeof input['state'] !== 'string' || !['active', 'revoked'].includes(input['state'])) throw new BadRequestException('Invalid project access.');
    const state = input['state'] as 'active' | 'revoked';
    return this.mutation(context, workspaceId, key, requestId, 'change-access', [projectId, principalId], { expectedVersion: version, state }, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const current = await this.projectView(tx, project, true, actor);
      const member = await this.accessMember(tx, project, principalId);
      if (version !== current.version) throw new ConflictException({ code: 'version-conflict', message: 'Project access changed. Review the current target access before saving again.', current, accessCurrent: member });
      if (state === 'active' && project.archivedAt) this.archived(current);
      if (state === 'active') await this.principals.assertAssignable(tx, workspaceId, principalId);
      await tx.projectAccess.upsert({ where: { workspaceId_projectId_principalId: { workspaceId, projectId, principalId } }, create: { workspaceId, projectId, principalId, state }, update: { state } });
      // The access trigger advances the aggregate version in this transaction.
      return this.projectView(tx, await this.projectRow(tx, workspaceId, projectId, actor), true, actor);
    }, true);
  }

  private mutation(context: VerifiedExecution, workspaceId: string, key: string, requestId: string, action: string, target: string[], input: unknown,
    work: (tx: Transaction, actor: ExecutionContextResponse) => Promise<ProjectTaskResult>, administration = false) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
    const requestHash = createHash('sha256').update(JSON.stringify(canonical([action, target, input]))).digest('hex');
    return this.principals.domainOperation(context, workspaceId, 'write', async (tx, actor) => {
      if (administration) this.requireManagement(actor);
      if (target[0]) await this.projectRow(tx, workspaceId, target[0], actor);
      const scope = { workspaceId, actorPrincipalId: actor.actorPrincipalId, executionScope: actor.grantId ? `grant:${actor.grantId}` : 'web', key };
      const previous = await tx.projectTaskOperation.findUnique({ where: { workspaceId_actorPrincipalId_executionScope_key: scope } });
      // Current execution and target access are rechecked before every replay.
      // Stored results are never authorization or a source of current content.
      if (previous) {
        if (previous.requestHash !== requestHash) throw new ConflictException('Idempotency key belongs to another request.');
        const saved = previous.response as unknown as ProjectTaskResult;
        if ('projectId' in saved) return this.taskView(tx, await this.taskRow(tx, workspaceId, saved.projectId, saved.id), await this.projectRow(tx, workspaceId, saved.projectId, actor), true);
        return this.projectView(tx, await this.projectRow(tx, workspaceId, saved.id, actor), true, actor);
      }
      const before = target[1] && action !== 'change-access' ? await tx.task.findFirst({ where: { workspaceId, projectId: target[0]!, id: target[1] } }) : null;
      const result = await work(tx, actor);
      // Only bounded categorical/date snapshots. Never store user text, related
      // entity contents, credential information or arbitrary input metadata.
      const changes = before && 'projectId' in result ? (['status', 'type', 'priority', 'dueDate'] as const).flatMap(field => {
        const old = field === 'dueDate' ? before.dueDate?.toISOString().slice(0, 10) ?? null : before[field];
        return old === result[field] ? [] : [{ field, before: old, after: result[field] }];
      }) : [];
      const changedFields = action.includes('checklist') ? ['checklist'] : action.endsWith('comment') ? ['comment'] : action === 'set-task-parent' ? ['parentTaskId'] : action === 'move-task' ? ['status', 'rank']
        : Object.keys(input as object).filter(field => !['expectedVersion', 'expectedParentVersion', 'acknowledgedChildrenVersion'].includes(field));
      const activityId = randomUUID();
      await tx.activityEvent.create({ data: { id: activityId, workspaceId, projectId: 'projectId' in result ? result.projectId : result.id, taskId: 'projectId' in result ? result.id : null,
        actorPrincipalId: actor.actorPrincipalId, executionMode: actor.executionMode, source: actor.source, grantId: actor.grantId, requestId,
        action, entityVersion: result.version, accessPrincipalId: action === 'change-access' ? target[1]! : null, changedFields, changes } });
      await tx.outboxEvent.create({ data: { id: randomUUID(), workspaceId, activityId, type: 'domain.activity', payload: { activityId } } });
      await tx.projectTaskOperation.create({ data: { ...scope, requestHash, response: result as unknown as Prisma.InputJsonValue } });
      return result;
    });
  }
  createProject(context: VerifiedExecution, workspaceId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, ['name', 'key', 'description', 'visibility'], ['name', 'key']);
    const name = text(input['name'], 200, true); const description = text(input['description'] ?? '', 20000);
    if (typeof input['key'] !== 'string' || !/^[A-Z][A-Z0-9]{1,9}$/.test(input['key']) || ('visibility' in input && (typeof input['visibility'] !== 'string' || !['workspace', 'private'].includes(input['visibility'])))) throw new BadRequestException('Use a 2–10 character uppercase project key and valid visibility.');
    const projectKey = input['key']; const visibility = input['visibility'] === 'private' ? 'private' : 'workspace';
    return this.mutation(context, workspaceId, key, requestId, 'create-project', [], { name, key: projectKey, description, visibility }, async (tx, actor) => {
      const row = await tx.project.create({ data: { id: randomUUID(), workspaceId, name, key: projectKey, description, visibility, ...attribution(actor) } });
      return this.projectView(tx, row, true, actor);
    }, visibility === 'private');
  }
  changeProject(context: VerifiedExecution, workspaceId: string, projectId: string, key: string, requestId: string, action: 'edit-project' | 'archive-project' | 'restore-project', payload: unknown) {
    const input = object(payload, action === 'edit-project' ? ['expectedVersion', 'name', 'description'] : ['expectedVersion'], ['expectedVersion']);
    const version = expected(input['expectedVersion']);
    const patch = action === 'edit-project' ? { name: text(input['name'], 200, true), description: text(input['description'], 20000) } : { archivedAt: action === 'archive-project' ? new Date() : null };
    return this.mutation(context, workspaceId, key, requestId, action, [projectId], action === 'edit-project' ? { expectedVersion: version, ...patch } : { expectedVersion: version }, async (tx, actor) => {
      const row = await this.projectRow(tx, workspaceId, projectId, actor); const current = await this.projectView(tx, row, true, actor); this.conflict(current, version);
      if (action !== 'restore-project' && row.archivedAt) this.archived(current);
      if (action === 'restore-project' && !row.archivedAt) throw new ConflictException({ code: 'archived', message: 'Project is already active.', current });
      return this.projectView(tx, await tx.project.update({ where: { workspaceId_id: { workspaceId, id: projectId } }, data: { ...patch, version: { increment: 1 } } }), true, actor);
    });
  }
  createTask(context: VerifiedExecution, workspaceId: string, projectId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, [...taskProperties, 'parentTaskId', 'expectedParentVersion'], ['title']); const fields = taskFields(input, true);
    const parentTaskId = input['parentTaskId'];
    if (parentTaskId !== undefined && !identifier(parentTaskId) || parentTaskId === undefined && 'expectedParentVersion' in input) throw new BadRequestException('Invalid parent task.');
    const parentVersion = parentTaskId === undefined ? undefined : expected(input['expectedParentVersion']);
    return this.mutation(context, workspaceId, key, requestId, 'create-task', [projectId], { ...fields, ...(parentTaskId ? { parentTaskId, expectedParentVersion: parentVersion } : {}) }, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor);
      if (project.archivedAt) this.archived(await this.projectView(tx, project, true, actor));
      if (fields.assigneePrincipalId) await this.assertAssignable(tx, project, fields.assigneePrincipalId);
      if (parentTaskId) await this.assertParent(tx, workspaceId, projectId, parentTaskId as string, parentVersion!);
      const row = await tx.task.create({ data: { id: randomUUID(), workspaceId, projectId, number: 1, ...fields, ...(parentTaskId ? { parentTaskId: parentTaskId as string } : {}), title: fields.title!, ...attribution(actor) } });
      return this.taskView(tx, row, project, true);
    });
  }
  changeTask(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string, key: string, requestId: string, action: 'edit-task' | 'archive-task' | 'restore-task', payload: unknown) {
    const input = object(payload, action === 'edit-task' ? ['expectedVersion', 'acknowledgedChildrenVersion', ...taskProperties] : ['expectedVersion'], ['expectedVersion']); const version = expected(input['expectedVersion']);
    const acknowledgment = 'acknowledgedChildrenVersion' in input ? expected(input['acknowledgedChildrenVersion']) : undefined;
    const properties = Object.fromEntries(Object.entries(input).filter(([field]) => !['expectedVersion', 'acknowledgedChildrenVersion'].includes(field)));
    const fields = action === 'edit-task' ? taskFields(properties, false) : { archivedAt: action === 'archive-task' ? new Date() : null };
    if (action === 'edit-task' && !Object.keys(fields).length) throw new BadRequestException('A task change is required.');
    return this.mutation(context, workspaceId, key, requestId, action, [projectId, taskId], action === 'edit-task' ? { expectedVersion: version, ...fields, ...(acknowledgment ? { acknowledgedChildrenVersion: acknowledgment } : {}) } : { expectedVersion: version }, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId, actor); const row = await this.taskRow(tx, workspaceId, projectId, taskId); const current = await this.taskView(tx, row, project, true); this.conflict(current, version);
      if (project.archivedAt || (action !== 'restore-task' && row.archivedAt)) this.archived(current);
      if (action === 'restore-task' && !row.archivedAt) throw new ConflictException({ code: 'archived', message: 'Task is already active.', current });
      if ('assigneePrincipalId' in fields && fields.assigneePrincipalId && fields.assigneePrincipalId !== row.assigneePrincipalId) await this.assertAssignable(tx, project, fields.assigneePrincipalId);
      await this.closing(tx, row, project, current, 'status' in fields ? fields.status : undefined, acknowledgment);
      const position = 'status' in fields && fields.status !== row.status ? { rank: await this.rank(tx, workspaceId, projectId, fields.status!, null, taskId) } : {};
      return this.taskView(tx, await tx.task.update({ where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } }, data: { ...fields, ...position } }), project, true);
    });
  }
}
