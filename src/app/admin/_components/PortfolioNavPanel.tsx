"use client";

import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import { computeNavTotalsByCurrency } from "@/lib/admin/valuation-totals";
import type { AdminVehicleValuationDTO } from "@/lib/admin/dto";

interface PortfolioNavPanelProps {
  vehicles: AdminVehicleValuationDTO[];
  vehicleId: string;
  onVehicleChange: (vehicleId: string) => void;
}

// NAV (Net Asset Value) of the total portfolio -- the sum of each
// VEHICLE's own latest NAV mark, deliberately distinct from "Portfolio
// Valuation" elsewhere on this dashboard (which sums each COMPANY's own
// latest valuation, a different, fund-structure-agnostic number). Always
// visible, same priority as PortfolioAlertsPanel, since this is the one
// headline number a fund manager expects to see without clicking into a
// chart view.
export function PortfolioNavPanel({ vehicles, vehicleId, onVehicleChange }: PortfolioNavPanelProps) {
  const { t, lang } = useLanguage();
  const totals = computeNavTotalsByCurrency(vehicles, vehicleId || undefined);

  return (
    <Card className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.charts.navPanelTitle}</h2>
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="nav-vehicle-filter" className="text-xs font-medium text-muted-foreground">
            {t.admin.charts.vehicleFilterLabel}
          </label>
          <Select id="nav-vehicle-filter" className="sm:w-auto" value={vehicleId} onChange={(e) => onVehicleChange(e.target.value)}>
            <option value="">{t.admin.charts.allVehiclesOption}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {lang === "ar" ? v.nameAr : v.nameEn}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {totals.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.admin.emptyState}</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {totals.map((entry) => (
            <KpiCard
              key={entry.currency}
              label={t.currencyNames[entry.currency]}
              value={<Num>{formatCurrency(entry.total, entry.currency, lang)}</Num>}
              hint={
                entry.excludedCount > 0
                  ? `${t.admin.kpi.excludesPrefix} ${entry.excludedCount} ${t.admin.charts.excludesNoNavSuffix}`
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
