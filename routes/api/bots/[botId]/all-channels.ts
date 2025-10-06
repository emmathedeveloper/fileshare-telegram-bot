import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db/index.ts";
import { define } from "../../../../utils.ts";
import { bot_channels, registered_channels } from "../../../../lib/db/schemas.ts";
import { getChannelInfo } from "../../../../lib/helpers.ts";



export const handler = define.handlers({
    GET: async ctx => {

        const bot_id = ctx.params.botId

        const channels = await db.query.bot_channels.findMany({
            where: eq(bot_channels.bot_id , bot_id),
            with: {
                channel: true
            },
        })

        const disconnected_channels = (await db.query.registered_channels.findMany({
            where: (t , { notInArray }) =>  notInArray(t.id , channels.map(c => c.channel_id))
        })).map(c => c.id)

        const all_channels = await db.select().from(registered_channels)

        const altered_channels = (await Promise.all(all_channels.map(async c => {

            const info = await getChannelInfo(c.channel_id)

            if(!info) return

            return {
                ...c,
                status: disconnected_channels.includes(c.id) ? "disconnected" : "connected",
                info
            }
        }))).filter(c => !!c)

        return new Response(JSON.stringify(altered_channels) , {
            headers: {
                "Content-Type": "application/json"
            },
            status: 200
        })
    } 
})