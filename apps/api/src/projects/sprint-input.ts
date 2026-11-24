import { BadRequestException } from '@nestjs/common';
import {
  configurePlanningInputSchema,
  createSprintInputSchema,
  editSprintInputSchema,
  planningSettingsSchema,
  sprintFieldsSchema,
} from '@rielia/contracts';
import { object } from './project-task-input.js';
import { sprintMidnight } from './sprint-policy.js';

export function planningInput(payload: unknown) {
  const input = object(payload, Object.keys(configurePlanningInputSchema.shape), [
    'expectedVersion',
  ]);
  const settings = {
    mode: input['mode'],
    timeZone: input['timeZone'],
    pointScale: input['pointScale'],
  };
  if (!planningSettingsSchema.safeParse(settings).success)
    throw new BadRequestException('Invalid planning settings.');
  const parsed = configurePlanningInputSchema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('A positive expectedVersion is required.');
  return parsed.data;
}
export function sprintInput(payload: unknown, create: boolean) {
  const versionKey = create ? 'expectedProjectVersion' : 'expectedVersion';
  const schema = create ? createSprintInputSchema : editSprintInputSchema;
  const input = object(payload, Object.keys(schema.shape), [versionKey]);
  const fields = sprintFieldsSchema.safeParse({
    name: input['name'],
    goal: input['goal'],
    startDate: input['startDate'],
    endDateExclusive: input['endDateExclusive'],
  });
  if (!fields.success)
    throw new BadRequestException('Invalid sprint name, goal or exclusive date interval.');
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new BadRequestException('A positive expectedVersion is required.');
  return {
    version:
      'expectedProjectVersion' in parsed.data
        ? parsed.data.expectedProjectVersion
        : parsed.data.expectedVersion,
    fields: fields.data,
  };
}
export function sprintInterval(startDate: string, endDateExclusive: string, timeZone: string) {
  try {
    const startsAt = sprintMidnight(startDate, timeZone);
    const endsAt = sprintMidnight(endDateExclusive, timeZone);
    if (startsAt >= endsAt || startsAt.getUTCFullYear() < 1 || endsAt.getUTCFullYear() > 9999)
      throw new Error('Invalid or unsupported UTC interval.');
    return { startsAt, endsAt };
  } catch {
    throw new BadRequestException(
      'Sprint midnights must be unambiguous and remain within UTC years 0001–9999.',
    );
  }
}
