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
  KeyRound,
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
    | "access"
  >;
  href: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: "portfolioOverview", href: "/admin", Icon: LayoutDashboard },
  { key: "investorDashboard", href: "/investor", Icon: PieChart },
  { key: "vehicleDashboard", href: "/vehicle", Icon: Landmark },
  { key: "companyReports", href: "/company", Icon: Building2 },
  { key: "startupForm", href: "/submit", Icon: ClipboardList },
  { key: "reviewWorkspace", href: "/review", Icon: ShieldCheck },
  { key: "access", href: "/admin/access", Icon: KeyRound },
];

// The single item whose href is the longest segment-wise prefix of the
// current path -- so /admin/access highlights "Access" only, not also
// "Portfolio Overview" (/admin).
function activeHref(pathname: string | null): string | null {
  if (!pathname) return null;
  const matches = NAV_ITEMS.map((i) => i.href).filter((h) => pathname === h || pathname.startsWith(`${h}/`));
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function SidebarNavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const current = activeHref(pathname);

  return (
    <nav aria-label={t.common.appName} className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === current;
        const label = t.nav[item.key];

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`chamfer-br-sm flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-aqua ${
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
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-nav-bg xl:flex xl:sticky xl:top-0 xl:h-screen xl:self-start xl:overflow-y-auto">
      <div className="p-4">
        <BrandMark variant="on-dark" />
      </div>
      <SidebarNavList />
    </aside>
  );
}
