import { define } from "../../../../../utils.ts";



export const handler = define.handlers({
    GET: async (ctx) => {

        const botId = ctx.params.botId;

        return new Response("Bot: " + botId + " endpoint is working");
    }
})