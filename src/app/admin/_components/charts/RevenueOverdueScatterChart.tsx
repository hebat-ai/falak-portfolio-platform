"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminCompanyDTO } from "@/lib/admin/dto";
import type { Currency } from "@/generated/prisma/client";

const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

interface RevenueOverdueScatterChartProps {
  companies: AdminCompanyDTO[];
  periodKey: string;
}

// Revenue is never shown or compared across currencies anywhere else in
// this app (see computeRevenueByCurrency's own comment and the KPI
// panel's no-cross-currency note) -- plotting SAR and USD companies on
// one shared revenue axis here would be the one place that broke that
// rule, so this scatter plot is scoped to one currency at a time, same
// as the KPI revenue section's own per-currency blocks.
export function RevenueOverdueScatterChart({ companies, periodKey }: RevenueOverdueScatterChartProps) {
  const { t, lang } = useLanguage();
  const currenciesPresent = useMemo(
    () => CURRENCY_ORDER.filter((c) => companies.some((company) => company.currency === c)),
    [companies]
  );
  const [currency, setCurrency] = useState<Currency | null>(currenciesPresent[0] ?? null);
  const activeCurrency = currency && currenciesPresent.includes(currency) ? currency : currenciesPresent[0];

  const data = useMemo(() => {
    if (!activeCurrency) return [];
    return companies
      .filter((c) => c.currency === activeCurrency)
      .map((company) => {
        const periodData = company.periods[periodKey];
        const revenue = periodData?.revenue;
        if (revenue == null) return null;
        const overdueDays = periodData?.currentDeadline ? getOverdueDays(periodData.status, periodData.currentDeadline) : null;
        return {
          name: lang === "ar" ? company.nameAr : company.nameEn,
          overdueDays: overdueDays ?? 0,
          revenue,
        };
      })
      .filter((d): d is { name: string; overdueDays: number; revenue: number } => d !== null);
  }, [companies, periodKey, activeCurrency, lang]);

  if (!activeCurrency) {
    return <p className="text-sm text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {currenciesPresent.length > 1 ? (
        <div className="flex w-fit flex-col gap-1">
          <label htmlFor="scatter-currency" className="text-xs font-medium text-muted-foreground">
            {t.admin.charts.currencyLabel}
          </label>
          <Select id="scatter-currency" value={activeCurrency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {currenciesPresent.map((c) => (
              <option key={c} value={c}>{t.currencyNames[c]}</option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              type="number"
              dataKey="overdueDays"
              name={t.admin.charts.overdueDaysAxisLabel}
              stroke="var(--muted-foreground)"
              fontSize={12}
              allowDecimals={false}
              label={{ value: t.admin.charts.overdueDaysAxisLabel, position: "insideBottom", offset: -5, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="number"
              dataKey="revenue"
              name={t.admin.charts.revenueAxisLabel}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value: number) => formatCurrency(value, activeCurrency, lang)}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value, key) =>
                key === "revenue"
                  ? [formatCurrency(Number(value), activeCurrency, lang), t.admin.charts.revenueAxisLabel]
                  : [String(value), t.admin.charts.overdueDaysAxisLabel]
              }
              labelFormatter={() => ""}
            />
            <Scatter data={data} fill="var(--chart-submitted)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
