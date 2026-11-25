import { BadRequestException } from '@nestjs/common';
import {
  changeProjectAccessInputSchema,
  changeProjectVisibilityInputSchema,
  createProjectInputSchema,
  createTaskFieldsInputSchema,
  createTaskInputSchema,
  editProjectInputSchema,
  editTaskInputSchema,
  moveTaskInputSchema,
  projectNameInputSchema,
  projectTaskDescriptionInputSchema,
  projectTaskVersionInputSchema,
  taskTitleInputSchema,
  taskTypeSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskProperties,
} from '@rielia/contracts';

export const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function object(
  value: unknown,
  allowed: string[],
  required: string[],
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
export function expected(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1)
    throw new BadRequestException('A positive expectedVersion is required.');
  return Number(value);
}
function parse<T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
  value: unknown,
  message: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(message);
  return result.data;
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
  if (create || 'title' in input)
    result.title = parse(taskTitleInputSchema, input['title'], 'Invalid text.');
  if (create || 'description' in input)
    result.description = parse(
      projectTaskDescriptionInputSchema,
      input['description'] ?? (create ? '' : undefined),
      'Invalid text.',
    );
  for (const [key, schema, fallback] of [
    ['type', taskTypeSchema, 'task'],
    ['priority', taskPrioritySchema, 'none'],
    ['status', taskStatusSchema, 'backlog'],
  ] as const) {
    if (create || key in input) {
      const value = input[key] === undefined && create ? fallback : input[key];
      result[key] = parse<string>(schema, value, 'Invalid task property.');
    }
  }
  if ('assigneePrincipalId' in input || create) {
    result.assigneePrincipalId = parse(
      createTaskFieldsInputSchema.shape.assigneePrincipalId,
      input['assigneePrincipalId'],
      'Invalid assignee.',
    );
  }
  if ('dueDate' in input || create) {
    const value = parse(
      createTaskFieldsInputSchema.shape.dueDate,
      input['dueDate'],
      'Invalid date-only due date.',
    );
    result.dueDate = value === null ? null : new Date(`${value}T00:00:00.000Z`);
  }
  return result;
}
export { taskProperties };

export function createProjectInput(payload: unknown) {
  const input = object(payload, Object.keys(createProjectInputSchema.shape), ['name', 'key']);
  parse(projectNameInputSchema, input['name'], 'Invalid text.');
  parse(projectTaskDescriptionInputSchema, input['description'] ?? '', 'Invalid text.');
  const result = parse(
    createProjectInputSchema,
    input,
    'Use a 2–10 character uppercase project key and valid visibility.',
  );
  return { ...result, visibility: result.visibility ?? 'workspace' };
}
export function changeProjectInput(payload: unknown, edit: boolean) {
  const schema = edit ? editProjectInputSchema : projectTaskVersionInputSchema;
  const input = object(payload, Object.keys(schema.shape), ['expectedVersion']);
  const version = expected(input['expectedVersion']);
  if (edit) {
    parse(projectNameInputSchema, input['name'], 'Invalid text.');
    parse(projectTaskDescriptionInputSchema, input['description'], 'Invalid text.');
    const result = parse(editProjectInputSchema, input, 'Invalid text.');
    return { version, fields: { name: result.name, description: result.description } };
  }
  parse(projectTaskVersionInputSchema, input, 'A positive expectedVersion is required.');
  return { version, fields: null };
}
export function visibilityInput(payload: unknown) {
  const input = object(payload, Object.keys(changeProjectVisibilityInputSchema.shape), [
    'expectedVersion',
    'visibility',
  ]);
  expected(input['expectedVersion']);
  return parse(changeProjectVisibilityInputSchema, input, 'Invalid project visibility.');
}
export function accessInput(payload: unknown, principalId: string) {
  const input = object(payload, Object.keys(changeProjectAccessInputSchema.shape), [
    'expectedVersion',
    'state',
  ]);
  expected(input['expectedVersion']);
  if (!identifier(principalId)) throw new BadRequestException('Invalid project access.');
  return parse(changeProjectAccessInputSchema, input, 'Invalid project access.');
}
export function createTaskInput(payload: unknown) {
  const input = object(payload, Object.keys(createTaskInputSchema.shape), ['title']);
  const fields = taskFields(input, true);
  const parentTaskId = input['parentTaskId'];
  if (
    (parentTaskId !== undefined && !identifier(parentTaskId)) ||
    (parentTaskId === undefined && 'expectedParentVersion' in input)
  )
    throw new BadRequestException('Invalid parent task.');
  const parentVersion =
    parentTaskId === undefined ? undefined : expected(input['expectedParentVersion']);
  const result = parse(createTaskInputSchema, input, 'Invalid parent task.');
  return { fields, parentTaskId: result.parentTaskId, parentVersion };
}
export function changeTaskInput(payload: unknown, edit: boolean) {
  const schema = edit ? editTaskInputSchema : projectTaskVersionInputSchema;
  const input = object(payload, Object.keys(schema.shape), ['expectedVersion']);
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
  const fields = edit ? taskFields(properties, false) : null;
  parse(schema, input, 'A task change is required.');
  return { version, acknowledgment, fields };
}
export function moveTaskInput(payload: unknown) {
  const input = object(payload, Object.keys(moveTaskInputSchema.shape), [
    'expectedVersion',
    'expectedOrderVersion',
    'status',
    'beforeTaskId',
  ]);
  expected(input['expectedVersion']);
  expected(input['expectedOrderVersion']);
  parse(
    moveTaskInputSchema.pick({ status: true, beforeTaskId: true }),
    {
      status: input['status'],
      beforeTaskId: input['beforeTaskId'],
    },
    'Invalid task move.',
  );
  if ('acknowledgedChildrenVersion' in input) expected(input['acknowledgedChildrenVersion']);
  return parse(moveTaskInputSchema, input, 'Invalid task move.');
}

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
