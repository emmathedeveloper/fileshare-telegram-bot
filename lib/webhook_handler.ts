import { eq } from "drizzle-orm";
import { db } from "./db/index.ts";
import { admins, uploaded_files } from "./db/schemas.ts";
import { forwardFileMessage, sendMessage } from "./helpers.ts";
import { TelegramMessage } from "./types.ts";

export default class WebhookHandler {
  static async HandleChannelPost({ text, ...rest }: TelegramMessage) {
    if (text && WebhookChannelPostHandler.IsGateChannelLinking(text)) {
      return await WebhookChannelPostHandler.HandleChannelPost({
        text,
        ...rest,
      });
    }

    return new Response(JSON.stringify("Received a channel post"), {
      status: 200,
    });
  }

  static async HandlePrivateMessage(message: TelegramMessage) {
    return await WebhookPrivateMessageHandler.HandleMessage(message);
  }

  static isFile(message: TelegramMessage) {
    return message.document || message.photo || message.video ||
      message.audio ||
      message.voice;
  }

  static async InsertFileRecord(
    message: TelegramMessage,
    admin: typeof admins.$inferSelect,
  ) {
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
      uploader_id: message.from?.id.toString() || admin.telegram_id,
      caption: message.caption || "",
      caption_entities: message.caption_entities,
      entities: message.entities
    }).returning();

    return file_record;
  }
}

class WebhookChannelPostHandler {
  static async HandleChannelPost({ text }: TelegramMessage) {
    // const link_token

    return new Response(JSON.stringify("Received a channel post"), {
      status: 200,
    });
  }

  static async HandleGateChannelLinking({ text }: TelegramMessage) {
    if (!text) {
      return new Response(
        JSON.stringify({ ok: false, error: "No text provided." }),
        { status: 400 },
      );
    }

    const parts = text.split(" ");

    if (parts.length !== 2) {
      return new Response(
        "Invalid command format. Use /<bot_username>_link <link_token>",
      );
    }

    const link_token = parts[1].trim();

    if (!link_token) {
      return new Response("Link token is missing.");
    }

    // Here you would typically verify the link_token and associate the channel with a user or perform other actions.

    return new Response(
      JSON.stringify({ ok: true, message: "Channel linked successfully." }),
      { status: 200 },
    );
  }

  static IsGateChannelLinking(text: string) {
    return text.startsWith(`/${Deno.env.get("TELEGRAM_BOT_USERNAME")}_link`);
  }
}

class WebhookPrivateMessageHandler {
  static async HandleMessage(message: TelegramMessage) {
    //check if the payload has a file
    if (WebhookHandler.isFile(message)) {
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

      const file_record = await WebhookHandler.InsertFileRecord(
        message,
        isAdmin,
      );

      if (!file_record) throw new Error("Failed to save file");

      // send share link to uploader
      const link = `https://t.me/${
        Deno.env.get("TELEGRAM_BOT_USERNAME")
      }?start=${file_record.id}`;

      await forwardFileMessage(
        message.chat.id,
        file_record,
        {
          inline_keyboard: [
            [{ text: "⬇️ DOWNLOAD HERE ⬇️", url: link }],
          ],
        }
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
          `Hi there! I'm Kesha, your friendly file-sharing bot.`,
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

    if (message.text && message.text.startsWith("/admin")) {
      const parts = message.text.split(" ");
      // deep link variants: "/start 42" OR "/start=42" sometimes Telegram sends "/start id"
      let code = parts[1] ?? null;
      // also handle "/start=42" or payload after ?start=...
      if (!code && message.text.includes("=")) {
        code = message.text.split("=")[1];
      }

      if (!code) {
        await sendMessage(
          message.chat.id,
          `Please pass admin code also`,
        );

        return new Response(JSON.stringify({ ok: true }));
      }

      if (code !== "12345") {
        await sendMessage(
          message.chat.id,
          `Invalid admin code`,
        );

        return new Response(JSON.stringify({ ok: true }));
      }

      if (!message.from) {
        await sendMessage(
          message.chat.id,
          `Can't identify who you are`,
        );

        return new Response(JSON.stringify({ ok: true }));
      }

      const [user] = await db.insert(admins).values({
        telegram_id: message.from.id.toString(),
        username: message.from.username,
      }).returning();

      await sendMessage(
        message.chat.id,
        `Welcome @${user.username}, you are now an admin`,
      );
      return new Response(JSON.stringify({ ok: true }));
    }

    return new Response(JSON.stringify("Received a channel post"), {
      status: 200,
    });
  }
}
