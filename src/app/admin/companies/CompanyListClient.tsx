"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FiltersBar, DEFAULT_ADMIN_FILTERS, type AdminFilterState } from "../_components/FiltersBar";
import { AdminCompanyTable } from "../_components/AdminCompanyTable";
import { CompanyCardGrid } from "../_components/CompanyCardGrid";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AdminPortfolioData } from "@/lib/admin/dto";

export function CompanyListClient({ companies, vehicles, ownershipLinks, periods }: AdminPortfolioData) {
  const { t } = useLanguage();
  const latestPeriodKey = periods.at(-1)?.key ?? "";
  const [filters, setFilters] = useState<AdminFilterState>({ ...DEFAULT_ADMIN_FILTERS, period: latestPeriodKey });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
    <AppShell title={t.admin.companyListTitle} subtitle={t.admin.companyListSubtitle}>
      <div className="space-y-6">
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
      </div>
    </AppShell>
  );
}
