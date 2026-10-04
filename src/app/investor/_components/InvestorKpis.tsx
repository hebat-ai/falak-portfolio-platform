"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency/convert";

interface InvestorKpisProps {
  vehiclesExposedCount: number;
  companiesInScopeCount: number;
  investedCapital: number;
  displayCurrency: DisplayCurrency;
}

export function InvestorKpis({ vehiclesExposedCount, companiesInScopeCount, investedCapital, displayCurrency }: InvestorKpisProps) {
  const { t, lang } = useLanguage();

  return (
    <section aria-label={t.admin.kpi.summaryLabel} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label={t.admin.kpi.vehiclesLabel} value={<Num>{vehiclesExposedCount}</Num>} />
      <KpiCard label={t.investorDashboard.companiesInScopeLabel} value={<Num>{companiesInScopeCount}</Num>} />
      <KpiCard
        label={t.investorDashboard.investedCapitalLabel}
        value={<Num>{formatCurrency(investedCapital, displayCurrency, lang)}</Num>}
      />
    </section>
  );
}
