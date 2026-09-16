"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioSummaryKpis } from "./_components/PortfolioSummaryKpis";
import { ReportingStatusPanel } from "./_components/ReportingStatusPanel";
import { FiltersBar, DEFAULT_ADMIN_FILTERS, type AdminFilterState } from "./_components/FiltersBar";
import { CompanyTable } from "./_components/CompanyTable";
import { CompanyCardGrid } from "./_components/CompanyCardGrid";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { companies, REPORTING_CYCLES } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import { investors } from "@/lib/mock/investors";
import { DASHBOARD_SNAPSHOT_DATE } from "@/lib/format";
import { computeRevenueByCurrency } from "@/lib/revenue";

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Portfolio-wide KPIs and the Reporting Status panel always reflect the
  // full portfolio for the selected period -- only the Vehicle/Currency/
  // Status filters (applied in filteredCompanies, below) narrow the
  // company list/cards, so top-level facts never silently change scope
  // based on an exploratory filter. See FiltersBar's visible scope note.
  const summary = useMemo(() => {
    const period = filters.period;
    const cycle = REPORTING_CYCLES[period];
    const deadline = new Date(`${cycle.deadline}T00:00:00Z`);

    const completeCount = companies.filter((c) => {
      const status = c.periods[period].status;
      return status === "approved" || status === "published";
    }).length;

    const overdueCount = companies.filter((c) => {
      const periodData = c.periods[period];
      return periodData.status === "draft" && DASHBOARD_SNAPSHOT_DATE > deadline;
    }).length;

    // Revenue is summed separately per currency and NEVER combined; a
    // company with revenue === null (no data submitted this period) is
    // excluded from the sum and counted in excludedCount -- never
    // silently treated as a submitted zero. Shared with the Vehicle
    // Dashboard so the two can never disagree on this rule.
    const revenueByCurrency = computeRevenueByCurrency(companies, period);

    return {
      companiesCount: companies.length,
      vehiclesCount: vehicles.length,
      investorsCount: investors.length,
      completionRate: companies.length === 0 ? 0 : completeCount / companies.length,
      overdueCount,
      revenueByCurrency,
    };
  }, [filters.period]);

  // Every company appears at most once here -- filter() over the base
  // `companies` array (already unique) never duplicates entries, even
  // when a company like Tadween is linked to two vehicles: the vehicle
  // filter is an existence check ("is there *a* link matching this
  // vehicle+company"), not a join that would multiply rows.
  const filteredCompanies = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    return companies.filter((company) => {
      if (filters.vehicleId !== "all") {
        const isLinkedToVehicle = vehicleCompanyLinks.some(
          (link) => link.vehicleId === filters.vehicleId && link.companyId === company.id
        );
        if (!isLinkedToVehicle) return false;
      }
      if (filters.currency !== "all" && company.currency !== filters.currency) {
        return false;
      }
      if (filters.status !== "all" && company.periods[filters.period].status !== filters.status) {
        return false;
      }
      if (query) {
        const companyVehicleNames = vehicleCompanyLinks
          .filter((link) => link.companyId === company.id)
          .map((link) => vehicles.find((v) => v.id === link.vehicleId))
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
          .flatMap((v) => [v.nameEn, v.nameAr]);

        const haystack = [company.nameEn, company.nameAr, company.sectorEn, company.sectorAr, ...companyVehicleNames]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <AppShell title={t.admin.title} subtitle={t.admin.subtitle}>
      <div className="space-y-6">
        <PortfolioSummaryKpis {...summary} />
        <ReportingStatusPanel companies={companies} period={filters.period} />
        <FiltersBar filters={filters} onChange={setFilters} viewMode={viewMode} onViewModeChange={setViewMode} />
        {viewMode === "table" ? (
          <CompanyTable companies={filteredCompanies} period={filters.period} />
        ) : (
          <CompanyCardGrid companies={filteredCompanies} period={filters.period} />
        )}
      </div>
    </AppShell>
  );
}
