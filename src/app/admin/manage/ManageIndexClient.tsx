"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

const MANAGE_CARDS: { key: keyof Dictionary["admin"]["manage"]; href: string }[] = [
  { key: "createCompanyTitle", href: "/admin/manage/new-company" },
  { key: "createVehicleTitle", href: "/admin/manage/new-vehicle" },
  { key: "createInvestorTitle", href: "/admin/manage/new-investor" },
  { key: "createTemplateTitle", href: "/admin/manage/new-reporting-template" },
  { key: "createCycleTitle", href: "/admin/manage/new-reporting-cycle" },
  { key: "invitesSectionTitle", href: "/admin/manage/invites" },
  { key: "vehicleAssignmentTitle", href: "/admin/manage/vehicle-assignment" },
  { key: "recordCompanyValuationTitle", href: "/admin/manage/company-valuation" },
  { key: "recordVehicleValuationTitle", href: "/admin/manage/vehicle-valuation" },
  { key: "recordCapitalTransactionTitle", href: "/admin/manage/capital-transaction" },
  { key: "auditLogTitle", href: "/admin/manage/audit-log" },
];

export function ManageIndexClient() {
  const { t, lang } = useLanguage();
  const ArrowIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <AppShell title={t.admin.manage.sectionTitle} subtitle={t.admin.manage.indexSubtitle}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MANAGE_CARDS.map((card) => (
          <Card key={card.key} className="flex items-center justify-between gap-2">
            <span className="font-heading text-sm font-semibold text-foreground">{t.admin.manage[card.key]}</span>
            <Link
              href={card.href}
              className="chamfer-br-sm shrink-0 p-1.5 text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              aria-label={t.admin.manage[card.key]}
            >
              <ArrowIcon aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
