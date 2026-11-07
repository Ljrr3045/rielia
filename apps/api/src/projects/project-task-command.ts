import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  taskStatuses,
  type TaskStatus,
  type ExecutionContextResponse,
  type ProjectTaskResult,
  type Task,
} from '@rielia/contracts';
import type { Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import type {
  PrincipalService,
  Transaction,
  VerifiedExecution,
} from '../principals/principal.service.js';
import {
  identifier,
  object,
  text,
  expected,
  taskFields,
  taskProperties,
} from './project-task-input.js';
import { attribution } from './project-task-dto.js';
import * as reads from './project-task-read.js';
import { mutateProjectTask } from './project-task-mutation.js';

function conflict(current: ProjectTaskResult, version: number) {
  if (version !== current.version)
    throw new ConflictException({
      code: 'version-conflict',
      message: 'Record changed. Compare the current record before saving again.',
      current,
    });
}

function archived(current: ProjectTaskResult) {
  throw new ConflictException({
    code: 'archived',
    message: 'Restore the archived record or its project before editing.',
    current,
  });
}

export async function assertParent(
  tx: Transaction,
  workspaceId: string,
  projectId: string,
  parentTaskId: string,
  version: number,
  taskId?: string,
) {
  const parent = await tx.task.findFirst({
    where: { workspaceId, projectId, id: parentTaskId, archivedAt: null, parentTaskId: null },
  });
  if (!parent || parentTaskId === taskId) throw new BadRequestException('Invalid parent task.');
  if (parent.version !== version)
    throw new ConflictException({
      code: 'parent-changed',
      message: 'Parent changed. Refresh and choose the parent again.',
    });
  if (taskId && (await tx.task.count({ where: { workspaceId, projectId, parentTaskId: taskId } })))
    throw new BadRequestException('A parent cannot become a child.');
}

async function closing(
  tx: Transaction,
  row: TaskRow,
  project: ProjectRow,
  current: Task,
  status: string | undefined,
  acknowledgment: number | undefined,
) {
  if (!status || status === row.status || !['done', 'canceled'].includes(status)) return;
  const where = {
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    parentTaskId: row.id,
    status: { notIn: ['done', 'canceled'] },
  };
  const open = await tx.task.count({ where });
  if (open && acknowledgment !== project.taskRevision)
    throw new ConflictException({
      code: 'open-children',
      message: 'Open children remain unchanged. Review them before closing the parent.',
      current,
      closeWarning: {
        open,
        archivedOpen: await tx.task.count({ where: { ...where, archivedAt: { not: null } } }),
        childrenVersion: project.taskRevision,
      },
    });
}

async function allocateTaskRank(
  tx: Transaction,
  workspaceId: string,
  projectId: string,
  status: string,
  beforeTaskId: string | null,
  taskId: string,
) {
  const rows = await tx.$queryRaw<
    Array<{ rank: bigint }>
  >`SELECT task_rank_before(${workspaceId},${projectId},${status},${beforeTaskId},${taskId}) AS rank`;
  return rows[0]!.rank;
}

async function assertAssignable(
  principals: PrincipalService,
  tx: Transaction,
  project: ProjectRow,
  principalId: string,
) {
  await principals.assertAssignable(tx, project.workspaceId, principalId);
  if (
    !(await tx.membership.findFirst({
      where: { ...reads.eligibleMembers(project), principalId },
      select: { principalId: true },
    }))
  )
    throw new ForbiddenException('Assignment is denied.');
}

export function collaborationMutation(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  taskId: string,
  key: string,
  requestId: string,
  action: string,
  input: Record<string, unknown>,
  work: (
    tx: Transaction,
    actor: ExecutionContextResponse,
    project: ProjectRow,
    task: TaskRow,
  ) => Promise<void>,
) {
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    action,
    [projectId, taskId],
    input,
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      const row = await reads.taskRow(tx, workspaceId, projectId, taskId);
      const current = await reads.taskView(tx, row, project, true);
      conflict(current, expected(input['expectedVersion']));
      if (project.archivedAt || row.archivedAt) archived(current);
      await work(tx, actor, project, row);
      // One aggregate version covers checklist, comments and relationship edits.
      const updated = await tx.task.update({
        where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } },
        data: { version: { increment: 1 } },
      });
      return reads.taskView(tx, updated, project, true);
    },
  );
}

export function moveTask(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  taskId: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = object(
    payload,
    [
      'expectedVersion',
      'expectedOrderVersion',
      'status',
      'beforeTaskId',
      'acknowledgedChildrenVersion',
    ],
    ['expectedVersion', 'expectedOrderVersion', 'status', 'beforeTaskId'],
  );
  const version = expected(input['expectedVersion']);
  const orderVersion = expected(input['expectedOrderVersion']);
  if (
    !taskStatuses.includes(input['status'] as TaskStatus) ||
    (input['beforeTaskId'] !== null && !identifier(input['beforeTaskId']))
  )
    throw new BadRequestException('Invalid task move.');
  const status = input['status'] as TaskStatus;
  const beforeTaskId = input['beforeTaskId'] as string | null;
  const acknowledgment =
    'acknowledgedChildrenVersion' in input
      ? expected(input['acknowledgedChildrenVersion'])
      : undefined;
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    'move-task',
    [projectId, taskId],
    {
      expectedVersion: version,
      expectedOrderVersion: orderVersion,
      status,
      beforeTaskId,
      ...(acknowledgment ? { acknowledgedChildrenVersion: acknowledgment } : {}),
    },
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      const row = await reads.taskRow(tx, workspaceId, projectId, taskId);
      const current = await reads.taskView(tx, row, project, true);
      conflict(current, version);
      if (project.archivedAt || row.archivedAt) archived(current);
      if (project.taskRevision !== orderVersion)
        throw new ConflictException({
          code: 'order-conflict',
          message: 'Task order changed. Refresh and choose a destination again.',
          current,
        });
      await closing(tx, row, project, current, status, acknowledgment);
      if (
        beforeTaskId !== null &&
        (beforeTaskId === taskId ||
          !(await tx.task.findFirst({
            where: { workspaceId, projectId, id: beforeTaskId, status, archivedAt: null },
            select: { id: true },
          })))
      )
        throw new BadRequestException('Invalid move anchor.');
      const rank = await allocateTaskRank(tx, workspaceId, projectId, status, beforeTaskId, taskId);
      const updated = await tx.task.update({
        where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } },
        data: { status, rank },
      });
      return reads.taskView(tx, updated, project, true);
    },
  );
}

export function changeVisibility(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = object(
    payload,
    ['expectedVersion', 'visibility'],
    ['expectedVersion', 'visibility'],
  );
  const version = expected(input['expectedVersion']);
  if (
    typeof input['visibility'] !== 'string' ||
    !['workspace', 'private'].includes(input['visibility'])
  )
    throw new BadRequestException('Invalid project visibility.');
  const visibility = input['visibility'] as 'workspace' | 'private';
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    'change-visibility',
    [projectId],
    { expectedVersion: version, visibility },
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      const current = await reads.projectView(tx, project, true, actor);
      conflict(current, version);
      if (project.archivedAt) archived(current);
      const row = await tx.project.update({
        where: { workspaceId_id: { workspaceId, id: projectId } },
        data: { visibility, version: { increment: 1 } },
      });
      return reads.projectView(tx, row, true, actor);
    },
    true,
  );
}

export function changeAccess(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  principalId: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = object(payload, ['expectedVersion', 'state'], ['expectedVersion', 'state']);
  const version = expected(input['expectedVersion']);
  if (
    !identifier(principalId) ||
    typeof input['state'] !== 'string' ||
    !['active', 'revoked'].includes(input['state'])
  )
    throw new BadRequestException('Invalid project access.');
  const state = input['state'] as 'active' | 'revoked';
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    'change-access',
    [projectId, principalId],
    { expectedVersion: version, state },
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      const current = await reads.projectView(tx, project, true, actor);
      const member = await reads.accessMember(tx, project, principalId);
      if (version !== current.version)
        throw new ConflictException({
          code: 'version-conflict',
          message: 'Project access changed. Review the current target access before saving again.',
          current,
          accessCurrent: member,
        });
      if (state === 'active' && project.archivedAt) archived(current);
      if (state === 'active') await principals.assertAssignable(tx, workspaceId, principalId);
      await tx.projectAccess.upsert({
        where: { workspaceId_projectId_principalId: { workspaceId, projectId, principalId } },
        create: { workspaceId, projectId, principalId, state },
        update: { state },
      });
      // The access trigger advances the aggregate version in this transaction.
      return reads.projectView(
        tx,
        await reads.projectRow(tx, workspaceId, projectId, actor),
        true,
        actor,
      );
    },
    true,
  );
}

export function createProject(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = object(payload, ['name', 'key', 'description', 'visibility'], ['name', 'key']);
  const name = text(input['name'], 200, true);
  const description = text(input['description'] ?? '', 20000);
  if (
    typeof input['key'] !== 'string' ||
    !/^[A-Z][A-Z0-9]{1,9}$/.test(input['key']) ||
    ('visibility' in input &&
      (typeof input['visibility'] !== 'string' ||
        !['workspace', 'private'].includes(input['visibility'])))
  )
    throw new BadRequestException(
      'Use a 2–10 character uppercase project key and valid visibility.',
    );
  const projectKey = input['key'];
  const visibility = input['visibility'] === 'private' ? 'private' : 'workspace';
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    'create-project',
    [],
    { name, key: projectKey, description, visibility },
    async (tx, actor) => {
      const row = await tx.project.create({
        data: {
          id: randomUUID(),
          workspaceId,
          name,
          key: projectKey,
          description,
          visibility,
          ...attribution(actor),
        },
      });
      return reads.projectView(tx, row, true, actor);
    },
    visibility === 'private',
  );
}

export function changeProject(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  key: string,
  requestId: string,
  action: 'edit-project' | 'archive-project' | 'restore-project',
  payload: unknown,
) {
  const input = object(
    payload,
    action === 'edit-project' ? ['expectedVersion', 'name', 'description'] : ['expectedVersion'],
    ['expectedVersion'],
  );
  const version = expected(input['expectedVersion']);
  const patch =
    action === 'edit-project'
      ? { name: text(input['name'], 200, true), description: text(input['description'], 20000) }
      : { archivedAt: action === 'archive-project' ? new Date() : null };
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    action,
    [projectId],
    action === 'edit-project'
      ? { expectedVersion: version, ...patch }
      : { expectedVersion: version },
    async (tx, actor) => {
      const row = await reads.projectRow(tx, workspaceId, projectId, actor);
      const current = await reads.projectView(tx, row, true, actor);
      conflict(current, version);
      if (action !== 'restore-project' && row.archivedAt) archived(current);
      if (action === 'restore-project' && !row.archivedAt)
        throw new ConflictException({
          code: 'archived',
          message: 'Project is already active.',
          current,
        });
      return reads.projectView(
        tx,
        await tx.project.update({
          where: { workspaceId_id: { workspaceId, id: projectId } },
          data: { ...patch, version: { increment: 1 } },
        }),
        true,
        actor,
      );
    },
  );
}

export function createTask(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  key: string,
  requestId: string,
  payload: unknown,
) {
  const input = object(
    payload,
    [...taskProperties, 'parentTaskId', 'expectedParentVersion'],
    ['title'],
  );
  const fields = taskFields(input, true);
  const parentTaskId = input['parentTaskId'];
  if (
    (parentTaskId !== undefined && !identifier(parentTaskId)) ||
    (parentTaskId === undefined && 'expectedParentVersion' in input)
  )
    throw new BadRequestException('Invalid parent task.');
  const parentVersion =
    parentTaskId === undefined ? undefined : expected(input['expectedParentVersion']);
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    'create-task',
    [projectId],
    {
      ...fields,
      ...(parentTaskId ? { parentTaskId, expectedParentVersion: parentVersion } : {}),
    },
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      if (project.archivedAt) archived(await reads.projectView(tx, project, true, actor));
      if (fields.assigneePrincipalId)
        await assertAssignable(principals, tx, project, fields.assigneePrincipalId);
      if (parentTaskId)
        await assertParent(tx, workspaceId, projectId, parentTaskId as string, parentVersion!);
      const row = await tx.task.create({
        data: {
          id: randomUUID(),
          workspaceId,
          projectId,
          number: 1,
          ...fields,
          ...(parentTaskId ? { parentTaskId: parentTaskId as string } : {}),
          title: fields.title!,
          ...attribution(actor),
        },
      });
      return reads.taskView(tx, row, project, true);
    },
  );
}

export function changeTask(
  principals: PrincipalService,
  context: VerifiedExecution,
  workspaceId: string,
  projectId: string,
  taskId: string,
  key: string,
  requestId: string,
  action: 'edit-task' | 'archive-task' | 'restore-task',
  payload: unknown,
) {
  const input = object(
    payload,
    action === 'edit-task'
      ? ['expectedVersion', 'acknowledgedChildrenVersion', ...taskProperties]
      : ['expectedVersion'],
    ['expectedVersion'],
  );
  const version = expected(input['expectedVersion']);
  const acknowledgment =
    'acknowledgedChildrenVersion' in input
      ? expected(input['acknowledgedChildrenVersion'])
      : undefined;
  const properties = Object.fromEntries(
    Object.entries(input).filter(
      ([field]) => !['expectedVersion', 'acknowledgedChildrenVersion'].includes(field),
    ),
  );
  const fields =
    action === 'edit-task'
      ? taskFields(properties, false)
      : { archivedAt: action === 'archive-task' ? new Date() : null };
  if (action === 'edit-task' && !Object.keys(fields).length)
    throw new BadRequestException('A task change is required.');
  return mutateProjectTask(
    principals,
    context,
    workspaceId,
    key,
    requestId,
    action,
    [projectId, taskId],
    action === 'edit-task'
      ? {
          expectedVersion: version,
          ...fields,
          ...(acknowledgment ? { acknowledgedChildrenVersion: acknowledgment } : {}),
        }
      : { expectedVersion: version },
    async (tx, actor) => {
      const project = await reads.projectRow(tx, workspaceId, projectId, actor);
      const row = await reads.taskRow(tx, workspaceId, projectId, taskId);
      const current = await reads.taskView(tx, row, project, true);
      conflict(current, version);
      if (project.archivedAt || (action !== 'restore-task' && row.archivedAt)) archived(current);
      if (action === 'restore-task' && !row.archivedAt)
        throw new ConflictException({
          code: 'archived',
          message: 'Task is already active.',
          current,
        });
      if (
        'assigneePrincipalId' in fields &&
        fields.assigneePrincipalId &&
        fields.assigneePrincipalId !== row.assigneePrincipalId
      )
        await assertAssignable(principals, tx, project, fields.assigneePrincipalId);
      await closing(
        tx,
        row,
        project,
        current,
        'status' in fields ? fields.status : undefined,
        acknowledgment,
      );
      const position =
        'status' in fields && fields.status !== row.status
          ? {
              rank: await allocateTaskRank(
                tx,
                workspaceId,
                projectId,
                fields.status!,
                null,
                taskId,
              ),
            }
          : {};
      return reads.taskView(
        tx,
        await tx.task.update({
          where: { workspaceId_projectId_id: { workspaceId, projectId, id: taskId } },
          data: { ...fields, ...position },
        }),
        project,
        true,
      );
    },
  );
}
