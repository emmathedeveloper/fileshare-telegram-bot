import { sendMessage } from "../../lib/helpers.ts";
import { TelegramUpdate } from "../../lib/types.ts";
import WebhookHandler from "../../lib/webhook_handler.ts";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      const data: TelegramUpdate = await ctx.req.json().catch(() => null);

      // console.log(data);

      //check if there is a payload
      if (!data) throw new Error("Invalid payload");

      const { message, callback_query } = data;

      if (message) {
        return await WebhookHandler.HandlePrivateMessage(message);
      }

      if (callback_query) {
        return await WebhookHandler.HandleCallbackQuery(callback_query);
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
