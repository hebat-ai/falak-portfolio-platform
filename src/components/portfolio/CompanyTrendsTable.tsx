"use client";

import Link from "next/link";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { computeTrendRow } from "@/lib/admin/company-trend-row";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { CompanyTrendDTO } from "@/lib/admin/company-trends";

// `favorable` decides the color: revenue growth is good when positive,
// a burn increase is good when negative.
function ChangeCell({ value, favorable, lang }: { value: number | null; favorable: (v: number) => boolean; lang: "en" | "ar" }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`font-medium ${favorable(value) ? "text-nebula-aqua" : "text-danger"}`}>
      <Num>{formatPercent(value, lang)}</Num>
    </span>
  );
}

interface CompanyTrendsTableProps {
  trends: CompanyTrendDTO[];
  periodKey: string;
  displayCurrency: DisplayCurrency;
  linkQuery: string;
}

export function CompanyTrendsTable({ trends, periodKey, displayCurrency, linkQuery }: CompanyTrendsTableProps) {
  const { t, lang } = useLanguage();

  if (trends.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.admin.charts.noTrendDataMessage}</p>;
  }

  const noData = <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>;

  return (
    <Table
      caption={t.admin.charts.companyTrendsCaption}
      className="[&_td]:px-3 [&_td]:py-2 [&_td]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:whitespace-nowrap"
    >
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          <Th>{t.companyReport.revenueLabel}</Th>
          <Th>{t.admin.charts.revenueGrowthQoqColumn}</Th>
          <Th>{t.admin.charts.burnLabel}</Th>
          <Th>{t.admin.charts.burnChangeQoqColumn}</Th>
          <Th>{t.admin.charts.runwayColumn}</Th>
        </Tr>
      </THead>
      <TBody>
        {trends.map((trend) => {
          const row = computeTrendRow(trend.points, trend.currency, periodKey, displayCurrency);
          return (
            <Tr key={trend.companyId}>
              <Td className="font-medium">
                <Link
                  href={`/company/${trend.companySlug}?${linkQuery}`}
                  className="chamfer-br-sm text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                >
                  {lang === "ar" ? trend.companyNameAr : trend.companyNameEn}
                </Link>
              </Td>
              <Td>{row.revenue === null ? noData : <Num>{formatCurrency(row.revenue, displayCurrency, lang)}</Num>}</Td>
              <Td>
                <ChangeCell value={row.revenueGrowth} favorable={(v) => v >= 0} lang={lang} />
              </Td>
              <Td>{row.burn === null ? noData : <Num>{formatCurrency(row.burn, displayCurrency, lang)}</Num>}</Td>
              <Td>
                <ChangeCell value={row.burnChange} favorable={(v) => v <= 0} lang={lang} />
              </Td>
              <Td>{row.runwayMonths === null ? noData : <Num>{formatNumber(row.runwayMonths, lang)}</Num>}</Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}
