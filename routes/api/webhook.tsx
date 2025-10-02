import { db } from "../../lib/db/index.ts";
import { admins, uploaded_files } from "../../lib/db/schemas.ts";
import { forwardFileMessage, sendMessage } from "../../lib/helpers.ts";
import { TelegramUpdate } from "../../lib/types.ts";
import WebhookHandler from "../../lib/webhook_handler.ts";
import { define } from "../../utils.ts";
import { eq } from "drizzle-orm";

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      const data: TelegramUpdate = await ctx.req.json().catch(() => null);

    //   console.log(data);

      //check if there is a payload
      //   if (!data || !data.message || !data.channel_post) throw new Error("Invalid payload");

      const { message , channel_post } = data;

        // prefer channel_post if exists (for channels), else use message (for private/group chats)
        if(channel_post) {
          return WebhookHandler.HandleChannelPost(channel_post);
        }

      if (message) {
        //check if the payload has a file
        if (
          message.document || message.photo || message.video || message.audio ||
          message.voice
        ) {
          const [isAdmin] = await db.select().from(admins).where(
            eq(admins.telegram_id, message.chat.id.toString()),
          );

          //check if the user is an admin
          if (!isAdmin) {
            await sendMessage(
              message.chat.id,
              "❌ You can't upload files.",
            );
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          //save the file to the database
          const [file_record] = await db.insert(uploaded_files).values({
            telegram_file_id: message.document?.file_id ||
              message.photo?.[0]?.file_id || message.video?.file_id ||
              message.audio?.file_id || message.voice?.file_id || "",
            file_type: message.document
              ? "document"
              : message.photo
              ? "photo"
              : message.video
              ? "video"
              : message.audio
              ? "audio"
              : message.voice
              ? "voice"
              : "unknown",
            file_name: message.document?.file_name || message.caption ||
              "unknown",
            file_size:
              (message.document?.file_size || message.photo?.[0]?.file_size ||
                message.video?.file_size || message.audio?.file_size ||
                message.voice?.file_size || 0).toString(),
            message_id: message.message_id.toString(),
            uploader_chat_id: message.chat.id.toString(),
            uploader_id: message.from?.id.toString() || isAdmin.telegram_id,
            caption: message.caption || "",
          }).returning();

          if (!file_record) throw new Error("Failed to save file");

          // send share link to uploader
          const link = `https://t.me/${
            Deno.env.get("TELEGRAM_BOT_USERNAME")
          }?start=${file_record.id}`;

          await sendMessage(
            message.chat.id,
            `✅ File saved. Share link:\n${link}`,
          );

          return new Response(JSON.stringify({ ok: true }));
        }

        // START handling: user invoked /start <id> or deep-linked start param
        if (message.text && message.text.startsWith("/start")) {
          const parts = message.text.split(" ");
          // deep link variants: "/start 42" OR "/start=42" sometimes Telegram sends "/start id"
          let id = parts[1] ?? null;
          // also handle "/start=42" or payload after ?start=...
          if (!id && message.text.includes("=")) {
            id = message.text.split("=")[1];
          }

          if (!id) {
            await sendMessage(
              message.chat.id,
              `
Hi there! I'm Keisha, your friendly file-sharing assistant. 
Feel free to send me any files, and I'll generate a shareable link for you. 
If you ever need to access files, just use the special link I provide. 
Let's get sharing!
            `,
            );

            return new Response(JSON.stringify({ ok: true }));
          }

          const res = await db.select().from(uploaded_files).where(
            eq(uploaded_files.id, id.toString()),
          ).limit(1);
          const item = res[0];

          if (!item) {
            await sendMessage(message.chat.id, "❌ File not found or expired.");
            return new Response(JSON.stringify({ ok: true }));
          }

          // Forward original message
          await forwardFileMessage(message.chat.id, item);

          return new Response(JSON.stringify({ ok: true }));
        }
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
