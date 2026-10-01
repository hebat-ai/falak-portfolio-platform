"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const ArrowIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <AppShell title={t.home.title} subtitle={t.home.subtitle}>
      <div>
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">{t.nav.portfolioOverview}</h2>
          <Link
            href="/admin"
            className="chamfer-br-sm inline-flex items-center gap-1.5 bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t.home.openAdmin}
            <ArrowIcon aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
