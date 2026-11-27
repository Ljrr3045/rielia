import { z } from 'zod';

export const diagnosticCommandSchema = z.tuple([
  z.enum(['enqueue', 'status', 'wait']),
  z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
]);
export type DiagnosticCommand = z.output<typeof diagnosticCommandSchema>;

function hasFields(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.prototype.propertyIsEnumerable.call(value, field))
  );
}

// Validate a known-field copy: ignored symbols/nonenumerable properties are not
// read, and a custom/null prototype cannot lend missing payload/result fields.
export const diagnosticPayloadSchema = z
  .unknown()
  .transform((value, context) => {
    if (!hasFields(value, ['kind', 'version'])) {
      context.addIssue({ code: 'custom', message: 'Invalid diagnostic payload fields.' });
      return z.NEVER;
    }
    return { kind: value['kind'], version: value['version'] };
  })
  .pipe(z.strictObject({ kind: z.literal('runtime-probe'), version: z.literal(1) }));
export const diagnosticResultSchema = z
  .unknown()
  .transform((value, context) => {
    if (!hasFields(value, ['diagnostic'])) {
      context.addIssue({ code: 'custom', message: 'Invalid diagnostic result fields.' });
      return z.NEVER;
    }
    return { diagnostic: value['diagnostic'] };
  })
  .pipe(z.strictObject({ diagnostic: z.literal('ok') }));
export type DiagnosticPayload = z.output<typeof diagnosticPayloadSchema>;
export type DiagnosticResult = z.output<typeof diagnosticResultSchema>;
export const diagnosticResult = { diagnostic: 'ok' } as const satisfies DiagnosticResult;

// Health historically consumes only at. Queue-age metadata and other extras
// remain ignored; parsing them would change the private heartbeat contract.
export const workerHeartbeatSchema = z.object({ at: z.number() });
export type WorkerHeartbeat = z.output<typeof workerHeartbeatSchema>;

export function isWorkerHeartbeatFresh(value: unknown, now: () => number = Date.now): boolean {
  const heartbeat = workerHeartbeatSchema.safeParse(value);
  return heartbeat.success && !(now() - heartbeat.data.at > 20000 || heartbeat.data.at > now());
}
