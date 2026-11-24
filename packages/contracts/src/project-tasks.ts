/** Bounded project/task domain. No configurable workflow is implied. */
import type { CreateTaskFields, TaskCollaborationCommand } from './task-collaboration.js';
import {
  domainPersonSchema,
  projectSchema,
  projectAccessMemberSchema,
  taskSchema,
  taskPageSchema,
  taskFiltersSchema,
  type DomainPerson,
  type Project,
  type ProjectAccessMember,
  type Task,
  type TaskPage,
  type TaskFields,
  type TaskFilters,
  type TaskStatus,
  type ProjectVisibility,
  projectPageSchema,
  projectAccessPageSchema,
  projectAccessReviewSchema,
  projectAssigneePageSchema,
  type DomainPage,
  type ProjectAccessPage,
  type ProjectAccessReview,
  type ProjectAssigneePage,
} from './project-task-schemas.js';
export * from './project-task-schemas.js';
export * from './project-task-input-schemas.js';
export interface TaskView {
  layout: 'list' | 'board';
  filters: TaskFilters;
  column: TaskStatus;
}
export type ProjectTaskCommand =
  | {
      type: 'create-project';
      workspaceId: string;
      name: string;
      key: string;
      description?: string;
      visibility?: ProjectVisibility;
    }
  | {
      type: 'edit-project';
      workspaceId: string;
      projectId: string;
      expectedVersion: number;
      name: string;
      description: string;
    }
  | {
      type: 'archive-project' | 'restore-project';
      workspaceId: string;
      projectId: string;
      expectedVersion: number;
    }
  | { type: 'create-task'; workspaceId: string; projectId: string; fields: CreateTaskFields }
  | {
      type: 'edit-task';
      workspaceId: string;
      projectId: string;
      taskId: string;
      expectedVersion: number;
      fields: Partial<TaskFields>;
      acknowledgedChildrenVersion?: number;
    }
  | {
      type: 'archive-task' | 'restore-task';
      workspaceId: string;
      projectId: string;
      taskId: string;
      expectedVersion: number;
    };
export interface ProjectMoveCommand {
  type: 'move-task';
  workspaceId: string;
  projectId: string;
  taskId: string;
  expectedVersion: number;
  expectedOrderVersion: number;
  status: TaskStatus;
  beforeTaskId: string | null;
  acknowledgedChildrenVersion?: number;
}
export type ProjectPolicyCommand =
  | {
      type: 'change-visibility';
      workspaceId: string;
      projectId: string;
      expectedVersion: number;
      visibility: ProjectVisibility;
    }
  | {
      type: 'change-access';
      workspaceId: string;
      projectId: string;
      expectedVersion: number;
      principalId: string;
      state: 'active' | 'revoked';
    };
export type ProjectCommand =
  ProjectTaskCommand | ProjectPolicyCommand | ProjectMoveCommand | TaskCollaborationCommand;
export type ProjectTaskResult = Project | Task;
export type ArchiveView = 'active' | 'archived';
export interface DomainConflict {
  code: 'version-conflict' | 'archived';
  message: string;
  current: ProjectTaskResult;
}
export function projectURL(workspaceId: string, projectId: string): string {
  return `/projects?workspace=${encodeURIComponent(workspaceId)}&project=${encodeURIComponent(projectId)}`;
}
export function taskURL(workspaceId: string, projectId: string, taskId: string): string {
  return `${projectURL(workspaceId, projectId)}&task=${encodeURIComponent(taskId)}`;
}

export function isTaskFilters(value: unknown): value is TaskFilters {
  return taskFiltersSchema.safeParse(value).success;
}
export function isDomainPerson(value: unknown): value is DomainPerson {
  return domainPersonSchema.safeParse(value).success;
}
export function isProject(value: unknown): value is Project {
  return projectSchema.safeParse(value).success;
}
export function isProjectAccessMember(value: unknown): value is ProjectAccessMember {
  return projectAccessMemberSchema.safeParse(value).success;
}
export function isTask(value: unknown): value is Task {
  return taskSchema.safeParse(value).success;
}
export function isTaskPage(value: unknown): value is TaskPage {
  return taskPageSchema.safeParse(value).success;
}
export function isProjectPage(value: unknown): value is DomainPage<Project> {
  return projectPageSchema.safeParse(value).success;
}
export function isProjectAccessPage(value: unknown): value is ProjectAccessPage {
  return projectAccessPageSchema.safeParse(value).success;
}
export function isProjectAccessReview(value: unknown): value is ProjectAccessReview {
  return projectAccessReviewSchema.safeParse(value).success;
}
export function isProjectAssigneePage(value: unknown): value is ProjectAssigneePage {
  return projectAssigneePageSchema.safeParse(value).success;
}
