import { Head } from "fresh/runtime";
import { define } from "../../../utils.ts";
import { page } from "fresh";
import { db } from "../../../lib/db/index.ts";
import { FaArrowLeft } from "react-icons/fa";
import { TelegramChat } from "../../../lib/types.ts";
import { getChannelInfo } from "../../../lib/helpers.ts";

export const handler = define.handlers({
  GET: async (ctx) => {

    const bot_id = ctx.params.bot_id

    const bot = await db.query.bots.findFirst({
      where: (t , { eq }) => eq(t.id , bot_id),
      with: {
        bot_channels: {
            with: {
                channel: true
            }
        },
      },
    });

    if(!bot) return ctx.redirect('/dashboard/bots')

    const populated_channels: TelegramChat[] = (await Promise.all(bot.bot_channels.map(({ channel }) => getChannelInfo(channel.channel_id)))).filter(c => !!c)

    const altered_bot = {
        ...bot,
        populated_channels
    }

    return page({ bot: altered_bot });
  },
});

export default define.page<typeof handler>(({ data: { bot } }) => {
  return (
    <>
      <Head>
        <title></title>
      </Head>
      <main class="flex flex-col gap-4 w-full max-w-[1000px] mx-auto p-4">
        <nav class="w-full flex">
            <a class="btn btn-secondary" href="/dashboard/bots">
                <FaArrowLeft />
                Back
            </a>
        </nav>

        <h1 class="text-3xl md:text-5xl mb-4">{bot.username}</h1>

        <div class="flex-1 overflow-y-auto">
            <h2 class="text-xl md:text-3xl mb-2 w-full border-t border-t-base-300 pt-4">Connected Channels</h2>
            {bot.populated_channels.map((channel) => (
                <div key={channel.id} class="bg-base-300 p-4 rounded mb-4">
                    <h1 class='text-3xl md:text-5xl'>{channel.title}</h1>
                </div>
            ))}
        </div>
      </main>
    </>
  );
});
