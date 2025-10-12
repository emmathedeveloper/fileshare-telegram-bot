import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text("telegram_id").notNull().unique(),
  username: text("username").default("user"),
  role: text("role").default("user").notNull(),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export const uploaded_files = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_file_id: text().notNull(),
  file_type: text("file_type").notNull(),
  file_name: text("file_name").notNull(),
  file_size: text("file_size").notNull(),
  media_group_id: text("media_group_id").default(""),
  uploader_id: text("uploader_id").notNull(),
  uploader_chat_id: text("uploader_chat_id").notNull(),
  message_id: text("message_id").notNull(),
  bot_id: uuid("bot_id").references(() => bots.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const sent_files = pgTable("sent_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  message_id: text("message_id").notNull(),
  bot_id: uuid("bot_id").references(() => bots.id , { onDelete: 'cascade' }).notNull(),
  chat_id: text("chat_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
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
  channel_id: uuid("channel_id").references(() => registered_channels.id, {
    onDelete: "cascade",
  }).notNull(),
  added_at: timestamp("added_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.bot_id, table.channel_id] }),
]);

export const user_bots = pgTable("user_bots", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_telegram_id: text("user_telegram_id").notNull(),
  bot_id: uuid("bot_id").references(() => bots.id).notNull(),
  status: text("status").default("pending").notNull(),
  upload_step: jsonb("upload_step").$type<{ status: string; data?: any }>()
    .default({ status: "idle", data: "" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("user_bot_unique_id").on(table.bot_id, table.user_telegram_id),
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

export const user_bot_relations = relations(user_bots, ({ one }) => ({
  bot: one(bots, {
    fields: [user_bots.bot_id],
    references: [bots.id],
  }),
}));
