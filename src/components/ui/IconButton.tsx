import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  // Toggle-pressed visual state (e.g. a table/cards view switch) -- aqua
  // fill when active, matching the brand's primary-action fill.
  active?: boolean;
}

export function IconButton({ children, active, className = "", ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`chamfer-br-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
        active ? "bg-nebula-aqua text-dark-green" : "text-muted-foreground hover:bg-surface-muted"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
