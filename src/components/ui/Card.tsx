import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddingClass = padding === "none" ? "" : padding === "sm" ? "p-4" : "p-5";
  // chamfer-br-md replaces the soft rounded corner; shadow-[var(--inner-line)]
  // replaces `border` -- a real border gets silently clipped off along a
  // chamfered edge, but an inset box-shadow survives clip-path (see
  // globals.css's --inner-line token).
  return (
    <div className={`chamfer-br-md bg-surface shadow-[var(--inner-line)] ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}
