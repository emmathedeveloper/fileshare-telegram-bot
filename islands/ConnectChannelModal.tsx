// deno-lint-ignore-file react-rules-of-hooks
import { IS_BROWSER } from "fresh/runtime";
import { useSignal } from "@preact/signals";
import { TelegramChat } from "../lib/types.ts";
import ConnectChannelCard from "./ConnectChannelCard.tsx";

type ConnectChannelModalProps = {
  botId: string;
};

const ConnectChannelModal = ({ botId }: ConnectChannelModalProps) => {
  if (!IS_BROWSER) return;

  const channels_load_state = useSignal<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const disconnected_channels = useSignal<{
    info: TelegramChat;
    id: string;
    added_at: Date;
    channel_id: string;
    status: "connected" | "disconnected";
  }[]>([]);

  const loadChannels = async () => {
    try {
      channels_load_state.value = "loading";

      const response = await fetch(`/api/bots/${botId}/all-channels`);

      if (!response.ok) throw new Error("Something went wrong");

      const data = await response.json();

      disconnected_channels.value = data;
    } catch (error) {
      console.log(error);
      channels_load_state.value = "error";
    }
  };

  return (
    <dialog
      onToggle={(e) => e.newState == "open" ? loadChannels() : null}
      id="my_modal_1"
      class="modal"
    >
      <div class="modal-box">
        <h1>Add a channel</h1>
        <div class="h-[500px] overflow-y-auto my-4">
          {disconnected_channels.value.map((c) => (
            <ConnectChannelCard key={c.id} botId={botId} channel={c} />
          ))}
        </div>
        <form method="dialog w-full">
          <button class="btn w-full">Close</button>
        </form>
      </div>
    </dialog>
  );
};

export default ConnectChannelModal;
