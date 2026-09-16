"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CompanyTable } from "@/app/admin/_components/CompanyTable";
import { VehicleKpis } from "./VehicleKpis";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getOverdueDays } from "@/lib/reportingStatus";
import { computeRevenueByCurrency } from "@/lib/revenue";
import { REPORTING_CYCLES, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { Company, Investor, ReportingPeriod, Vehicle } from "@/lib/mock/types";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto";

interface VehicleDashboardViewProps {
  vehicle: Vehicle;
  linkedCompanies: Company[];
  linkedInvestors: Investor[];
}

export function VehicleDashboardView({ vehicle, linkedCompanies, linkedInvestors }: VehicleDashboardViewProps) {
  const { t, lang } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportingPeriod>(
    REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1]
  );
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  // Mirrors admin/page.tsx's own summary shape, scoped to this vehicle's
  // linked companies only, and reusing the same shared rules (overdue
  // days, revenue-by-currency) so the two views can never disagree.
  const summary = useMemo(() => {
    const cycle = REPORTING_CYCLES[selectedPeriod];

    const completeCount = linkedCompanies.filter((c) => {
      const status = c.periods[selectedPeriod].status;
      return status === "approved" || status === "published";
    }).length;

    const overdueCount = linkedCompanies.filter(
      (c) => getOverdueDays(c.periods[selectedPeriod].status, cycle.deadline) !== null
    ).length;

    return {
      completionRate: linkedCompanies.length === 0 ? 0 : completeCount / linkedCompanies.length,
      overdueCount,
      revenueByCurrency: computeRevenueByCurrency(linkedCompanies, selectedPeriod),
    };
  }, [linkedCompanies, selectedPeriod]);

  return (
    <AppShell
      title={lang === "ar" ? vehicle.nameAr : vehicle.nameEn}
      subtitle={t.vehicleTypes[vehicle.type]}
    >
      <div className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.stub.backToOverview}
        </Link>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="vehicle-report-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <select
            id="vehicle-report-period"
            className={selectClass}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as ReportingPeriod)}
          >
            {REPORTING_PERIODS_ORDER.map((p) => (
              <option key={p} value={p}>
                {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
              </option>
            ))}
          </select>
        </div>

        <VehicleKpis
          companiesCount={linkedCompanies.length}
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
                <dd className="min-w-0 break-words text-end text-foreground">
                  {t.currencyNames[vehicle.currency]}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.vehicleReport.investorsTitle}</h2>
            {linkedInvestors.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.vehicleReport.noInvestorsLinked}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {linkedInvestors.map((investor) => (
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
          <h2 className="font-heading mb-3 text-sm font-semibold text-foreground">
            {t.vehicleReport.companiesTableTitle}
          </h2>
          <CompanyTable
            companies={linkedCompanies}
            period={selectedPeriod}
            showVehicleColumn={false}
            emptyStateText={t.vehicleReport.noCompaniesLinked}
            caption={t.vehicleReport.companiesTableTitle}
          />
        </div>
      </div>
    </AppShell>
  );
}
