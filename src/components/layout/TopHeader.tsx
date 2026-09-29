"use client";

import { Menu, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { formatDate, DASHBOARD_SNAPSHOT_DATE } from "@/lib/format";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  viewerRoleLabel?: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
  drawerId: string;
}

export function TopHeader({ title, subtitle, viewerRoleLabel, menuOpen, onOpenMenu, drawerId }: TopHeaderProps) {
  const { t, lang } = useLanguage();
  const snapshotIso = DASHBOARD_SNAPSHOT_DATE.toISOString().slice(0, 10);

  return (
    <header className="flex flex-col gap-3 border-b border-border-subtle bg-surface px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t.nav.openMenu}
          aria-expanded={menuOpen}
          aria-controls={drawerId}
          className="rounded-md p-2 text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground xl:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {viewerRoleLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground">
            <User aria-hidden="true" className="h-3.5 w-3.5" />
            {t.common.viewingAsLabel}: {viewerRoleLabel}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {t.common.dataAsOfLabel} <time dateTime={snapshotIso}>{formatDate(snapshotIso, lang)}</time>
        </span>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
