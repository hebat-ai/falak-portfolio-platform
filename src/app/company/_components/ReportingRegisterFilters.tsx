"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminPeriodOption } from "@/lib/admin/dto";
import type { SubmissionStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];

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
    <div className="chamfer-br-md flex flex-col gap-4 bg-surface p-4 shadow-[var(--inner-line)]">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="register-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <Input
            search
            id="register-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            placeholder={t.companyRegister.searchPlaceholder}
            clearAriaLabel={t.admin.filters.clearSearchAriaLabel}
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="register-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <Select id="register-period" value={periodFilter} onChange={(e) => onPeriodFilterChange(e.target.value)}>
            <option value="all">{t.admin.filters.allOption}</option>
            {periodsNewestFirst.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="register-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <Select
            id="register-status"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as SubmissionStatus | "all")}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t.status[s].label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
