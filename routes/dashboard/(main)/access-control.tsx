import { page } from "fresh";
import { define } from "../../../utils.ts";
import { db } from "../../../lib/db/index.ts";
import { decrypt } from "../../../crypt.ts";
import { TelegramChat } from "../../../lib/types.ts";
import { bots } from "../../../lib/db/schemas.ts";
import { useSignal } from "@preact/signals";
import FilterTabs from "../../../islands/FilterTabs.tsx";
import { getUserInfo } from "../../../lib/helpers.ts";
import FilterTabContentView from "../../../islands/FilterTabContentView.tsx";

export const handler = define.handlers({
  GET: async (ctx) => {
    //Using this map to cache bot info so i don't have to call decrypt everytime
    const cached_bot_info_map = new Map();

    const cached_user_info_map = new Map();

    const decryted_bot_token_map = new Map();

    const data = await db.query.user_bots.findMany();

    //Alter the data by querying for more info from telegram API
    const altered_data = (await Promise.all(data.map(async (item) => {
      //Get bot info from cache. If not cached get from database
      const bot: typeof bots.$inferSelect =
        cached_bot_info_map.get(item.bot_id) || await db.query.bots.findFirst({
          where: (t, { eq }) => eq(t.id, item.bot_id),
        }).then((b) => {
          cached_bot_info_map.set(item.bot_id, b);
          return b;
        });

      if (!bot) return;

      //Get the decrypted token from cache. If not in cache, decrypt it and set it in cache
      const token = decryted_bot_token_map.get(item.bot_id) ||
        await decrypt(bot.token, Deno.env.get("SECRET_KEY")!)
          .then((t) => {
            decryted_bot_token_map.set(item.bot_id, t);
            return t;
          });

      //If there is a cached info, just use that, else fetch the bot info from telegram
      const cached_user_info: TelegramChat =
        cached_user_info_map.get(item.user_telegram_id) ||
        await getUserInfo(item.user_telegram_id, token).then((d) => {
          cached_user_info_map.set(item.user_telegram_id, d);
          return d;
        });

      return {
        ...item,
        user: cached_user_info,
        bot_info: bot,
      };
    }))).filter((a) => !!a);

    return page({ items: altered_data });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const currentTab = useSignal("pending");

  const items = useSignal(data.items)

  return (
    <main class="size-full flex flex-col p-4">
      <FilterTabs currentTab={currentTab} />
      <div class="flex-1 overflow-y-auto mt-4">
        <FilterTabContentView currentTab={currentTab} items={items}/>
      </div>
    </main>
  );
});
