"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en, ar, type Dictionary } from "./dictionary";
import type { AppLocale } from "@/lib/format";

const STORAGE_KEY = "falak-prototype-lang";

interface LanguageContextValue {
  lang: AppLocale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  setLang: (lang: AppLocale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyDocumentAttributes(lang: AppLocale) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server always renders "en" -- this initial state matches that exactly,
  // so hydration never mismatches (no suppressHydrationWarning needed).
  // A saved preference (if any) is restored after hydration in the effect
  // below. That means a returning Arabic-preferring user may see a brief
  // LTR/English flash before it applies -- see PROTOTYPE_NOTES.md.
  const [lang, setLangState] = useState<AppLocale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") {
      // Intentional: the saved language preference is restored from
      // localStorage only after hydration (see the comment on `lang`'s
      // initial state above) -- this is a one-time sync from an external
      // source, not state that could be derived during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(saved);
      applyDocumentAttributes(saved);
    }
  }, []);

  function setLang(next: AppLocale) {
    setLangState(next);
    applyDocumentAttributes(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const value: LanguageContextValue = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: lang === "ar" ? ar : en,
    setLang,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
