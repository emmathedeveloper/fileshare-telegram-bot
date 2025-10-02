import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text().notNull().unique(),
  username: text().default("user"),
});

export const uploaded_files = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  uploader_id: text("uploader_id").references(() => admins.telegram_id).notNull(),
  uploader_chat_id: text("uploader_chat_id").notNull(),
  message_id: text("message_id").notNull().unique(),
  caption: text("caption"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
