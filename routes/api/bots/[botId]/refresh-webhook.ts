import { db } from "../../../../lib/db/index.ts";
import { decrypt } from "../../../../lib/utils.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  GET: async (ctx) => {
    try {
      // Get the base URL of the request
      // replace http with https (for local testing with cloudflare tunnel)
      const base_url = new URL(ctx.req.url).origin.replace(
        /^http:\/\//,
        "https",
      );

      const bot_id = ctx.params.botId;

      const bot = await db.query.bots.findFirst({
        where: (t, { eq }) => eq(t.id, bot_id),
      });

      if (!bot) throw new Error("Bot not found");

      const token = await decrypt(bot.token, Deno.env.get("SECRET_KEY")!);

      //set webhook url for the bot
      const webhook_response = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${base_url}/api/bots/${bot.id}/webhook`,
      );

      const result = await webhook_response.json();

      if (!result.ok || result.result !== true) {
        return new Response("Webhook not set", { status: 400 });
      }

      return new Response(
        JSON.stringify(bot),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.log(error);
      return new Response((error as Error)?.message || "Something went wrong", {
        status: 400,
      });
    }
  },
});
