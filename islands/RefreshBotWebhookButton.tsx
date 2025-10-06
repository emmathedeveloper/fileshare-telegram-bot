import { IS_BROWSER } from "fresh/runtime";
import { FaHistory } from "react-icons/fa";
import { useSignal } from "@preact/signals";

type RefreshBotWebhookButtonProps = {
    botId: string
}

const RefreshBotWebhookButton = ({ botId } : RefreshBotWebhookButtonProps) => {
  const refresh_state = useSignal<"idle" | "refreshing" | "success" | "error">(
    "idle",
  );

  if (!IS_BROWSER) return;

  const handleClick = async () => {
    try {
      refresh_state.value = "refreshing";

      const response = await fetch(`/api/bots/${botId}/all-channels`);

      if (!response.ok) throw new Error("Something went wrong");

      const data = await response.json();

      refresh_state.value = "success"
    } catch (error) {
        console.log(error)
      refresh_state.value = "error";
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={refresh_state.value == "refreshing"}
      class="btn btn-error"
    >
      REFRESH BOT WEBHOOK
      <FaHistory />
    </button>
  );
};

export default RefreshBotWebhookButton;
