import { getBotChannels } from "./db/helpers.ts";
import { uploaded_files } from "./db/schemas.ts";
import {
  ReplyMarkup,
  SendMessagePayload,
  TelegramChat,
} from "./types.ts";

export const TELEGRAM_API_BASE = (token: string) =>
  `https://api.telegram.org/bot${token}`;

export async function sendMessage(
  chat_id: number | string,
  text: string,
  bot_token: string,
  reply_markup?: ReplyMarkup,
) {
  try {
    const response_data: SendMessagePayload = {
      chat_id,
      text,
    };

    if (reply_markup) response_data.reply_markup = reply_markup;

    await fetch(
      `${TELEGRAM_API_BASE(bot_token)}/sendMessage`,
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

export async function forwardFileMessage(
  chat_id: number,
  item: typeof uploaded_files.$inferSelect,
  bot_token: string,
  reply_markup?: ReplyMarkup,
) {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE(bot_token)}/copyMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id.toString(),
          from_chat_id: Number(item.uploader_chat_id),
          message_id: Number(item.message_id),
          reply_markup
        }),
      },
    );

    if(!response.ok) return

    
    const data = await response.json()
    console.log(data)

    return data.result.message_id

  } catch (error) {
    console.log(error);
    return
  }
}

export async function forwardCaptionArtMessage(
  chat_id: number,
  from_chat_id: number,
  message_id: number,
  bot_token: string,
  reply_markup?: ReplyMarkup,
) {
  try {
    await fetch(
      `${TELEGRAM_API_BASE(bot_token)}/copyMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id.toString(),
          from_chat_id,
          message_id,
          reply_markup
        }),
      },
    );
  } catch (error) {
    console.log(error);
  }
}

export async function forwardMediaGroup(
  chat_id: number,
  items: typeof uploaded_files.$inferSelect[],
  bot_token: string,
  reply_markup?: ReplyMarkup,
) {
  try {
    const media = items.map((item) => {

      let mediaType = item.file_type;

      if(mediaType.startsWith("video/")) {
        mediaType = "video";
      } else if(mediaType.startsWith("audio/")) {
        mediaType = "audio";
      } else if(mediaType.startsWith("image/")) {
        mediaType = "photo";
      } else if(mediaType === "application/pdf") {
        mediaType = "document";
      } else {
        mediaType = "document"; // default to document for other types
      }

      return {
        type: mediaType,
        media: item.telegram_file_id,
        caption: item.file_name,
      };
    });

    await fetch(
      `${TELEGRAM_API_BASE(bot_token)}/sendMediaGroup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id.toString(),
          media,
          reply_markup
        }),
      },
    );
  } catch (error) {
    console.log(error);
  }
}


export async function checkChannelMember(channel_id: string, user_id: number) {

  try{
    const api_url = TELEGRAM_API_BASE(Deno.env.get("TELEGRAM_BOT_TOKEN")!) + "/getChatMember";
  
    const payload = {
      chat_id: channel_id,
      user_id: user_id
    };
  
    const response = await fetch(api_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  
    const data = await response.json();
  
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
  
    const member_status = data.result.status;
  
    // Possible statuses: creator, administrator, member, restricted, left, kicked
    const is_member = ["creator", "administrator", "member"].includes(member_status);
  
    return {
      is_member,
      status: member_status,
      user: data.result.user
    };
  } catch(error){
    console.log(error);
    console.log((error as Error).message || "Invalid Request")
    return
  }
}

export async function hasJoinedAllChannels(user_id: number , bot_id: string){

  try {
    
    const channels = await getBotChannels(bot_id)
    
    if(!channels) return

    const has_joined = (await Promise.all(channels.map((c) => checkChannelMember(c.channel_id , user_id)))).every(r => r?.is_member)
    
    if(has_joined) return { status: true , channels: [] }
    
    const populated_channels: TelegramChat[] = (await Promise.all(channels.map(c => getChannelInfo(c.channel_id)))).filter(c => !!c)

    return { status: false , channels: populated_channels }

  } catch (error) {
    console.log(error)
    return
  }
}

export async function getChannelInfo(channelId: string) : Promise<TelegramChat | undefined> {
  try {
    const url = `https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/getChat`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: channelId, // Can be @username or numeric ID like -1001234567890
      }),
    });
  
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
  
    return data.result;
    
  } catch (error) {
    console.log(error)
    return
  }
}

export async function getUserInfo(user_telegram_id: string, token: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: user_telegram_id }),
    });

    const data = await res.json();

    return data.result as TelegramChat;
  } catch (error) {
    console.log(error);
    return;
  }
}