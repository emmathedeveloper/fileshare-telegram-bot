import { TelegramMessage } from "./types.ts";




export default class WebhookHandler {
    
    static async HandleChannelPost({ text , ...rest }: TelegramMessage) {
        
        if(text && WebhookChannelPostHandler.IsGateChannelLinking(text)){
            return await WebhookChannelPostHandler.HandleChannelPost({ text , ...rest });
        }

        return new Response(JSON.stringify("Received a channel post"), { status: 200 });
    }

    static async HandlePrivateMessage(message: TelegramMessage) {
        console.log("Received a private message:", message);
    }
}

class WebhookChannelPostHandler {
    static async HandleChannelPost({ text }: TelegramMessage) {
        
        // const link_token

        return new Response(JSON.stringify("Received a channel post"), { status: 200 });
    }

    static async HandleGateChannelLinking({ text }: TelegramMessage) {

        if (!text) {
            return new Response(JSON.stringify({ ok: false, error: "No text provided." }), { status: 400 });
        }

        const parts = text.split(" ");

        if (parts.length !== 2) {
            return new Response("Invalid command format. Use /<bot_username>_link <link_token>");
        }

        const link_token = parts[1].trim();

        if (!link_token) {
            return new Response("Link token is missing.");
        }

        // Here you would typically verify the link_token and associate the channel with a user or perform other actions.



        return new Response(JSON.stringify({ ok: true, message: "Channel linked successfully." }), { status: 200 });
    }

    static IsGateChannelLinking(text: string){
        return text.startsWith(`/${Deno.env.get("TELEGRAM_BOT_USERNAME")}_link`);
    }
}

// class WebhookPrivateMessageHandler {
//     static async HandlePrivateMessage(message: TelegramMessage) {
//         console.log("Received a private message:", message);
//     }
// }