"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InvestorCompanyTable } from "./_components/InvestorCompanyTable";
import { InvestorKpis } from "./_components/InvestorKpis";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { computeInvestorRevenueByCurrency } from "@/lib/investor/revenue";
import type { InvestorPortfolioData } from "@/lib/investor/dto";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

export function InvestorPortfolioClient({ orgs, periods, companies, vehicleExposures }: InvestorPortfolioData) {
  const { t, lang } = useLanguage();
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [periodKey, setPeriodKey] = useState(periods[periods.length - 1]?.key ?? "");

  // Every derived number on this page traces back to this one
  // computation, so a KPI, a vehicle card, and the companies table can
  // never disagree about who is "in scope" for the selected org and
  // period -- same discipline the original mock page established.
  const scope = useMemo(() => {
    const inScopeCompanies = companies.filter((c) => c.investorOrgId === orgId && c.periodKey === periodKey);
    const inScopeCompanyIds = new Set(inScopeCompanies.map((c) => c.id));

    const orgVehicles = vehicleExposures.filter((v) => v.investorOrgId === orgId);
    const vehicleCards = orgVehicles.map((vehicle) => {
      const visibleCount = vehicle.linkedCompanyIds.filter((id) => inScopeCompanyIds.has(id)).length;
      return { vehicle, visibleCount };
    });

    return {
      vehiclesExposedCount: orgVehicles.length,
      vehicleCards,
      inScopeCompanies,
      companiesInScopeCount: inScopeCompanies.length,
      revenueByCurrency: computeInvestorRevenueByCurrency(inScopeCompanies),
    };
  }, [companies, vehicleExposures, orgId, periodKey]);

  if (orgs.length === 0) {
    return (
      <AppShell title={t.nav.investorDashboard} subtitle={t.investorDashboard.subtitle}>
        <div className="rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm text-muted-foreground">
          {t.investorDashboard.noOrgAccess}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.nav.investorDashboard} subtitle={t.investorDashboard.subtitle}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="investor-org-select" className="text-xs font-medium text-muted-foreground">
              {t.investorDashboard.investorSelectLabel}
            </label>
            <select
              id="investor-org-select"
              className={selectClass}
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {lang === "ar" ? org.nameAr : org.nameEn}
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
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              disabled={periods.length === 0}
            >
              {periods.length === 0 ? (
                <option value="">{t.investorDashboard.noApprovedReports}</option>
              ) : (
                periods.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))
              )}
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
          <InvestorCompanyTable
            companies={scope.inScopeCompanies}
            caption={t.investorDashboard.companiesTableCaption}
            emptyStateText={t.investorDashboard.noApprovedReports}
          />
        </section>
      </div>
    </AppShell>
  );
}
