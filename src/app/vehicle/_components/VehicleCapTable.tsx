"use client";

import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency/convert";
import type { VehicleCapTable as VehicleCapTableData } from "@/lib/vehicle/cap-table-compute";
import { useListView, byText, byValue } from "@/components/lists/useListView";

interface VehicleCapTableProps {
  capTable: VehicleCapTableData;
  displayCurrency: DisplayCurrency;
}

export function VehicleCapTable({ capTable, displayCurrency }: VehicleCapTableProps) {
  const { t, lang } = useLanguage();
  type Row = VehicleCapTableData["rows"][number];
  const name = (r: Row) => (lang === "ar" ? r.nameAr : r.nameEn);
  const { visible, controls, empty } = useListView(capTable.rows, {
    id: "vehicle-cap-table",
    searchText: (r) => `${r.nameEn} ${r.nameAr}`,
    sorts: [
      byValue("ownershipDesc", t.lists.ownershipDesc, (r) => r.ownershipPct, true),
      byValue("amountDesc", t.lists.amountDesc, (r) => r.contributed, true),
      byText("nameAsc", t.lists.nameAsc, name),
    ],
  });

  if (capTable.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.vehicleReport.noInvestorsLinked}</p>;
  }

  const money = (v: number) => <Num>{formatCurrency(v, displayCurrency, lang)}</Num>;
  const pct = (v: number | null) =>
    v === null ? <span className="text-muted-foreground">—</span> : <Num>{formatPercent(v, lang, 2)}</Num>;

  return (
    <div className="flex flex-col gap-2">
      {controls}
      {empty}
      <Table
        caption={t.vehicleReport.capTableCaption}
        className="[&_td]:px-3 [&_td]:py-2 [&_td]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:whitespace-nowrap"
      >
        <THead>
          <Tr>
            <Th>{t.vehicleReport.investorColumn}</Th>
            <Th>{t.vehicleReport.contributedCapitalColumn}</Th>
            <Th>{t.vehicleReport.netInvestedCapitalColumn}</Th>
            <Th>{t.vehicleReport.ownershipColumn}</Th>
          </Tr>
        </THead>
        <TBody>
          {visible.map((row) => (
            <Tr key={row.investorId}>
              <Td className="font-medium">{lang === "ar" ? row.nameAr : row.nameEn}</Td>
              <Td>{money(row.contributed)}</Td>
              <Td>{money(row.netInvested)}</Td>
              <Td>{pct(row.ownershipPct)}</Td>
            </Tr>
          ))}
          <Tr className="bg-surface-muted font-semibold">
            <Td>{t.vehicleReport.totalRow}</Td>
            <Td>{money(capTable.totals.contributed)}</Td>
            <Td>{money(capTable.totals.netInvested)}</Td>
            <Td>{pct(capTable.totals.ownershipPct)}</Td>
          </Tr>
        </TBody>
      </Table>
    </div>
  );
}
