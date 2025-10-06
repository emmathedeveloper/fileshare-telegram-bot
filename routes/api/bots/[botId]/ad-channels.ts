import { and, eq } from "drizzle-orm";
import { db } from "../../../../lib/db/index.ts";
import { bot_channels, bots } from "../../../../lib/db/schemas.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  GET: async (ctx) => {
    try {
      const bot_id = ctx.params.botId;

      const bot = await db.query.bots.findFirst({
        where: eq(bots.id, bot_id),
        with: {
          bot_channels: {
            with: {
              channel: true,
            },
          },
        },
      });

      if (!bot) {
        return new Response("Bot not found", { status: 404 });
      }

      const connected_channels = bot.bot_channels.map((bc) => bc.channel);

      return new Response(JSON.stringify(connected_channels), {
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
      const bot_id = ctx.params.botId;

      const data: { channel_id: string } = await ctx.req
        .json()
        .catch(() => null);

      if (!data || !data.channel_id) {
        return new Response("Invalid payload", { status: 400 });
      }

      const [bot] = await db.select().from(bots).where(eq(bots.id, bot_id));

      if (!bot) {
        return new Response("Bot not found", { status: 404 });
      }

      //check if the channel is already connected to the bot
      const existing_relation = await db
        .select()
        .from(bot_channels)
        .where(
          and(
            eq(bot_channels.bot_id, bot_id),
            eq(bot_channels.channel_id, data.channel_id),
          ),
        )
        .limit(1);

      if (existing_relation.length > 0) {
        return new Response("Channel already connected to the bot", {
          status: 400,
        });
      }

      //connect the channel to the bot
      await db.insert(bot_channels).values({
        bot_id: bot_id,
        channel_id: data.channel_id,
      });

      return new Response("Channel connected to the bot", { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
  DELETE: async (ctx) => {
    try {
      const bot_id = ctx.params.botId;

      const data: { channel_id: string } = await ctx.req
        .json()
        .catch(() => null);

      if (!data || !data.channel_id) {
        return new Response("Invalid payload", { status: 400 });
      }

      await db.delete(bot_channels).where(
        and(
          eq(bot_channels.bot_id, bot_id),
          eq(bot_channels.channel_id , data.channel_id)
        )
      );

      return new Response("Channel disconnect from bot", { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
});
