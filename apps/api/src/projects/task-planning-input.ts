import { BadRequestException } from '@nestjs/common';
import {
  estimateTaskInputSchema,
  startSprintInputSchema,
  setTaskSprintInputSchema,
  estimatePointsSchema,
  discoveryIdentifierSchema,
} from '@rielia/contracts';
import { object, expected } from './project-task-input.js';

export function estimateTaskInput(payload: unknown) {
  const fields = Object.keys(estimateTaskInputSchema.shape);
  const input = object(payload, fields, fields);
  if (!estimatePointsSchema.safeParse(input['estimatePoints']).success)
    throw new BadRequestException('Invalid estimate.');
  expected(input['expectedVersion']);
  return estimateTaskInputSchema.parse(input);
}
export function startSprintInput(payload: unknown) {
  const fields = Object.keys(startSprintInputSchema.shape);
  const input = object(payload, fields, fields);
  expected(input['expectedVersion']);
  expected(input['expectedProjectVersion']);
  expected(input['expectedTaskRevision']);
  return startSprintInputSchema.parse(input);
}
export function setTaskSprintInput(payload: unknown) {
  const fields = Object.keys(setTaskSprintInputSchema.shape);
  const input = object(payload, fields, fields);
  if (
    !discoveryIdentifierSchema.nullable().safeParse(input['expectedCurrentParticipationId'])
      .success ||
    !discoveryIdentifierSchema.nullable().safeParse(input['targetSprintId']).success
  )
    throw new BadRequestException('Invalid sprint participation.');
  expected(input['expectedTaskVersion']);
  if (input['expectedSourceVersion'] !== null) expected(input['expectedSourceVersion']);
  if (input['expectedTargetVersion'] !== null) expected(input['expectedTargetVersion']);
  const result = setTaskSprintInputSchema.safeParse(input);
  if (!result.success)
    throw new BadRequestException(
      'Sprint versions must match the explicit source and destination.',
    );
  return result.data;
}
