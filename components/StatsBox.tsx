import { IconType } from "react-icons/lib";

type StatsBoxProps = {
    icon: IconType,
    class?: string,
    count: number,
    text: string
};

const StatsBox = (props: StatsBoxProps) => {
  return (
    <div class="flex flex-col md:flex-row md:justify-between gap-2 bg-base-300 p-2 rounded">
      <div class={`p-2 rounded w-max grid place-items-center ${props.class}`}>
        <props.icon size={24} />
      </div>
      <section class="flex items-start gap-2">
        <h1 class="text-3xl md:text-5xl">{props.count}</h1>
        <small>{props.text}</small>
      </section>
    </div>
  );
};

export default StatsBox;
