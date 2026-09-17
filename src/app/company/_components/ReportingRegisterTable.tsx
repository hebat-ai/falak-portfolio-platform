"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import { REPORTING_CYCLES } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import type { Company, ReportingPeriod } from "@/lib/mock/types";

export interface RegisterRow {
  company: Company;
  period: ReportingPeriod;
}

const COLUMN_COUNT = 9;

export function ReportingRegisterTable({ rows }: { rows: RegisterRow[] }) {
  const { t, lang } = useLanguage();
  const ChevronIcon = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
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
          rows.map(({ company, period }) => {
            const periodData = company.periods[period];
            const cycle = REPORTING_CYCLES[period];
            const overdueDays = getOverdueDays(periodData.status, cycle.deadline);
            const companyVehicles = vehicleCompanyLinks
              .filter((l) => l.companyId === company.id)
              .map((l) => vehicles.find((v) => v.id === l.vehicleId))
              .filter((v): v is NonNullable<typeof v> => Boolean(v));

            return (
              <Tr key={`${company.id}-${period}`} className="hover:bg-surface-muted/60">
                <Td className="font-medium">{lang === "ar" ? company.nameAr : company.nameEn}</Td>
                <Td>{lang === "ar" ? cycle.labelAr : cycle.labelEn}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1">
                    {companyVehicles.length === 0 ? (
                      <span>—</span>
                    ) : (
                      companyVehicles.map((v, i) => (
                        <span key={v.id} className="inline-flex items-center gap-1">
                          <Link
                            href={`/vehicle/${v.slug}`}
                            className="rounded text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
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
                  {periodData.revenue === null ? (
                    <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                  ) : (
                    <Num>{formatCurrency(periodData.revenue, company.currency, lang)}</Num>
                  )}
                </Td>
                <Td>
                  <StatusBadge status={periodData.status} />
                </Td>
                <Td>
                  {periodData.lastUpdated ? (
                    <time dateTime={periodData.lastUpdated}>{formatDate(periodData.lastUpdated, lang)}</time>
                  ) : (
                    <span className="text-muted-foreground">{t.admin.reportingStatusPanel.neverSubmitted}</span>
                  )}
                </Td>
                <Td>
                  <time dateTime={cycle.deadline}>{formatDate(cycle.deadline, lang)}</time>
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
                    href={`/company/${company.slug}?period=${period}`}
                    aria-label={`${t.admin.table.viewCompanyAction} — ${lang === "ar" ? company.nameAr : company.nameEn} — ${lang === "ar" ? cycle.labelAr : cycle.labelEn}`}
                    className="inline-flex items-center gap-1 rounded text-sm font-medium text-link-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
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
  );
}
