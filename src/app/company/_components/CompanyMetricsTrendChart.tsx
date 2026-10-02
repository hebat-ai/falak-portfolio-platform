"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { findNumericMetricValue } from "@/lib/reporting/metric-format";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyReportPeriodData, CompanyReportPeriodOption } from "@/lib/company/dto";

interface CompanyMetricsTrendChartProps {
  periods: CompanyReportPeriodOption[];
  periodsData: Record<string, CompanyReportPeriodData>;
  currency: Currency;
}

// Visible to both Falak staff and the company's own members (same
// visibility as MetricsBreakdown/CompanyKpis above it) -- this is the
// company's own reported revenue/burn history, not a fund-controlled
// mark. Reuses data CompanyReportView already holds in memory (every
// period's revenue + metrics), no extra fetch.
export function CompanyMetricsTrendChart({ periods, periodsData, currency }: CompanyMetricsTrendChartProps) {
  const { t, lang } = useLanguage();

  const data = periods.map((p) => {
    const periodData = periodsData[p.key];
    return {
      date: p.periodStart,
      label: p.label,
      revenue: periodData?.revenue ?? null,
      burn: periodData ? findNumericMetricValue(periodData.metrics, "fin_burn_rate") : null,
    };
  });

  const hasAnyData = data.some((d) => d.revenue !== null || d.burn !== null);
  if (!hasAnyData) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value: string) => formatDate(value, lang)} />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickFormatter={(value: number) => formatCurrency(value, currency, lang)}
          />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
            labelFormatter={(value) => formatDate(String(value), lang)}
            formatter={(value) => [formatCurrency(Number(value), currency, lang), ""]}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" name={t.companyReport.revenueLabel} stroke="var(--chart-submitted)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="burn" name={t.admin.charts.burnLabel} stroke="var(--chart-draft)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
