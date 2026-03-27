import ThemeToggle from "../islands/ThemeToogle.tsx";
import * as Icons from "./Icons.tsx";

export default function NavigationBar(
  props: { class?: string; currentPath?: string },
) {
  const items = [
    { name: "Restaurant", href: "/restaurant" },
    { name: "Place Order", href: "/order" },
    { name: "Kitchen", href: "/kitchen" },
  ];

  return (
    <nav class={`relative ${props.class ?? ""}`}>
      {/* Hamburger Button */}
      <input type="checkbox" id="menu-toggle" class="hidden peer" />
      <label
        for="menu-toggle"
        class="lg:hidden p-2 cursor-pointer flex items-center"
      >
        <Icons.Menu />
      </label>

      {/* Navigation Menu */}
      <ul
        class="absolute lg:static right-0 top-12 bg-[hsl(var(--background))] border-dotted border lg:border-none border-red-500 lg:bg-transparent shadow-md lg:shadow-none p-4 lg:p-0 flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mx-4 my-2 lg:my-6 flex-wrap lg:mx-8 2xl:mr-0 transition-all duration-300 ease-in-out hidden peer-checked:flex lg:flex"
        id="menu"
      >
        {items.map((item) => {
          const isActive = props.currentPath === item.href ||
            (item.href !== "/" && props.currentPath?.startsWith(item.href));

          // Special styling for Services link
          const isServicesLink = item.name === "Services";

          let linkClasses = "p-1 sm:p-2 hover:underline";

          if (isServicesLink) {
            // Red color for Services link
            linkClasses += isActive
              ? " font-bold underline text-[hsl(var(--foreground))]"
              : " underline";
          } else {
            // Default styling for other links
            linkClasses += isActive
              ? " font-bold text-[hsl(var(--foreground))]"
              : "";
          }

          return (
            <li key={item.name}>
              <a
                href={item.href}
                class={linkClasses}
                aria-current={isActive ? "page" : undefined}
              >
                {item.name}
              </a>
            </li>
          );
        })}
        <li key="fraktalio">
          <a
            href="https://fraktalio.com"
            class="p-1 sm:p-2 underline hover:underline text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            fraktalio.com
          </a>
        </li>
        <li class="flex items-center">
          <a
            href="https://github.com/fraktalio"
            class="hover:text-blue-500 inline-block transition"
            aria-label="GitHub"
          >
            <Icons.GitHub />
          </a>
        </li>
        <li class="flex items-center">
          <ThemeToggle />
        </li>
      </ul>
    </nav>
  );
}
