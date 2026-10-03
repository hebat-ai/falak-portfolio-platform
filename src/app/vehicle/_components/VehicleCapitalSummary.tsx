"use client";

import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { VehicleCapitalTotal } from "@/lib/vehicle/capital";

interface VehicleCapitalSummaryProps {
  totals: VehicleCapitalTotal[];
}

// Committed vs called capital across this vehicle's own LP base, per
// currency -- the fund-administration counterpart to the NAV panel: NAV
// says what the fund is worth today, this says how much capital has
// actually been put to work against what was promised.
export function VehicleCapitalSummary({ totals }: VehicleCapitalSummaryProps) {
  const { t, lang } = useLanguage();

  if (totals.length === 0) {
    return null;
  }

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.vehicleReport.capitalSummaryTitle}</h2>
      <div className="mt-3 space-y-4">
        {totals.map((entry) => {
          const calledPct = entry.committed > 0 ? entry.called / entry.committed : null;
          return (
            <div key={entry.currency}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t.currencyNames[entry.currency]}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard label={t.vehicleReport.committedLabel} value={<Num>{formatCurrency(entry.committed, entry.currency, lang)}</Num>} />
                <KpiCard label={t.vehicleReport.calledLabel} value={<Num>{formatCurrency(entry.called, entry.currency, lang)}</Num>} />
                <KpiCard
                  label={t.vehicleReport.calledPctLabel}
                  value={calledPct === null ? t.admin.table.noDataValue : <Num>{formatPercent(calledPct, lang)}</Num>}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
