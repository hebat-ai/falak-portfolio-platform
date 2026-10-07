"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface SortOption<T> {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
}

/** Text sort, case- and accent-insensitive, in the viewer's language. */
export function byText<T>(key: string, label: string, get: (item: T) => string | null | undefined, desc = false): SortOption<T> {
  return {
    key,
    label,
    compare: (a, b) => {
      const r = (get(a) ?? "").localeCompare(get(b) ?? "", undefined, { sensitivity: "base", numeric: true });
      return desc ? -r : r;
    },
  };
}

/** Number or ISO-date sort; empty values always go last. */
export function byValue<T>(key: string, label: string, get: (item: T) => number | string | null | undefined, desc = false): SortOption<T> {
  return {
    key,
    label,
    compare: (a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null || va === "") return vb == null || vb === "" ? 0 : 1;
      if (vb == null || vb === "") return -1;
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return desc ? -r : r;
    },
  };
}

/**
 * Search box + sort menu for any list. `searchText` returns the text an
 * item is matched against (every typed word must appear). The first sort
 * option is the default.
 */
export function useListView<T>(
  items: T[],
  options: { searchText: (item: T) => string; sorts: SortOption<T>[]; id: string; search?: boolean }
) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(options.sorts[0]?.key ?? "");
  const { searchText, sorts } = options;

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = words.length
      ? items.filter((item) => {
          const text = searchText(item).toLowerCase();
          return words.every((w) => text.includes(w));
        })
      : items;
    const sort = sorts.find((s) => s.key === sortKey) ?? sorts[0];
    return sort ? [...filtered].sort(sort.compare) : filtered;
  }, [items, query, sortKey, searchText, sorts]);

  const controls: ReactNode = (
    <div className="flex flex-wrap items-end gap-2">
      {options.search === false ? null : (
      <div className="min-w-[12rem] flex-1 sm:max-w-xs">
        <Input
          search
          id={`${options.id}-search`}
          aria-label={t.lists.searchPlaceholder}
          placeholder={t.lists.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          clearAriaLabel={t.lists.clearSearch}
        />
      </div>
      )}
      {sorts.length > 1 ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {t.lists.sortLabel}
          <Select className="w-auto" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      {query && visible.length !== items.length ? (
        <span className="text-xs text-muted-foreground">
          {t.lists.showingCount.replace("{shown}", String(visible.length)).replace("{total}", String(items.length))}
        </span>
      ) : null}
    </div>
  );

  const empty: ReactNode =
    items.length > 0 && visible.length === 0 ? <p className="text-sm text-muted-foreground">{t.lists.noMatches}</p> : null;

  return { visible, controls, empty, query };
}
