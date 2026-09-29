"use client";

import { Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AdminPeriodOption } from "@/lib/admin/dto";
import type { SubmissionStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

interface ReportingRegisterFiltersProps {
  periods: AdminPeriodOption[];
  periodFilter: string;
  onPeriodFilterChange: (period: string) => void;
  statusFilter: SubmissionStatus | "all";
  onStatusFilterChange: (status: SubmissionStatus | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ReportingRegisterFilters({
  periods,
  periodFilter,
  onPeriodFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: ReportingRegisterFiltersProps) {
  const { t } = useLanguage();

  // Newest-first without mutating `periods` (oldest-first, the single
  // source of truth) -- same reversed-copy pattern ReportingHistoryList
  // already uses for the same reason.
  const periodsNewestFirst = [...periods].reverse();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="register-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
            />
            <input
              id="register-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.companyRegister.searchPlaceholder}
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
          <label htmlFor="register-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <select
            id="register-period"
            className={selectClass}
            value={periodFilter}
            onChange={(e) => onPeriodFilterChange(e.target.value)}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {periodsNewestFirst.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="register-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <select
            id="register-status"
            className={selectClass}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as SubmissionStatus | "all")}
          >
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
