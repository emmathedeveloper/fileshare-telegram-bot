import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text().notNull().unique(),
  username: text().default("user"),
});

export const uploaded_files = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_file_id: text().notNull(),
  file_type: text().notNull(),
  file_name: text().notNull(),
  file_size: text().notNull(),
  uploader_id: text("uploader_id").references(() => admins.telegram_id).notNull(),
  uploader_chat_id: text("uploader_chat_id").notNull(),
  message_id: text("message_id").notNull().unique(),
  caption: text("caption"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const gate_channels = pgTable("gate_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel_id: text().notNull().unique(),
  added_at: timestamp("added_at").defaultNow().notNull(),
});