"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { InvestorCompanyTable } from "./_components/InvestorCompanyTable";
import { InvestorKpis } from "./_components/InvestorKpis";
import { InvestorReturnsPanel } from "./_components/InvestorReturnsPanel";
import { InvestorNavChart } from "./_components/InvestorNavChart";
import { DistributionPieChart } from "@/app/admin/_components/companylist/DistributionPieChart";
import { Num } from "@/components/ui/Num";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  computeInvestedCapital,
  computeInvestorNavSeries,
  computeSectorDistribution,
} from "@/lib/investor/dashboard-compute";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { InvestorPortfolioData } from "@/lib/investor/dto";
import type { InvestorReturnSummary } from "@/lib/investor/returns";

const DISPLAY_CURRENCIES: DisplayCurrency[] = ["USD", "SAR"];

interface InvestorPortfolioClientProps extends InvestorPortfolioData {
  returnsByOrgId: Record<string, InvestorReturnSummary[]>;
}

export function InvestorPortfolioClient({
  orgs,
  periods,
  companies,
  vehicleExposures,
  returnsByOrgId,
}: InvestorPortfolioClientProps) {
  const { t, lang } = useLanguage();
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [periodKey, setPeriodKey] = useState(periods[periods.length - 1]?.key ?? "");
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(
    vehicleExposures.find((v) => v.investorOrgId === orgs[0]?.id)?.currency ?? "SAR"
  );

  // Every derived number on this page traces back to this one
  // computation, so a KPI, a vehicle card, and the companies table can
  // never disagree about who is "in scope" for the selected org and
  // period -- same discipline the original mock page established.
  const scope = useMemo(() => {
    const inScopeCompanies = companies.filter((c) => c.investorOrgId === orgId && c.periodKey === periodKey);
    const inScopeCompanyIds = new Set(inScopeCompanies.map((c) => c.id));

    const orgVehicles = vehicleExposures.filter((v) => v.investorOrgId === orgId);
    const vehicleCards = orgVehicles.map((vehicle) => {
      const companies = vehicle.linkedCompanies.map((company) => ({
        ...company,
        hasVisibleReport: inScopeCompanyIds.has(company.id),
      }));
      return { vehicle, companies, visibleCount: companies.filter((c) => c.hasVisibleReport).length };
    });

    // Latest period per company across every period this org can see,
    // regardless of the period selected above.
    const periodStartByKey = new Map(periods.map((p) => [p.key, p.periodStart]));
    const latestPeriodByCompanyId: Record<string, string> = {};
    for (const c of companies) {
      if (c.investorOrgId !== orgId) continue;
      const current = latestPeriodByCompanyId[c.id];
      if (!current || (periodStartByKey.get(c.periodKey) ?? "") > (periodStartByKey.get(current) ?? "")) {
        latestPeriodByCompanyId[c.id] = c.periodKey;
      }
    }

    return {
      vehiclesExposedCount: orgVehicles.length,
      vehicleCards,
      inScopeCompanies,
      companiesInScopeCount: inScopeCompanies.length,
      latestPeriodByCompanyId,
      sectorDistribution: computeSectorDistribution(orgVehicles),
      investedCapital: computeInvestedCapital(orgVehicles, displayCurrency),
      navSeries: computeInvestorNavSeries(orgVehicles, displayCurrency),
    };
  }, [companies, periods, vehicleExposures, orgId, periodKey, displayCurrency]);

  if (orgs.length === 0) {
    return (
      <AppShell title={t.nav.investorDashboard} subtitle={t.investorDashboard.subtitle}>
        <div className="chamfer-br-md bg-surface-muted p-5 text-sm text-muted-foreground shadow-[var(--inner-line)]">
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
            <Select id="investor-org-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {lang === "ar" ? org.nameAr : org.nameEn}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="investor-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.filters.periodLabel}
            </label>
            <Select
              id="investor-period"
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
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="investor-display-currency" className="text-xs font-medium text-muted-foreground">
              {t.admin.charts.currencyToggleLabel}
            </label>
            <Select
              id="investor-display-currency"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as DisplayCurrency)}
            >
              {DISPLAY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {t.currencyNames[c]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DistributionPieChart
            title={t.investorDashboard.sectorDistributionTitle}
            data={scope.sectorDistribution}
            labelFor={(key) => {
              const slice = scope.sectorDistribution.find((s) => s.key === key);
              return slice ? (lang === "ar" ? slice.labelAr : slice.labelEn) : key;
            }}
            emptyMessage={t.investorDashboard.noSectorDataMessage}
          />
          <InvestorNavChart series={scope.navSeries} displayCurrency={displayCurrency} />
        </div>

        <InvestorKpis
          vehiclesExposedCount={scope.vehiclesExposedCount}
          companiesInScopeCount={scope.companiesInScopeCount}
          investedCapital={scope.investedCapital}
          displayCurrency={displayCurrency}
        />

        <InvestorReturnsPanel returns={returnsByOrgId[orgId] ?? []} />

        <section aria-labelledby="investor-vehicle-exposure-heading" className="space-y-3">
          <h2 id="investor-vehicle-exposure-heading" className="font-heading text-sm font-semibold text-foreground">
            {t.investorDashboard.vehicleExposureTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scope.vehicleCards.map(({ vehicle, companies, visibleCount }) => (
              <div key={vehicle.id} className="chamfer-br-md bg-surface p-4 shadow-[var(--inner-line)]">
                {/* Deliberately plain text, not a Link to /vehicle/[slug]
                    -- that page is Falak-staff-only (getVehicleDashboardData
                    requires FALAK_OPERATIONS) and shows other investors'
                    exposure alongside internal figures; an investor-scoped
                    vehicle view would need its own page and auth branch,
                    which is out of scope here. Linking to a page this
                    viewer would just be redirected away from is worse
                    than no link at all. */}
                <p className="font-heading text-sm font-semibold text-foreground">
                  {lang === "ar" ? vehicle.nameAr : vehicle.nameEn}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.vehicleTypes[vehicle.type]} · {t.currencyNames[vehicle.currency]}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {t.investorDashboard.visibleCompaniesLabel}: <Num>{visibleCount}</Num>
                </p>
                {companies.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">{t.investorDashboard.noStartupsInVehicle}</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {companies.map((company) => (
                      <li key={company.id} className="text-sm">
                        {company.hasVisibleReport ? (
                          <Link
                            href={`/company/${company.slug}/report?period=${encodeURIComponent(periodKey)}&from=investor`}
                            className="text-link-foreground underline-offset-2 hover:underline"
                          >
                            {lang === "ar" ? company.nameAr : company.nameEn}
                          </Link>
                        ) : (
                          <span className="text-foreground">
                            {lang === "ar" ? company.nameAr : company.nameEn}{" "}
                            <span className="text-xs text-muted-foreground">({t.reviewWorkspace.notPublishedValue})</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
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
            latestPeriodByCompanyId={scope.latestPeriodByCompanyId}
            caption={t.investorDashboard.companiesTableCaption}
            emptyStateText={t.investorDashboard.noApprovedReports}
          />
        </section>
      </div>
    </AppShell>
  );
}
