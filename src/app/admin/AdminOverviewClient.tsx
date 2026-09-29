"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioSummaryKpis } from "./_components/PortfolioSummaryKpis";
import { ReportingStatusPanel } from "./_components/ReportingStatusPanel";
import { FiltersBar, DEFAULT_ADMIN_FILTERS, type AdminFilterState } from "./_components/FiltersBar";
import { AdminCompanyTable } from "./_components/AdminCompanyTable";
import { CompanyCardGrid } from "./_components/CompanyCardGrid";
import { ManagePanel } from "./_components/ManagePanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { computeRevenueByCurrency } from "@/lib/admin/revenue";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminPortfolioData } from "@/lib/admin/dto";

export function AdminOverviewClient({ companies, vehicles, investors, ownershipLinks, periods, templates }: AdminPortfolioData) {
  const { t } = useLanguage();
  const latestPeriodKey = periods.at(-1)?.key ?? "";
  const [filters, setFilters] = useState<AdminFilterState>({ ...DEFAULT_ADMIN_FILTERS, period: latestPeriodKey });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const selectedPeriod = periods.find((p) => p.key === filters.period) ?? periods[0];

  // Portfolio-wide KPIs and the Reporting Status panel always reflect the
  // full portfolio for the selected period -- only the Vehicle/Currency/
  // Status filters (applied in filteredCompanies, below) narrow the
  // company list/cards, so top-level facts never silently change scope
  // based on an exploratory filter. Mirrors the mock prototype's own rule
  // (src/app/admin/page.tsx), now against real data.
  const summary = useMemo(() => {
    const period = filters.period;

    const completeCount = companies.filter((c) => c.periods[period]?.status === "approved").length;

    const overdueCount = companies.filter((c) => {
      const periodData = c.periods[period];
      return periodData?.currentDeadline ? getOverdueDays(periodData.status, periodData.currentDeadline) !== null : false;
    }).length;

    const revenueByCurrency = computeRevenueByCurrency(companies, period);

    return {
      companiesCount: companies.length,
      vehiclesCount: vehicles.length,
      investorsCount: investors.length,
      completionRate: companies.length === 0 ? 0 : completeCount / companies.length,
      overdueCount,
      revenueByCurrency,
    };
  }, [filters.period, companies, vehicles.length, investors.length]);

  const filteredCompanies = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    return companies.filter((company) => {
      if (filters.vehicleId !== "all") {
        const isLinkedToVehicle = ownershipLinks.some(
          (link) => link.vehicleId === filters.vehicleId && link.companyId === company.id
        );
        if (!isLinkedToVehicle) return false;
      }
      if (filters.currency !== "all" && company.currency !== filters.currency) {
        return false;
      }
      if (filters.status !== "all" && company.periods[filters.period]?.status !== filters.status) {
        return false;
      }
      if (query) {
        const companyVehicleNames = ownershipLinks
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
  }, [filters, companies, ownershipLinks, vehicles]);

  return (
    <AppShell title={t.admin.title} subtitle={t.admin.subtitle}>
      <div className="space-y-6">
        <PortfolioSummaryKpis {...summary} />
        {selectedPeriod ? <ReportingStatusPanel companies={companies} period={selectedPeriod} /> : null}
        <FiltersBar
          filters={filters}
          onChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          vehicles={vehicles}
          periods={periods}
        />
        {viewMode === "table" ? (
          <AdminCompanyTable companies={filteredCompanies} period={filters.period} vehicles={vehicles} vehicleLinks={ownershipLinks} />
        ) : (
          <CompanyCardGrid companies={filteredCompanies} period={filters.period} vehicles={vehicles} vehicleLinks={ownershipLinks} />
        )}
        <ManagePanel companies={companies} vehicles={vehicles} investors={investors} templates={templates} />
      </div>
    </AppShell>
  );
}
