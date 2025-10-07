import { Signal, useSignal } from "@preact/signals";
import { Item } from "./FilterTabContentView.tsx";

type FilterItemCardProps = {
  item: Item;
  items: Signal<Item[]>;
};

const FilterItemCard = ({ item , items }: FilterItemCardProps) => {
  const load_state = useSignal<"idle" | "loading" | "error">("idle");

  const handleClick = async (status: string) => {
    try {
      load_state.value = "loading";

      const response = await fetch(
        `/api/bots/${item.bot_id}/approve-user`,
        {
          method: "POST",
          body: JSON.stringify({
            user_telegram_id: item.user_telegram_id,
            status,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) throw new Error("Something went wrong");

      load_state.value = "idle";

      items.value = [...items.value.filter(i => i.id !== item.id) , { ...item , status }]
    } catch (error) {
      console.log(error);
      load_state.value = "error";
    }
  };

  return (
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">
          {item.user.first_name || item.user.last_name ||
            item.user.username}
        </h2>
        <p class="mb-4">
          {item.user.bio}
        </p>
<p>ACCESS FOR: {item.bot_info?.username}</p>
        {item.status == "pending" &&
          (
            <button
              onClick={() => handleClick("approved")}
              disabled={load_state.value == "loading"}
              class="btn btn-accent w-full"
            >
              {load_state.value == "idle" && "APPROVE"}
              {load_state.value == "loading" && "APPROVING..."}
              {load_state.value == "error" && "TRY AGAIN"}
            </button>
          )}
        {item.status == "approved" &&
          (
            <button
              onClick={() => handleClick("revoked")}
              disabled={load_state.value == "loading"}
              class="btn btn-error w-full"
            >
              {load_state.value == "idle" && "REVOKE"}
              {load_state.value == "loading" && "REVOKING..."}
              {load_state.value == "error" && "TRY AGAIN"}
            </button>
          )}
        {item.status == "revoked" &&
          (
            <button
              onClick={() => handleClick("approved")}
              disabled={load_state.value == "loading"}
              class="btn btn-primary w-full"
            >
              {load_state.value == "idle" && "RESTORE"}
              {load_state.value == "loading" && "RESTORING..."}
              {load_state.value == "error" && "TRY AGAIN"}
            </button>
          )}
      </div>
    </div>
  );
};

export default FilterItemCard;
