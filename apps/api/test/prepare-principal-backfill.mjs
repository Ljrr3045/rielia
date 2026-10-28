import pg from 'pg';
import { readFile } from 'node:fs/promises';

// Only the disposable test DB: simulate an installation at the old migration.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(await readFile(new URL('../prisma/migrations/20261025000000_identity/migration.sql', import.meta.url), 'utf8'));
  await pool.query(`INSERT INTO "user"(id, name, email, "updatedAt") VALUES ('legacy-user', 'Existing Human', 'legacy@example.test', now())`);
} finally { await pool.end(); }
