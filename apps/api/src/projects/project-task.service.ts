import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  isTaskFilters,
  type TaskFilters,
  type TaskPage,
  type ArchiveView,
  type ExecutionContextResponse,
  type Task,
  type ProjectAccessPage,
  type ProjectAssigneePage,
  type ProjectAccessReview,
  type TaskDiscoveryItem,
} from '@rielia/contracts';
import type { Project as ProjectRow, Task as TaskRow } from '../generated/prisma/client.js';
import {
  PrincipalService,
  type Transaction,
  type VerifiedExecution,
} from '../principals/principal.service.js';
import { identifier, canonical } from './project-task-input.js';
import type { ReadableTaskProject } from './project-task-dto.js';
import * as reads from './project-task-read.js';
import * as commands from './project-task-command.js';
export type { ReadableTaskProject } from './project-task-dto.js';

@Injectable()
export class ProjectTaskService {
  constructor(@Inject(PrincipalService) private readonly principals: PrincipalService) {}

  projects(
    context: VerifiedExecution,
    workspaceId: string,
    view: ArchiveView = 'active',
    cursor?: string,
  ) {
    if (cursor !== undefined && !identifier(cursor))
      throw new BadRequestException('Invalid page cursor.');
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) => reads.projects(tx, actor, canWrite, workspaceId, view, cursor),
    );
  }

  project(context: VerifiedExecution, workspaceId: string, projectId: string) {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) => reads.project(tx, actor, canWrite, workspaceId, projectId),
    );
  }

  /** Internal discovery composition; one current fenced authority snapshot,
   * with the exact same readable-project predicate used by detail and writes. */
  discoveryRead<T>(
    context: VerifiedExecution,
    workspaceId: string,
    work: (
      tx: Transaction,
      actor: ExecutionContextResponse,
      canWrite: boolean,
      projects: ReadableTaskProject[],
    ) => Promise<T>,
  ) {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) => reads.discoveryRead(tx, actor, canWrite, work),
    );
  }

  /** Events need only current project IDs and policy versions; keep the same
   * authorization predicate and one-second reevaluation without an access cache. */
  eventsRead<T>(
    context: VerifiedExecution,
    workspaceId: string,
    work: (
      tx: Transaction,
      actor: ExecutionContextResponse,
      canWrite: boolean,
      projects: Pick<ProjectRow, 'id' | 'version'>[],
    ) => Promise<T>,
  ) {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) => reads.eventsRead(tx, actor, canWrite, work),
    );
  }

  async discoveryItems(
    tx: Transaction,
    rows: TaskRow[],
    projects: ReadableTaskProject[],
    canWrite: boolean,
  ): Promise<TaskDiscoveryItem[]> {
    return reads.discoveryItems(tx, rows, projects, canWrite);
  }

  tasks(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    view: ArchiveView = 'active',
    cursor?: string,
    filters: TaskFilters = {},
  ): Promise<TaskPage> {
    if (!isTaskFilters(filters)) throw new BadRequestException('Invalid task filters.');
    const normalized = canonical(filters);
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) =>
        reads.tasks(tx, actor, canWrite, workspaceId, projectId, view, cursor, filters, normalized),
    );
  }

  task(context: VerifiedExecution, workspaceId: string, projectId: string, taskId: string) {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) =>
        reads.task(tx, actor, canWrite, workspaceId, projectId, taskId),
    );
  }

  /** Internal composition seam: collaborators share current project policy and
   * the same fenced transaction, never reuse a DTO as authority. */
  collaborationRead<T>(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    taskId: string,
    work: (
      tx: Transaction,
      actor: ExecutionContextResponse,
      canWrite: boolean,
      project: ProjectRow,
      task: TaskRow,
      view: () => Promise<Task>,
    ) => Promise<T>,
  ) {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) =>
        reads.collaborationRead(tx, actor, canWrite, workspaceId, projectId, taskId, work),
    );
  }

  collaborationMutation(
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
    return commands.collaborationMutation(
      this.principals,
      context,
      workspaceId,
      projectId,
      taskId,
      key,
      requestId,
      action,
      input,
      work,
    );
  }

  async assertParent(
    tx: Transaction,
    workspaceId: string,
    projectId: string,
    parentTaskId: string,
    version: number,
    taskId?: string,
  ) {
    return commands.assertParent(tx, workspaceId, projectId, parentTaskId, version, taskId);
  }

  moveTask(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    taskId: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    return commands.moveTask(
      this.principals,
      context,
      workspaceId,
      projectId,
      taskId,
      key,
      requestId,
      payload,
    );
  }

  accessReview(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    principalId: string,
  ): Promise<ProjectAccessReview> {
    return this.principals.domainOperation(
      context,
      workspaceId,
      'read',
      async (tx, actor, canWrite) =>
        reads.accessReview(tx, actor, canWrite, workspaceId, projectId, principalId),
    );
  }

  access(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    cursor?: string,
  ): Promise<ProjectAccessPage> {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor) =>
      reads.access(tx, actor, workspaceId, projectId, cursor),
    );
  }

  assignees(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    cursor?: string,
  ): Promise<ProjectAssigneePage> {
    return this.principals.domainOperation(context, workspaceId, 'read', async (tx, actor) =>
      reads.assignees(tx, actor, workspaceId, projectId, cursor),
    );
  }

  changeVisibility(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    return commands.changeVisibility(
      this.principals,
      context,
      workspaceId,
      projectId,
      key,
      requestId,
      payload,
    );
  }

  changeAccess(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    principalId: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    return commands.changeAccess(
      this.principals,
      context,
      workspaceId,
      projectId,
      principalId,
      key,
      requestId,
      payload,
    );
  }

  createProject(
    context: VerifiedExecution,
    workspaceId: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    return commands.createProject(this.principals, context, workspaceId, key, requestId, payload);
  }

  changeProject(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    key: string,
    requestId: string,
    action: 'edit-project' | 'archive-project' | 'restore-project',
    payload: unknown,
  ) {
    return commands.changeProject(
      this.principals,
      context,
      workspaceId,
      projectId,
      key,
      requestId,
      action,
      payload,
    );
  }

  createTask(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    key: string,
    requestId: string,
    payload: unknown,
  ) {
    return commands.createTask(
      this.principals,
      context,
      workspaceId,
      projectId,
      key,
      requestId,
      payload,
    );
  }

  changeTask(
    context: VerifiedExecution,
    workspaceId: string,
    projectId: string,
    taskId: string,
    key: string,
    requestId: string,
    action: 'edit-task' | 'archive-task' | 'restore-task',
    payload: unknown,
  ) {
    return commands.changeTask(
      this.principals,
      context,
      workspaceId,
      projectId,
      taskId,
      key,
      requestId,
      action,
      payload,
    );
  }
}
