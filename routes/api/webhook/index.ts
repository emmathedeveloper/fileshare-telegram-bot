import { eq } from "drizzle-orm";
import { db } from "../../../lib/db/index.ts";
import { bot_channels, registered_channels } from "../../../lib/db/schemas.ts";
import { TelegramUpdate } from "../../../lib/types.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      const data: TelegramUpdate = await ctx.req.json().catch(() => null);

      console.log(data);

      //check if there is a payload
      if (!data) throw new Error("Invalid payload");

      const { my_chat_member } = data;

      // Handle bot being added as admin to a channel
      if (
        my_chat_member &&
        my_chat_member.new_chat_member.status === "administrator"
      ) {
        const [channel] = await db.insert(registered_channels).values({
          channel_id: my_chat_member.chat.id.toString(),
        }).onConflictDoNothing({ target: registered_channels.channel_id }).returning();

        return new Response("Channel registered: " + channel?.channel_id);
      }

      // Handle bot being removed from a channel
      if(my_chat_member && my_chat_member.new_chat_member.status !== "administrator") {
        const [channel] = await db.delete(registered_channels).where(
          eq(registered_channels.channel_id , my_chat_member.chat.id.toString())
        ).returning();

        if(channel) await db.delete(bot_channels).where(
          eq(bot_channels.channel_id , channel.id)
        );

        return new Response("Channel unregistered: " + my_chat_member.chat.id);
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
