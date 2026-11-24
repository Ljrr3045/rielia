import { z } from 'zod';
import { healthResponseSchema, type HealthResponse } from './infrastructure-schemas.js';
import {
  pageSchema,
  workspaceInvitationSchema,
  workspaceMemberSchema,
  workspaceSummarySchema,
  type Page,
  type WorkspaceInvitation,
  type WorkspaceMember,
  type WorkspaceSummary,
} from './workspace-schemas.js';

export * from './infrastructure-schemas.js';
export * from './identity-schemas.js';
export * from './principal-schemas.js';
export * from './workspace-schemas.js';
export * from './project-tasks.js';
export * from './task-collaboration.js';

export function isHealthResponse(value: unknown): value is HealthResponse {
  return healthResponseSchema.safeParse(value).success;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isWorkspaceSummary(value: unknown): value is WorkspaceSummary {
  return workspaceSummarySchema.safeParse(value).success;
}
export function isWorkspaceMember(value: unknown): value is WorkspaceMember {
  return workspaceMemberSchema.safeParse(value).success;
}
export function isWorkspaceInvitation(value: unknown): value is WorkspaceInvitation {
  return workspaceInvitationSchema.safeParse(value).success;
}
export function isPage<T>(value: unknown, item: (value: unknown) => value is T): value is Page<T> {
  return pageSchema(z.custom<T>((candidate) => item(candidate))).safeParse(value).success;
}
export * from './task-discovery.js';
export * from './sprints.js';
export * from './task-planning.js';
export * from './sprint-closure.js';
