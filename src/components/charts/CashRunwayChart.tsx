"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, legendProps, tooltipProps, Y_AXIS_WIDTH } from "./chart-kit";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";

export interface CashRunwayPoint {
  label: string;
  cash: number | null;
  runway: number | null;
}

interface CashRunwayChartProps {
  points: CashRunwayPoint[];
  currency: Currency;
  /** Fixed pixel width, for print; fills the card otherwise. */
  width?: number;
  animate?: boolean;
  className?: string;
}

// Cash balance as bars (left axis, money) and runway as a line (right
// axis, months), per reporting period.
export function CashRunwayChart({ points, currency, width, animate = true, className }: CashRunwayChartProps) {
  const { t, lang } = useLanguage();
  const hasData = points.some((p) => p.cash !== null || p.runway !== null);
  const months = (v: number) => `${formatNumber(v, lang)} ${t.quarterlyReport.monthsUnit}`;

  return (
    <ChartCard
      title={t.quarterlyReport.cashRunwayTitle}
      isEmpty={!hasData}
      emptyMessage={t.quarterlyReport.cashRunwayEmpty}
      className={className}
    >
      <ResponsiveContainer width={width ?? "100%"} height="100%">
        <ComposedChart data={points} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            yAxisId="cash"
            {...axisProps}
            width={Y_AXIS_WIDTH}
            tickFormatter={(value: number) => formatCompactCurrency(value, currency, lang)}
          />
          <YAxis
            yAxisId="runway"
            orientation="right"
            {...axisProps}
            width={32}
            allowDecimals={false}
            tickFormatter={(value: number) => formatNumber(value, lang)}
          />
          <Tooltip
            {...tooltipProps}
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value, name, item) =>
              item.dataKey === "runway" ? [months(Number(value)), name] : [formatCurrency(Number(value), currency, lang), name]
            }
          />
          <Legend {...legendProps} />
          <Bar
            yAxisId="cash"
            dataKey="cash"
            name={t.quarterlyReport.cashBalanceSeriesLabel}
            fill="var(--chart-submitted)"
            maxBarSize={36}
            isAnimationActive={animate}
          />
          <Line
            yAxisId="runway"
            type="monotone"
            dataKey="runway"
            name={`${t.quarterlyReport.runwayLabel} (${t.quarterlyReport.monthsUnit})`}
            stroke="var(--chart-draft)"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={animate}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
