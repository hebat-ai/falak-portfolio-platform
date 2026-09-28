"use client";

import { Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SubmissionStatus } from "@/generated/prisma/client";
import type { AdminPeriodOption } from "@/lib/admin/dto";

export type QueueStatusFilter = "actionable" | "all" | SubmissionStatus;

const STATUS_OPTIONS: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

interface ReviewQueueFiltersProps {
  period: string;
  onPeriodChange: (period: string) => void;
  periods: AdminPeriodOption[];
  statusFilter: QueueStatusFilter;
  onStatusFilterChange: (status: QueueStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ReviewQueueFilters({
  period,
  onPeriodChange,
  periods,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: ReviewQueueFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="review-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
            />
            <input
              id="review-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.reviewWorkspace.searchPlaceholder}
              className="w-full rounded-md border border-control-border bg-surface py-1.5 ps-9 pe-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground [&::-webkit-search-cancel-button]:appearance-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t.admin.filters.clearSearchAriaLabel}
                className="absolute inset-y-0 end-0 my-auto me-2 rounded p-1 text-muted-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="review-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <select
            id="review-period"
            className={selectClass}
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="review-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <select
            id="review-status"
            className={selectClass}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as QueueStatusFilter)}
          >
            <option value="actionable">{t.reviewWorkspace.statusActionableOption}</option>
            <option value="all">{t.admin.filters.allOption}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t.status[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
