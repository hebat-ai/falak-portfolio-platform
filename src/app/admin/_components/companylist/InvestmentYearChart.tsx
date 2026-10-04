"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
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
  if (data.length === 0) {
    return (
      <Card className="min-w-0">
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
            <Bar dataKey="count" fill={getSeriesColor(0)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
