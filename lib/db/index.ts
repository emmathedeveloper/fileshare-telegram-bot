import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schemas.ts";

export const db = drizzle(Deno.env.get("DATABASE_URL")! , {
    schema,
});