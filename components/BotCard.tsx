import { FaUsers } from "react-icons/fa";
import { bot_channels, bots } from "../lib/db/schemas.ts";

type BotCardProps = {
    bot: typeof bots.$inferSelect & { bot_channels: (typeof bot_channels.$inferSelect)[] }
}

const BotCard = ({ bot } : BotCardProps) => {
  return (
    <a
      href={`/dashboard/bot/${bot.id}`}
      class="flex w-full flex-col gap-4 rounded bg-base-300 p-4"
    >
      <h1 class="text-3xl md:text-5xl text-base-content">@{bot.username}</h1>

      <section class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <FaUsers />
          <p>{bot.bot_channels.length} CHANNELS(S)</p>
        </div>
      </section>
    </a>
  );
};

export default BotCard