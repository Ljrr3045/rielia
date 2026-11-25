import { z } from 'zod';
import { projectTaskVersionSchema } from './project-task-input-schemas.js';
import { taskFiltersSchema } from './project-task-schemas.js';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import { collaborationCursorSchema } from './task-collaboration-schemas.js';
import { estimatePointsSchema } from './task-planning-schemas.js';

const version = projectTaskVersionSchema;
export const estimateTaskInputSchema = z.strictObject({
  expectedVersion: version,
  estimatePoints: estimatePointsSchema,
});
export const startSprintInputSchema = z.strictObject({
  expectedVersion: version,
  expectedProjectVersion: version,
  expectedTaskRevision: version,
});
export const setTaskSprintInputSchema = z
  .strictObject({
    expectedTaskVersion: version,
    expectedCurrentParticipationId: discoveryIdentifierSchema.nullable(),
    expectedSourceVersion: version.nullable(),
    targetSprintId: discoveryIdentifierSchema.nullable(),
    expectedTargetVersion: version.nullable(),
  })
  .refine(
    (value) =>
      (value.expectedCurrentParticipationId === null) === (value.expectedSourceVersion === null) &&
      (value.targetSprintId === null) === (value.expectedTargetVersion === null),
  );
// HTTP admission observes inherited fields before authority. Preserve the
// fallback's String(view) evaluation order; G04's stricter raw view admission is
// not interchangeable for non-JSON conversion exceptions on this boundary.
function planningQueryAdmission(paged: boolean) {
  const cursor = paged ? collaborationCursorSchema : discoveryIdentifierSchema;
  return z.unknown().refine((value) => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false;
    const query = value as Record<string, unknown>;
    return (
      Object.keys(query).every((key) => paged && key === 'cursor') &&
      (query['view'] === undefined ||
        (['active', 'archived'].includes(String(query['view'])) &&
          typeof query['view'] === 'string')) &&
      (query['cursor'] === undefined || cursor.safeParse(query['cursor']).success) &&
      (query['destination'] === undefined ||
        discoveryIdentifierSchema.safeParse(query['destination']).success) &&
      taskFiltersSchema.safeParse(
        Object.fromEntries(
          ['status', 'assignee', 'priority']
            .filter((key) => key in query)
            .map((key) => [key, query[key]]),
        ),
      ).success
    );
  });
}
export const planningPageHttpQuerySchema = planningQueryAdmission(true)
  .transform((value) => {
    const query = value as Record<string, unknown>;
    return 'cursor' in query ? { cursor: query['cursor'] } : {};
  })
  .pipe(z.strictObject({ cursor: collaborationCursorSchema.optional() }));
export const planningEmptyHttpQuerySchema = planningQueryAdmission(false)
  .transform(() => ({}))
  .pipe(z.strictObject({}));

export type EstimateTaskInput = z.input<typeof estimateTaskInputSchema>;
export type StartSprintInput = z.input<typeof startSprintInputSchema>;
export type SetTaskSprintInput = z.input<typeof setTaskSprintInputSchema>;
