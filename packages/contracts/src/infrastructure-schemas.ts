import { z } from 'zod';
import type { KnownFields } from './schema-types.js';

/** Process liveness only; neither database readiness nor authentication. */
export const healthResponseSchema = z.looseObject({
  status: z.literal('ok'),
  service: z.literal('rielia-api'),
});
export const readinessResponseSchema = z.looseObject({ status: z.literal('ready') });
export type HealthResponse = KnownFields<z.output<typeof healthResponseSchema>>;
export type ReadinessResponse = KnownFields<z.output<typeof readinessResponseSchema>>;
