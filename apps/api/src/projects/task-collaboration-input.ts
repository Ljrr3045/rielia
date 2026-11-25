import { BadRequestException } from '@nestjs/common';
import {
  collaborationActionSchema,
  collaborationInputSchemas,
  checklistTextInputSchema,
  commentTextInputSchema,
  commentBodyInputSchema,
  discoveryIdentifierSchema,
  moveChecklistItemInputSchema,
} from '@rielia/contracts';
import { object, expected } from './project-task-input.js';

function parse<T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
  value: unknown,
  message: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(message);
  return result.data;
}
export function collaborationInput(action: string, payload: unknown, itemId?: string) {
  const operation = collaborationActionSchema.safeParse(action);
  if (
    !operation.success ||
    ([
      'edit-checklist-item',
      'move-checklist-item',
      'remove-checklist-item',
      'edit-comment',
    ].includes(action) &&
      !discoveryIdentifierSchema.safeParse(itemId).success)
  )
    throw new BadRequestException('Invalid collaboration operation.');
  const schema = collaborationInputSchemas[operation.data];
  const input = object(payload, Object.keys(schema.shape), ['expectedVersion']);
  expected(input['expectedVersion']);
  if ('text' in input)
    input['text'] = parse(checklistTextInputSchema, input['text'], 'Invalid text.');
  if (action.endsWith('comment')) {
    parse(commentTextInputSchema, input['body'], 'Invalid text.');
    input['body'] = parse(commentBodyInputSchema, input['body'], 'A comment is required.');
    if (action === 'edit-comment') expected(input['expectedCommentVersion']);
  }
  if (
    (action === 'add-checklist-item' && !('text' in input)) ||
    (action === 'edit-checklist-item' && !('text' in input || 'completed' in input)) ||
    ('completed' in input && typeof input['completed'] !== 'boolean')
  )
    throw new BadRequestException('Invalid checklist change.');
  if (action === 'add-checklist-item' || action === 'move-checklist-item')
    parse(
      moveChecklistItemInputSchema.shape.beforeItemId,
      input['beforeItemId'],
      'Invalid checklist destination.',
    );
  if (action === 'set-task-parent') {
    if (
      (input['parentTaskId'] !== null &&
        !discoveryIdentifierSchema.safeParse(input['parentTaskId']).success) ||
      (input['parentTaskId'] === null && 'expectedParentVersion' in input)
    )
      throw new BadRequestException('Invalid parent task.');
    if (input['parentTaskId']) expected(input['expectedParentVersion']);
  }
  // Staged checks above preserve historical error precedence and normalization;
  // the selected strict schema remains the complete request shape authority.
  if (!schema.safeParse(input).success)
    throw new BadRequestException('Invalid project/task request.');
  if (itemId) input['itemId'] = itemId;
  return input;
}
