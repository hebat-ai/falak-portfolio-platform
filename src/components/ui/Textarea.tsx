import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`chamfer-br-sm w-full bg-surface px-3 py-1.5 text-sm text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${className}`}
      {...rest}
    />
  );
}
