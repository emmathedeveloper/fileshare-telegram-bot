// Telegram API Types
export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  // You can add more (inline_query, my_chat_member, etc.) if needed
};


export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: (TelegramMessageEntity & Record<string , string>)[];
  caption?: string;
  document?: TelegramDocument;
  photo?: TelegramPhotoSize[];
  video?: TelegramVideo;
  audio?: TelegramAudio;
  voice?: TelegramVoice;
  animation?: TelegramAnimation;
  sticker?: TelegramSticker;
};

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramMessageEntity = {
  offset: number;
  length: number;
  type: string; // e.g., "bold", "italic", "bot_command"
};

export type TelegramDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TelegramVideo = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

export type TelegramAudio = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
};

export type TelegramVoice = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

export type TelegramAnimation = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

export type TelegramSticker = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  is_animated?: boolean;
  is_video?: boolean;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
};


// Telegram Bot API Reply Markup Types

export type KeyboardButton = {
  text: string;
  request_user?: {
    request_id: number;
    user_is_bot?: boolean;
    user_is_premium?: boolean;
  };
  request_chat?: {
    request_id: number;
    chat_is_channel?: boolean;
    chat_is_forum?: boolean;
    chat_has_username?: boolean;
    chat_is_created?: boolean;
    user_administrator_rights?: any;
    bot_administrator_rights?: any;
    bot_is_member?: boolean;
  };
  request_contact?: boolean;
  request_location?: boolean;
  request_poll?: { type?: "quiz" | "regular" };
  web_app?: { url: string };
};

export type InlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
  login_url?: {
    url: string;
    forward_text?: string;
    bot_username?: string;
    request_write_access?: boolean;
  };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  switch_inline_query_chosen_chat?: {
    query?: string;
    allow_user_chats?: boolean;
    allow_bot_chats?: boolean;
    allow_group_chats?: boolean;
    allow_channel_chats?: boolean;
  };
  callback_game?: any;
  pay?: boolean;
};

// Main reply markup object
export type ReplyMarkup =
  | {
      inline_keyboard: InlineKeyboardButton[][];
    }
  | {
      keyboard: KeyboardButton[][];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      input_field_placeholder?: string;
      selective?: boolean;
    }
  | {
      remove_keyboard: true;
      selective?: boolean;
    }
  | {
      force_reply: true;
      input_field_placeholder?: string;
      selective?: boolean;
    };


// --- sendMessage payload type ---
export interface SendMessagePayload {
  chat_id: number | string; // user ID, group ID, or @channelusername
  text: string;

  // Optional parameters
  message_thread_id?: number; // for forum topics
  parse_mode?: "MarkdownV2" | "HTML" | "Markdown";
  entities?: Array<{
    offset: number;
    length: number;
    type:
      | "mention"
      | "hashtag"
      | "cashtag"
      | "bot_command"
      | "url"
      | "email"
      | "phone_number"
      | "bold"
      | "italic"
      | "underline"
      | "strikethrough"
      | "spoiler"
      | "code"
      | "pre"
      | "text_link"
      | "text_mention"
      | "custom_emoji";
    url?: string;
    user?: { id: number; is_bot?: boolean; first_name?: string };
    language?: string;
    custom_emoji_id?: string;
  }>;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  protect_content?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
  reply_markup?: ReplyMarkup;
}