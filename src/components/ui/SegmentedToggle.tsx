"use client";

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: SegmentedToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

// Generic version of the chamfer-br-sm segmented-button pattern
// DashboardViewSwitcher/ManageSubNav each hand-rolled their own copy of
// -- small (breakdown toggles, the USD/SAR switch) so it's worth sharing
// rather than a third copy.
export function SegmentedToggle<T extends string>({ value, options, onChange, ariaLabel }: SegmentedToggleProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
              isActive
                ? "bg-nebula-aqua text-dark-green"
                : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
