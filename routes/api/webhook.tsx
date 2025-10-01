import { define } from "../../utils.ts";


export default define.handlers({
    GET: () => {
        return new Response("Webhook is running");
    }
})