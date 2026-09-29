"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { VehicleCompanyTable } from "./VehicleCompanyTable";
import { VehicleKpis } from "./VehicleKpis";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getOverdueDays } from "@/lib/reportingStatus";
import { computeVehicleRevenueByCurrency } from "@/lib/vehicle/revenue";
import type { VehicleDashboardData } from "@/lib/vehicle/dto";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto";

export function VehicleDashboardView({ vehicle, periods, companies, investors }: VehicleDashboardData) {
  const { t, lang } = useLanguage();
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(periods[periods.length - 1]?.key ?? "");
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  // Same summary shape as /admin's, scoped to this vehicle's linked
  // companies. "Complete" is `approved`: publishing is a Report-level
  // event, and a published report's submission stays `approved`.
  const summary = useMemo(() => {
    const completeCount = companies.filter((c) => c.periods[selectedPeriodKey]?.status === "approved").length;
    const overdueCount = companies.filter((c) => {
      const periodData = c.periods[selectedPeriodKey];
      return periodData?.currentDeadline != null && getOverdueDays(periodData.status, periodData.currentDeadline) !== null;
    }).length;

    return {
      completionRate: companies.length === 0 ? 0 : completeCount / companies.length,
      overdueCount,
      revenueByCurrency: computeVehicleRevenueByCurrency(companies, selectedPeriodKey),
    };
  }, [companies, selectedPeriodKey]);

  return (
    <AppShell title={lang === "ar" ? vehicle.nameAr : vehicle.nameEn} subtitle={t.vehicleTypes[vehicle.type]}>
      <div className="space-y-6">
        <Link
          href="/vehicle"
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.vehicleReport.backToDirectory}
        </Link>

        {periods.length > 0 ? (
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="vehicle-report-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.filters.periodLabel}
            </label>
            <select
              id="vehicle-report-period"
              className={selectClass}
              value={selectedPeriodKey}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <VehicleKpis
          companiesCount={companies.length}
          completionRate={summary.completionRate}
          overdueCount={summary.overdueCount}
          revenueByCurrency={summary.revenueByCurrency}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.vehicleReport.profileTitle}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.admin.filters.currencyLabel}</dt>
                <dd className="min-w-0 break-words text-end text-foreground">{t.currencyNames[vehicle.currency]}</dd>
              </div>
            </dl>
          </Card>

          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.vehicleReport.investorsTitle}</h2>
            {investors.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.vehicleReport.noInvestorsLinked}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {investors.map((investor) => (
                  <li key={investor.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words text-start text-foreground">
                      {lang === "ar" ? investor.nameAr : investor.nameEn}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{t.investorTypes[investor.type]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <h2 className="font-heading mb-3 text-sm font-semibold text-foreground">{t.vehicleReport.companiesTableTitle}</h2>
          <VehicleCompanyTable
            companies={companies}
            periodKey={selectedPeriodKey}
            vehicleSlug={vehicle.slug}
            caption={t.vehicleReport.companiesTableTitle}
            emptyStateText={t.vehicleReport.noCompaniesLinked}
          />
        </div>
      </div>
    </AppShell>
  );
}
