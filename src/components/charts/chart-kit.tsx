"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// One compact look for every chart on the platform: the same card, the
// same plot height, small type, and tooltips/legends that stay readable
// when a chart carries dozens of startups or vehicles.

export const CHART_FONT_SIZE = 10;

export const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: CHART_FONT_SIZE,
  tickLine: false,
} as const;

export const gridProps = {
  strokeDasharray: "3 3",
  stroke: "var(--border-subtle)",
  vertical: false,
} as const;

export const chartMargin = { top: 4, right: 8, bottom: 0, left: 0 };

/** Y-axis width that fits compact labels like "$1.2M" or "SAR 950K". */
export const Y_AXIS_WIDTH = 52;

export const tooltipProps = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border-subtle)",
    color: "var(--foreground)",
    fontSize: 11,
    padding: "4px 8px",
  },
  labelStyle: { fontWeight: 600, marginBottom: 2 },
  itemStyle: { padding: 0 },
} as const;

export const legendProps = {
  iconSize: 8,
  wrapperStyle: { fontSize: CHART_FONT_SIZE, lineHeight: "14px", maxHeight: 44, overflowY: "auto" as const },
} as const;

interface ChartCardProps {
  title: string;
  /** A headline figure shown under the title, e.g. a total. */
  headline?: ReactNode;
  /** Toggles or selects shown at the card's top end. */
  actions?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Small print under the chart, e.g. how a projection is made. */
  footnote?: ReactNode;
  children: ReactNode;
}

/** Fixed-height chart card so charts placed side by side always line up. */
export function ChartCard({ title, headline, actions, isEmpty = false, emptyMessage, footnote, children }: ChartCardProps) {
  return (
    <Card padding="sm" className="flex h-full min-w-0 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-xs font-semibold text-foreground">{title}</h2>
          {headline ? <p className="text-sm font-semibold text-foreground">{headline}</p> : null}
        </div>
        {actions}
      </div>
      {isEmpty ? (
        <div className="mt-2 flex h-52 items-center justify-center text-xs text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="mt-2 h-52 w-full min-w-0">{children}</div>
      )}
      {footnote ? <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{footnote}</p> : null}
    </Card>
  );
}

interface TooltipEntry {
  name?: unknown;
  value?: unknown;
  color?: string;
}

interface CompactTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: unknown;
  format: (value: number) => string;
  formatLabel?: (label: string) => string;
  /** Rows shown before collapsing the rest into "+N more". */
  limit?: number;
}

/**
 * Tooltip for charts with many series (one per startup or vehicle):
 * hides zero rows, sorts largest first and caps the list so it never
 * covers the whole screen.
 */
export function CompactTooltip({ active, payload, label, format, formatLabel, limit = 8 }: CompactTooltipProps) {
  const { t } = useLanguage();
  if (!active || !payload?.length) return null;
  const rows = payload
    .map((p) => ({ name: String(p.name ?? ""), value: Number(p.value ?? 0), color: p.color }))
    .filter((r) => r.value !== 0)
    .sort((a, b) => b.value - a.value);
  const shown = rows.slice(0, limit);
  const hidden = rows.length - shown.length;
  const labelText = label == null ? "" : formatLabel ? formatLabel(String(label)) : String(label);

  return (
    <div style={tooltipProps.contentStyle} className="max-w-[16rem]">
      {labelText ? <p className="mb-0.5 font-semibold">{labelText}</p> : null}
      <ul className="space-y-0.5">
        {shown.map((r) => (
          <li key={r.name} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 shrink-0" style={{ background: r.color }} />
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            <span className="tabular-nums">{format(r.value)}</span>
          </li>
        ))}
      </ul>
      {hidden > 0 ? <p className="mt-0.5 text-muted-foreground">{t.admin.charts.moreSeriesLabel.replace("{count}", String(hidden))}</p> : null}
    </div>
  );
}
