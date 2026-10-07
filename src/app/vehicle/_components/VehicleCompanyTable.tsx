"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VehicleCompanyDTO } from "@/lib/vehicle/dto";
import { useListView, byText, byValue } from "@/components/lists/useListView";

// No vehicle column: every row already belongs to the vehicle being
// viewed, so repeating it would only ever show the current vehicle.
interface VehicleCompanyTableProps {
  companies: VehicleCompanyDTO[];
  periodKey: string;
  // Passed through to the company report so its back link returns here.
  vehicleSlug: string;
  caption: string;
  emptyStateText: string;
}

const COLUMN_COUNT = 9;

export function VehicleCompanyTable({ companies, periodKey, vehicleSlug, caption, emptyStateText }: VehicleCompanyTableProps) {
  const { t, lang } = useLanguage();
  const ChevronIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const name = (c: VehicleCompanyDTO) => (lang === "ar" ? c.nameAr : c.nameEn);
  const { visible, controls, empty } = useListView(companies, {
    id: "vehicle-companies",
    searchText: (c) => `${c.nameEn} ${c.nameAr} ${c.sectorEn} ${c.sectorAr} ${t.stages[c.currentStage]}`,
    sorts: [
      byText("nameAsc", t.lists.nameAsc, name),
      byText("nameDesc", t.lists.nameDesc, name, true),
      byValue("lastUpdated", t.lists.lastUpdatedDesc, (c) => c.periods[periodKey]?.lastUpdated, true),
      byText("statusAsc", t.lists.statusAsc, (c) => c.periods[periodKey]?.status),
      byValue("revenueDesc", t.lists.revenueDesc, (c) => c.periods[periodKey]?.revenue, true),
      byText("sectorAsc", t.lists.sectorAsc, (c) => (lang === "ar" ? c.sectorAr : c.sectorEn)),
    ],
  });

  return (
    <div className="flex flex-col gap-2">
      {companies.length > 0 ? controls : null}
      {empty}
      <Table caption={caption}>
        <THead>
          <Tr>
            <Th>{t.admin.table.companyColumn}</Th>
            <Th>{t.admin.table.sectorColumn}</Th>
            <Th>{t.admin.table.customerModelColumn}</Th>
            <Th>{t.admin.table.entryStageColumn}</Th>
            <Th>{t.admin.table.currentStageColumn}</Th>
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
              <Td colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
                {emptyStateText}
              </Td>
            </Tr>
          ) : (
            visible.map((company) => {
              const periodData = company.periods[periodKey];

              return (
                <Tr key={company.id} className="hover:bg-surface-muted/60">
                  <Td className="font-medium">{lang === "ar" ? company.nameAr : company.nameEn}</Td>
                  <Td>{lang === "ar" ? company.sectorAr : company.sectorEn}</Td>
                  <Td>{t.customerModels[company.customerModel]}</Td>
                  <Td>{t.stages[company.entryStage]}</Td>
                  <Td>{t.stages[company.currentStage]}</Td>
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
                    <Link
                      href={`/company/${company.slug}?${new URLSearchParams({
                        ...(periodKey ? { period: periodKey } : {}),
                        fromVehicle: vehicleSlug,
                      }).toString()}`}
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
