"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import { computeValuationTotalsByCurrency } from "@/lib/admin/valuation-totals";
import type { AdminCompanyValuationDTO } from "@/lib/admin/dto";

interface PortfolioValuationSummaryProps {
  companies: AdminCompanyValuationDTO[];
}

export function PortfolioValuationSummary({ companies }: PortfolioValuationSummaryProps) {
  const { t, lang } = useLanguage();
  const totals = computeValuationTotalsByCurrency(companies);

  if (totals.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {totals.map((entry) => (
        <KpiCard
          key={entry.currency}
          label={`${t.admin.charts.portfolioValuationViewLabel} — ${t.currencyNames[entry.currency]}`}
          value={<Num>{formatCurrency(entry.total, entry.currency, lang)}</Num>}
          hint={
            entry.excludedCount > 0
              ? `${t.admin.kpi.excludesPrefix} ${entry.excludedCount} ${t.admin.charts.excludesNoValuationSuffix}`
              : undefined
          }
        />
      ))}
    </div>
  );
}
