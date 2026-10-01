import type { SelectHTMLAttributes } from "react";

// Replaces 7 independently-duplicated `selectClass` string definitions
// across the app. Same chamfer + inset-hairline technique as Card/Table --
// a real `border` would be clipped off along the cut corner, so the
// hairline is an inset box-shadow instead (see globals.css's --inner-line
// note; this uses --control-border, the stronger-contrast token, matching
// what every one of those duplicated strings already used for selects).
export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`chamfer-br-sm w-full bg-surface px-3 py-1.5 text-sm text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${className}`}
      {...rest}
    />
  );
}
