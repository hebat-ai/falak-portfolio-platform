"use client";

import { LayoutList, LayoutGrid, RotateCcw, Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { vehicles } from "@/lib/mock/vehicles";
import { REPORTING_CYCLES } from "@/lib/mock/companies";
import type { Currency, ReportingPeriod, ReportingStatus } from "@/lib/mock/types";

export interface AdminFilterState {
  vehicleId: string | "all";
  period: ReportingPeriod;
  currency: Currency | "all";
  status: ReportingStatus | "all";
  searchQuery: string;
}

export const DEFAULT_ADMIN_FILTERS: AdminFilterState = {
  vehicleId: "all",
  period: "Q2_2026",
  currency: "all",
  status: "all",
  searchQuery: "",
};

interface FiltersBarProps {
  filters: AdminFilterState;
  onChange: (next: AdminFilterState) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
}

const STATUS_OPTIONS: ReportingStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "published",
];

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

export function FiltersBar({ filters, onChange, viewMode, onViewModeChange }: FiltersBarProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4">
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.filters.title}</h2>
        <p className="text-xs text-muted-foreground">{t.admin.filters.scopeNote}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="filter-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
            />
            <input
              id="filter-search"
              type="search"
              value={filters.searchQuery}
              onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
              placeholder={t.admin.filters.searchPlaceholder}
              className="w-full rounded-md border border-control-border bg-surface py-1.5 ps-9 pe-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground [&::-webkit-search-cancel-button]:appearance-none"
            />
            {filters.searchQuery ? (
              <button
                type="button"
                onClick={() => onChange({ ...filters, searchQuery: "" })}
                aria-label={t.admin.filters.clearSearchAriaLabel}
                className="absolute inset-y-0 end-0 my-auto me-2 rounded p-1 text-muted-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-vehicle" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.vehicleLabel}
          </label>
          <select
            id="filter-vehicle"
            className={selectClass}
            value={filters.vehicleId}
            onChange={(e) => onChange({ ...filters, vehicleId: e.target.value })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {lang === "ar" ? v.nameAr : v.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-period" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.periodLabel}
          </label>
          <select
            id="filter-period"
            className={selectClass}
            value={filters.period}
            onChange={(e) => onChange({ ...filters, period: e.target.value as ReportingPeriod })}
          >
            {(Object.keys(REPORTING_CYCLES) as ReportingPeriod[]).map((p) => (
              <option key={p} value={p}>
                {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-currency" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.currencyLabel}
          </label>
          <select
            id="filter-currency"
            className={selectClass}
            value={filters.currency}
            onChange={(e) => onChange({ ...filters, currency: e.target.value as Currency | "all" })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            <option value="SAR">{t.currencyNames.SAR}</option>
            <option value="USD">{t.currencyNames.USD}</option>
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="filter-status" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.statusLabel}
          </label>
          <select
            id="filter-status"
            className={selectClass}
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as ReportingStatus | "all" })}
          >
            <option value="all">{t.admin.filters.allOption}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t.status[s].label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_ADMIN_FILTERS)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t.admin.filters.resetFilters}
        </button>

        <div className="flex w-full items-center justify-center gap-1 rounded-md border border-control-border p-1 sm:ms-auto sm:w-auto">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            aria-pressed={viewMode === "table"}
            aria-label={t.admin.filters.viewTable}
            className={`rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
              viewMode === "table" ? "bg-nebula-aqua text-dark-green" : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <LayoutList aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            aria-pressed={viewMode === "cards"}
            aria-label={t.admin.filters.viewCards}
            className={`rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
              viewMode === "cards" ? "bg-nebula-aqua text-dark-green" : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <LayoutGrid aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
