import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Generation needs no live DB; migration commands reject an absent URL.
  datasource: { url: process.env['DATABASE_URL'] ?? '' },
});
