import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddingClass = padding === "none" ? "" : padding === "sm" ? "p-4" : "p-5";
  return (
    <div className={`rounded-xl border border-border-subtle bg-surface shadow-sm ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}
