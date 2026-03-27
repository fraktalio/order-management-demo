import NavigationBar from "./NavigationBar.tsx";

export default function Header(
  props: {
    title: string;
    isSticky: boolean;
    isHome?: boolean;
    currentPath?: string;
  },
) {
  const isSticky = props.isSticky;
  const isHome: boolean = props.isHome ?? false;

  return (
    <header
      class={[
        "mx-auto flex gap-3 items-center",
        isHome ? "justify-end" : "justify-between",
        isSticky
          ? "h-20 max-w-screen-2xl w-full sticky top-0 bg-background/75 text-[hsl(var(--muted-foreground))] z-50 backdrop-blur-sm"
          : "h-20 max-w-7xl",
      ].join(" ")}
      f-client-nav={false}
    >
      {!isHome && (
        <div class="text-[hsl(var(--foreground))] p-4 flex items-center">
          <Logo />
        </div>
      )}
      <NavigationBar currentPath={props.currentPath} />
    </header>
  );
}

export function Logo() {
  return (
    <a
      href="/"
      class="flex mr-3 items-center shrink-0 font-bold"
      aria-label="Top Page"
    >
      <img
        src="/logo-white.webp"
        alt="Fraktalio logo"
        width={14}
        height={28}
        class="hidden dark:block"
      />
      <img
        src="/logo.webp"
        alt="Fraktalio logo"
        width={14}
        height={18}
        class="block dark:hidden"
      />
      {"{ restaurant }"}
    </a>
  );
}
