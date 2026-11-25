import { BadRequestException } from '@nestjs/common';
import { closeSprintInputSchema } from '@rielia/contracts';
import { object } from './project-task-input.js';

export function closeSprintInput(payload: unknown) {
  const fields = Object.keys(closeSprintInputSchema.shape);
  const input = object(payload, fields, fields);
  const result = closeSprintInputSchema.safeParse(input);
  if (!result.success) throw new BadRequestException('Invalid sprint closing request.');
  // Keep the existing object copy, including ignored enumerable symbol keys.
  return { ...input, ...result.data };
}
