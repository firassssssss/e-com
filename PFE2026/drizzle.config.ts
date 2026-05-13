import type { Config } from 'drizzle-kit';

export default {
  schema: './src/infrastructure/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:admin@localhost:5432/cosmetica_db',
  },
  verbose: true,
  strict: true,
} satisfies Config;