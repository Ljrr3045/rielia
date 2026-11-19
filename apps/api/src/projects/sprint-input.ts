import { BadRequestException } from '@nestjs/common';
import { isPlanningSettings, isSprintFields } from '@rielia/contracts';
import { expected, object } from './project-task-input.js';
import { sprintMidnight } from './sprint-policy.js';

export function planningInput(payload: unknown) {
  const input = object(
    payload,
    ['expectedVersion', 'mode', 'timeZone', 'pointScale'],
    ['expectedVersion'],
  );
  const { expectedVersion, ...settings } = input;
  if (!isPlanningSettings(settings)) throw new BadRequestException('Invalid planning settings.');
  return {
    expectedVersion: expected(expectedVersion),
    ...settings,
    pointScale: [...settings.pointScale],
  };
}
export function sprintInput(payload: unknown, create: boolean) {
  const versionKey = create ? 'expectedProjectVersion' : 'expectedVersion';
  const input = object(
    payload,
    [versionKey, 'name', 'goal', 'startDate', 'endDateExclusive'],
    [versionKey],
  );
  const fields = {
    name: input['name'],
    goal: input['goal'],
    startDate: input['startDate'],
    endDateExclusive: input['endDateExclusive'],
  };
  if (!isSprintFields(fields))
    throw new BadRequestException('Invalid sprint name, goal or exclusive date interval.');
  return { version: expected(input[versionKey]), fields };
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
