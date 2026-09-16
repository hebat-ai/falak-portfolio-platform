import type { ReactNode } from "react";

interface NumProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps numeric/currency text so digits always render left-to-right and
 * stay visually intact even when embedded inside Arabic (RTL) sentence
 * flow -- uses an explicit dir + unicode-bidi isolation, not just
 * font/layout mirroring.
 */
export function Num({ children, className = "" }: NumProps) {
  return (
    <span dir="ltr" style={{ unicodeBidi: "isolate" }} className={`tabular-nums ${className}`}>
      {children}
    </span>
  );
}
