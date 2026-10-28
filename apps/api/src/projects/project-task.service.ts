import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { projectURL, taskURL, taskStatuses, taskTypes, taskPriorities, type ArchiveView, type DomainPage, type DomainPerson, type ExecutionContextResponse, type Project, type ProjectTaskResult, type Task } from '@rielia/contracts';
import type { Prisma, Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import { PrincipalService, type Transaction, type VerifiedExecution } from '../principals/principal.service.js';

const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function object(value: unknown, allowed: string[], required: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))
    || required.some(key => !(key in value))) throw new BadRequestException('Invalid project/task request.');
  return value as Record<string, unknown>;
}
function text(value: unknown, limit: number, required = false): string {
  if (typeof value !== 'string' || value.includes('\0') || value.length > limit || (required && (!value.trim() || /[\r\n\t]/.test(value)))) throw new BadRequestException('Invalid text.');
  return required ? value.trim() : value;
}
function expected(value: unknown): number {
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

  private async projectRow(tx: Transaction, workspaceId: string, projectId: string) {
    const row = await tx.project.findUnique({ where: { workspaceId_id: { workspaceId, id: projectId } } });
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
  private projectDto(row: ProjectRow, people: Map<string, DomainPerson>, canWrite: boolean): Project {
    return { id: row.id, workspaceId: row.workspaceId, key: row.key, name: row.name, description: row.description, visibility: 'workspace', version: row.version,
      archivedAt: iso(row.archivedAt), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), creator: people.get(row.createdByPrincipalId)!, provenance: provenance(row),
      capabilities: { canEdit: canWrite && !row.archivedAt, canArchive: canWrite && !row.archivedAt, canRestore: canWrite && !!row.archivedAt }, url: projectURL(row.workspaceId, row.id) };
  }
  private taskDto(row: TaskRow, project: ProjectRow, people: Map<string, DomainPerson>, canWrite: boolean): Task {
    const active = !project.archivedAt && !row.archivedAt;
    return { id: row.id, workspaceId: row.workspaceId, projectId: row.projectId, projectKey: project.key, number: row.number, key: `${project.key}-${row.number}`,
      title: row.title, description: row.description, type: row.type as Task['type'], priority: row.priority as Task['priority'], status: row.status as Task['status'],
      assigneePrincipalId: row.assigneePrincipalId, assignee: row.assigneePrincipalId ? people.get(row.assigneePrincipalId)! : null,
      dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null, version: row.version, archivedAt: iso(row.archivedAt), projectArchivedAt: iso(project.archivedAt),
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), creator: people.get(row.createdByPrincipalId)!, provenance: provenance(row),
      capabilities: { canEdit: canWrite && active, canArchive: canWrite && active, canRestore: canWrite && !project.archivedAt && !!row.archivedAt }, url: taskURL(row.workspaceId, row.projectId, row.id) };
  }
  private async projectView(tx: Transaction, row: ProjectRow, canWrite: boolean) { return this.projectDto(row, await this.people(tx, row.workspaceId, [row.createdByPrincipalId]), canWrite); }
  private async taskView(tx: Transaction, row: TaskRow, project: ProjectRow, canWrite: boolean) { return this.taskDto(row, project, await this.people(tx, row.workspaceId, [row.createdByPrincipalId, ...(row.assigneePrincipalId ? [row.assigneePrincipalId] : [])]), canWrite); }
  private conflict(current: ProjectTaskResult, version: number) {
    if (version !== current.version) throw new ConflictException({ code: 'version-conflict', message: 'Record changed. Compare the current record before saving again.', current });
  }
  private archived(current: ProjectTaskResult) { throw new ConflictException({ code: 'archived', message: 'Restore the archived record or its project before editing.', current }); }

  projects(context: VerifiedExecution, workspaceId: string, view: ArchiveView = 'active', cursor?: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, _actor, canWrite) => {
      const where = { workspaceId, archivedAt: view === 'active' ? null : { not: null } };
      const rows = await tx.project.findMany({ where: { ...where, ...(cursor ? { id: { gt: cursor } } : {}) }, orderBy: { id: 'asc' }, take: 101 });
      const people = await this.people(tx, workspaceId, rows.map(row => row.createdByPrincipalId));
      return page(rows.map(row => this.projectDto(row, people, canWrite)), await tx.project.count({ where }), row => row.id, canWrite);
    });
  }
  project(context: VerifiedExecution, workspaceId: string, projectId: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, _actor, canWrite) => this.projectView(tx, await this.projectRow(tx, workspaceId, projectId), canWrite));
  }
  tasks(context: VerifiedExecution, workspaceId: string, projectId: string, view: ArchiveView = 'active', cursor?: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, _actor, canWrite) => {
      const project = await this.projectRow(tx, workspaceId, projectId);
      const where = { workspaceId, projectId, archivedAt: view === 'active' ? null : { not: null } };
      const rows = await tx.task.findMany({ where: { ...where, ...(cursor ? { id: { gt: cursor } } : {}) }, orderBy: { id: 'asc' }, take: 101 });
      const people = await this.people(tx, workspaceId, rows.flatMap(row => [row.createdByPrincipalId, ...(row.assigneePrincipalId ? [row.assigneePrincipalId] : [])]));
      return page(rows.map(row => this.taskDto(row, project, people, canWrite)), await tx.task.count({ where }), row => row.id, canWrite && !project.archivedAt);
    });
  }
  task(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string) {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, _actor, canWrite) => this.taskView(tx, await this.taskRow(tx, workspaceId, projectId, taskId), await this.projectRow(tx, workspaceId, projectId), canWrite));
  }

  private mutation(context: VerifiedExecution, workspaceId: string, key: string, requestId: string, action: string, target: string[], input: unknown,
    work: (tx: Transaction, actor: ExecutionContextResponse) => Promise<ProjectTaskResult>) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new BadRequestException('A UUID v4 Idempotency-Key is required.');
    const requestHash = createHash('sha256').update(JSON.stringify(canonical([action, target, input]))).digest('hex');
    return this.principals.domainOperation(context, workspaceId, 'write', async (tx, actor) => {
      const scope = { workspaceId, actorPrincipalId: actor.actorPrincipalId, executionScope: actor.grantId ? `grant:${actor.grantId}` : 'web', key };
      const previous = await tx.projectTaskOperation.findUnique({ where: { workspaceId_actorPrincipalId_executionScope_key: scope } });
      // Current execution and full workspace access were rechecked before any
      // replay. This slice admits no private project policy or soft deletion.
      if (previous) {
        if (previous.requestHash !== requestHash) throw new ConflictException('Idempotency key belongs to another request.');
        const saved = previous.response as unknown as ProjectTaskResult;
        if ('projectId' in saved) return this.taskView(tx, await this.taskRow(tx, workspaceId, saved.projectId, saved.id), await this.projectRow(tx, workspaceId, saved.projectId), true);
        return this.projectView(tx, await this.projectRow(tx, workspaceId, saved.id), true);
      }
      const result = await work(tx, actor);
      const activityId = randomUUID();
      await tx.activityEvent.create({ data: { id: activityId, workspaceId, projectId: 'projectId' in result ? result.projectId : result.id, taskId: 'projectId' in result ? result.id : null,
        actorPrincipalId: actor.actorPrincipalId, executionMode: actor.executionMode, source: actor.source, grantId: actor.grantId, requestId,
        action, entityVersion: result.version, changedFields: Object.keys(input as object).filter(field => field !== 'expectedVersion') } });
      await tx.outboxEvent.create({ data: { id: randomUUID(), workspaceId, activityId, type: 'domain.activity', payload: { activityId } } });
      await tx.projectTaskOperation.create({ data: { ...scope, requestHash, response: result as unknown as Prisma.InputJsonValue } });
      return result;
    });
  }
  createProject(context: VerifiedExecution, workspaceId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, ['name', 'key', 'description', 'visibility'], ['name', 'key']);
    const name = text(input['name'], 200, true); const description = text(input['description'] ?? '', 20000);
    if (typeof input['key'] !== 'string' || !/^[A-Z][A-Z0-9]{1,9}$/.test(input['key']) || ('visibility' in input && input['visibility'] !== 'workspace')) throw new BadRequestException('Use a 2–10 character uppercase project key and workspace visibility.');
    const projectKey = input['key'];
    return this.mutation(context, workspaceId, key, requestId, 'create-project', [], { name, key: projectKey, description, visibility: 'workspace' }, async (tx, actor) => {
      const row = await tx.project.create({ data: { id: randomUUID(), workspaceId, name, key: projectKey, description, ...attribution(actor) } });
      return this.projectView(tx, row, true);
    });
  }
  changeProject(context: VerifiedExecution, workspaceId: string, projectId: string, key: string, requestId: string, action: 'edit-project' | 'archive-project' | 'restore-project', payload: unknown) {
    const input = object(payload, action === 'edit-project' ? ['expectedVersion', 'name', 'description'] : ['expectedVersion'], ['expectedVersion']);
    const version = expected(input['expectedVersion']);
    const patch = action === 'edit-project' ? { name: text(input['name'], 200, true), description: text(input['description'], 20000) } : { archivedAt: action === 'archive-project' ? new Date() : null };
    return this.mutation(context, workspaceId, key, requestId, action, [projectId], action === 'edit-project' ? { expectedVersion: version, ...patch } : { expectedVersion: version }, async (tx) => {
      const row = await this.projectRow(tx, workspaceId, projectId); const current = await this.projectView(tx, row, true); this.conflict(current, version);
      if (action !== 'restore-project' && row.archivedAt) this.archived(current);
      if (action === 'restore-project' && !row.archivedAt) throw new ConflictException({ code: 'archived', message: 'Project is already active.', current });
      return this.projectView(tx, await tx.project.update({ where: { workspaceId_id: { workspaceId, id: projectId } }, data: { ...patch, version: { increment: 1 } } }), true);
    });
  }
  createTask(context: VerifiedExecution, workspaceId: string, projectId: string, key: string, requestId: string, payload: unknown) {
    const input = object(payload, taskProperties, ['title']); const fields = taskFields(input, true);
    return this.mutation(context, workspaceId, key, requestId, 'create-task', [projectId], fields, async (tx, actor) => {
      const project = await this.projectRow(tx, workspaceId, projectId);
      if (project.archivedAt) this.archived(await this.projectView(tx, project, true));
      if (fields.assigneePrincipalId) await this.principals.assertAssignable(tx, workspaceId, fields.assigneePrincipalId);
      const row = await tx.task.create({ data: { id: randomUUID(), workspaceId, projectId, number: 1, ...fields, title: fields.title!, ...attribution(actor) } });
      return this.taskView(tx, row, project, true);
    });
  }
  changeTask(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string, key: string, requestId: string, action: 'edit-task' | 'archive-task' | 'restore-task', payload: unknown) {
    const input = object(payload, action === 'edit-task' ? ['expectedVersion', ...taskProperties] : ['expectedVersion'], ['expectedVersion']); const version = expected(input['expectedVersion']);
    const properties = Object.fromEntries(Object.entries(input).filter(([field]) => field !== 'expectedVersion'));
    const fields = action === 'edit-task' ? taskFields(properties, false) : { archivedAt: action === 'archive-task' ? new Date() : null };
    if (action === 'edit-task' && !Object.keys(fields).length) throw new BadRequestException('A task change is required.');
    return this.mutation(context, workspaceId, key, requestId, action, [projectId, taskId], action === 'edit-task' ? { expectedVersion: version, ...fields } : { expectedVersion: version }, async tx => {
      const project = await this.projectRow(tx, workspaceId, projectId); const row = await this.taskRow(tx, workspaceId, projectId, taskId); const current = await this.taskView(tx, row, project, true); this.conflict(current, version);
      if (project.archivedAt || (action !== 'restore-task' && row.archivedAt)) this.archived(current);
      if (action === 'restore-task' && !row.archivedAt) throw new ConflictException({ code: 'archived', message: 'Task is already active.', current });
      if ('assigneePrincipalId' in fields && fields.assigneePrincipalId && fields.assigneePrincipalId !== row.assigneePrincipalId) await this.principals.assertAssignable(tx, workspaceId, fields.assigneePrincipalId);
      return this.taskView(tx, await tx.task.update({ where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } }, data: fields }), project, true);
    });
  }
}
