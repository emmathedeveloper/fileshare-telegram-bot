import { db } from "./db/index.ts";
import { gate_channels, uploaded_files } from "./db/schemas.ts";
import { ReplyMarkup, SendMessagePayload } from "./types.ts";

export const TELEGRAM_API_BASE = (token: string) =>
  `https://api.telegram.org/bot${token}`;

export async function sendMessage(
  chat_id: number,
  text: string,
  reply_markup?: ReplyMarkup,
) {
  try {
    const response_data: SendMessagePayload = {
      chat_id,
      text,
      parse_mode: "Markdown",
    };

    if (reply_markup) response_data.reply_markup = reply_markup;

    await fetch(
      `${TELEGRAM_API_BASE(Deno.env.get("TELEGRAM_BOT_TOKEN")!)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response_data),
      },
    );
  } catch (error) {
    console.log(error);
  }
}

async function isUserInChannel(userId: number, channel: string) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${Deno.env.get(
        "TELEGRAM_BOT_TOKEN",
      )!}/getChatMember?chat_id=${channel}&user_id=${userId}`,
    );
    const data = await res.json();

    if (!data.ok) return false;

    const status = data.result.status;
    return ["member", "administrator", "creator"].includes(status);
  } catch (error) {
    console.log(error);
  }
}

export async function checkUserAccess(userId: number) {
  const all_gate_channels = await db.select().from(gate_channels);
  const gate_channel_ids = all_gate_channels.map((c) => c.channel_id);

  for (const channel of gate_channel_ids) {
    const joined = await isUserInChannel(userId, channel);
    if (!joined) {
      return false;
    }
  }
  return true;
}

export async function forwardFileMessage(
  chat_id: number,
  item: typeof uploaded_files.$inferSelect,
) {
  try {
    await fetch(
      `${TELEGRAM_API_BASE(Deno.env.get("TELEGRAM_BOT_TOKEN")!)}/copyMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id.toString(),
          from_chat_id: Number(item.uploader_chat_id),
          message_id: Number(item.message_id),
        }),
      },
    );
  } catch (error) {
    console.log(error);
  }
}
