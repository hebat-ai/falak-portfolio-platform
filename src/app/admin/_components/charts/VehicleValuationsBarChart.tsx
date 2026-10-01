"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { AdminVehicleValuationDTO } from "@/lib/admin/dto";
import type { Currency } from "@/generated/prisma/client";

const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

interface VehicleValuationsBarChartProps {
  vehicles: AdminVehicleValuationDTO[];
}

export function VehicleValuationsBarChart({ vehicles }: VehicleValuationsBarChartProps) {
  const { t, lang } = useLanguage();
  const withNav = useMemo(() => vehicles.filter((v) => v.latest !== null), [vehicles]);
  const currenciesPresent = useMemo(
    () => CURRENCY_ORDER.filter((c) => withNav.some((vehicle) => vehicle.latest?.currency === c)),
    [withNav]
  );
  const [currency, setCurrency] = useState<Currency | null>(currenciesPresent[0] ?? null);
  const activeCurrency = currency && currenciesPresent.includes(currency) ? currency : currenciesPresent[0];

  const data = useMemo(() => {
    if (!activeCurrency) return [];
    return withNav
      .filter((v) => v.latest?.currency === activeCurrency)
      .map((v) => ({ name: lang === "ar" ? v.nameAr : v.nameEn, nav: v.latest?.amount ?? 0 }));
  }, [withNav, activeCurrency, lang]);

  if (!activeCurrency) {
    return <p className="text-sm text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {currenciesPresent.length > 1 ? (
        <div className="flex w-fit flex-col gap-1">
          <label htmlFor="vv-bar-currency" className="text-xs font-medium text-muted-foreground">
            {t.admin.charts.currencyLabel}
          </label>
          <Select id="vv-bar-currency" value={activeCurrency} onChange={(e) => setCurrency(e.target.value as Currency)}>
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
            <Bar dataKey="nav" fill="var(--chart-approved)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
