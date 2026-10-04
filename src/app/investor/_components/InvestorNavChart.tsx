"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { InvestorNavSeriesPoint } from "@/lib/investor/dashboard-compute";

interface InvestorNavChartProps {
  series: InvestorNavSeriesPoint[];
  displayCurrency: DisplayCurrency;
}

export function InvestorNavChart({ series, displayCurrency }: InvestorNavChartProps) {
  const { t, lang } = useLanguage();

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.investorDashboard.navChartTitle}</h2>
      {series.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.investorDashboard.noNavMessage}</p>
      ) : (
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="asOfDate"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(value: string) => formatDate(value, lang)}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                width={90}
                tickFormatter={(value: number) => formatCurrency(value, displayCurrency, lang)}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                labelFormatter={(value) => formatDate(String(value), lang)}
                formatter={(value) => [formatCurrency(Number(value), displayCurrency, lang), t.investorDashboard.navSeriesLabel]}
              />
              <Line type="monotone" dataKey="value" stroke="var(--chart-submitted)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
