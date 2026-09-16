"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function CompanyStubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t, lang } = useLanguage();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <AppShell title={t.stub.companyTitle} subtitle={slug}>
      <Card className="max-w-xl">
        <p className="text-sm text-muted-foreground">{t.stub.comingInBatch}</p>
        <Link
          href="/admin"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.stub.backToOverview}
        </Link>
      </Card>
    </AppShell>
  );
}
