"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { AdminCompanyValuationDTO } from "@/lib/admin/dto";
import type { Currency } from "@/generated/prisma/client";

const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

interface CompanyValuationsBarChartProps {
  companies: AdminCompanyValuationDTO[];
}

// Same currency-scoping judgment call as RevenueOverdueScatterChart --
// valuation is never combined across currencies either, so this bar
// chart is scoped to one currency at a time, with a selector only when
// more than one is actually present among companies that have a mark.
export function CompanyValuationsBarChart({ companies }: CompanyValuationsBarChartProps) {
  const { t, lang } = useLanguage();
  const withValuation = useMemo(() => companies.filter((c) => c.latest !== null), [companies]);
  const currenciesPresent = useMemo(
    () => CURRENCY_ORDER.filter((c) => withValuation.some((company) => company.latest?.currency === c)),
    [withValuation]
  );
  const [currency, setCurrency] = useState<Currency | null>(currenciesPresent[0] ?? null);
  const activeCurrency = currency && currenciesPresent.includes(currency) ? currency : currenciesPresent[0];

  const data = useMemo(() => {
    if (!activeCurrency) return [];
    return withValuation
      .filter((c) => c.latest?.currency === activeCurrency)
      .map((c) => ({ name: lang === "ar" ? c.nameAr : c.nameEn, valuation: c.latest?.amount ?? 0 }));
  }, [withValuation, activeCurrency, lang]);

  if (!activeCurrency) {
    return <p className="text-sm text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {currenciesPresent.length > 1 ? (
        <div className="flex w-fit flex-col gap-1">
          <label htmlFor="cv-bar-currency" className="text-xs font-medium text-muted-foreground">
            {t.admin.charts.currencyLabel}
          </label>
          <Select id="cv-bar-currency" value={activeCurrency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {currenciesPresent.map((c) => (
              <option key={c} value={c}>{t.currencyNames[c]}</option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value: number) => formatCurrency(value, activeCurrency, lang)}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value) => [formatCurrency(Number(value), activeCurrency, lang), t.admin.charts.valuationAxisLabel]}
            />
            <Bar dataKey="valuation" fill="var(--chart-submitted)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
