import { z } from 'zod';
import { closeSprintBindingSchema } from './sprint-closure-schemas.js';
import { discoveryIdentifierSchema } from './task-discovery-schemas.js';
import { collaborationCursorSchema } from './task-collaboration-schemas.js';
import { taskFiltersSchema } from './project-task-schemas.js';

export const closeSprintInputSchema = closeSprintBindingSchema.strict();

// Preserve the HTTP fallback's inherited reads and String(view) exception order.
// Parsed query copies are not used to replace the original transport query.
export const sprintClosePreviewHttpQuerySchema = z
  .unknown()
  .refine((value) => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false;
    const query = value as Record<string, unknown>;
    return (
      Object.keys(query).every((key) => key === 'cursor' || key === 'destination') &&
      (query['view'] === undefined ||
        (['active', 'archived'].includes(String(query['view'])) &&
          typeof query['view'] === 'string')) &&
      (query['cursor'] === undefined ||
        collaborationCursorSchema.safeParse(query['cursor']).success) &&
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
  })
  .transform((value) => {
    const query = value as Record<string, unknown>;
    return {
      ...('cursor' in query ? { cursor: query['cursor'] } : {}),
      ...('destination' in query ? { destination: query['destination'] } : {}),
    };
  })
  .pipe(
    z.strictObject({
      cursor: collaborationCursorSchema.optional(),
      destination: discoveryIdentifierSchema.optional(),
    }),
  );
