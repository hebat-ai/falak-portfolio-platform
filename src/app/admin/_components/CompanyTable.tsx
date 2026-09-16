"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import type { Company, ReportingPeriod } from "@/lib/mock/types";

interface CompanyTableProps {
  companies: Company[];
  period: ReportingPeriod;
}

export function CompanyTable({ companies, period }: CompanyTableProps) {
  const { t, lang } = useLanguage();
  const ChevronIcon = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <Table caption={t.admin.table.caption}>
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          <Th>{t.admin.table.sectorColumn}</Th>
          <Th>{t.admin.table.customerModelColumn}</Th>
          <Th>{t.admin.table.entryStageColumn}</Th>
          <Th>{t.admin.table.currentStageColumn}</Th>
          <Th>{t.admin.table.vehicleColumn}</Th>
          <Th>{t.admin.table.revenueColumn}</Th>
          <Th>{t.admin.table.statusColumn}</Th>
          <Th>{t.admin.table.lastUpdatedColumn}</Th>
          <Th>
            <span className="sr-only">{t.admin.table.viewCompanyAction}</span>
          </Th>
        </Tr>
      </THead>
      <TBody>
        {companies.length === 0 ? (
          <Tr>
            <Td colSpan={10} className="py-8 text-center text-muted-foreground">
              {t.admin.emptyState}
            </Td>
          </Tr>
        ) : (
          companies.map((company) => {
            const periodData = company.periods[period];
            const links = vehicleCompanyLinks.filter((l) => l.companyId === company.id);
            const companyVehicles = links
              .map((l) => vehicles.find((v) => v.id === l.vehicleId))
              .filter((v): v is NonNullable<typeof v> => Boolean(v));

            return (
              <Tr key={company.id} className="hover:bg-surface-muted/60">
                <Td className="font-medium">{lang === "ar" ? company.nameAr : company.nameEn}</Td>
                <Td>{lang === "ar" ? company.sectorAr : company.sectorEn}</Td>
                <Td>{t.customerModels[company.customerModel]}</Td>
                <Td>{t.stages[company.entryStage]}</Td>
                <Td>{t.stages[company.currentStage]}</Td>
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
                  <Link
                    href={`/company/${company.slug}`}
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
