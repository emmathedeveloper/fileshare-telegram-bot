import { define } from "../../utils.ts";


export const handler = define.handlers({
    GET: () => {
        return new Response("Webhook is running");
    }
})