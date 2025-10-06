import { page } from "fresh";
import { define } from "../../../utils.ts";
import { db } from "../../../lib/db/index.ts";
import { Head } from "fresh/runtime";
import { FaPlus, FaSearch } from "react-icons/fa";
import BotCard from "../../../components/BotCard.tsx";

export const handler = define.handlers({
  GET: async (_) => {
    const allBots = await db.query.bots.findMany({
      with: {
        bot_channels: true
      }
    });

    return page({ bots: allBots });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <>
      <Head>
        <title>Adams - Bots</title>
      </Head>
      <main class="size-full flex flex-col p-2 gap-2">
        <div class="w-full flex items-center gap-2">
          <label class="input flex-1">
            <FaSearch size={20} />
            <input placeholder="Search" />
          </label>
          <button class="btn btn-primary">
            <FaPlus size={20}/>
            NEW BOT
          </button>
        </div>
        <div class="flex flex-col gap-4 flex-1 overflow-y-auto">

          {data.bots.map(bot => <BotCard key={bot.id} bot={bot}/>)}
        </div>
      </main>
    </>
  );
});
