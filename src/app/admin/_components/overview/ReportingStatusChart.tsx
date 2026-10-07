"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ChartCard, axisProps, chartMargin, gridProps, legendProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
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

  return (
    <ChartCard
      title={title}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
      actions={
        <SegmentedToggle
          size="xs"
          value={view}
          onChange={setView}
          ariaLabel={title}
          options={[
            { value: "submission", label: submissionViewLabel },
            { value: "audited", label: auditedViewLabel },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="periodLabel" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} width={Y_AXIS_WIDTH} />
          <Tooltip {...tooltipProps} cursor={{ fill: "var(--surface-muted)" }} />
          <Legend {...legendProps} />
          <Bar
            dataKey="positive"
            name={view === "submission" ? submittedLabel : auditedLabel}
            stackId="reporting"
            fill={getSeriesColor(0)}
            maxBarSize={28}
          />
          <Bar
            dataKey="negative"
            name={view === "submission" ? notSubmittedLabel : notAuditedLabel}
            stackId="reporting"
            fill={getSeriesColor(3)}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
