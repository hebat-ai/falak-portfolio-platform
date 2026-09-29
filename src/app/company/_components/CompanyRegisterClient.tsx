"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportingRegisterFilters } from "./ReportingRegisterFilters";
import { ReportingRegisterTable, type RegisterRow } from "./ReportingRegisterTable";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AdminPortfolioData } from "@/lib/admin/dto";
import type { SubmissionStatus } from "@/generated/prisma/client";

export function CompanyRegisterClient({ companies, vehicles, ownershipLinks, periods }: AdminPortfolioData) {
  const { t } = useLanguage();
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Newest period first, globally; within each period, companies keep
  // their existing array order. `periods` is oldest-first (same
  // convention as the mock's REPORTING_PERIODS_ORDER), so this reverses a
  // copy rather than hard-coding a second order.
  const allRows: RegisterRow[] = useMemo(
    () => [...periods].reverse().flatMap((period) => companies.map((company) => ({ company, periodKey: period.key }))),
    [companies, periods]
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allRows.filter(({ company, periodKey }) => {
      if (periodFilter !== "all" && periodKey !== periodFilter) return false;
      if (statusFilter !== "all" && company.periods[periodKey]?.status !== statusFilter) return false;
      if (query) {
        const haystack = `${company.nameEn} ${company.nameAr} ${company.sectorEn} ${company.sectorAr}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allRows, periodFilter, statusFilter, searchQuery]);

  return (
    <AppShell title={t.nav.companyReports} subtitle={t.companyRegister.subtitle}>
      <div className="space-y-6">
        <ReportingRegisterFilters
          periods={periods}
          periodFilter={periodFilter}
          onPeriodFilterChange={setPeriodFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <ReportingRegisterTable rows={filteredRows} periods={periods} vehicles={vehicles} ownershipLinks={ownershipLinks} />
      </div>
    </AppShell>
  );
}
