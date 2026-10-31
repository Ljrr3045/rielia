import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isActivityChange, isCollaborationCommand, taskActivityActions, taskActivityFields, taskURL, type CollaborationCollection, type TaskCollaborationPages, type TaskComment, type TaskActivity, type TaskReference, type DomainPerson } from '@rielia/contracts';
import type { Task as TaskRow, TaskComment as CommentRow } from '../generated/prisma/client.js';
import type { Transaction, VerifiedExecution } from '../principals/principal.service.js';
import { ProjectTaskService, object, expected, text } from './project-task.service.js';

const identifier = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const scope = (workspaceId: string, projectId: string, taskId: string) => ({ workspaceId, projectId, taskId });
const reference = (row: TaskRow, key: string): TaskReference => ({ id: row.id, key: `${key}-${row.number}`, title: row.title, status: row.status as TaskReference['status'], archivedAt: row.archivedAt?.toISOString() ?? null, version: row.version, url: taskURL(row.workspaceId, row.projectId, row.id) });

@Injectable()
export class TaskCollaborationService {
  constructor(@Inject(ProjectTaskService) private readonly tasks: ProjectTaskService) {}

  private cursor(cursor: string | undefined, collection: CollaborationCollection, w: string, p: string, t: string, revision: number) {
    if (!cursor) return null;
    let value: Record<string, unknown>;
    try {
      if (!/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
      value = object(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')), ['v', 'w', 'p', 't', 'k', 'r', 'a'], ['v', 'w', 'p', 't', 'k', 'r', 'a']);
      if (value['v'] !== 1 || value['w'] !== w || value['p'] !== p || value['t'] !== t || value['k'] !== collection || !identifier(value['a']) || !Number.isSafeInteger(value['r']) || Number(value['r']) < 1) throw new Error();
    } catch { throw new BadRequestException('Invalid collaboration cursor.'); }
    if (value['r'] !== revision) throw new ConflictException({ code: 'page-changed', message: 'Collaboration changed. Refresh the collection.' });
    return value['a'] as string;
  }
  private async people(tx: Transaction, workspaceId: string, ids: string[]) {
    const rows = await tx.membership.findMany({ where: { workspaceId, principalId: { in: [...new Set(ids)] } }, include: { principal: true } });
    return new Map(rows.map(row => [row.principalId, { principalId: row.principalId, name: row.principal.displayName, kind: row.principal.kind as DomainPerson['kind'], active: row.state === 'active' && row.principal.state === 'active' }]));
  }
  private comment(row: CommentRow, people: Map<string, DomainPerson>, actorId: string, writable: boolean): TaskComment {
    return { id: row.id, body: row.body, version: row.version, author: people.get(row.authorPrincipalId)!,
      provenance: { actorPrincipalId: row.authorPrincipalId, executionMode: row.creationMode as TaskComment['provenance']['executionMode'], source: row.creationSource as 'web' | 'mcp', grantId: row.creationGrantId },
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), editedAt: row.version > 1 ? row.updatedAt.toISOString() : null, capabilities: { canEdit: writable && actorId === row.authorPrincipalId } };
  }
  page<K extends CollaborationCollection>(context: VerifiedExecution, w: string, p: string, t: string, collection: K, cursor?: string): Promise<TaskCollaborationPages[K]> {
    return this.tasks.collaborationRead(context, w, p, t, async (tx, actor, canWrite, project, task) => {
      const where = scope(w, p, t); const writable = canWrite && !project.archivedAt && !task.archivedAt;
      const revision = collection === 'relations' || collection === 'parent-candidates' ? project.taskRevision : task.version;
      const anchorId = this.cursor(cursor, collection, w, p, t, revision);
      const envelope = (id: string) => Buffer.from(JSON.stringify({ v: 1, w, p, t, k: collection, r: revision, a: id })).toString('base64url');
      const base = { ...where, revision };
      if (collection === 'parent-candidates') {
        const oldParent = task.parentTaskId ? await tx.task.findFirst({ where: { workspaceId: w, projectId: p, id: task.parentTaskId } }) : null;
        const canSelect = writable && !oldParent?.archivedAt && !await tx.task.count({ where: { workspaceId: w, projectId: p, parentTaskId: t } });
        const candidates = { workspaceId: w, projectId: p, parentTaskId: null, archivedAt: null, id: { not: t } };
        const anchor = anchorId && canSelect ? await tx.task.findFirst({ where: { ...candidates, id: anchorId } }) : null;
        if (anchorId && !anchor) throw new BadRequestException('Invalid collaboration cursor.');
        const rows = canSelect ? await tx.task.findMany({ where: { ...candidates, ...(anchor ? { number: { gt: anchor.number } } : {}) }, orderBy: { number: 'asc' }, take: 101 }) : [];
        return { ...base, items: rows.slice(0, 100).map(row => reference(row, project.key)), total: canSelect ? await tx.task.count({ where: candidates }) : 0,
          nextCursor: rows.length > 100 ? envelope(rows[99]!.id) : null, capabilities: { canSelect } } as TaskCollaborationPages[K];
      }
      if (collection === 'relations') {
        const children = { workspaceId: w, projectId: p, parentTaskId: t };
        const anchor = anchorId ? await tx.task.findFirst({ where: { ...children, id: anchorId } }) : null;
        if (anchorId && !anchor) throw new BadRequestException('Invalid collaboration cursor.');
        const rows = await tx.task.findMany({ where: { ...children, ...(anchor ? { number: { gt: anchor.number } } : {}) }, orderBy: { number: 'asc' }, take: 101 });
        const parent = task.parentTaskId ? await tx.task.findFirst({ where: { workspaceId: w, projectId: p, id: task.parentTaskId } }) : null;
        const open = { ...children, status: { notIn: ['done', 'canceled'] } };
        const total = await tx.task.count({ where: children });
        return { ...base, parent: parent ? reference(parent, project.key) : null, items: rows.slice(0, 100).map(row => reference(row, project.key)), total,
          open: await tx.task.count({ where: open }), archivedOpen: await tx.task.count({ where: { ...open, archivedAt: { not: null } } }), nextCursor: rows.length > 100 ? envelope(rows[99]!.id) : null,
          capabilities: { canCreate: writable && !task.parentTaskId, canLink: writable && !parent?.archivedAt && total === 0, canUnlink: writable && !!parent && !parent.archivedAt } } as TaskCollaborationPages[K];
      }
      if (collection === 'checklist') {
        // There are at most 100 active items. No paging beyond this bounded set.
        if (anchorId) throw new BadRequestException('Invalid collaboration cursor.');
        const rows = await tx.checklistItem.findMany({ where: { ...where, removedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }], take: 100 });
        return { ...base, items: rows.map((row, index) => ({ id: row.id, text: row.text, completed: row.completed, position: row.position, version: row.version,
          moveUpBeforeItemId: rows[index - 1]?.id ?? null, moveDownBeforeItemId: rows[index + 2]?.id ?? null,
          capabilities: { canEdit: writable, canRemove: writable, canMoveUp: writable && index > 0, canMoveDown: writable && index < rows.length - 1 } })), total: rows.length, nextCursor: null,
          capabilities: { canCreate: writable && rows.length < 100, canEdit: writable } } as TaskCollaborationPages[K];
      }
      if (collection === 'comments') {
        const anchor = anchorId ? await tx.taskComment.findFirst({ where: { ...where, id: anchorId } }) : null;
        if (anchorId && !anchor) throw new BadRequestException('Invalid collaboration cursor.');
        const rows = await tx.taskComment.findMany({ where: { ...where, ...(anchor ? { OR: [{ updatedAt: { lt: anchor.updatedAt } }, { updatedAt: anchor.updatedAt, id: { lt: anchor.id } }] } : {}) }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 101 });
        const people = await this.people(tx, w, rows.map(row => row.authorPrincipalId));
        return { ...base, items: rows.slice(0, 100).map(row => this.comment(row, people, actor.actorPrincipalId, writable)), total: await tx.taskComment.count({ where }), nextCursor: rows.length > 100 ? envelope(rows[99]!.id) : null,
          capabilities: { canCreate: writable } } as TaskCollaborationPages[K];
      }
      const historyWhere = { ...where, action: { in: [...taskActivityActions] } };
      const anchor = anchorId ? await tx.activityEvent.findFirst({ where: { ...historyWhere, id: anchorId } }) : null;
      if (anchorId && !anchor) throw new BadRequestException('Invalid collaboration cursor.');
      const rows = await tx.activityEvent.findMany({ where: { ...historyWhere, ...(anchor ? { OR: [{ createdAt: { lt: anchor.createdAt } }, { createdAt: anchor.createdAt, id: { lt: anchor.id } }] } : {}) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 101 });
      const people = await this.people(tx, w, rows.map(row => row.actorPrincipalId));
      const items: TaskActivity[] = rows.slice(0, 100).map(row => ({ id: row.id, action: row.action as TaskActivity['action'], fields: taskActivityFields.filter(field => row.changedFields.includes(field)),
        actor: people.get(row.actorPrincipalId)!, provenance: { actorPrincipalId: row.actorPrincipalId, executionMode: row.executionMode as TaskActivity['provenance']['executionMode'], source: row.source as TaskActivity['provenance']['source'], grantId: row.grantId },
        entityVersion: row.entityVersion, createdAt: row.createdAt.toISOString(), changes: Array.isArray(row.changes) ? row.changes.filter(isActivityChange) : [] }));
      return { ...base, items, total: await tx.activityEvent.count({ where: historyWhere }), nextCursor: rows.length > 100 ? envelope(rows[99]!.id) : null } as TaskCollaborationPages[K];
    });
  }
  commentReview(context: VerifiedExecution, w: string, p: string, t: string, id: string) {
    return this.tasks.collaborationRead(context, w, p, t, async (tx, actor, canWrite, project, task, view) => {
      const row = await tx.taskComment.findFirst({ where: { ...scope(w, p, t), id } });
      if (!row) throw new ForbiddenException('Comment access is denied.');
      return { task: await view(), comment: this.comment(row, await this.people(tx, w, [row.authorPrincipalId]), actor.actorPrincipalId, canWrite && !project.archivedAt && !task.archivedAt) };
    });
  }
  mutate(context: VerifiedExecution, w: string, p: string, t: string, key: string, requestId: string, action: string, payload: unknown, itemId?: string) {
    if (!isCollaborationCommand({ type: action }) || ['edit-checklist-item', 'move-checklist-item', 'remove-checklist-item', 'edit-comment'].includes(action) && !identifier(itemId)) throw new BadRequestException('Invalid collaboration operation.');
    const allowed = action === 'set-task-parent' ? ['parentTaskId', 'expectedParentVersion'] : action === 'add-checklist-item' ? ['text', 'beforeItemId']
      : action === 'edit-checklist-item' ? ['text', 'completed'] : action === 'move-checklist-item' ? ['beforeItemId'] : action === 'remove-checklist-item' ? [] : action === 'edit-comment' ? ['body', 'expectedCommentVersion'] : ['body'];
    const input = object(payload, ['expectedVersion', ...allowed], ['expectedVersion']); expected(input['expectedVersion']);
    if (itemId) input['itemId'] = itemId;
    if ('text' in input) input['text'] = text(input['text'], 500, true);
    if (action.endsWith('comment')) {
      const body = text(input['body'], 10000); if (!body.trim()) throw new BadRequestException('A comment is required.'); input['body'] = body;
      if (action === 'edit-comment') expected(input['expectedCommentVersion']);
    }
    if (action === 'add-checklist-item' && !('text' in input) || action === 'edit-checklist-item' && !('text' in input || 'completed' in input)
      || 'completed' in input && typeof input['completed'] !== 'boolean') throw new BadRequestException('Invalid checklist change.');
    if (action === 'add-checklist-item' || action === 'move-checklist-item') {
      if (input['beforeItemId'] !== null && !identifier(input['beforeItemId'])) throw new BadRequestException('Invalid checklist destination.');
    }
    if (action === 'set-task-parent') {
      if (input['parentTaskId'] !== null && !identifier(input['parentTaskId']) || input['parentTaskId'] === null && 'expectedParentVersion' in input) throw new BadRequestException('Invalid parent task.');
      if (input['parentTaskId']) expected(input['expectedParentVersion']);
    }
    return this.tasks.collaborationMutation(context, w, p, t, key, requestId, action, input, async (tx, actor, _project, task) => {
      const where = scope(w, p, t);
      if (action === 'set-task-parent') {
        if (task.parentTaskId && await tx.task.findFirst({ where: { workspaceId: w, projectId: p, id: task.parentTaskId, archivedAt: { not: null } } })) throw new ConflictException('Archived relationships are frozen.');
        if (input['parentTaskId']) await this.tasks.assertParent(tx, w, p, input['parentTaskId'] as string, Number(input['expectedParentVersion']), t);
        await tx.task.update({ where: { workspaceId_projectId_id: { workspaceId: w, projectId: p, id: t } }, data: { parentTaskId: input['parentTaskId'] as string | null } }); return;
      }
      if (action.endsWith('comment')) {
        if (action === 'add-comment') await tx.taskComment.create({ data: { ...where, id: randomUUID(), body: input['body'] as string, authorPrincipalId: actor.actorPrincipalId, creationMode: actor.executionMode, creationSource: actor.source, creationGrantId: actor.grantId } });
        else {
          const row = await tx.taskComment.findFirst({ where: { ...where, id: itemId! } });
          if (!row || row.authorPrincipalId !== actor.actorPrincipalId) throw new ForbiddenException('Comment editing is denied.');
          if (row.version !== input['expectedCommentVersion']) throw new ConflictException({ code: 'comment-conflict', message: 'Comment changed. Reload and compare before editing.' });
          await tx.taskComment.update({ where: { id: row.id }, data: { body: input['body'] as string } });
        }
        return;
      }
      const rows = await tx.checklistItem.findMany({ where: { ...where, removedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }] });
      if (action === 'add-checklist-item' && rows.length >= 100) throw new BadRequestException('Checklist limit reached.');
      const target = itemId ? rows.find(row => row.id === itemId) : undefined;
      if (itemId && !target) throw new BadRequestException('Invalid checklist item.');
      if (action === 'edit-checklist-item') { await tx.checklistItem.update({ where: { id: target!.id }, data: { ...('text' in input ? { text: input['text'] as string } : {}), ...('completed' in input ? { completed: input['completed'] as boolean } : {}) } }); return; }
      if (action === 'remove-checklist-item') { await tx.checklistItem.update({ where: { id: target!.id }, data: { removedAt: new Date() } }); return; }
      const ordered = rows.filter(row => row.id !== itemId); const before = input['beforeItemId'];
      const position = before === null ? ordered.length : ordered.findIndex(row => row.id === before);
      if (position < 0) throw new BadRequestException('Invalid checklist destination.');
      const moved = target ?? await tx.checklistItem.create({ data: { ...where, id: randomUUID(), text: input['text'] as string, position: rows.length + 1 } });
      ordered.splice(position, 0, moved);
      for (const [index, row] of ordered.entries()) if (row.position !== index + 1) await tx.checklistItem.update({ where: { id: row.id }, data: { position: index + 1 } });
    });
  }
}
