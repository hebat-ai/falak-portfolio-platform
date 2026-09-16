"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { RevenueByCurrencyEntry } from "@/lib/revenue";

interface VehicleKpisProps {
  companiesCount: number;
  completionRate: number;
  overdueCount: number;
  revenueByCurrency: RevenueByCurrencyEntry[];
}

export function VehicleKpis({ companiesCount, completionRate, overdueCount, revenueByCurrency }: VehicleKpisProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label={t.vehicleReport.companiesLabel} value={<Num>{companiesCount}</Num>} />
        <KpiCard
          label={t.admin.kpi.completionLabel}
          value={<Num>{formatPercent(completionRate, lang)}</Num>}
          hint={t.admin.kpi.completionHint}
        />
        <KpiCard label={t.admin.kpi.overdueLabel} value={<Num>{overdueCount}</Num>} />
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
      ) : null}
    </div>
  );
}
