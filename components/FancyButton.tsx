import type { ComponentChildren, JSX } from "preact";

type Variant = "primary" | "secondary" | "destructive" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  children?: ComponentChildren;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  class?: string;
  disabled?: boolean;
  id?: string;
}

interface ButtonProps extends BaseProps {
  href?: never;
  onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

interface LinkProps extends BaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

export type FancyButtonProps = ButtonProps | LinkProps;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-80",
  destructive:
    "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90",
  outline:
    "border border-[hsl(var(--input))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]",
  ghost:
    "bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-4 py-2.5 rounded-sm",
  md: "text-base px-5 py-3 rounded-md",
  lg: "text-lg px-8 py-4 rounded-md",
};

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      class="relative ml-2 bottom-[0.05em] transition-transform ease-out duration-150 group-hover:translate-x-1"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      stroke-width="3"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </svg>
  );
}

export function FancyButton(props: FancyButtonProps) {
  const {
    variant = "primary",
    size = "md",
    arrow = false,
    disabled = false,
    id,
    children,
  } = props;

  const classes = [
    "group inline-flex items-center justify-center font-semibold leading-none",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
    variantClasses[variant],
    sizeClasses[size],
    disabled ? "opacity-50 pointer-events-none" : "cursor-pointer",
    props.class ?? "",
  ].join(" ");

  if (props.href) {
    return (
      <a href={props.href} id={id} class={classes} aria-disabled={disabled}>
        {children}
        {arrow && <ArrowIcon />}
      </a>
    );
  }

  return (
    <button
      id={id}
      type={(props as ButtonProps).type ?? "button"}
      onClick={(props as ButtonProps).onClick}
      disabled={disabled}
      class={classes}
    >
      {children}
      {arrow && <ArrowIcon />}
    </button>
  );
}
