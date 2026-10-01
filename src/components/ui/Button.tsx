import type { ButtonHTMLAttributes, ReactNode } from "react";

// Falak Ventures' brand action control: chamfered bottom-right corner,
// flat fill, no scale/bounce on interaction. Variants/sizes/behavior match
// the design system's Button.prompt.md rules. `primary` is the only fill
// used for the single main action per view; `secondary` is Dark Nebula;
// `outline`/`ghost` are tertiary. Hover darkens the fill one ramp step,
// press darkens further plus a 1px downward nudge -- both via Tailwind's
// built-in :hover/:active, no JS state needed (unlike the design system's
// own reference implementation, which tracks hover/press in React state to
// work outside a Tailwind/CSS-class environment).
const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-nebula-aqua text-dark-green hover:bg-[#00905b] active:bg-[#00744a]",
  secondary: "bg-dark-nebula text-white hover:bg-[#1d474d] active:bg-dark-green",
  outline:
    "bg-transparent text-foreground shadow-[inset_0_0_0_2px_var(--brand-dark-nebula)] hover:bg-[#e0f7ed] active:bg-[#9fe6c9]",
  ghost: "bg-transparent text-link-foreground hover:bg-[#e0f7ed] active:bg-[#9fe6c9]",
};

const SIZE_CLASSES: Record<string, string> = {
  // Compact inline row-action size (archive/revoke/review/copy-link) --
  // no fixed control height, tighter than even `sm`, matching the pattern
  // already in use for those actions app-wide.
  xs: "px-2 py-1 text-xs",
  sm: "h-control-sm gap-2 px-4 text-sm",
  md: "h-control-md gap-2 px-5 text-base",
  lg: "h-control-lg gap-3 px-6 text-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`chamfer-br-sm inline-flex items-center justify-center font-bold tracking-[var(--ls-label)] transition-[background-color,color,transform] duration-120 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-mint focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-muted-foreground ${
        block ? "flex w-full" : ""
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
