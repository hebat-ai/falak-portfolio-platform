"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { FundListRow } from "@/lib/admin/portfolio-overview-compute";
import type { DisplayCurrency } from "@/lib/currency/convert";
import { useListView, byText, byValue } from "@/components/lists/useListView";

interface FundListTableProps {
  title: string;
  rows: (FundListRow & { slug: string })[];
  displayCurrency: DisplayCurrency;
  columns: {
    fundName: string;
    vintageYear: string;
    investedCapital: string;
    nav: string;
    moic: string;
    numberOfInvestors: string;
  };
  notAvailableLabel: string;
  emptyMessage: string;
}

const cellClass = "px-3 py-2 text-sm text-foreground";

// Every value in a row links to that fund's own vehicle dashboard --
// one destination per row (there's no separate per-metric detail page
// for "this fund's invested capital" vs "this fund's NAV"), satisfying
// "clickable links on each value" without inventing pages that don't
// exist yet.
export function FundListTable({ title, rows, displayCurrency, columns, notAvailableLabel, emptyMessage }: FundListTableProps) {
  const { t, lang } = useLanguage();
  type Row = FundListTableProps["rows"][number];
  const name = (r: Row) => (lang === "ar" ? r.nameAr : r.nameEn);
  const { visible, controls, empty } = useListView(rows, {
    id: "fund-list",
    searchText: (r) => `${r.nameEn} ${r.nameAr} ${r.vintageYear ?? ""}`,
    sorts: [
      byText("nameAsc", t.lists.nameAsc, name),
      byValue("amountDesc", t.lists.amountDesc, (r) => r.investedCapital, true),
      byValue("navDesc", t.lists.navDesc, (r) => r.nav, true),
      byValue("moicDesc", t.lists.moicDesc, (r) => r.moic, true),
      byValue("vintageDesc", t.lists.vintageDesc, (r) => r.vintageYear, true),
      byValue("mostInvestors", t.lists.mostInvestors, (r) => r.numberOfInvestors, true),
    ],
  });

  if (rows.length === 0) {
    return (
      <Card className="min-w-0">
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-x-auto">
      <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{controls}</div>
      {empty}
      <table className="mt-3 w-full min-w-[640px] border-collapse text-start">
        <thead>
          <tr className="border-b border-border-subtle text-xs font-medium text-muted-foreground">
            <th className="px-3 py-2 text-start">{columns.fundName}</th>
            <th className="px-3 py-2 text-start">{columns.vintageYear}</th>
            <th className="px-3 py-2 text-start">{columns.investedCapital}</th>
            <th className="px-3 py-2 text-start">{columns.nav}</th>
            <th className="px-3 py-2 text-start">{columns.moic}</th>
            <th className="px-3 py-2 text-start">{columns.numberOfInvestors}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted">
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  {lang === "ar" ? row.nameAr : row.nameEn}
                </Link>
              </td>
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  {row.vintageYear ?? notAvailableLabel}
                </Link>
              </td>
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  <Num>{formatCurrency(row.investedCapital, displayCurrency, lang)}</Num>
                </Link>
              </td>
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  <Num>{formatCurrency(row.nav, displayCurrency, lang)}</Num>
                </Link>
              </td>
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  {row.moic === null ? notAvailableLabel : <Num>{row.moic.toFixed(2)}x</Num>}
                </Link>
              </td>
              <td className={cellClass}>
                <Link href={`/vehicle/${row.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                  <Num>{row.numberOfInvestors}</Num>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
