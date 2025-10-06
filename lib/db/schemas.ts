import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text("telegram_id").notNull().unique(),
  username: text("username").default("user"),
  upload_step: jsonb("upload_step").$type<{ status: string; data?: any }>().default({
    status: "idle",
    data: "",
  }).notNull(), // idle, uploading waiting_for_caption, waiting_for_thumbnail,
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export const uploaded_files = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_file_id: text().notNull(),
  file_type: text("file_type").notNull(),
  file_name: text("file_name").notNull(),
  file_size: text("file_size").notNull(),
  media_group_id: text("media_group_id").default(""),
  uploader_id: text("uploader_id").references(() => admins.telegram_id)
    .notNull(),
  uploader_chat_id: text("uploader_chat_id").notNull(),
  message_id: text("message_id").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const registered_channels = pgTable("registered_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel_id: text().notNull().unique(),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export const bots = pgTable("bots", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  username: text("username").unique().notNull(),
  telegram_id: text("telegram_id").unique().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const bot_channels = pgTable("bot_channels", {
  bot_id: uuid("bot_id").references(() => bots.id).notNull(),
  channel_id: uuid("channel_id").references(() => registered_channels.id).notNull(),
  added_at: timestamp("added_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.bot_id, table.channel_id] }),
]);

//Many channels to one both
export const bots_relations = relations(
  bots,
  ({ many }) => ({
    bot_channels: many(bot_channels),
  }),
);

//Many bots to one channel
export const registered_channels_relations = relations(
  registered_channels,
  ({ many }) => ({
    bot_channels: many(bot_channels),
  }),
);


// Join table for bot and channel relations
export const bot_channels_relations = relations(bot_channels, ({ one }) => ({
  bot: one(bots, {
    fields: [bot_channels.bot_id],
    references: [bots.id],
  }),
  channel: one(registered_channels, {
    fields: [bot_channels.channel_id],
    references: [registered_channels.id],
  }),
}));
