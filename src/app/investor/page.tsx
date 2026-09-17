"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyTable } from "@/app/admin/_components/CompanyTable";
import { InvestorKpis } from "./_components/InvestorKpis";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { companies, REPORTING_CYCLES, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import { investors, investorVehicleExposures } from "@/lib/mock/investors";
import { computeRevenueByCurrency } from "@/lib/revenue";
import type { ReportingPeriod } from "@/lib/mock/types";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

export default function InvestorDashboardPage() {
  const { t, lang } = useLanguage();
  const [investorId, setInvestorId] = useState(investors[0].id);
  const [period, setPeriod] = useState<ReportingPeriod>(
    REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1]
  );

  // Every derived number on this page traces back to this one computation,
  // so a KPI, a vehicle card, and the companies table can never disagree
  // with each other about who is "in scope" for the selected investor and
  // period.
  const scope = useMemo(() => {
    // Deduplicate this investor's vehicle exposures by vehicleId, keeping
    // first-occurrence order from investorVehicleExposures.
    const seenVehicleIds = new Set<string>();
    const exposedVehicleIds: string[] = [];
    for (const exposure of investorVehicleExposures) {
      if (exposure.investorId !== investorId) continue;
      if (seenVehicleIds.has(exposure.vehicleId)) continue;
      seenVehicleIds.add(exposure.vehicleId);
      exposedVehicleIds.push(exposure.vehicleId);
    }
    const exposedVehicles = exposedVehicleIds
      .map((id) => vehicles.find((v) => v.id === id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));

    // Companies linked to any exposed vehicle, deduplicated by companyId,
    // keeping first-occurrence order across exposedVehicles.
    const seenCompanyIds = new Set<string>();
    const linkedCompanyIds: string[] = [];
    for (const vehicle of exposedVehicles) {
      const companyIdsForVehicle = vehicleCompanyLinks
        .filter((l) => l.vehicleId === vehicle.id)
        .map((l) => l.companyId);
      for (const companyId of companyIdsForVehicle) {
        if (seenCompanyIds.has(companyId)) continue;
        seenCompanyIds.add(companyId);
        linkedCompanyIds.push(companyId);
      }
    }

    // Only approved/published for the selected period -- an investor never
    // sees a draft, submitted, under-review, or changes-requested report.
    const inScopeCompanies = linkedCompanyIds
      .map((id) => companies.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => {
        const status = c.periods[period].status;
        return status === "approved" || status === "published";
      });

    const inScopeCompanyIds = new Set(inScopeCompanies.map((c) => c.id));

    // Each vehicle's visible-company count is a deduplicated subset of the
    // same inScopeCompanyIds set -- never recomputed independently, and
    // never a raw link-row count, so a duplicated relationship row or a
    // company reachable via this vehicle more than once can't double-count.
    const vehicleCards = exposedVehicles.map((vehicle) => {
      const visibleCompanyIds = new Set(
        vehicleCompanyLinks
          .filter((l) => l.vehicleId === vehicle.id && inScopeCompanyIds.has(l.companyId))
          .map((l) => l.companyId)
      );
      return { vehicle, visibleCount: visibleCompanyIds.size };
    });

    return {
      vehiclesExposedCount: exposedVehicles.length,
      vehicleCards,
      inScopeCompanies,
      companiesInScopeCount: inScopeCompanies.length,
      revenueByCurrency: computeRevenueByCurrency(inScopeCompanies, period),
    };
  }, [investorId, period]);

  return (
    <AppShell
      title={t.nav.investorDashboard}
      subtitle={t.investorDashboard.subtitle}
      viewerRoleLabel={t.investorDashboard.viewerRoleLabel}
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm text-muted-foreground">
          {t.investorDashboard.prototypeNotice}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="investor-select" className="text-xs font-medium text-muted-foreground">
              {t.investorDashboard.investorSelectLabel}
            </label>
            <select
              id="investor-select"
              className={selectClass}
              value={investorId}
              onChange={(e) => setInvestorId(e.target.value)}
            >
              {investors.map((investor) => (
                <option key={investor.id} value={investor.id}>
                  {lang === "ar" ? investor.nameAr : investor.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="investor-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.filters.periodLabel}
            </label>
            <select
              id="investor-period"
              className={selectClass}
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportingPeriod)}
            >
              {REPORTING_PERIODS_ORDER.map((p) => (
                <option key={p} value={p}>
                  {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <InvestorKpis
          vehiclesExposedCount={scope.vehiclesExposedCount}
          companiesInScopeCount={scope.companiesInScopeCount}
          revenueByCurrency={scope.revenueByCurrency}
        />

        <section aria-labelledby="investor-vehicle-exposure-heading" className="space-y-3">
          <h2 id="investor-vehicle-exposure-heading" className="font-heading text-sm font-semibold text-foreground">
            {t.investorDashboard.vehicleExposureTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scope.vehicleCards.map(({ vehicle, visibleCount }) => (
              <div key={vehicle.id} className="rounded-xl border border-border-subtle bg-surface p-4">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {lang === "ar" ? vehicle.nameAr : vehicle.nameEn}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.vehicleTypes[vehicle.type]} · {t.currencyNames[vehicle.currency]}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {t.investorDashboard.visibleCompaniesLabel}: <Num>{visibleCount}</Num>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="investor-companies-heading" className="space-y-3">
          <h2 id="investor-companies-heading" className="font-heading text-sm font-semibold text-foreground">
            {t.investorDashboard.companiesTableTitle}
          </h2>
          <CompanyTable
            companies={scope.inScopeCompanies}
            period={period}
            showVehicleColumn={false}
            showCompanyAction={false}
            caption={t.investorDashboard.companiesTableCaption}
            emptyStateText={t.investorDashboard.noApprovedReports}
          />
        </section>
      </div>
    </AppShell>
  );
}
