import { Head } from "fresh/runtime";
import { define } from "../../../utils.ts";
import { FaRobot, FaUsers } from "react-icons/fa";
import StatsBox from "../../../components/StatsBox.tsx";
import { page } from "fresh";
import { db } from "../../../lib/db/index.ts";
import { bots, registered_channels } from "../../../lib/db/schemas.ts";
import { count } from "drizzle-orm";

export const handler = define.handlers({
    GET: async (_) => {

        const [{ count: total_bots }] = await db.select({ count: count() }).from(bots)
        const [{ count: total_channels }] = await db.select({ count: count() }).from(registered_channels)

        return page({ total_bots , total_channels })
    }
})

export default define.page<typeof handler>(({ data }) => {
  return (
    <>
      <Head>
        <title>Adams - Dasboard</title>
      </Head>

      <main class="size-full p-2">
        <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsBox icon={FaRobot} class="bg-secondary/20 text-secondary" text="BOTS" count={data.total_bots}/>
          <StatsBox icon={FaUsers} class="bg-primary/20 text-primary" text="CHANNELS" count={data.total_channels}/>
        </div>
      </main>
    </>
  );
});
