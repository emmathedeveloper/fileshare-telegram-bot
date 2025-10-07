import { eq } from "drizzle-orm";
import { db } from "../../../../../lib/db/index.ts";
import { user_bots } from "../../../../../lib/db/schemas.ts";
import { define } from "../../../../../utils.ts";
import { decrypt } from "../../../../../lib/utils.ts";
import { sendMessage } from "../../../../../lib/helpers.ts";

const statuses = ["pending", "approved", "revoked"];

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      const bot_id = ctx.params.botId;

      const { user_telegram_id, status }: {
        user_telegram_id: string;
        status: string;
      } = await ctx.req
        .json();

      if (!statuses.includes(status)) throw new Error("Invalid status type");

      const user_bot = await db.query.user_bots.findFirst({
        where: (c, { eq, and }) =>
          and(eq(c.user_telegram_id, user_telegram_id), eq(c.bot_id, bot_id)),
      });

      if (!user_bot) throw new Error("Cannot find request");

      const [updated_user_bot] = await db.update(user_bots).set({
        status,
      }).where(eq(user_bots.id, user_bot.id)).returning();

      if (!updated_user_bot) throw new Error("Couldn't update status");

      const bot = await db.query.bots.findFirst({
        where: (t) => eq(t.id, bot_id),
      });

      if (!bot) throw new Error("This bot doesn't exist anymore");

      const token = await decrypt(bot.token, Deno.env.get("SECRET_KEY")!);

      let message = "";

      switch (status) {
        case "approved":
          message =
            `Your admin status has been ${status}.\nYou can start uploading files now`;
          break;
        case "revoked":
          message =
            `Your admin status has been ${status}.\nPlease contact a central admin`;
          break;
        default:
          message =
            `Your admin status is now ${status}.\nPlease contact a central admin`;
          break;
      }

      await sendMessage(
        user_bot.user_telegram_id,
        message,
        token,
      );

      return new Response("Done");
    } catch (error) {
      console.log(error);
      return new Response((error as Error).message || "Invalid request", {
        status: 400,
      });
    }
  },
});
