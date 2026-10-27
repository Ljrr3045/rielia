import { PgBoss } from 'pg-boss';
import type pg from 'pg';
import { DIAGNOSTIC_QUEUE, QUEUE_SCHEMA } from './database.js';

export const diagnosticPayload = { kind: 'runtime-probe', version: 1 } as const;

export function isDiagnosticPayload(data: unknown): boolean {
  return typeof data === 'object' && data !== null
    && Object.keys(data).length === 2
    && 'kind' in data && data.kind === diagnosticPayload.kind
    && 'version' in data && data.version === diagnosticPayload.version;
}

export function diagnosticBoss(pool: pg.Pool, migrate = false, worker = false): PgBoss {
  const boss = new PgBoss({
    db: { executeSql: (text, values) => pool.query(text, values) }, schema: QUEUE_SCHEMA,
    migrate, createSchema: migrate, schedule: false, supervise: worker,
    registerInstance: worker, instanceName: 'rielia-diagnostic-worker',
    reindex: false,
  });
  boss.on('error', () => console.error('Diagnostic queue operation failed; check database availability.'));
  return boss;
}

export async function installDiagnosticQueue(boss: PgBoss): Promise<void> {
  await boss.createQueue(DIAGNOSTIC_QUEUE, {
    retryLimit: 2, retryDelay: 1, expireInSeconds: 30,
    retentionSeconds: 86400, deleteAfterSeconds: 86400,
  });
}
