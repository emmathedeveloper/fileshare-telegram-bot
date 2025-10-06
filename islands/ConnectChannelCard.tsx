import { useSignal } from "@preact/signals";
import { TelegramChat } from "../lib/types.ts";
import { IS_BROWSER } from "fresh/runtime";

type ConnectChannelCardProps = {
    channel: {
        info: TelegramChat
        id: string;
        added_at: Date;
        channel_id: string;
        status: "connected" | "disconnected"
    },
    botId: string
}

const ConnectChannelCard = ({ channel , botId } : ConnectChannelCardProps) => {

  const connection_state = useSignal<'disconnected' | 'connecting' | 'disconnecting' | 'connected'>(channel.status)

    const toggleConnection = async () => {
    try {

      const initial_state = connection_state.value

      connection_state.value = connection_state.value == "disconnected" ? "connecting" : "disconnecting"

      const response = await fetch(`/api/bots/${botId}/ad-channels` , {
        method: initial_state == "disconnected" ? "POST" : "DELETE",
        body: JSON.stringify({
            channel_id: channel.id
        }),
        headers: {
            "Content-Type": "application/json"
        }
      })

      if(!response.ok) throw new Error("Something went wrong")

      connection_state.value = connection_state.value == "connecting" ? "connected" : "disconnected"

    } catch (error) {
      console.log(error)
      connection_state.value = connection_state.value == "connecting" ? "disconnected" : "connected"
    }
  }

  if(!IS_BROWSER) return

  return (
    <div class="w-full flex items-center justify-between bg-base-300 rounded p-2 mb-4">
      <p>{channel.info.title}</p>

      <button 
      aria-state={connection_state.value} onClick={() => toggleConnection()} 
      disabled={["connecting" , "disconnecting"].includes(connection_state.value)} 
      class={`btn aria-[state='disconnected']:btn-accent aria-[state='connected']:btn-error`}>
        { connection_state.value == "connected" && "DISCONNECT" }
        { connection_state.value == "connecting" && "CONNECTING..." }
        { connection_state.value == "disconnecting" && "DISCONNECTING..." }
        { connection_state.value == "disconnected" && "CONNECT" }
      </button>
    </div>
  );
};

export default ConnectChannelCard;
