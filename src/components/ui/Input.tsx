import type { InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // When true, renders the search-icon prefix + conditional clear-button
  // suffix pattern previously hand-rolled in FiltersBar/ReviewQueueFilters/
  // ReportingRegisterFilters. `onClear` fires on the clear button; the
  // clear button only renders when `value` is non-empty.
  search?: boolean;
  onClear?: () => void;
  clearAriaLabel?: string;
}

const baseClass =
  "chamfer-br-sm w-full bg-surface py-1.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[inset_0_0_0_1px_var(--control-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

export function Input({ search, onClear, clearAriaLabel, className = "", value, ...rest }: InputProps) {
  if (!search) {
    return <input className={`${baseClass} px-3 ${className}`} value={value} {...rest} />;
  }

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        className={`${baseClass} ps-9 pe-8 [&::-webkit-search-cancel-button]:appearance-none ${className}`}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearAriaLabel}
          className="chamfer-br-sm absolute inset-y-0 end-0 my-auto me-2 p-1 text-muted-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
