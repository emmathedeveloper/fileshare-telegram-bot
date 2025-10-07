import { define } from "../../utils.ts";
import { db } from "../../lib/db/index.ts";
import { sent_files, bots } from "../../lib/db/schemas.ts";
import { eq, lt } from "drizzle-orm";
import { decrypt } from "../../lib/utils.ts";

export const handler = define.handlers({
  DELETE: async () => {
    try {
      const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);

      console.log("RUNNING FILE CLEANUP")

      // Find files older than 30 minutes
      const oldFiles = await db
        .select()
        .from(sent_files)
        .where(lt(sent_files.created_at, THIRTY_MINUTES_AGO));

      let deletedCount = 0;

      for (const file of oldFiles) {
        try {
          // Get bot and decrypt token
          const bot = await db.query.bots.findFirst({
            where: eq(bots.id, file.bot_id || "9e9c34c0-f6b2-48f6-8620-ee887220ad11"),
          });
          if (!bot) continue;

          const botToken = await decrypt(bot.token, Deno.env.get("SECRET_KEY")!);

          // Delete message from Telegram
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/deleteMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: file.chat_id,
                message_id: file.message_id,
              }),
            },
          );

          // Delete from DB
          if(response.ok) {
            await db.delete(sent_files).where(eq(sent_files.id, file.id));
          deletedCount++;
          }
        } catch (fileErr) {
          console.error(`Error deleting file/message for file ID ${file.id}:`, fileErr);
          // Continue with next file
        }
      }

      return new Response(
        `Deleted ${deletedCount} files and their Telegram messages.`,
        { status: 200 },
      );
    } catch (err) {
      console.error("Clean-up error:", err);
      return new Response("Internal server error", { status: 500 });
    }
  },
});