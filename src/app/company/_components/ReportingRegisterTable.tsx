"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminCompanyDTO, AdminPeriodOption, AdminVehicleDTO, AdminOwnershipLinkDTO } from "@/lib/admin/dto";
import { useListView, byText, byValue } from "@/components/lists/useListView";

export interface RegisterRow {
  company: AdminCompanyDTO;
  periodKey: string;
}

const COLUMN_COUNT = 9;

interface ReportingRegisterTableProps {
  rows: RegisterRow[];
  periods: AdminPeriodOption[];
  vehicles: AdminVehicleDTO[];
  ownershipLinks: AdminOwnershipLinkDTO[];
}

export function ReportingRegisterTable({ rows, periods, vehicles, ownershipLinks }: ReportingRegisterTableProps) {
  const { t, lang } = useLanguage();
  const ChevronIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const periodIndex = (r: RegisterRow) => periods.findIndex((p) => p.key === r.periodKey);
  const data = (r: RegisterRow) => r.company.periods[r.periodKey];
  const { visible, controls } = useListView(rows, {
    id: "reporting-register",
    search: false,
    searchText: () => "",
    sorts: [
      byValue("periodDesc", t.lists.periodDesc, periodIndex, true),
      byValue("periodAsc", t.lists.periodAsc, periodIndex),
      byText("nameAsc", t.lists.nameAsc, (r) => (lang === "ar" ? r.company.nameAr : r.company.nameEn)),
      byValue("deadlineAsc", t.lists.deadlineAsc, (r) => data(r)?.currentDeadline),
      byValue("overdueDesc", t.lists.overdueDesc, (r) => {
        const d = data(r);
        return d?.currentDeadline != null ? getOverdueDays(d.status, d.currentDeadline) : null;
      }, true),
      byValue("lastUpdated", t.lists.lastUpdatedDesc, (r) => data(r)?.lastUpdated, true),
      byText("statusAsc", t.lists.statusAsc, (r) => data(r)?.status),
      byValue("revenueDesc", t.lists.revenueDesc, (r) => data(r)?.revenue, true),
    ],
  });

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 ? controls : null}
      <Table caption={t.companyRegister.registerCaption}>
        <THead>
          <Tr>
            <Th>{t.admin.table.companyColumn}</Th>
            <Th>{t.companyRegister.periodColumnLabel}</Th>
            <Th>{t.admin.table.vehicleColumn}</Th>
            <Th>{t.admin.table.revenueColumn}</Th>
            <Th>{t.admin.table.statusColumn}</Th>
            <Th>{t.admin.table.lastUpdatedColumn}</Th>
            <Th>{t.admin.reportingStatusPanel.deadlineColumn}</Th>
            <Th>{t.companyRegister.overdueColumnLabel}</Th>
            <Th>
              <span className="sr-only">{t.admin.table.viewCompanyAction}</span>
            </Th>
          </Tr>
        </THead>
        <TBody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
                {t.companyRegister.emptyRegisterMessage}
              </Td>
            </Tr>
          ) : (
            visible.map(({ company, periodKey }) => {
              const periodData = company.periods[periodKey];
              const period = periods.find((p) => p.key === periodKey);
              const overdueDays =
                periodData?.currentDeadline != null ? getOverdueDays(periodData.status, periodData.currentDeadline) : null;
              const companyVehicles = ownershipLinks
                .filter((l) => l.companyId === company.id)
                .map((l) => vehicles.find((v) => v.id === l.vehicleId))
                .filter((v): v is NonNullable<typeof v> => Boolean(v));

              return (
                <Tr key={`${company.id}-${periodKey}`} className="hover:bg-surface-muted/60">
                  <Td className="font-medium">{lang === "ar" ? company.nameAr : company.nameEn}</Td>
                  <Td>{period?.label ?? periodKey}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1">
                      {companyVehicles.length === 0 ? (
                        <span>—</span>
                      ) : (
                        companyVehicles.map((v, i) => (
                          <span key={v.id} className="inline-flex items-center gap-1">
                            <Link
                              href={`/vehicle/${v.slug}`}
                              className="chamfer-br-sm text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                            >
                              {lang === "ar" ? v.nameAr : v.nameEn}
                            </Link>
                            {i < companyVehicles.length - 1 ? (
                              <span aria-hidden="true" className="text-muted-foreground">
                                {lang === "ar" ? "،" : ","}
                              </span>
                            ) : null}
                          </span>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>
                    {periodData?.revenue == null ? (
                      <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                    ) : (
                      <Num>{formatCurrency(periodData.revenue, company.currency, lang)}</Num>
                    )}
                  </Td>
                  <Td>{periodData ? <StatusBadge status={periodData.status} /> : null}</Td>
                  <Td>
                    {periodData?.lastUpdated ? (
                      <time dateTime={periodData.lastUpdated}>{formatDate(periodData.lastUpdated, lang)}</time>
                    ) : (
                      <span className="text-muted-foreground">{t.admin.reportingStatusPanel.neverSubmitted}</span>
                    )}
                  </Td>
                  <Td>
                    {periodData?.currentDeadline ? (
                      <time dateTime={periodData.currentDeadline}>{formatDate(periodData.currentDeadline, lang)}</time>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    {overdueDays !== null ? (
                      <span className="font-medium">
                        <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/company/${company.slug}?period=${periodKey}`}
                      aria-label={`${t.admin.table.viewCompanyAction} — ${lang === "ar" ? company.nameAr : company.nameEn} — ${period?.label ?? periodKey}`}
                      className="chamfer-br-sm inline-flex items-center gap-1 text-sm font-medium text-link-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                    >
                      {t.admin.table.viewCompanyAction}
                      <ChevronIcon aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Td>
                </Tr>
              );
            })
          )}
        </TBody>
      </Table>
    </div>
  );
}
