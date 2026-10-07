"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
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
    <Card className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          {t.companyReport.quarterlyRevenueTitle} — {summary.year}
        </h2>
        {summary.annualRevenue !== null ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {summary.isActual ? t.companyReport.annualActualLabel : t.companyReport.annualProjectedLabel}
            </p>
            <p className="font-heading text-lg font-semibold text-foreground">
              <Num>{formatCurrency(summary.annualRevenue, currency, lang)}</Num>
            </p>
            {!summary.isActual ? (
              <p className="max-w-xs text-xs text-muted-foreground">{t.companyReport.projectionMethodNote}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={90}
              tickFormatter={(value: number) => formatCurrency(value, currency, lang)}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value, name) => [formatCurrency(Number(value), currency, lang), name]}
            />
            <Legend />
            <Bar dataKey="actual" stackId="rev" name={t.companyReport.reportedSeriesLabel} fill="var(--chart-submitted)" />
            <Bar
              dataKey="projected"
              stackId="rev"
              name={t.companyReport.projectedSeriesLabel}
              fill="var(--chart-submitted)"
              fillOpacity={0.35}
              stroke="var(--chart-submitted)"
              strokeDasharray="4 3"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
