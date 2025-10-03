import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schemas.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL")!,
  },
});
