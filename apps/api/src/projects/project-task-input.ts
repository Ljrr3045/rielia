import { BadRequestException } from '@nestjs/common';
import { taskTypes, taskPriorities, taskStatuses } from '@rielia/contracts';

export const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function object(
  value: unknown,
  allowed: string[],
  required: string[] = [],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    required.some((key) => !(key in value))
  )
    throw new BadRequestException('Invalid project/task request.');
  return { ...(value as Record<string, unknown>) };
}
export function text(value: unknown, limit: number, required = false): string {
  if (
    typeof value !== 'string' ||
    value.includes('\0') ||
    value.length > limit ||
    (required && (!value.trim() || /[\r\n\t]/.test(value)))
  )
    throw new BadRequestException('Invalid text.');
  return required ? value.trim() : value;
}
export function expected(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1)
    throw new BadRequestException('A positive expectedVersion is required.');
  return Number(value);
}
export function taskFields(input: Record<string, unknown>, create: boolean) {
  const result: {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    status?: string;
    assigneePrincipalId?: string | null;
    dueDate?: Date | null;
  } = {};
  if (create || 'title' in input) result.title = text(input['title'], 300, true);
  if (create || 'description' in input)
    result.description = text(input['description'] ?? (create ? '' : undefined), 20000);
  for (const [key, choices, fallback] of [
    ['type', taskTypes, 'task'],
    ['priority', taskPriorities, 'none'],
    ['status', taskStatuses, 'backlog'],
  ] as const) {
    if (create || key in input) {
      const value = input[key] === undefined && create ? fallback : input[key];
      if (typeof value !== 'string' || !(choices as readonly string[]).includes(value))
        throw new BadRequestException('Invalid task property.');
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
      if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith('0000')
      )
        throw new BadRequestException('Invalid date-only due date.');
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
        throw new BadRequestException('Invalid date-only due date.');
      result.dueDate = date;
    }
  }
  return result;
}
export const taskProperties = [
  'title',
  'description',
  'type',
  'priority',
  'status',
  'assigneePrincipalId',
  'dueDate',
];

export function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
