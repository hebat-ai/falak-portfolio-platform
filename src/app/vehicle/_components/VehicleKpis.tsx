"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";
import type { VehicleNavPoint } from "@/lib/vehicle/nav";

interface VehicleKpisProps {
  companiesCount: number;
  investedCapital: number;
  latestValuation: VehicleNavPoint | null;
  displayCurrency: DisplayCurrency;
}

export function VehicleKpis({ companiesCount, investedCapital, latestValuation, displayCurrency }: VehicleKpisProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label={t.vehicleReport.companiesLabel} value={<Num>{companiesCount}</Num>} />
      <KpiCard
        label={t.vehicleReport.investedCapitalLabel}
        value={<Num>{formatCurrency(investedCapital, displayCurrency, lang)}</Num>}
      />
      {latestValuation ? (
        <KpiCard
          label={t.vehicleReport.latestValuationLabel}
          value={
            <Num>
              {formatCurrency(
                convertToDisplay(latestValuation.amount, latestValuation.currency, displayCurrency),
                displayCurrency,
                lang
              )}
            </Num>
          }
          hint={`${t.vehicleReport.latestValuationAsOf} ${formatDate(latestValuation.asOfDate, lang)}`}
        />
      ) : (
        <KpiCard
          label={t.vehicleReport.latestValuationLabel}
          value={<span className="text-muted-foreground">—</span>}
          hint={t.vehicleReport.noValuationRecorded}
        />
      )}
    </div>
  );
}
