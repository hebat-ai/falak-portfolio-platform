"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyListFiltersBar, DEFAULT_COMPANY_LIST_FILTERS, type CompanyListFilterState } from "../_components/companylist/CompanyListFiltersBar";
import { CompanyListTable } from "../_components/companylist/CompanyListTable";
import { DistributionPieChart } from "../_components/companylist/DistributionPieChart";
import { InvestmentYearChart } from "../_components/companylist/InvestmentYearChart";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  getSectorDistribution,
  getVehicleDistribution,
  getStageDistribution,
  getInvestmentYearSeries,
} from "@/lib/admin/company-list-compute";
import type { CompanyListRow, CompanyListVehicleRef } from "@/lib/admin/company-list";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface CompanyListClientProps {
  companies: CompanyListRow[];
}

export function CompanyListClient({ companies }: CompanyListClientProps) {
  const { t, lang } = useLanguage();
  const [filters, setFilters] = useState<CompanyListFilterState>(DEFAULT_COMPANY_LIST_FILTERS);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("USD");

  const vehicles = useMemo(() => {
    const byId = new Map<string, CompanyListVehicleRef>();
    for (const company of companies) {
      for (const v of company.vehicles) byId.set(v.id, v);
    }
    return [...byId.values()].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [companies]);

  const investmentYears = useMemo(() => {
    const years = new Set<number>();
    for (const company of companies) {
      if (company.investmentYear !== null) years.add(company.investmentYear);
    }
    return [...years].sort((a, b) => a - b);
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    return companies.filter((company) => {
      if (filters.vehicleId !== "all" && !company.vehicles.some((v) => v.id === filters.vehicleId)) {
        return false;
      }
      if (filters.investmentYear !== "all" && String(company.investmentYear) !== filters.investmentYear) {
        return false;
      }
      if (query) {
        const haystack = [
          company.nameEn,
          company.nameAr,
          company.sectorEn,
          company.sectorAr,
          ...company.vehicles.flatMap((v) => [v.nameEn, v.nameAr]),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [filters, companies]);

  const sectorDistribution = useMemo(() => getSectorDistribution(filteredCompanies), [filteredCompanies]);
  const vehicleDistribution = useMemo(() => getVehicleDistribution(filteredCompanies), [filteredCompanies]);
  const stageDistribution = useMemo(() => getStageDistribution(filteredCompanies), [filteredCompanies]);
  const investmentYearSeries = useMemo(() => getInvestmentYearSeries(filteredCompanies), [filteredCompanies]);

  const vehicleNameById = useMemo(() => new Map(vehicles.map((v) => [v.id, lang === "ar" ? v.nameAr : v.nameEn])), [vehicles, lang]);

  return (
    <AppShell title={t.admin.companyListTitle} subtitle={t.admin.companyListSubtitle}>
      <div className="space-y-6">
        <CompanyListFiltersBar
          filters={filters}
          onChange={setFilters}
          vehicles={vehicles}
          investmentYears={investmentYears}
          displayCurrency={displayCurrency}
          onDisplayCurrencyChange={setDisplayCurrency}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DistributionPieChart
            title={t.admin.charts.sectorDistributionChartTitle}
            data={sectorDistribution}
            labelFor={(key) => key}
            emptyMessage={t.admin.charts.noDataMessage}
          />
          <DistributionPieChart
            title={t.admin.charts.vehicleDistributionChartTitle}
            data={vehicleDistribution}
            labelFor={(key) => vehicleNameById.get(key) ?? key}
            emptyMessage={t.admin.charts.noDataMessage}
          />
          <DistributionPieChart
            title={t.admin.charts.stageDistributionChartTitle}
            data={stageDistribution}
            labelFor={(key) => t.stages[key as keyof Dictionary["stages"]]}
            emptyMessage={t.admin.charts.noDataMessage}
          />
        </div>

        <InvestmentYearChart
          title={t.admin.charts.investmentYearChartTitle}
          data={investmentYearSeries}
          emptyMessage={t.admin.charts.noDataMessage}
        />

        <CompanyListTable companies={filteredCompanies} displayCurrency={displayCurrency} />
      </div>
    </AppShell>
  );
}
