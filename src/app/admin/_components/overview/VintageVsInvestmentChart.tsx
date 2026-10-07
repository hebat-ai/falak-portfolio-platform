"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, legendProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { VintageVsInvestmentPoint } from "@/lib/admin/portfolio-overview-compute";

interface VintageVsInvestmentChartProps {
  title: string;
  data: VintageVsInvestmentPoint[];
  fundsFormedLabel: string;
  startupsInvestedLabel: string;
  emptyMessage: string;
}

// Chart 6 -- two discrete per-year counts (funds formed, startups
// first-invested), so a grouped bar chart is the natural fit: easy to
// compare the two series year by year, unlike a line chart which would
// imply a continuous trend between sparse yearly counts.
export function VintageVsInvestmentChart({ title, data, fundsFormedLabel, startupsInvestedLabel, emptyMessage }: VintageVsInvestmentChartProps) {
  return (
    <ChartCard title={title} isEmpty={data.length === 0} emptyMessage={emptyMessage}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} width={Y_AXIS_WIDTH} />
          <Tooltip {...tooltipProps} cursor={{ fill: "var(--surface-muted)" }} />
          <Legend {...legendProps} />
          <Bar dataKey="fundsFormed" name={fundsFormedLabel} fill={getSeriesColor(0)} maxBarSize={20} />
          <Bar dataKey="startupsInvested" name={startupsInvestedLabel} fill={getSeriesColor(1)} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
