import { eq } from "drizzle-orm";
import { db } from "./index.ts";
import { bots } from "./schemas.ts";

export async function getBotChannels(bot_id: string) {
  const bot = await db.query.bots.findFirst({
    where: eq(bots.id, bot_id),
    with: {
      bot_channels: {
        with: {
          channel: true,
        },
      },
    },
  });

  if (!bot) {
    return
  }

  const connected_channels = bot.bot_channels.map((bc) => bc.channel);

  return connected_channels
}