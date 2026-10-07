"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard, tooltipProps } from "@/components/charts/chart-kit";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatPercent } from "@/lib/format";
import type { DistributionSlice } from "@/lib/admin/company-list-compute";

interface DistributionPieChartProps {
  title: string;
  data: DistributionSlice[];
  labelFor: (key: string) => string;
  emptyMessage: string;
}

// Largest buckets get their own slice; the rest merge into "Other" so the
// chart stays readable however many sectors/vehicles/stages exist.
const MAX_SLICES = 7;
const OTHER_COLOR = "color-mix(in srgb, var(--muted-foreground) 45%, transparent)";

// Shared by every "distribution" chart (sector, vehicle, stage): a donut
// with its legend beside it, listing each slice's count and share.
export function DistributionPieChart({ title, data, labelFor, emptyMessage }: DistributionPieChartProps) {
  const { t, lang } = useLanguage();

  const { slices, total } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const head = sorted.length > MAX_SLICES + 1 ? sorted.slice(0, MAX_SLICES) : sorted;
    const rest = sorted.slice(head.length);
    const out = head.map((s, i) => ({ key: s.key, name: labelFor(s.key), value: s.count, color: getSeriesColor(i), names: [] as string[] }));
    if (rest.length > 0) {
      out.push({
        key: "__other",
        name: `${t.admin.charts.otherSliceLabel} (${rest.length})`,
        value: rest.reduce((sum, s) => sum + s.count, 0),
        color: OTHER_COLOR,
        names: rest.map((s) => labelFor(s.key)),
      });
    }
    return { slices: out, total: sorted.reduce((sum, s) => sum + s.count, 0) };
  }, [data, labelFor, t]);

  return (
    <ChartCard title={title} isEmpty={data.length === 0} emptyMessage={emptyMessage}>
      <div className="flex h-full items-center gap-3">
        <div className="relative h-full w-2/5 min-w-[6rem] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="92%"
                paddingAngle={1}
                stroke="var(--surface)"
                isAnimationActive={false}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-heading text-sm font-semibold text-foreground">
            {total}
          </span>
        </div>
        <ul className="scrollbar-thin max-h-full min-w-0 flex-1 space-y-1 overflow-y-auto pe-1 text-[11px] leading-tight">
          {slices.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5" title={s.names.length ? s.names.join(", ") : s.name}>
              <span aria-hidden="true" className="h-2 w-2 shrink-0" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 truncate text-foreground">{s.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {s.value} · {formatPercent(s.value / total, lang)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
