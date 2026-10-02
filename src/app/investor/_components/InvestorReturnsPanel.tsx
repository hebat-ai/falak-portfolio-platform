"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { InvestorReturnSummary } from "@/lib/investor/returns";

interface InvestorReturnsPanelProps {
  returns: InvestorReturnSummary[];
}

// One row of KPI tiles per currency the investor has capital
// transactions in -- never blended across currencies, same discipline
// as InvestorKpis' own revenue section above it.
export function InvestorReturnsPanel({ returns }: InvestorReturnsPanelProps) {
  const { t, lang } = useLanguage();

  if (returns.length === 0) {
    return (
      <section aria-labelledby="investor-returns-heading" className="space-y-3">
        <h2 id="investor-returns-heading" className="font-heading text-sm font-semibold text-foreground">
          {t.investorDashboard.returnsTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.investorDashboard.noReturnsMessage}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="investor-returns-heading" className="space-y-3">
      <h2 id="investor-returns-heading" className="font-heading text-sm font-semibold text-foreground">
        {t.investorDashboard.returnsTitle}
      </h2>
      {returns.map((r) => (
        <div key={r.currency} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.currencyNames[r.currency]}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label={t.investorDashboard.contributedLabel} value={<Num>{formatCurrency(r.contributed, r.currency, lang)}</Num>} />
            <KpiCard label={t.investorDashboard.distributedLabel} value={<Num>{formatCurrency(r.distributed, r.currency, lang)}</Num>} />
            <KpiCard label={t.investorDashboard.currentValueLabel} value={<Num>{formatCurrency(r.currentValue, r.currency, lang)}</Num>} />
            <KpiCard
              label={t.investorDashboard.moicLabel}
              value={r.moic === null ? t.investorDashboard.irrNotAvailableLabel : <Num>{r.moic.toFixed(2)}x</Num>}
            />
            <KpiCard
              label={t.investorDashboard.irrLabel}
              value={r.irr === null ? t.investorDashboard.irrNotAvailableLabel : <Num>{formatPercent(r.irr, lang)}</Num>}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
