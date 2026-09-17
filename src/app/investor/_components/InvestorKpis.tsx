"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { RevenueByCurrencyEntry } from "@/lib/revenue";

interface InvestorKpisProps {
  vehiclesExposedCount: number;
  companiesInScopeCount: number;
  revenueByCurrency: RevenueByCurrencyEntry[];
}

export function InvestorKpis({ vehiclesExposedCount, companiesInScopeCount, revenueByCurrency }: InvestorKpisProps) {
  const { t, lang } = useLanguage();

  return (
    <section aria-label={t.admin.kpi.summaryLabel} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard label={t.admin.kpi.vehiclesLabel} value={<Num>{vehiclesExposedCount}</Num>} />
        <KpiCard label={t.investorDashboard.companiesInScopeLabel} value={<Num>{companiesInScopeCount}</Num>} />
      </div>

      {revenueByCurrency.length > 0 ? (
        <div>
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
      ) : (
        <p className="text-sm text-muted-foreground">{t.investorDashboard.noApprovedReports}</p>
      )}
    </section>
  );
}
