"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, legendProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";
import type { AnnualRevenueSummary } from "@/lib/reporting/annual-revenue";

interface QuarterlyRevenueChartProps {
  summary: AnnualRevenueSummary;
  currency: Currency;
}

export function QuarterlyRevenueChart({ summary, currency }: QuarterlyRevenueChartProps) {
  const { t, lang } = useLanguage();
  const data = summary.quarters.map((q) => ({ ...q, label: `${q.label} ${summary.year}` }));

  return (
    <ChartCard
      title={`${t.companyReport.quarterlyRevenueTitle} — ${summary.year}`}
      actions={
        summary.annualRevenue !== null ? (
          <div className="text-end">
            <p className="text-[11px] font-medium text-muted-foreground">
              {summary.isActual ? t.companyReport.annualActualLabel : t.companyReport.annualProjectedLabel}
            </p>
            <p className="font-heading text-sm font-semibold text-foreground">
              <Num>{formatCurrency(summary.annualRevenue, currency, lang)}</Num>
            </p>
          </div>
        ) : null
      }
      footnote={summary.annualRevenue !== null && !summary.isActual ? t.companyReport.projectionMethodNote : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={Y_AXIS_WIDTH} tickFormatter={(value: number) => formatCompactCurrency(value, currency, lang)} />
          <Tooltip
            {...tooltipProps}
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value, name) => [formatCurrency(Number(value), currency, lang), name]}
          />
          <Legend {...legendProps} />
          <Bar dataKey="actual" stackId="rev" name={t.companyReport.reportedSeriesLabel} fill="var(--chart-submitted)" maxBarSize={36} />
          <Bar
            dataKey="projected"
            stackId="rev"
            name={t.companyReport.projectedSeriesLabel}
            fill="var(--chart-submitted)"
            fillOpacity={0.35}
            stroke="var(--chart-submitted)"
            strokeDasharray="4 3"
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
