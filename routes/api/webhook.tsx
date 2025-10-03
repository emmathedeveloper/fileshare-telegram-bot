import { TelegramUpdate } from "../../lib/types.ts";
import WebhookHandler from "../../lib/webhook_handler.ts";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      const data: TelegramUpdate = await ctx.req.json().catch(() => null);

        // console.log(data);

      //check if there is a payload
      //   if (!data || !data.message || !data.channel_post) throw new Error("Invalid payload");

      const { message, channel_post } = data;

      // prefer channel_post if exists (for channels), else use message (for private/group chats)
      if (channel_post) {
        return await WebhookHandler.HandleChannelPost(channel_post);
      }

      if (message) {
        return await WebhookHandler.HandlePrivateMessage(message);
      }

      return new Response("Webhook is running");
    } catch (error) {
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
});
