"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
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
      <div className="mt-3 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
            <Legend />
            <Bar dataKey="fundsFormed" name={fundsFormedLabel} fill={getSeriesColor(0)} />
            <Bar dataKey="startupsInvested" name={startupsInvestedLabel} fill={getSeriesColor(1)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
