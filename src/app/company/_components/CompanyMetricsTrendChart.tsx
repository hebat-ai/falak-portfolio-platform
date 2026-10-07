"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, legendProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { findNumericMetricValue } from "@/lib/reporting/metric-format";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyReportPeriodData, CompanyReportPeriodOption } from "@/lib/company/dto";

interface CompanyMetricsTrendChartProps {
  title: string;
  periods: CompanyReportPeriodOption[];
  periodsData: Record<string, CompanyReportPeriodData>;
  currency: Currency;
}

// Visible to both Falak staff and the company's own members (same
// visibility as MetricsBreakdown/CompanyKpis above it) -- this is the
// company's own reported revenue/burn history, not a fund-controlled
// mark. Reuses data CompanyReportView already holds in memory (every
// period's revenue + metrics), no extra fetch.
export function CompanyMetricsTrendChart({ title, periods, periodsData, currency }: CompanyMetricsTrendChartProps) {
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
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" {...axisProps} tickFormatter={(value: string) => formatDate(value, lang)} />
          <YAxis {...axisProps} width={Y_AXIS_WIDTH} tickFormatter={(value: number) => formatCompactCurrency(value, currency, lang)} />
          <Tooltip
            {...tooltipProps}
            labelFormatter={(value) => formatDate(String(value), lang)}
            formatter={(value, name) => [formatCurrency(Number(value), currency, lang), name]}
          />
          <Legend {...legendProps} />
          <Line type="monotone" dataKey="revenue" name={t.companyReport.revenueLabel} stroke="var(--chart-submitted)" strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
          <Line type="monotone" dataKey="burn" name={t.admin.charts.burnLabel} stroke="var(--chart-draft)" strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
