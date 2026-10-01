"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyValuationPointDTO } from "@/lib/company/dto";

type Granularity = "quarterly" | "annually";

interface ValuationHistoryChartProps {
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

export function ValuationHistoryChart({ valuations, currency }: ValuationHistoryChartProps) {
  const { t, lang } = useLanguage();
  const [granularity, setGranularity] = useState<Granularity>("quarterly");

  const data = useMemo(() => {
    const points = granularity === "annually" ? toAnnual(valuations) : valuations;
    return points.map((v) => ({ date: v.asOfDate, amount: v.amount }));
  }, [valuations, granularity]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={granularity === "quarterly"}
          onClick={() => setGranularity("quarterly")}
          className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
            granularity === "quarterly"
              ? "bg-nebula-aqua text-dark-green"
              : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
          }`}
        >
          {t.companyReport.quarterlyToggleLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={granularity === "annually"}
          onClick={() => setGranularity("annually")}
          className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
            granularity === "annually"
              ? "bg-nebula-aqua text-dark-green"
              : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
          }`}
        >
          {t.companyReport.annuallyToggleLabel}
        </button>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="date"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value: string) => formatDate(value, lang)}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value: number) => formatCurrency(value, currency, lang)}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              labelFormatter={(value) => formatDate(String(value), lang)}
              formatter={(value) => [formatCurrency(Number(value), currency, lang), t.admin.charts.valuationAxisLabel]}
            />
            <Line type="monotone" dataKey="amount" stroke="var(--chart-submitted)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
