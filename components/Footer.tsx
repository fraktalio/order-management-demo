import type { JSX } from "preact";

const LINKS = [
  {
    title: "Privacy Policy",
    href: "/privacy",
  },
  {
    title: "Terms Of Use",
    href: "/terms",
  },
];

export default function Footer(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      class={`border-t-2 md:h-16 flex justify-center md:mx-16 ${
        props.class ?? ""
      }`}
    >
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center max-w-7xl mx-auto w-full sm:px-6 md:px-8 p-4">
        <div class="text-muted-foreground text-center">
          <span>
            © {new Date().getFullYear()}{" "}
            <a href="https://fraktalio.com">Fraktalio</a>
          </span>
        </div>

        <div class="flex items-center gap-8">
          <a
            class="text-muted-foreground hover:underline"
            href="mailto:info@fraktalio.com"
          >
            info@fraktalio.com
          </a>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              class="text-muted-foreground hover:underline"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
