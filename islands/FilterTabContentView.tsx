import { Signal } from "@preact/signals";
import { TelegramChat } from "../lib/types.ts";
import FilterItemCard from "./FilterItemCard.tsx";

export type Item = {
    user: TelegramChat;
    bot_info: {
        id: string;
        telegram_id: string;
        username: string;
        token: string;
        created_at: Date;
    };
    id: string;
    bot_id: string;
    created_at: Date;
    user_telegram_id: string;
    status: string;
    upload_step: {
        status: string;
        data?: any;
    };
}

type FilterTabContentViewProps = {
  currentTab: Signal<string>;
  items: Signal<Item[]>
};

const FilterTabContentView = ({ currentTab , items } : FilterTabContentViewProps) => {

  return (
    <div class="grid grid-cols-2 gap-4">
      {items.value.filter((i) => i.status == currentTab.value).map((item) => (
        <FilterItemCard item={item} items={items}/>
      ))}
    </div>
  );
};

export default FilterTabContentView;
