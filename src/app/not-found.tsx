"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function NotFound() {
  const { t, lang } = useLanguage();
  const ForwardIcon = lang === "ar" ? ArrowLeft : ArrowRight;
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <AppShell title={t.notFound.title}>
      <Card className="max-w-xl">
        <p className="font-heading text-4xl font-bold text-link-foreground">404</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.notFound.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="chamfer-br-sm inline-flex items-center gap-1.5 bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t.home.openAdmin}
            <ForwardIcon aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="chamfer-br-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <BackIcon aria-hidden="true" className="h-4 w-4" />
            {t.notFound.backToHome}
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
