import { eq } from "drizzle-orm";
import { db } from "./db/index.ts";
import { admins, uploaded_files } from "./db/schemas.ts";
import { forwardFileMessage, sendMessage } from "./helpers.ts";
import { TelegramCallbackQuery, TelegramMessage } from "./types.ts";

// export default class WebhookHandler {
//   static async HandleChannelPost({ text, ...rest }: TelegramMessage) {
//     if (text && WebhookChannelPostHandler.IsGateChannelLinking(text)) {
//       return await WebhookChannelPostHandler.HandleChannelPost({
//         text,
//         ...rest,
//       });
//     }

//     return new Response(JSON.stringify("Received a channel post"), {
//       status: 200,
//     });
//   }

//   static async HandlePrivateMessage(message: TelegramMessage) {
//     return await WebhookPrivateMessageHandler.HandleMessage(message);
//   }

//   static isFile(message: TelegramMessage) {
//     return message.document || message.photo || message.video ||
//       message.audio ||
//       message.voice;
//   }

//   static async InsertFileRecord(
//     message: TelegramMessage,
//     admin: typeof admins.$inferSelect,
//   ) {
//     //save the file to the database
//     const [file_record] = await db.insert(uploaded_files).values({
//       telegram_file_id: message.document?.file_id ||
//         message.photo?.[0]?.file_id || message.video?.file_id ||
//         message.audio?.file_id || message.voice?.file_id || "",
//       file_type: message.document
//         ? "document"
//         : message.photo
//         ? "photo"
//         : message.video
//         ? "video"
//         : message.audio
//         ? "audio"
//         : message.voice
//         ? "voice"
//         : "unknown",
//       file_name: message.document?.file_name || message.caption ||
//         "unknown",
//       file_size:
//         (message.document?.file_size || message.photo?.[0]?.file_size ||
//           message.video?.file_size || message.audio?.file_size ||
//           message.voice?.file_size || 0).toString(),
//       message_id: message.message_id.toString(),
//       uploader_chat_id: message.chat.id.toString(),
//       uploader_id: message.from?.id.toString() || admin.telegram_id,
//       caption: message.caption || "",
//       caption_entities: message.caption_entities,
//       entities: message.entities
//     }).returning();

//     return file_record;
//   }
// }

// class WebhookChannelPostHandler {
//   static async HandleChannelPost({ text }: TelegramMessage) {
//     // const link_token

//     return new Response(JSON.stringify("Received a channel post"), {
//       status: 200,
//     });
//   }

//   static async HandleGateChannelLinking({ text }: TelegramMessage) {
//     if (!text) {
//       return new Response(
//         JSON.stringify({ ok: false, error: "No text provided." }),
//         { status: 400 },
//       );
//     }

//     const parts = text.split(" ");

//     if (parts.length !== 2) {
//       return new Response(
//         "Invalid command format. Use /<bot_username>_link <link_token>",
//       );
//     }

//     const link_token = parts[1].trim();

//     if (!link_token) {
//       return new Response("Link token is missing.");
//     }

//     // Here you would typically verify the link_token and associate the channel with a user or perform other actions.

//     return new Response(
//       JSON.stringify({ ok: true, message: "Channel linked successfully." }),
//       { status: 200 },
//     );
//   }

//   static IsGateChannelLinking(text: string) {
//     return text.startsWith(`/${Deno.env.get("TELEGRAM_BOT_USERNAME")}_link`);
//   }
// }

// class WebhookPrivateMessageHandler {
//   static async HandleMessage(message: TelegramMessage) {
//     //check if the payload has a file
//     if (WebhookHandler.isFile(message)) {
//       const [isAdmin] = await db.select().from(admins).where(
//         eq(admins.telegram_id, message.chat.id.toString()),
//       );

//       //check if the user is an admin
//       if (!isAdmin) {
//         await sendMessage(
//           message.chat.id,
//           "❌ You can't upload files.",
//         );

//         return new Response(JSON.stringify({ ok: true }), { status: 200 });
//       }

//       const file_record = await WebhookHandler.InsertFileRecord(
//         message,
//         isAdmin,
//       );

//       if (!file_record) throw new Error("Failed to save file");

//       // send share link to uploader
//       const link = `https://t.me/${
//         Deno.env.get("TELEGRAM_BOT_USERNAME")
//       }?start=${file_record.id}`;

//       await forwardFileMessage(
//         message.chat.id,
//         file_record,
//         {
//           inline_keyboard: [
//             [{ text: "⬇️ DOWNLOAD HERE ⬇️", url: link }],
//           ],
//         }
//       );

//       return new Response(JSON.stringify({ ok: true }));
//     }

//     // START handling: user invoked /start <id> or deep-linked start param
//     if (message.text && message.text.startsWith("/start")) {
//       const parts = message.text.split(" ");
//       // deep link variants: "/start 42" OR "/start=42" sometimes Telegram sends "/start id"
//       let id = parts[1] ?? null;
//       // also handle "/start=42" or payload after ?start=...
//       if (!id && message.text.includes("=")) {
//         id = message.text.split("=")[1];
//       }

//       if (!id) {
//         await sendMessage(
//           message.chat.id,
//           `Hi there! I'm Kesha, your friendly file-sharing bot.`,
//         );

//         return new Response(JSON.stringify({ ok: true }));
//       }

//       const res = await db.select().from(uploaded_files).where(
//         eq(uploaded_files.id, id.toString()),
//       ).limit(1);
//       const item = res[0];

//       if (!item) {
//         await sendMessage(message.chat.id, "❌ File not found or expired.");
//         return new Response(JSON.stringify({ ok: true }));
//       }

//       // Forward original message
//       await forwardFileMessage(message.chat.id, item);

//       return new Response(JSON.stringify({ ok: true }));
//     }

//     if (message.text && message.text.startsWith("/admin")) {
//       const parts = message.text.split(" ");
//       // deep link variants: "/start 42" OR "/start=42" sometimes Telegram sends "/start id"
//       let code = parts[1] ?? null;
//       // also handle "/start=42" or payload after ?start=...
//       if (!code && message.text.includes("=")) {
//         code = message.text.split("=")[1];
//       }

//       if (!code) {
//         await sendMessage(
//           message.chat.id,
//           `Please pass admin code also`,
//         );

//         return new Response(JSON.stringify({ ok: true }));
//       }

//       if (code !== "12345") {
//         await sendMessage(
//           message.chat.id,
//           `Invalid admin code`,
//         );

//         return new Response(JSON.stringify({ ok: true }));
//       }

//       if (!message.from) {
//         await sendMessage(
//           message.chat.id,
//           `Can't identify who you are`,
//         );

//         return new Response(JSON.stringify({ ok: true }));
//       }

//       const [user] = await db.insert(admins).values({
//         telegram_id: message.from.id.toString(),
//         username: message.from.username,
//       }).returning();

//       await sendMessage(
//         message.chat.id,
//         `Welcome @${user.username}, you are now an admin`,
//       );
//       return new Response(JSON.stringify({ ok: true }));
//     }

//     return new Response(JSON.stringify("Received a channel post"), {
//       status: 200,
//     });
//   }
// }

export default class WebhookHandler {
  static async HandleCallbackQuery(callback_query: TelegramCallbackQuery) {
    return await WebhookCallbackQueryHandler.HandleCallbackQuery(
      callback_query,
    );
  }

  static async HandlePrivateMessage(message: TelegramMessage) {
    return await WebhookPrivateMessageHandler.HandleMessage(message);
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
  static async HandleMessage(message: TelegramMessage) {
    if (message.media_group_id || WebhookHandler.isFile(message)) {
      const admin = await DBHelper.getAdminByTelegramId(
        message.chat.id.toString(),
      );

      //check if the user is an admin
      if (!admin) {
        await sendMessage(
          message.chat.id,
          "You can't upload files.",
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
              Deno.env.get("TELEGRAM_BOT_USERNAME")
            }?start=series_${media_group_id}
      `,
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
          console.log("No photo in caption art message");
          await sendMessage(
            message.chat.id,
            "Please send an image as caption art, or /skip to skip this step.",
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
          {
            inline_keyboard: [[{
              text: "DOWNLOAD HERE",
              url: `https://t.me/${
                Deno.env.get("TELEGRAM_BOT_USERNAME")
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
        );

        return new Response("Caption art received");
      }

      //check if the payload has a file
      if (WebhookHandler.isFile(message)) {
        return await WebhookPrivateMessageHandler.HandleFileUpload(
          message,
          admin,
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
        );

        return new Response("User not admin");
      }

      if (admin.upload_step.status !== "idle") {
        await sendMessage(
          message.chat.id,
          "Caption art skipped for this upload.",
        );

        await sendMessage(
          message.chat.id,
          `
        Caption art skipped. Upload process completed.

        Download link: https://t.me/${
            Deno.env.get("TELEGRAM_BOT_USERNAME")
          }?start=${
            admin.upload_step.status == "waiting_for_series_caption_art"
              ? "series_"
              : ""
          }${admin.upload_step.data}
      `,
        );

        await db.update(admins).set({
          upload_step: { status: "idle", data: "" },
        })
          .where(eq(admins.id, admin.id));

        return new Response("Skipped caption art");
      }

      return new Response("Upload process skipped");
    }

    if (command === "/start" && payload) {
      // return new Response("Start with payload handling not yet implemented");

      if (payload.startsWith("series_")) {
        const media_group_id = payload.replace("series_", "").trim();

        const files = await db.select().from(uploaded_files).where(
          eq(uploaded_files.media_group_id, media_group_id),
        );

        if (files.length === 0) {
          await sendMessage(message.chat.id, "Files not found or expired.");
          return new Response("No files found for media group");
        }

        for (const file of files) {
          await forwardFileMessage(message.chat.id, file);
        }

        return new Response("Series files forwarded");
      }

      const res = await db.select().from(uploaded_files).where(
        eq(uploaded_files.id, payload),
      ).limit(1);
      const item = res[0];

      if (!item) {
        await sendMessage(message.chat.id, "❌ File not found or expired.");
        return new Response("File not found");
      }

      // Forward original message
      await forwardFileMessage(message.chat.id, item);

      return new Response("Received a deep link start");
    }

    if (command === "/admin") {
      //handle admin linking
      return await WebhookPrivateMessageHandler.HandleAdminLinking(
        message,
        payload || "",
      );
    }

    if (command === "/upload") {
      //handle upload initiation

      const admin = await DBHelper.getAdminByTelegramId(
        message.from?.id.toString() || "",
      );

      //check if the user is an admin
      if (!admin) {
        await sendMessage(
          message.chat.id,
          "❌ You can't upload files.",
        );

        return new Response("User not admin");
      }

      //send upload options

      await sendMessage(
        message.chat.id,
        "Hello! This is a test message from your bot.",
        {
          inline_keyboard: [
            [{ text: "UPLOAD MOVIE 🎬", callback_data: "upload_movie" }],
            [{ text: "UPLOAD SERIES 🍿", callback_data: "upload_series" }],
            [{ text: "UPLOAD FILE 📄", callback_data: "upload_file" }],
          ],
        },
      );

      return new Response("Upload initiation not yet implemented");
    }

    return new Response("Received a private message");
  }

  static async HandleFileUpload(
    message: TelegramMessage,
    admin: typeof admins.$inferSelect,
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
        Deno.env.get("TELEGRAM_BOT_USERNAME")
      }?start=${file_record.id}
      `,
    );

    await sendMessage(
      message.chat.id,
      "Please send a caption art (image) for this file, or /skip to skip this step.",
    );

    return new Response("File uploaded and link sent");
  }

  static async HandleAdminLinking(message: TelegramMessage, code: string) {
    if (!code) {
      await sendMessage(
        message.chat.id,
        `Please pass admin code also`,
      );

      return new Response("No admin code provided");
    }

    if (code !== "12345") {
      await sendMessage(
        message.chat.id,
        `Invalid admin code`,
      );

      return new Response("Invalid admin code");
    }

    if (!message.from) {
      await sendMessage(
        message.chat.id,
        `Can't identify who you are`,
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
    );

    return new Response("Received an admin linking");
  }
}

class WebhookCallbackQueryHandler {
  static async HandleCallbackQuery(callback_query: TelegramCallbackQuery) {
    if (callback_query.data === "upload_movie") {
      //initiate movie upload dialogue
      await sendMessage(
        callback_query.from.id,
        "Please upload the movie file.",
      );

      return new Response("Initiated movie upload dialogue");
    }

    return new Response("Received a callback query");
  }
}
