"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Landmark,
  Building2,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BrandMark } from "@/components/brand/BrandMark";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface NavItemConfig {
  key: keyof Pick<
    Dictionary["nav"],
    | "portfolioOverview"
    | "investorDashboard"
    | "vehicleDashboard"
    | "companyReports"
    | "startupForm"
    | "reviewWorkspace"
  >;
  href: string;
  Icon: LucideIcon;
  enabled: boolean;
}

// Only Portfolio Overview is real in Batch 1. The rest are visible (so the
// prototype's full intended IA is legible during review) but intentionally
// non-interactive -- rendered as <span aria-disabled>, not dead links.
const NAV_ITEMS: NavItemConfig[] = [
  { key: "portfolioOverview", href: "/admin", Icon: LayoutDashboard, enabled: true },
  { key: "investorDashboard", href: "/investor", Icon: PieChart, enabled: true },
  { key: "vehicleDashboard", href: "/vehicle", Icon: Landmark, enabled: false },
  { key: "companyReports", href: "/company", Icon: Building2, enabled: true },
  { key: "startupForm", href: "/submit", Icon: ClipboardList, enabled: false },
  { key: "reviewWorkspace", href: "/review", Icon: ShieldCheck, enabled: true },
];

export function SidebarNavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav aria-label={t.common.appName} className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.enabled && pathname?.startsWith(item.href);
        const label = t.nav[item.key];

        if (!item.enabled) {
          return (
            <span
              key={item.key}
              aria-disabled="true"
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-nav-fg-muted"
            >
              <span className="flex items-center gap-3">
                <item.Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {label}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {t.nav.comingSoonBadge}
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-aqua ${
              isActive ? "bg-white/10 text-nav-fg" : "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg"
            }`}
          >
            <item.Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { t } = useLanguage();
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-nav-bg xl:flex xl:sticky xl:top-0 xl:h-screen xl:self-start xl:overflow-y-auto">
      <div className="p-4">
        <BrandMark variant="on-dark" />
      </div>
      <SidebarNavList />
      <div className="mt-auto p-4 text-[11px] text-nav-fg-muted">{t.common.syntheticDataNotice}</div>
    </aside>
  );
}
