"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const ariaLabel = theme === "light" ? t.theme.ariaSwitchToDark : t.theme.ariaSwitchToLight;
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-md border border-control-border bg-surface p-1.5 text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${className}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
