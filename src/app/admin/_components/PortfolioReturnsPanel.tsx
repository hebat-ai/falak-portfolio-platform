"use client";

import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { PortfolioReturnSummary } from "@/lib/admin/portfolio-returns";

interface PortfolioReturnsPanelProps {
  returns: PortfolioReturnSummary[];
}

// GP-level "how is Falak's own deployed capital performing" view -- one
// row of KPI tiles per currency, never blended (same discipline as
// PortfolioNavPanel/InvestorReturnsPanel). Distinct from a single
// investor's own MOIC/IRR (InvestorReturnsPanel, LP-level) and from
// Portfolio NAV (a vehicle's own fund-structure NAV mark): this measures
// invested-capital-in vs. current ownership-weighted value-out across
// every company in the portfolio.
export function PortfolioReturnsPanel({ returns }: PortfolioReturnsPanelProps) {
  const { t, lang } = useLanguage();

  if (returns.length === 0) {
    return null;
  }

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.charts.portfolioReturnsTitle}</h2>
      <div className="mt-3 space-y-4">
        {returns.map((r) => (
          <div key={r.currency} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t.currencyNames[r.currency]}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label={t.admin.charts.investedCapitalLabel}
                value={<Num>{formatCurrency(r.investedCapital, r.currency, lang)}</Num>}
              />
              <KpiCard
                label={t.admin.charts.distributedCapitalLabel}
                value={<Num>{formatCurrency(r.distributed, r.currency, lang)}</Num>}
              />
              <KpiCard
                label={t.admin.charts.currentAttributableValueLabel}
                value={<Num>{formatCurrency(r.currentValue, r.currency, lang)}</Num>}
              />
              <KpiCard
                label={t.admin.charts.portfolioMoicLabel}
                value={r.moic === null ? t.admin.charts.moicNotAvailableLabel : <Num>{r.moic.toFixed(2)}x</Num>}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
