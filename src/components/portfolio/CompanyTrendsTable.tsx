"use client";

import Link from "next/link";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import type { CompanyTrendDTO } from "@/lib/admin/company-trends";

interface SparklineProps {
  values: (number | null)[];
  color: string;
}

// A tiny, axis-less trend line per cell -- the same "scan many companies
// at once" pattern Carta/Chronograph-style portfolio grids use instead
// of (or alongside) a single cluttered multi-series chart with one line
// per company. connectNulls so a gap (a period the company didn't
// report) doesn't break the line into disconnected dots.
function Sparkline({ values, color }: SparklineProps) {
  const hasAnyData = values.some((v) => v !== null);
  if (!hasAnyData) return <span className="text-xs text-muted-foreground">—</span>;

  const data = values.map((value, i) => ({ i, value }));
  return (
    <div className="h-8 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function GrowthCell({ value, lang }: { value: number | null; lang: "en" | "ar" }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`font-medium ${value >= 0 ? "text-nebula-aqua" : "text-red-600"}`}>
      <Num>{formatPercent(value, lang)}</Num>
    </span>
  );
}

interface CompanyTrendsTableProps {
  trends: CompanyTrendDTO[];
  // Same shared convention as PortfolioAlertsPanel's linkQuery -- lets
  // both the portfolio dashboard and a single vehicle dashboard reuse
  // this exact table with the right back-link on each company row.
  linkQuery: string;
}

// "Everything I need to know to track performance" in one scannable
// grid: every reporting company, its revenue and burn sparkline across
// its full reported history, and the latest QoQ growth/change figures --
// the per-company counterpart to the aggregate portfolio/vehicle trend
// chart it's rendered alongside.
export function CompanyTrendsTable({ trends, linkQuery }: CompanyTrendsTableProps) {
  const { t, lang } = useLanguage();

  if (trends.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.admin.charts.noTrendDataMessage}</p>;
  }

  return (
    <Table caption={t.admin.charts.companyTrendsCaption}>
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          <Th>{t.companyReport.revenueLabel}</Th>
          <Th className="text-end">{t.admin.charts.revenueGrowthQoqColumn}</Th>
          <Th>{t.admin.charts.burnLabel}</Th>
          <Th className="text-end">{t.admin.charts.burnChangeQoqColumn}</Th>
          <Th className="text-end">{t.admin.charts.runwayColumn}</Th>
        </Tr>
      </THead>
      <TBody>
        {trends.map((trend) => (
          <Tr key={trend.companyId}>
            <Td className="font-medium">
              <Link
                href={`/company/${trend.companySlug}?${linkQuery}`}
                className="chamfer-br-sm text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              >
                {lang === "ar" ? trend.companyNameAr : trend.companyNameEn}
              </Link>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <Sparkline values={trend.points.map((p) => p.revenue)} color="var(--chart-submitted)" />
                <span className="whitespace-nowrap">
                  {trend.latestRevenue === null ? (
                    <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                  ) : (
                    <Num>{formatCurrency(trend.latestRevenue, trend.currency, lang)}</Num>
                  )}
                </span>
              </div>
            </Td>
            <Td className="text-end">
              <GrowthCell value={trend.revenueGrowth} lang={lang} />
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <Sparkline values={trend.points.map((p) => p.burn)} color="var(--chart-draft)" />
                <span className="whitespace-nowrap">
                  {trend.latestBurn === null ? (
                    <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                  ) : (
                    <Num>{formatCurrency(trend.latestBurn, trend.currency, lang)}</Num>
                  )}
                </span>
              </div>
            </Td>
            <Td className="text-end">
              {/* A burn increase is unfavorable (the opposite framing of
                  revenue growth) -- color-code on the inverse sign. */}
              {trend.burnChange === null ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                <span className={`font-medium ${trend.burnChange <= 0 ? "text-nebula-aqua" : "text-red-600"}`}>
                  <Num>{formatPercent(trend.burnChange, lang)}</Num>
                </span>
              )}
            </Td>
            <Td className="text-end">
              {trend.runwayMonths === null ? (
                <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
              ) : (
                <Num>{formatNumber(trend.runwayMonths, lang)}</Num>
              )}
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
