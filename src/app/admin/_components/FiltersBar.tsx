"use client";

import { LayoutList, LayoutGrid, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import type { Currency, SubmissionStatus } from "@/generated/prisma/client";
import type { AdminVehicleDTO, AdminPeriodOption } from "@/lib/admin/dto";

export interface AdminFilterState {
  vehicleId: string | "all";
  period: string;
  currency: Currency | "all";
  status: SubmissionStatus | "all";
  searchQuery: string;
}

export const DEFAULT_ADMIN_FILTERS: Omit<AdminFilterState, "period"> = {
  vehicleId: "all",
  currency: "all",
  status: "all",
  searchQuery: "",
};

interface FiltersBarProps {
  filters: AdminFilterState;
  onChange: (next: AdminFilterState) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  vehicles: AdminVehicleDTO[];
  periods: AdminPeriodOption[];
}

const STATUS_OPTIONS: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];

export function FiltersBar({ filters, onChange, viewMode, onViewModeChange, vehicles, periods }: FiltersBarProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="chamfer-br-md flex flex-col gap-4 bg-surface p-4 shadow-[var(--inner-line)]">
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.filters.title}</h2>
        <p className="text-xs text-muted-foreground">{t.admin.filters.scopeNote}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="filter-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <Input
            search
            id="filter-search"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            onClear={() => onChange({ ...filters, searchQuery: "" })}
            placeholder={t.admin.filters.searchPlaceholder}
            clearAriaLabel={t.admin.filters.clearSearchAriaLabel}
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-vehicle" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.vehicleLabel}
          </label>
          <Select
            id="filter-vehicle"
            value={filters.vehicleId}
            onChange={(e) => onChange({ ...filters, vehicleId: e.target.value })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {lang === "ar" ? v.nameAr : v.nameEn}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <Select id="filter-period" value={filters.period} onChange={(e) => onChange({ ...filters, period: e.target.value })}>
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-currency" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.currencyLabel}
          </label>
          <Select
            id="filter-currency"
            value={filters.currency}
            onChange={(e) => onChange({ ...filters, currency: e.target.value as Currency | "all" })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            <option value="SAR">{t.currencyNames.SAR}</option>
            <option value="USD">{t.currencyNames.USD}</option>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <Select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as SubmissionStatus | "all" })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t.status[s].label}
              </option>
            ))}
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          block
          className="sm:w-auto"
          onClick={() => onChange({ ...DEFAULT_ADMIN_FILTERS, period: filters.period })}
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t.admin.filters.resetFilters}
        </Button>

        <div className="chamfer-br-sm flex w-full items-center justify-center gap-1 p-1 shadow-[inset_0_0_0_1px_var(--control-border)] sm:ms-auto sm:w-auto">
          <IconButton
            onClick={() => onViewModeChange("table")}
            aria-pressed={viewMode === "table"}
            aria-label={t.admin.filters.viewTable}
            active={viewMode === "table"}
          >
            <LayoutList aria-hidden="true" className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={() => onViewModeChange("cards")}
            aria-pressed={viewMode === "cards"}
            aria-label={t.admin.filters.viewCards}
            active={viewMode === "cards"}
          >
            <LayoutGrid aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
