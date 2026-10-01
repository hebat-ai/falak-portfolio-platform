"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface BrandMarkProps {
  variant?: "on-dark" | "on-light";
  className?: string;
}

/**
 * Placeholder brand mark -- an original, generic geometric shape (a plain
 * solid rounded square) plus the company's own name set in the
 * placeholder fonts. This intentionally does NOT attempt to reproduce
 * Falak's actual approved logo artwork (the angular interlocking arrow
 * mark seen in references/), which remains proprietary and untouched
 * inside references/. See PROTOTYPE_NOTES.md.
 */
export function BrandMark({ variant = "on-light", className = "" }: BrandMarkProps) {
  const { lang } = useLanguage();
  const textColor = variant === "on-dark" ? "text-nav-fg" : "text-foreground";
  const subTextColor = variant === "on-dark" ? "text-nav-fg-muted" : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="chamfer-br-sm inline-block h-8 w-8 shrink-0 bg-nebula-aqua"
      />
      <span className="flex flex-col leading-tight">
        <span className={`font-heading text-base font-semibold ${textColor}`}>
          {lang === "ar" ? "فلك" : "Falak"}
        </span>
        <span className={`text-[11px] ${lang === "ar" ? "" : "tracking-wide"} ${subTextColor}`}>
          {lang === "ar" ? "الاستثمارية" : "Ventures"}
        </span>
      </span>
    </div>
  );
}
