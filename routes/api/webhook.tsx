import { define } from "../../utils.ts";


export const handler = define.handlers({
    GET: async () => {

        return new Response("Webhook processed");
    }
})