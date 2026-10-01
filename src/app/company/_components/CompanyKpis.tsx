"use client";

import type { ReactNode } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyValuationPointDTO } from "@/lib/company/dto";

interface CompanyKpisProps {
  currency: Currency;
  currentRevenue: number | null;
  previousRevenue: number | null;
  // null means the selected period has no predecessor at all (it's the
  // first period), distinct from "a predecessor exists but its data is
  // insufficient" -- the two states get different localized messages.
  // Already resolved to a display label by the caller -- this component
  // has no period lookup table of its own to resolve one from.
  previousPeriodLabel: string | null;
  // Falak-staff-only -- the caller passes null both when there's
  // genuinely no valuation recorded yet AND when the viewer shouldn't
  // see one at all (same "caller decides visibility, this component
  // just renders what it's given" pattern as every other prop here).
  latestValuation: CompanyValuationPointDTO | null;
}

// Fraction, not a percentage-point number -- matches every other percent
// value in this codebase (e.g. admin/page.tsx's completionRate) and is
// mathematically identical to (current-previous)/previous*100 once run
// through formatPercent, which applies the x100 and % symbol for display.
function computeRevenueGrowth(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return null;
  return (current - previous) / previous;
}

const nullStateClass = "text-sm font-normal text-muted-foreground";

export function CompanyKpis({ currency, currentRevenue, previousRevenue, previousPeriodLabel, latestValuation }: CompanyKpisProps) {
  const { t, lang } = useLanguage();

  const revenueValue: ReactNode =
    currentRevenue === null ? (
      <span className={nullStateClass}>{t.admin.table.noDataValue}</span>
    ) : (
      <Num>{formatCurrency(currentRevenue, currency, lang)}</Num>
    );

  let growthValue: ReactNode;
  let growthHint: string | undefined;

  if (previousPeriodLabel === null) {
    growthValue = <span className={nullStateClass}>{t.companyReport.revenueGrowthNoPriorPeriod}</span>;
    growthHint = undefined;
  } else {
    growthHint = `${t.companyReport.revenueGrowthVsPrefix} ${previousPeriodLabel}`;

    const growth = computeRevenueGrowth(currentRevenue, previousRevenue);
    growthValue =
      growth === null ? (
        <span className={nullStateClass}>{t.companyReport.revenueGrowthInsufficientData}</span>
      ) : (
        <Num>{formatPercent(growth, lang)}</Num>
      );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label={t.companyReport.revenueLabel} value={revenueValue} />
      <KpiCard label={t.companyReport.revenueGrowthLabel} value={growthValue} hint={growthHint} />
      {latestValuation ? (
        <KpiCard
          label={t.companyReport.latestValuationLabel}
          value={<Num>{formatCurrency(latestValuation.amount, currency, lang)}</Num>}
          hint={`${t.companyReport.valuationAsOfPrefix} ${formatDate(latestValuation.asOfDate, lang)} — ${t.valuationTypes[latestValuation.valuationType]}`}
        />
      ) : null}
    </div>
  );
}
