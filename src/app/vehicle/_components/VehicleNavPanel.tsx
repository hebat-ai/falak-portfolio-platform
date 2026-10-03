"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VehicleNavSummary } from "@/lib/vehicle/nav";

interface VehicleNavPanelProps {
  nav: VehicleNavSummary;
}

// This vehicle's own NAV headline + its NAV-over-time trend -- the one
// figure the vehicle dashboard was missing before (previously only
// reachable by filtering the portfolio dashboard's NAV panel down to
// this vehicle). Mirrors ValuationHistoryChart's single-series LineChart
// pattern, just for VehicleNavSnapshot instead of CompanyValuationSnapshot.
export function VehicleNavPanel({ nav }: VehicleNavPanelProps) {
  const { t, lang } = useLanguage();

  if (!nav.latest) {
    return (
      <Card className="min-w-0">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.charts.navPanelTitle}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{t.admin.emptyState}</p>
      </Card>
    );
  }

  const currency = nav.latest.currency;
  const data = nav.history.map((p) => ({ date: p.asOfDate, amount: p.amount }));

  return (
    <Card className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.charts.navPanelTitle}</h2>
        <KpiCard
          className="min-w-[12rem]"
          label={t.currencyNames[currency]}
          value={<Num>{formatCurrency(nav.latest.amount, currency, lang)}</Num>}
          hint={`${t.companyReport.valuationAsOfPrefix} ${formatDate(nav.latest.asOfDate, lang)}`}
        />
      </div>

      {data.length > 1 ? (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value: string) => formatDate(value, lang)} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(value: number) => formatCurrency(value, currency, lang)}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                labelFormatter={(value) => formatDate(String(value), lang)}
                formatter={(value) => [formatCurrency(Number(value), currency, lang), t.admin.charts.navPanelTitle]}
              />
              <Line type="monotone" dataKey="amount" stroke="var(--chart-approved)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Card>
  );
}
