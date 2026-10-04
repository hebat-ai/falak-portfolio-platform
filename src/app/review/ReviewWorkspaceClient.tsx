"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AdminCompanyTable } from "@/app/admin/_components/AdminCompanyTable";
import { ReviewQueueFilters, type QueueStatusFilter } from "./_components/ReviewQueueFilters";
import { ReviewActionPanel } from "./_components/ReviewActionPanel";
import { ReportsLogTable } from "@/components/portfolio/ReportsLogTable";
import { extendReportingCycleDeadlineAction, resendReportToInvestorsAction } from "./actions";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AdminCompanyDTO, AdminPortfolioData } from "@/lib/admin/dto";
import type { SubmissionStatus } from "@/generated/prisma/client";
import type { ReportingRequestRow } from "@/lib/admin/reporting-requests";

function matchesStatusFilter(status: SubmissionStatus, filter: QueueStatusFilter): boolean {
  if (filter === "all") return true;
  // "approved" belongs here too -- Publish is still a real pending
  // action Falak needs to take on it, same as Start Review/Approve are
  // for submitted/under_review. Excluding it previously meant the
  // default queue view could show zero rows (and so no way to select a
  // company at all) in the common case where everything due this
  // period is already approved and just waiting to be published.
  if (filter === "actionable") return status === "submitted" || status === "under_review" || status === "approved";
  return status === filter;
}

type ReviewWorkspaceClientProps = Pick<AdminPortfolioData, "companies" | "vehicles" | "ownershipLinks" | "periods"> & {
  reportingRequests: ReportingRequestRow[];
};

// Real Server Actions (see ../review/actions.ts) replace the former
// in-memory overlay -- there is no local status simulation anymore.
// Next.js refreshes this Server Component tree's props automatically
// after any Server Action submitted via a <form> completes, so a
// successful transition in ReviewActionPanel flows fresh data back here
// with no manual refetch.
export function ReviewWorkspaceClient({ companies, vehicles, ownershipLinks, periods, reportingRequests }: ReviewWorkspaceClientProps) {
  const { t } = useLanguage();
  const latestPeriodKey = periods.at(-1)?.key ?? "";

  const [period, setPeriod] = useState(latestPeriodKey);
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>("actionable");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);

  const selectedPeriod = periods.find((p) => p.key === period) ?? periods[0];

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return companies.filter((company) => {
      const status = company.periods[period]?.status;
      if (!status || !matchesStatusFilter(status, statusFilter)) return false;
      if (query) {
        const haystack = `${company.nameEn} ${company.nameAr} ${company.sectorEn} ${company.sectorAr}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [companies, period, statusFilter, searchQuery]);

  const selectedCompany = selectedCompanyId ? (companies.find((c) => c.id === selectedCompanyId) ?? null) : null;
  const selectedEffectiveData = selectedCompany ? (selectedCompany.periods[period] ?? null) : null;

  // Runs after selectedCompanyId is actually committed (and the panel has
  // re-rendered with the new selection), not synchronously inside the
  // click handler -- so the ref is guaranteed current before we scroll to
  // and focus it.
  useEffect(() => {
    if (selectedCompanyId) {
      panelHeadingRef.current?.scrollIntoView({ block: "start" });
      panelHeadingRef.current?.focus();
    }
  }, [selectedCompanyId]);

  function handlePeriodChange(next: string) {
    setPeriod(next);
    setSelectedCompanyId(null);
  }

  function handleStatusFilterChange(next: QueueStatusFilter) {
    setStatusFilter(next);
    setSelectedCompanyId(null);
  }

  function handleSearchChange(next: string) {
    setSearchQuery(next);
    setSelectedCompanyId(null);
  }

  function handleSelectForReview(company: AdminCompanyDTO) {
    setSelectedCompanyId(company.id);
  }

  function handleSelectFromReportsLog(row: ReportingRequestRow) {
    if (row.periodLabel !== period) {
      handlePeriodChange(row.periodLabel);
    }
    setSelectedCompanyId(row.companyId);
  }

  return (
    <AppShell title={t.nav.reviewWorkspace} subtitle={t.reviewWorkspace.subtitle}>
      <div className="space-y-6">
        <ReviewQueueFilters
          period={period}
          onPeriodChange={handlePeriodChange}
          periods={periods}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        <AdminCompanyTable
          companies={filteredCompanies}
          period={period}
          vehicles={vehicles}
          vehicleLinks={ownershipLinks}
          onSelectForReview={handleSelectForReview}
        />

        {selectedPeriod ? (
          <ReviewActionPanel
            company={selectedCompany}
            period={selectedPeriod}
            effectiveData={selectedEffectiveData}
            headingRef={panelHeadingRef}
          />
        ) : null}

        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t.reviewWorkspace.reportsLogTitle}</h2>
          <ReportsLogTable
            rows={reportingRequests}
            onSelectForReview={handleSelectFromReportsLog}
            extendDeadlineAction={extendReportingCycleDeadlineAction}
            resendAction={resendReportToInvestorsAction}
          />
        </div>
      </div>
    </AppShell>
  );
}
