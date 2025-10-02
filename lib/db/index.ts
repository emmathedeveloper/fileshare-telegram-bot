import { drizzle } from 'drizzle-orm/neon-http';

export const db = drizzle(Deno.env.get("DATABASE_URL")!);