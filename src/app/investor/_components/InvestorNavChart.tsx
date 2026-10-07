"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, axisProps, chartMargin, gridProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { InvestorNavSeriesPoint } from "@/lib/investor/dashboard-compute";

interface InvestorNavChartProps {
  series: InvestorNavSeriesPoint[];
  displayCurrency: DisplayCurrency;
}

export function InvestorNavChart({ series, displayCurrency }: InvestorNavChartProps) {
  const { t, lang } = useLanguage();

  return (
    <ChartCard title={t.investorDashboard.navChartTitle} isEmpty={series.length === 0} emptyMessage={t.investorDashboard.noNavMessage}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="asOfDate" {...axisProps} tickFormatter={(value: string) => formatDate(value, lang)} />
          <YAxis {...axisProps} width={Y_AXIS_WIDTH} tickFormatter={(value: number) => formatCompactCurrency(value, displayCurrency, lang)} />
          <Tooltip
            {...tooltipProps}
            labelFormatter={(value) => formatDate(String(value), lang)}
            formatter={(value) => [formatCurrency(Number(value), displayCurrency, lang), t.investorDashboard.navSeriesLabel]}
          />
          <Line type="monotone" dataKey="value" stroke="var(--chart-submitted)" strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
