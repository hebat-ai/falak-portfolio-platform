"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
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

  return (
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
  );
}
