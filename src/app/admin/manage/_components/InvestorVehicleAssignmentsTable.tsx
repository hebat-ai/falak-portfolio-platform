"use client";

import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { unassignInvestorFromVehicleAction } from "../../actions";
import type { InvestorVehicleAssignmentRow } from "@/lib/admin/investor-vehicle-assignments";

const COLUMN_COUNT = 6;

export function InvestorVehicleAssignmentsTable({ rows }: { rows: InvestorVehicleAssignmentRow[] }) {
  const { t, lang } = useLanguage();

  return (
    <Table caption={t.admin.manage.investorVehicleAssignmentsCaption}>
      <THead>
        <Tr>
          <Th>{t.admin.manage.investorLabel}</Th>
          <Th>{t.admin.manage.vehicleLabel}</Th>
          <Th>{t.admin.manage.commitmentAmountLabel}</Th>
          <Th>{t.admin.manage.ownershipPctLabel}</Th>
          <Th>{t.admin.manage.effectiveFromLabel}</Th>
          <Th>
            <span className="sr-only">{t.admin.manage.archiveAction}</span>
          </Th>
        </Tr>
      </THead>
      <TBody>
        {rows.length === 0 ? (
          <Tr>
            <Td colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
              {t.admin.emptyState}
            </Td>
          </Tr>
        ) : (
          rows.map((row) => (
            <Tr key={row.id}>
              <Td>{lang === "ar" ? row.investorNameAr : row.investorNameEn}</Td>
              <Td>{lang === "ar" ? row.vehicleNameAr : row.vehicleNameEn}</Td>
              <Td>{row.commitmentAmount === null ? t.admin.table.noDataValue : <Num>{formatCurrency(row.commitmentAmount, row.currency, lang)}</Num>}</Td>
              <Td>{row.ownershipPct === null ? t.admin.table.noDataValue : <Num>{formatPercent(row.ownershipPct, lang)}</Num>}</Td>
              <Td>{formatDate(row.effectiveFrom, lang)}</Td>
              <Td>
                <form action={unassignInvestorFromVehicleAction}>
                  <input type="hidden" name="positionId" value={row.id} />
                  <Button type="submit" variant="outline" size="sm">
                    {t.admin.manage.unassignAction}
                  </Button>
                </form>
              </Td>
            </Tr>
          ))
        )}
      </TBody>
    </Table>
  );
}
