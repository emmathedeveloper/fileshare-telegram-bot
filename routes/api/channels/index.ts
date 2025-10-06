import { desc, eq } from "drizzle-orm";
import { db } from "../../../lib/db/index.ts";
import { registered_channels } from "../../../lib/db/schemas.ts";
import { define } from "../../../utils.ts";


export const handler = define.handlers({
  GET: async () => {
    try {
      const channels = await db.select().from(registered_channels).orderBy(desc(registered_channels.added_at));

      return new Response(JSON.stringify(channels), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },

  POST: async (ctx) => {
    try {
      const data: { channel_id: string } = await ctx.req
        .json()
        .catch(() => null);

      if (!data || !data.channel_id) {
        return new Response("Invalid payload", { status: 400 });
      }

      //check if the channel is already registered
      const [existing_channel] = await db
        .select()
        .from(registered_channels)
        .where(eq(registered_channels.channel_id, data.channel_id))
        .limit(1);

      if (existing_channel) {
        return new Response("Channel already registered", { status: 400 });
      }

      const [new_channel] = await db
        .insert(registered_channels)
        .values({ channel_id: data.channel_id })
        .returning();

      return new Response(JSON.stringify(new_channel), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
});