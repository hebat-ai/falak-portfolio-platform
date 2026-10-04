"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { ReportingPeriodPoint } from "@/lib/admin/portfolio-overview-compute";

type View = "submission" | "audited";

interface ReportingStatusChartProps {
  title: string;
  data: ReportingPeriodPoint[];
  submissionViewLabel: string;
  auditedViewLabel: string;
  submittedLabel: string;
  notSubmittedLabel: string;
  auditedLabel: string;
  notAuditedLabel: string;
  emptyMessage: string;
}

// Chart 7 -- a 100%-composition stacked bar per reporting period, same
// chart type for both views (submitted/not, audited/not) so flipping
// the toggle reads as "the same chart, different lens" rather than two
// unrelated charts.
export function ReportingStatusChart({
  title,
  data,
  submissionViewLabel,
  auditedViewLabel,
  submittedLabel,
  notSubmittedLabel,
  auditedLabel,
  notAuditedLabel,
  emptyMessage,
}: ReportingStatusChartProps) {
  const [view, setView] = useState<View>("submission");

  const chartData = useMemo(
    () =>
      data.map((p) => ({
        periodLabel: p.periodLabel,
        positive: view === "submission" ? p.submittedCount : p.auditedCount,
        negative: view === "submission" ? p.notSubmittedCount : p.notAuditedCount,
      })),
    [data, view]
  );

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <SegmentedToggle
          value={view}
          onChange={setView}
          ariaLabel={title}
          options={[
            { value: "submission", label: submissionViewLabel },
            { value: "audited", label: auditedViewLabel },
          ]}
        />
      </div>
      <div className="mt-3 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="periodLabel" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
            <Legend />
            <Bar
              dataKey="positive"
              name={view === "submission" ? submittedLabel : auditedLabel}
              stackId="reporting"
              fill={getSeriesColor(0)}
            />
            <Bar
              dataKey="negative"
              name={view === "submission" ? notSubmittedLabel : notAuditedLabel}
              stackId="reporting"
              fill={getSeriesColor(3)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
