"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "falak-prototype-theme";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDocumentTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server always renders with no data-theme attribute (= light) -- this
  // initial state matches that exactly, so hydration never mismatches. A
  // saved preference (if any) is restored after hydration in the effect
  // below -- same brief-flash tradeoff as LanguageProvider, documented
  // there and in PROTOTYPE_NOTES.md.
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      // Intentional: same one-time post-hydration external-storage sync
      // as LanguageProvider's saved-language restoration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(saved);
      applyDocumentTheme(saved);
    }
  }, []);

  function setTheme(next: AppTheme) {
    setThemeState(next);
    applyDocumentTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const value: ThemeContextValue = { theme, setTheme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
