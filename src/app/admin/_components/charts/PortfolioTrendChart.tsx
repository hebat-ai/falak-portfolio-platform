"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, formatPercent } from "@/lib/format";
import { percentChange } from "@/lib/reporting/computed-metrics";
import type { PortfolioTrendPoint } from "@/lib/admin/portfolio-trend";

// No single Currency applies across the whole portfolio (companies can
// be SAR or USD) -- this chart deliberately shows raw numbers with no
// currency symbol, same "never blend currencies" discipline the rest of
// this codebase's portfolio-wide views follow, just taken one step
// further here since there's no per-currency split worth a whole second
// chart for a simple trend line.
interface PortfolioTrendChartProps {
  points: PortfolioTrendPoint[];
}

export function PortfolioTrendChart({ points }: PortfolioTrendChartProps) {
  const { t, lang } = useLanguage();

  const data = points.map((p) => ({
    date: p.periodStart,
    label: p.periodLabel,
    revenue: p.totalRevenue,
    burn: p.totalBurn,
  }));

  // QoQ growth/change, derived client-side from the same already-
  // fetched totals -- no separate server round-trip. First period has
  // nothing to compare against (null, not 0), same discipline
  // percentChange itself documents.
  const growthData = points.map((p, i) => ({
    date: p.periodStart,
    revenueGrowth: i === 0 ? null : percentChange(p.totalRevenue, points[i - 1].totalRevenue),
    burnChange: i === 0 ? null : percentChange(p.totalBurn, points[i - 1].totalBurn),
  }));

  return (
    <div className="space-y-6">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value: string) => formatDate(value, lang)} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              labelFormatter={(value) => formatDate(String(value), lang)}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" name={t.companyReport.revenueLabel} stroke="var(--chart-submitted)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="burn" name={t.admin.charts.burnLabel} stroke="var(--chart-draft)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{t.admin.charts.revenueGrowthQoqColumn}</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value: string) => formatDate(value, lang)} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value: number) => formatPercent(value, lang)} />
              <ReferenceLine y={0} stroke="var(--border-subtle)" />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                labelFormatter={(value) => formatDate(String(value), lang)}
                formatter={(value) => [value === null ? "—" : formatPercent(Number(value), lang), ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenueGrowth"
                name={t.companyReport.revenueGrowthLabel}
                stroke="var(--chart-submitted)"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="burnChange"
                name={t.admin.charts.burnChangeQoqColumn}
                stroke="var(--chart-draft)"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
