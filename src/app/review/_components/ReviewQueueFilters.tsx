"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { SubmissionStatus } from "@/generated/prisma/client";
import type { AdminPeriodOption } from "@/lib/admin/dto";

export type QueueStatusFilter = "actionable" | "all" | SubmissionStatus;

const STATUS_OPTIONS: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];

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
    <div className="chamfer-br-md flex flex-col gap-4 bg-surface p-4 shadow-[var(--inner-line)]">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="review-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <Input
            search
            id="review-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            placeholder={t.reviewWorkspace.searchPlaceholder}
            clearAriaLabel={t.admin.filters.clearSearchAriaLabel}
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="review-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <Select id="review-period" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="review-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <Select
            id="review-status"
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
          </Select>
        </div>
      </div>
    </div>
  );
}
