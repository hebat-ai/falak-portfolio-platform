"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyTable } from "@/app/admin/_components/CompanyTable";
import { ReviewQueueFilters, type QueueStatusFilter } from "./_components/ReviewQueueFilters";
import { ReviewActionPanel } from "./_components/ReviewActionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { DASHBOARD_SNAPSHOT_DATE } from "@/lib/format";
import { companies, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { Company, CyclePeriodData, ReportingPeriod, ReportingStatus } from "@/lib/mock/types";

type ReviewStatusOverlay = Partial<Record<string, Partial<Record<ReportingPeriod, CyclePeriodData>>>>;

// The single source of truth for which transitions this workspace may
// perform -- enforced here, not only by which buttons happen to render.
// handleTransition consults this before writing anything, independent of
// what ReviewActionPanel chose to show.
const ALLOWED_TRANSITIONS: Partial<Record<ReportingStatus, readonly ReportingStatus[]>> = {
  submitted: ["under_review"],
  under_review: ["changes_requested", "approved"],
  approved: ["published"],
};

function isTransitionAllowed(from: ReportingStatus, to: ReportingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function matchesStatusFilter(status: ReportingStatus, filter: QueueStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "actionable") return status === "submitted" || status === "under_review";
  return status === filter;
}

export default function ReviewWorkspacePage() {
  const { t, lang } = useLanguage();
  const todayIso = DASHBOARD_SNAPSHOT_DATE.toISOString().slice(0, 10);

  const [period, setPeriod] = useState<ReportingPeriod>(
    REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1]
  );
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>("actionable");
  const [searchQuery, setSearchQuery] = useState("");
  // Prototype only: this overlay is the single in-memory source of truth
  // for every simulated action below. It is never written back to the
  // imported `companies` module, never persisted to localStorage or any
  // server, and resets the moment this page reloads. It also has no
  // effect on /company, /admin, or any other route -- each of those reads
  // straight from the original mock data on its own mount.
  const [overlay, setOverlay] = useState<ReviewStatusOverlay>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);

  // The single place overlay-merging happens -- both the queue table and
  // the action panel read from this, so they can never disagree about
  // what the "current" status of a company/period is.
  const effectiveCompanies = useMemo(
    () =>
      companies.map((c) => {
        const overlaid = overlay[c.id]?.[period];
        return overlaid ? { ...c, periods: { ...c.periods, [period]: overlaid } } : c;
      }),
    [period, overlay]
  );

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return effectiveCompanies.filter((c) => {
      if (!matchesStatusFilter(c.periods[period].status, statusFilter)) return false;
      if (query) {
        const haystack = `${c.nameEn} ${c.nameAr} ${c.sectorEn} ${c.sectorAr}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [effectiveCompanies, period, statusFilter, searchQuery]);

  const selectedCompany = selectedCompanyId
    ? (effectiveCompanies.find((c) => c.id === selectedCompanyId) ?? null)
    : null;
  const selectedEffectiveData = selectedCompany ? selectedCompany.periods[period] : null;

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

  function handlePeriodChange(next: ReportingPeriod) {
    setPeriod(next);
    setSelectedCompanyId(null);
    setActionNotice(null);
  }

  function handleStatusFilterChange(next: QueueStatusFilter) {
    setStatusFilter(next);
    setSelectedCompanyId(null);
    setActionNotice(null);
  }

  function handleSearchChange(next: string) {
    setSearchQuery(next);
    setSelectedCompanyId(null);
    setActionNotice(null);
  }

  function handleSelectForReview(company: Company) {
    setSelectedCompanyId(company.id);
  }

  function handleTransition(newStatus: ReportingStatus) {
    if (!selectedCompany) return;
    const current = selectedCompany.periods[period];
    if (!isTransitionAllowed(current.status, newStatus)) return;
    const willStillMatch = matchesStatusFilter(newStatus, statusFilter);
    const companyName = lang === "ar" ? selectedCompany.nameAr : selectedCompany.nameEn;

    setOverlay((prev) => ({
      ...prev,
      [selectedCompany.id]: {
        ...prev[selectedCompany.id],
        [period]: { ...current, status: newStatus, lastUpdated: todayIso },
      },
    }));

    const base = `${t.reviewWorkspace.statusUpdatedPrefix} ${t.status[newStatus].label} — ${companyName}.`;
    setActionNotice(willStillMatch ? base : `${base} ${t.reviewWorkspace.removedFromFilterSuffix}`);
    // selectedCompanyId is deliberately left untouched here -- an action
    // that causes this row to leave the active filter still keeps the
    // panel showing its result; only a manual filter/search/period change
    // (above) clears the selection.
  }

  return (
    <AppShell title={t.nav.reviewWorkspace} subtitle={t.reviewWorkspace.subtitle}>
      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-xs text-muted-foreground">{t.reviewWorkspace.prototypeNotice}</p>
        </div>

        <ReviewQueueFilters
          period={period}
          onPeriodChange={handlePeriodChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {actionNotice ? (
          <p role="status" className="text-sm font-medium text-foreground">
            {actionNotice}
          </p>
        ) : null}

        <CompanyTable
          companies={filteredCompanies}
          period={period}
          caption={t.reviewWorkspace.queueCaption}
          emptyStateText={t.reviewWorkspace.emptyQueueMessage}
          onSelectForReview={handleSelectForReview}
        />

        <ReviewActionPanel
          company={selectedCompany}
          period={period}
          effectiveData={selectedEffectiveData}
          onTransition={handleTransition}
          headingRef={panelHeadingRef}
        />
      </div>
    </AppShell>
  );
}
