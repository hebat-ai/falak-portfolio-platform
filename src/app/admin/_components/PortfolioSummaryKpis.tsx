"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Currency } from "@/lib/mock/types";

interface RevenueByCurrency {
  currency: Currency;
  total: number;
  excludedCount: number;
}

interface PortfolioSummaryKpisProps {
  companiesCount: number;
  vehiclesCount: number;
  investorsCount: number;
  completionRate: number;
  overdueCount: number;
  revenueByCurrency: RevenueByCurrency[];
}

export function PortfolioSummaryKpis({
  companiesCount,
  vehiclesCount,
  investorsCount,
  completionRate,
  overdueCount,
  revenueByCurrency,
}: PortfolioSummaryKpisProps) {
  const { t, lang } = useLanguage();

  return (
    <section aria-label={t.admin.kpi.summaryLabel} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label={t.admin.kpi.companiesLabel} value={<Num>{companiesCount}</Num>} />
        <KpiCard label={t.admin.kpi.vehiclesLabel} value={<Num>{vehiclesCount}</Num>} />
        <KpiCard label={t.admin.kpi.investorsLabel} value={<Num>{investorsCount}</Num>} />
        <KpiCard
          label={t.admin.kpi.completionLabel}
          value={<Num>{formatPercent(completionRate, lang)}</Num>}
          hint={t.admin.kpi.completionHint}
        />
        <KpiCard label={t.admin.kpi.overdueLabel} value={<Num>{overdueCount}</Num>} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            {t.admin.kpi.revenueSectionLabel}
          </h2>
          <span className="text-xs text-muted-foreground">{t.admin.kpi.noCrossCurrencyNote}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {revenueByCurrency.map((entry) => (
            <KpiCard
              key={entry.currency}
              label={t.currencyNames[entry.currency]}
              value={<Num>{formatCurrency(entry.total, entry.currency, lang)}</Num>}
              hint={
                entry.excludedCount > 0
                  ? `${t.admin.kpi.excludesPrefix} ${entry.excludedCount} ${t.admin.kpi.excludesSuffixSingular}`
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
