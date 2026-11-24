import {
  discoveryIdentifierSchema,
  taskSearchSchema,
  taskDiscoveryQuerySchema,
  taskDiscoveryParametersSchema,
  taskDiscoveryPageSchema,
  taskInvalidationSchema,
  type TaskDiscoveryQuery,
  type TaskDiscoveryPage,
  type TaskInvalidation,
} from './task-discovery-schemas.js';
export * from './task-discovery-schemas.js';

export function discoveryIdentifier(value: unknown): value is string {
  return discoveryIdentifierSchema.safeParse(value).success;
}
export function isTaskSearch(value: unknown): value is string {
  return taskSearchSchema.safeParse(value).success;
}
export function isTaskDiscoveryQuery(value: unknown): value is TaskDiscoveryQuery {
  return taskDiscoveryQuerySchema.safeParse(value).success;
}
export function parseTaskDiscoveryQuery(
  params: Record<string, unknown>,
): TaskDiscoveryQuery | null {
  const result = taskDiscoveryParametersSchema.safeParse(params);
  return result.success ? result.data : null;
}
export function isTaskDiscoveryPage(value: unknown): value is TaskDiscoveryPage {
  return taskDiscoveryPageSchema.safeParse(value).success;
}
export function isTaskInvalidation(value: unknown): value is TaskInvalidation {
  return taskInvalidationSchema.safeParse(value).success;
}
