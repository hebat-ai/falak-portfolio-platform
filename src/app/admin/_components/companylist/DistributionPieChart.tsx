"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { DistributionSlice } from "@/lib/admin/company-list-compute";

interface DistributionPieChartProps {
  title: string;
  data: DistributionSlice[];
  labelFor: (key: string) => string;
  emptyMessage: string;
}

// Shared by all three "distribution" charts (sector, vehicle, stage) --
// a pie is the natural read for "what share of the portfolio falls
// into each bucket," the same judgment call the old (now removed)
// StatusBreakdownPieChart made for submission status.
export function DistributionPieChart({ title, data, labelFor, emptyMessage }: DistributionPieChartProps) {
  if (data.length === 0) {
    return (
      <Card className="min-w-0">
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  const chartData = data.map((slice) => ({ name: labelFor(slice.key), value: slice.count }));

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ value }) => value}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getSeriesColor(i)} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
