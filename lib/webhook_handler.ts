import { eq } from "drizzle-orm";
import { db } from "./db/index.ts";
import { admins, bots, uploaded_files } from "./db/schemas.ts";
import {
  forwardFileMessage,
  hasJoinedAllChannels,
  sendMessage,
} from "./helpers.ts";
import { TelegramCallbackQuery, TelegramMessage } from "./types.ts";

export default class WebhookHandler {
  static async HandleCallbackQuery(
    callback_query: TelegramCallbackQuery,
    bot: typeof bots.$inferSelect,
    bot_token: string,
  ) {
    return await WebhookCallbackQueryHandler.HandleCallbackQuery(
      callback_query,
      bot,
      bot_token,
    );
  }

  static async HandlePrivateMessage(
    message: TelegramMessage,
    bot: typeof bots.$inferSelect,
    bot_token: string,
  ) {
    return await WebhookPrivateMessageHandler.HandleMessage(
      message,
      bot,
      bot_token,
    );
  }

  static isFile(message: TelegramMessage) {
    return message.document || message.photo || message.video ||
      message.audio ||
      message.voice;
  }

  static SplitKeyAndPayload(text: string, separator: string | RegExp = /\s+/) {
    const parts = text.split(separator);
    const key = parts[0];
    const payload = parts.slice(1).join(" ") || null;
    return [key, payload];
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
        ? message.document.mime_type || "document"
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
      media_group_id: message.media_group_id || "",
    }).returning();

    return file_record;
  }
}

class DBHelper {
  static async getAdminByTelegramId(telegram_id: string) {
    const [admin] = await db.select().from(admins).where(
      eq(admins.telegram_id, telegram_id),
    );
    return admin;
  }

  static async createAdmin(telegram_id: string, username?: string) {
    const [admin] = await db.insert(admins).values({
      telegram_id,
      username,
    }).returning().onConflictDoUpdate({
      target: admins.telegram_id,
      set: { username },
    });
    return admin;
  }
}

const media_groups = new Map();

class WebhookPrivateMessageHandler {
  static async HandleMessage(
    message: TelegramMessage,
    bot: typeof bots.$inferSelect,
    bot_token: string,
  ) {
    if (message.media_group_id || WebhookHandler.isFile(message)) {
      const admin = await DBHelper.getAdminByTelegramId(
        message.chat.id.toString(),
      );

      //check if the user is an admin
      if (!admin) {
        await sendMessage(
          message.chat.id,
          "You can't upload files.",
          bot_token,
        );

        return new Response("User not admin");
      }

      if (message.media_group_id) {
        //wait for 5 seconds to allow other files in the media group to arrive
        const media_group_id = message.media_group_id;

        if (!media_groups.has(media_group_id)) {
          media_groups.set(media_group_id, { messages: [], timeoutId: null });
        }

        const group = media_groups.get(media_group_id);
        group.messages.push(message);

        // Reset previous timeout (we expect more messages)
        clearTimeout(group.timeout_id);

        // 🕒 Wait 1 second after the last message — then treat as complete
        group.timeout_id = setTimeout(async () => {
          sendMessage(
            message.chat.id,
            `
        Files uploaded successfully!.

        Download link: https://t.me/${
              bot.username
            }?start=series_${media_group_id}
      `,
            bot_token,
          );

          media_groups.delete(media_group_id);

          await db.update(admins).set({
            upload_step: {
              status: "waiting_for_series_caption_art",
              data: media_group_id,
            },
          }).where(eq(admins.id, admin.id));

          sendMessage(
            message.chat.id,
            "Please send a caption art (image) for this series, or /skip to skip this step.",
            bot_token,
          );
        }, 1000);

        await WebhookHandler.InsertFileRecord(message, admin);

        return new Response("Media group file recorded");
      }

      //check if the payload has a file
      if (
        WebhookHandler.isFile(message) &&
        (admin.upload_step.status === "waiting_for_series_caption_art" ||
          admin.upload_step.status === "waiting_for_file_caption_art")
      ) {
        // this is the caption art for the series

        if (!message.photo) {
          await sendMessage(
            message.chat.id,
            "Please send an image as caption art, or /skip to skip this step.",
            bot_token,
          );
          return new Response("Waiting for valid caption art");
        }

        await db.update(admins).set({
          upload_step: { status: "idle", data: "" },
        }).where(eq(admins.id, admin.id));

        const file_record = await WebhookHandler.InsertFileRecord(
          message,
          admin,
        );

        if (!file_record) throw new Error("Failed to save file");

        await forwardFileMessage(
          message.chat.id,
          file_record,
          bot_token,
          {
            inline_keyboard: [[{
              text: "⬇️ DOWNLOAD HERE ⬇️",
              url: `https://t.me/${
                bot.username
              }?start=${
                admin.upload_step.status == "waiting_for_series_caption_art"
                  ? "series_"
                  : ""
              }${admin.upload_step.data}`,
            }]],
          },
        );

        await sendMessage(
          message.chat.id,
          "Caption art received. Upload process completed.",
          bot_token,
        );

        return new Response("Caption art received");
      }

      //check if the payload has a file
      if (WebhookHandler.isFile(message)) {
        return await WebhookPrivateMessageHandler.HandleFileUpload(
          message,
          admin,
          bot,
          bot_token,
        );
      }
    }

    const [command, payload] = WebhookHandler.SplitKeyAndPayload(
      message.text || "",
    );

    if (command === "/skip") {
      const admin = await DBHelper.getAdminByTelegramId(
        message.chat.id.toString(),
      );

      if (!admin) {
        await sendMessage(
          message.chat.id,
          "You can't perform this action.",
          bot_token,
        );

        return new Response("User not admin");
      }

      if (admin.upload_step.status !== "idle") {
        await sendMessage(
          message.chat.id,
          "Caption art skipped for this upload.",
          bot_token,
        );

        await sendMessage(
          message.chat.id,
          `
        Caption art skipped. Upload process completed.

        Download link: https://t.me/${
            bot.username
          }?start=${
            admin.upload_step.status == "waiting_for_series_caption_art"
              ? "series_"
              : ""
          }${admin.upload_step.data}
      `,
          bot_token,
        );

        await db.update(admins).set({
          upload_step: { status: "idle", data: "" },
        })
          .where(eq(admins.id, admin.id));

        return new Response("Skipped caption art");
      }

      return new Response("Upload process skipped");
    }

    if (command === "/start") {
      // return new Response("Start with payload handling not yet implemented");

      if (!payload) {
        await sendMessage(
          message.chat.id,
          `Hi there! I'm your friendly file-sharing bot.`,
          bot_token,
        );

        return new Response("No payload provided");
      }

      if (payload) {
        //Check if user has joined all associated channels
        const channel_stats = await hasJoinedAllChannels(
          message.from?.id!,
          bot.id,
        );

        //If something goes wrong with getting associated channels
        if (!channel_stats) {
          await sendMessage(
            message.chat.id,
            "Something went wrong!. Try again later",
            bot.id,
          );

          return new Response("Error fetching channeld");
        }

        const { status, channels } = channel_stats;

        if (status == false) {
          await sendMessage(
            message.chat.id,
            `You haven't joined the following channels.\n\nJoin to proceed with download.`,
            bot_token,
            {
              inline_keyboard: [
                ...channels.map((c) => [{ text: c.title!, url: c.invite_link }]),
                [{ text: "♻️ Try Again ♻️" , url: `https://t.me/${bot.username}?start=${payload}` }]
              ],
            },
          );

          return new Response("Please join channels");
        }

        if (payload.startsWith("series_")) {
          const media_group_id = payload.replace("series_", "").trim();

          const files = await db.select().from(uploaded_files).where(
            eq(uploaded_files.media_group_id, media_group_id),
          );

          if (files.length === 0) {
            await sendMessage(
              message.chat.id,
              "Files not found or expired.",
              bot_token,
            );
            return new Response("No files found for media group");
          }

          for (const file of files) {
            await forwardFileMessage(message.chat.id, file, bot_token);
          }

          return new Response("Series files forwarded");
        }

        const res = await db.select().from(uploaded_files).where(
          eq(uploaded_files.id, payload),
        ).limit(1);
        const item = res[0];

        if (!item) {
          await sendMessage(
            message.chat.id,
            "❌ File not found or expired.",
            bot_token,
          );
          return new Response("File not found");
        }

        // Forward original message
        await forwardFileMessage(message.chat.id, item, bot_token);
      }

      return new Response("Received a deep link start");
    }

    if (command === "/admin") {
      //handle admin linking
      return await WebhookPrivateMessageHandler.HandleAdminLinking(
        message,
        payload || "",
        bot_token,
      );
    }

    return new Response("Received a private message");
  }

  static async HandleFileUpload(
    message: TelegramMessage,
    admin: typeof admins.$inferSelect,
    bot: typeof bots.$inferSelect,
    bot_token: string,
  ) {
    //save the file to the database
    const file_record = await WebhookHandler.InsertFileRecord(
      message,
      admin,
    );

    if (!file_record) throw new Error("Failed to save file");

    await db.update(admins).set({
      upload_step: {
        status: "waiting_for_file_caption_art",
        data: file_record.id,
      },
    }).where(eq(admins.id, admin.id));

    await sendMessage(
      message.chat.id,
      `
        File uploaded successfully!.

    Download link: https://t.me/${
        bot.username
      }?start=${file_record.id}
      `,
      bot_token,
    );

    await sendMessage(
      message.chat.id,
      "Please send a caption art (image) for this file, or /skip to skip this step.",
      bot_token,
    );

    return new Response("File uploaded and link sent");
  }

  static async HandleAdminLinking(
    message: TelegramMessage,
    code: string,
    bot_token: string,
  ) {
    if (!code) {
      await sendMessage(
        message.chat.id,
        `Please pass admin code also`,
        bot_token,
      );

      return new Response("No admin code provided");
    }

    if (code !== "12345") {
      await sendMessage(
        message.chat.id,
        `Invalid admin code`,
        bot_token,
      );

      return new Response("Invalid admin code");
    }

    if (!message.from) {
      await sendMessage(
        message.chat.id,
        `Can't identify who you are`,
        bot_token,
      );

      return new Response("Can't identify user");
    }

    const admin = await DBHelper.createAdmin(
      message.from.id.toString(),
      message.from.username,
    );

    await sendMessage(
      message.chat.id,
      `Welcome @${admin.username}, you are now an admin`,
      bot_token,
    );

    return new Response("Received an admin linking");
  }
}

class WebhookCallbackQueryHandler {
  static async HandleCallbackQuery(
    callback_query: TelegramCallbackQuery,
    bot: typeof bots.$inferSelect,
    bot_token: string,
  ) {
    if (callback_query.data === "upload_movie") {
      //initiate movie upload dialogue
      await sendMessage(
        callback_query.from.id,
        "Please upload the movie file.",
        bot_token,
      );

      return new Response("Initiated movie upload dialogue");
    }

    return new Response("Received a callback query");
  }
}
