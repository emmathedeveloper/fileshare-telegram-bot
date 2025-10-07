import { define } from "../../../utils.ts";
import { FaCog, FaHome, FaRobot, FaUserEdit } from "react-icons/fa";

export default define.layout(({ Component }) => {
  const links = [
    {
      icon: FaHome,
      text: "Home",
      href: "/dashboard",
    },
    {
      icon: FaRobot,
      text: "Bots",
      href: "/dashboard/bots",
    },
    {
      icon: FaCog,
      text: "Settings",
      href: "/dashboard/settings",
    },
    {
      icon: FaUserEdit,
      text: "Access control",
      href: "/dashboard/access-control",
    },
  ];

  return (
      <div class="size-full w-full max-w-[1000px] mx-auto flex">
        <nav class="bg-base-300 w-full md:w-[300px] h-full pt-2 pl-4 flex flex-col gap-4 items-center justify-center">
          {links.map((link) => (
            <a
              href={link.href}
              class="w-full flex items-center gap-2 pl-4 p-4 aria-[current='page']:bg-base-100 aria-[current='page']:text-accent rounded-tl rounded-bl"
            >
              <link.icon size={24} />
              <p>{link.text}</p>
            </a>
          ))}
        </nav>
        <div class="flex-1 h-full">
          <Component />
        </div>
      </div>
  );
});
