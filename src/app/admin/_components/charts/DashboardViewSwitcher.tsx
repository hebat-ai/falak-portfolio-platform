"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

export type DashboardView = "kpi" | "bar" | "pie" | "scatter" | "company-valuations" | "vehicle-valuations" | "portfolio-valuation";

const VIEW_OPTIONS: { key: DashboardView; labelKey: keyof Dictionary["admin"]["charts"] }[] = [
  { key: "kpi", labelKey: "kpiViewLabel" },
  { key: "bar", labelKey: "barViewLabel" },
  { key: "pie", labelKey: "pieViewLabel" },
  { key: "scatter", labelKey: "scatterViewLabel" },
  { key: "company-valuations", labelKey: "companyValuationsViewLabel" },
  { key: "vehicle-valuations", labelKey: "vehicleValuationsViewLabel" },
  { key: "portfolio-valuation", labelKey: "portfolioValuationViewLabel" },
];

interface DashboardViewSwitcherProps {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}

// Same active/inactive chamfer-br-sm button styling ManageSubNav.tsx
// already established for a segmented control, reused here for
// consistency. Plain ephemeral state owned by the caller -- not
// persisted, same precedent as CompanyListClient's table/cards toggle.
export function DashboardViewSwitcher({ view, onChange }: DashboardViewSwitcherProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.admin.charts.viewSwitcherLabel}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = option.key === view;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.key)}
            className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
              isActive
                ? "bg-nebula-aqua text-dark-green"
                : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
            }`}
          >
            {t.admin.charts[option.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
