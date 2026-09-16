"use client";

import Link from "next/link";
import {
  PieChart,
  Landmark,
  Building2,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface ComingSoonItem {
  key: keyof Pick<
    Dictionary["nav"],
    "investorDashboard" | "vehicleDashboard" | "companyReports" | "startupForm" | "reviewWorkspace"
  >;
  Icon: LucideIcon;
}

// Mirrors Sidebar's disabled nav items -- kept as a small local list here
// rather than importing Sidebar's internal array, since that array isn't
// exported and duplicating five {key, Icon} pairs is simpler than adding
// a new shared file to the (already agreed) file count.
const COMING_SOON_ITEMS: ComingSoonItem[] = [
  { key: "investorDashboard", Icon: PieChart },
  { key: "vehicleDashboard", Icon: Landmark },
  { key: "companyReports", Icon: Building2 },
  { key: "startupForm", Icon: ClipboardList },
  { key: "reviewWorkspace", Icon: ShieldCheck },
];

export default function HomePage() {
  const { t, lang } = useLanguage();
  const ArrowIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <AppShell title={t.home.title} subtitle={t.home.subtitle}>
      <div className="space-y-8">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-nebula-aqua/10 px-3 py-1 text-xs font-medium text-link-foreground">
              {t.home.batch1Label}
            </span>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t.nav.portfolioOverview}
              </h2>
              <p className="text-sm text-muted-foreground">{t.home.availableNow}</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t.home.openAdmin}
            <ArrowIcon aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Card>

        <div>
          <h2 className="font-heading mb-3 text-sm font-semibold text-foreground">{t.home.comingLater}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMING_SOON_ITEMS.map((item) => (
              <Card key={item.key} padding="sm" className="flex items-center gap-3 opacity-70">
                <item.Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t.nav[item.key]}</span>
                <span className="ms-auto rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {t.nav.comingSoonBadge}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
