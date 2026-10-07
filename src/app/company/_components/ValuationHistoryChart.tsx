"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ChartCard, axisProps, chartMargin, gridProps, tooltipProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyValuationPointDTO } from "@/lib/company/dto";

type Granularity = "quarterly" | "annually";

interface ValuationHistoryChartProps {
  title: string;
  valuations: CompanyValuationPointDTO[];
  currency: Currency;
}

// Annual view takes each calendar year's LATEST-dated mark as that
// year's representative point -- a company can be marked more than once
// a year; "latest" is this plan's rule everywhere else (the Portfolio
// Dashboard's valuation views use the same "most recent wins" logic), so
// this stays consistent with that rather than averaging or taking the
// first mark of the year.
function toAnnual(valuations: CompanyValuationPointDTO[]): CompanyValuationPointDTO[] {
  const latestByYear = new Map<string, CompanyValuationPointDTO>();
  for (const v of valuations) {
    const year = v.asOfDate.slice(0, 4);
    const existing = latestByYear.get(year);
    if (!existing || v.asOfDate > existing.asOfDate) {
      latestByYear.set(year, v);
    }
  }
  return [...latestByYear.values()].sort((a, b) => a.asOfDate.localeCompare(b.asOfDate));
}

export function ValuationHistoryChart({ title, valuations, currency }: ValuationHistoryChartProps) {
  const { t, lang } = useLanguage();
  const [granularity, setGranularity] = useState<Granularity>("quarterly");

  const data = useMemo(() => {
    const points = granularity === "annually" ? toAnnual(valuations) : valuations;
    return points.map((v) => ({ date: v.asOfDate, amount: v.amount }));
  }, [valuations, granularity]);

  return (
    <ChartCard
      title={title}
      actions={
        <SegmentedToggle
          size="xs"
          value={granularity}
          onChange={setGranularity}
          ariaLabel={title}
          options={[
            { value: "quarterly", label: t.companyReport.quarterlyToggleLabel },
            { value: "annually", label: t.companyReport.annuallyToggleLabel },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" {...axisProps} tickFormatter={(value: string) => formatDate(value, lang)} />
          <YAxis {...axisProps} width={Y_AXIS_WIDTH} tickFormatter={(value: number) => formatCompactCurrency(value, currency, lang)} />
          <Tooltip
            {...tooltipProps}
            labelFormatter={(value) => formatDate(String(value), lang)}
            formatter={(value) => [formatCurrency(Number(value), currency, lang), t.admin.charts.valuationAxisLabel]}
          />
          <Line type="monotone" dataKey="amount" stroke="var(--chart-submitted)" strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
