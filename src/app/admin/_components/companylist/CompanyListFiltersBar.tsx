"use client";

import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import type { CompanyListVehicleRef } from "@/lib/admin/company-list";
import type { DisplayCurrency } from "@/lib/currency/convert";

export interface CompanyListFilterState {
  searchQuery: string;
  vehicleId: string | "all";
  investmentYear: string | "all";
}

export const DEFAULT_COMPANY_LIST_FILTERS: CompanyListFilterState = {
  searchQuery: "",
  vehicleId: "all",
  investmentYear: "all",
};

interface CompanyListFiltersBarProps {
  filters: CompanyListFilterState;
  onChange: (next: CompanyListFilterState) => void;
  vehicles: CompanyListVehicleRef[];
  investmentYears: number[];
  displayCurrency: DisplayCurrency;
  onDisplayCurrencyChange: (currency: DisplayCurrency) => void;
}

export function CompanyListFiltersBar({
  filters,
  onChange,
  vehicles,
  investmentYears,
  displayCurrency,
  onDisplayCurrencyChange,
}: CompanyListFiltersBarProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="chamfer-br-md flex flex-col gap-4 bg-surface p-4 shadow-[var(--inner-line)]">
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.filters.title}</h2>
        <p className="text-xs text-muted-foreground">{t.admin.filters.scopeNote}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:min-w-[220px] sm:flex-1">
          <label htmlFor="cl-search" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.searchLabel}
          </label>
          <Input
            search
            id="cl-search"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            onClear={() => onChange({ ...filters, searchQuery: "" })}
            placeholder={t.admin.filters.searchPlaceholder}
            clearAriaLabel={t.admin.filters.clearSearchAriaLabel}
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="cl-vehicle" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.vehicleLabel}
          </label>
          <Select id="cl-vehicle" value={filters.vehicleId} onChange={(e) => onChange({ ...filters, vehicleId: e.target.value })}>
            <option value="all">{t.admin.filters.allOption}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {lang === "ar" ? v.nameAr : v.nameEn}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label htmlFor="cl-year" className="text-xs font-medium text-muted-foreground">
            {t.admin.filters.investmentYearLabel}
          </label>
          <Select id="cl-year" value={filters.investmentYear} onChange={(e) => onChange({ ...filters, investmentYear: e.target.value })}>
            <option value="all">{t.admin.filters.allOption}</option>
            {investmentYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground">{t.admin.charts.currencyToggleLabel}</span>
          <SegmentedToggle
            value={displayCurrency}
            onChange={onDisplayCurrencyChange}
            ariaLabel={t.admin.charts.currencyToggleLabel}
            options={[
              { value: "USD", label: t.currencyNames.USD },
              { value: "SAR", label: t.currencyNames.SAR },
            ]}
          />
        </div>

        <Button type="button" variant="outline" size="sm" block className="sm:w-auto" onClick={() => onChange(DEFAULT_COMPANY_LIST_FILTERS)}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t.admin.filters.resetFilters}
        </Button>
      </div>
    </div>
  );
}
