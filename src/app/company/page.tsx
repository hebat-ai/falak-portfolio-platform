"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ReportingRegisterFilters,
  type RegisterPeriodFilter,
  type RegisterStatusFilter,
} from "./_components/ReportingRegisterFilters";
import { ReportingRegisterTable, type RegisterRow } from "./_components/ReportingRegisterTable";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { companies, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";

// Newest period first, globally; within each period, companies keep their
// existing array order. REPORTING_PERIODS_ORDER is oldest-first (the
// single source of truth shared across the app), so this reverses a copy
// of it rather than hard-coding a second order. Computed once at module
// scope -- the underlying data never changes at runtime.
const ALL_REGISTER_ROWS: RegisterRow[] = [...REPORTING_PERIODS_ORDER]
  .reverse()
  .flatMap((period) => companies.map((company) => ({ company, period })));

export default function CompanyReportsRegisterPage() {
  const { t } = useLanguage();
  const [periodFilter, setPeriodFilter] = useState<RegisterPeriodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RegisterStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_REGISTER_ROWS.filter(({ company, period }) => {
      if (periodFilter !== "all" && period !== periodFilter) return false;
      if (statusFilter !== "all" && company.periods[period].status !== statusFilter) return false;
      if (query) {
        const haystack = `${company.nameEn} ${company.nameAr} ${company.sectorEn} ${company.sectorAr}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [periodFilter, statusFilter, searchQuery]);

  return (
    <AppShell title={t.nav.companyReports} subtitle={t.companyRegister.subtitle}>
      <div className="space-y-6">
        <ReportingRegisterFilters
          periodFilter={periodFilter}
          onPeriodFilterChange={setPeriodFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <ReportingRegisterTable rows={filteredRows} />
      </div>
    </AppShell>
  );
}
