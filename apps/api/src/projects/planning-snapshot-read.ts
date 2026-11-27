import { ServiceUnavailableException } from '@nestjs/common';
import { isPlanningSnapshot, type PlanningSnapshot } from '@rielia/contracts';

/** Validate frozen data without replacing it with current Task state or a parse copy. */
export function storedPlanningSnapshot(value: unknown): PlanningSnapshot {
  if (!isPlanningSnapshot(value))
    throw new ServiceUnavailableException('Planning snapshot is unavailable.');
  return value;
}
