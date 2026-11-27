import { z } from 'zod';

const enabledSchema = z.literal('true');
const connectionSchema = z.string().min(1);
const portSchema = z.number().int().min(1).max(65535);

export function localRuntimeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return enabledSchema.safeParse(env['LOCAL_RUNTIME_ENABLED']).success;
}

/** Diagnostic opt-in only: pg retains connection-string parsing, without trim. */
export function runtimeDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (localRuntimeEnabled(env)) {
    const connection = connectionSchema.safeParse(env['DATABASE_URL']);
    if (connection.success) return connection.data;
  }
  throw new Error('Local diagnostic runtime requires explicit enablement and DATABASE_URL.');
}

export function readApiPort(env: NodeJS.ProcessEnv = process.env): number {
  const port = portSchema.safeParse(Number(env['PORT'] ?? 3001));
  if (!port.success) throw new Error('PORT must be an integer between 1 and 65535.');
  return port.data;
}
