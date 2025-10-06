import { eq } from "drizzle-orm";
import { db } from "../../../lib/db/index.ts";
import { bots } from "../../../lib/db/schemas.ts";
import { encrypt } from "../../../lib/utils.ts";
import { define } from "../../../utils.ts";

type RequestBodyPayload = {
  bot_token: string;
};

export const handler = define.handlers({
  POST: async (ctx) => {
    try {
      // Get the base URL of the request
      // replace http with https (for local testing with cloudflare tunnel)
      const base_url = new URL(ctx.req.url).origin.replace(/^http/, "https");

      // Parse the JSON body
      const data: RequestBodyPayload = await ctx.req.json().catch(() => null);

      if (!data || !data.bot_token) {
        return new Response("Invalid payload", { status: 400 });
      }

      if (data.bot_token === Deno.env.get("TELEGRAM_BOT_TOKEN")) {
        return new Response("This is the main bot token", { status: 400 });
      }

      // Validate the bot token by making a request to getMe
      const response = await fetch(
        `https://api.telegram.org/bot${data.bot_token}/getMe`,
      );

      const botInfo = await response.json();

      if (!botInfo.ok) {
        return new Response("Invalid bot token", { status: 400 });
      }

      // Encrypt the bot token before storing
      const encryptedToken = await encrypt(
        data.bot_token,
        Deno.env.get("SECRET_KEY")!,
      );

      const [ bot ] = await db.insert(bots).values({
        token: encryptedToken,
        telegram_id: botInfo.result.id.toString(),
        username: botInfo.result.username,
      }).onConflictDoUpdate({ target: bots.telegram_id , set: { username: botInfo.result.username } }).returning()

      //set webhook url for the bot
      const webhook_response = await fetch(
        `https://api.telegram.org/bot${data.bot_token}/setWebhook?url=${base_url}/api/bots/${bot.id}/webhook`,
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
      console.error(error);
      return new Response((error as Error)?.message || "Invalid request", {
        status: 400,
      });
    }
  },
});
