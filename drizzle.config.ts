import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  introspect: {
    casing: 'camel',
  },
  schemaFilter: ['public'], // Only manage the public schema
} satisfies Config;


