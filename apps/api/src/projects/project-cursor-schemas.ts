import { z } from 'zod';
import { discoveryIdentifierSchema, isRecord, projectTaskVersionSchema } from '@rielia/contracts';

const identifier = discoveryIdentifierSchema;
const version = projectTaskVersionSchema;
const ordinaryString = z.string();

// Scope, filter/query equality, revisions and anchors remain owner decisions.
export const taskPageCursorSchema = z.strictObject({
  v: z.literal(1),
  w: ordinaryString,
  p: ordinaryString,
  view: ordinaryString,
  filters: z.unknown(),
  revision: version,
  anchor: identifier,
});
export const collaborationPageCursorSchema = z.strictObject({
  v: z.literal(1),
  w: ordinaryString,
  p: ordinaryString,
  t: ordinaryString,
  k: ordinaryString,
  r: version,
  a: identifier,
});
export const discoveryPageCursorSchema = z.strictObject({
  v: z.literal(1),
  w: ordinaryString,
  actor: ordinaryString,
  query: z.unknown(),
  revision: ordinaryString,
  anchor: ordinaryString,
});
export const sprintPageCursorSchema = z.strictObject({
  v: z.literal(1),
  w: ordinaryString,
  p: ordinaryString,
  revision: version,
  projectVersion: version,
  anchor: identifier,
});

// Count/anchor admission precedes scope, then EACH version's invalid/stale check.
// Requiring all version keys here would preempt an earlier stale-version409.
export const planningCursorAdmissionSchema = z
  .custom<Record<string, unknown>>(isRecord)
  .refine((value) => Object.keys(value).length === 11, { abort: true })
  .pipe(z.object({ a: identifier, o: z.string().regex(/^[0-9]{1,20}$/) }).catchall(z.unknown()));
export const planningCursorVersionSchema = version;

export const closingPageCursorSchema = z.strictObject({
  v: z.literal(1),
  binding: ordinaryString,
  anchor: identifier,
});
