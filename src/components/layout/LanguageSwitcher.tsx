"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, t, setLang } = useLanguage();
  const nextLang = lang === "en" ? "ar" : "en";
  const ariaLabel = lang === "en" ? t.language.ariaSwitchToArabic : t.language.ariaSwitchToEnglish;
  const buttonText = lang === "en" ? t.language.buttonLabelAr : t.language.buttonLabelEn;

  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      aria-label={ariaLabel}
      className={`chamfer-br-sm inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${className}`}
    >
      <Languages aria-hidden="true" className="h-4 w-4" />
      <span>{buttonText}</span>
    </button>
  );
}
