import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db/index.ts";
import { bots } from "../../../../lib/db/schemas.ts";
import { TelegramUpdate } from "../../../../lib/types.ts";
import WebhookHandler from "../../../../lib/webhook_handler.ts";
import { define } from "../../../../utils.ts";
import { decrypt } from "../../../../lib/utils.ts";


export const handler = define.handlers({
  POST: async (ctx) => {
    try {
    
      const bot_id = ctx.params.botId;

      const data: TelegramUpdate = await ctx.req.json().catch(() => null);

      console.log(data);

      //check if there is a payload
      if (!data) throw new Error("Invalid payload");

      const { message, callback_query } = data;

      const bot = await db.query.bots.findFirst({
        where: eq(bots.id, bot_id),
      });

      if (!bot) {
        console.log("Bot not found");
        return new Response("Bot not found", { status: 404 });
      }

      const bot_token = await decrypt(
        bot.token,
        Deno.env.get("SECRET_KEY")!,
      );

      if (message) {
        return await WebhookHandler.HandlePrivateMessage(message , bot , bot_token);
      }

      if (callback_query) {
        return await WebhookHandler.HandleCallbackQuery(callback_query , bot , bot_token);
      }

      // prefer channel_post if exists (for channels), else use message (for private/group chats)
      // if (channel_post) {
      //   return await WebhookHandler.HandleChannelPost(channel_post);
      // }

      // if (message) {
      //   return await WebhookHandler.HandlePrivateMessage(message);
      // }

      return new Response("Webhook is running");
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
});
