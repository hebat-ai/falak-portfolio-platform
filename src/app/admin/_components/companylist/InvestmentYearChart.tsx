"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { InvestmentYearPoint } from "@/lib/admin/company-list-compute";

interface InvestmentYearChartProps {
  title: string;
  data: InvestmentYearPoint[];
  emptyMessage: string;
}

// A yearly count of NEW investments (not cumulative headcount, which
// already has its own chart on the portfolio overview dashboard) is a
// discrete per-year figure, so a bar chart reads more naturally than a
// line here.
export function InvestmentYearChart({ title, data, emptyMessage }: InvestmentYearChartProps) {
  return (
    <ChartCard title={title} isEmpty={data.length === 0} emptyMessage={emptyMessage}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} width={Y_AXIS_WIDTH} />
          <Tooltip {...tooltipProps} cursor={{ fill: "var(--surface-muted)" }} />
          <Bar dataKey="count" fill={getSeriesColor(0)} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
