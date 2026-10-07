"use client";

import { Menu } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SignOutButton } from "./SignOutButton";
import { BackButton } from "./BackButton";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
  drawerId: string;
}

export function TopHeader({ title, subtitle, menuOpen, onOpenMenu, drawerId }: TopHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="flex flex-col gap-3 border-b border-border-subtle bg-surface px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t.nav.openMenu}
          aria-expanded={menuOpen}
          aria-controls={drawerId}
          className="chamfer-br-sm p-2 text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground xl:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <BackButton />
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <SignOutButton />
      </div>
    </header>
  );
}
