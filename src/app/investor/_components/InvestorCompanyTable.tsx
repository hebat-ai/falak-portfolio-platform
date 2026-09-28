"use client";

import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvestorVisibleCompanyDTO } from "@/lib/investor/dto";

// Investor-only counterpart to the shared CompanyTable (which stays
// mock-typed for /company and /vehicle) and to AdminCompanyTable (which
// has an Archive/Review action column and a vehicle column this view
// deliberately never shows). No status column -- every row here is, by
// construction, a published version this investor org was actually
// granted, so there is nothing to badge. No action column, no link to
// /company/[slug], ever -- the internal Company Report page must not be
// reachable from this read-only view.
interface InvestorCompanyTableProps {
  companies: InvestorVisibleCompanyDTO[];
  caption: string;
  emptyStateText: string;
}

export function InvestorCompanyTable({ companies, caption, emptyStateText }: InvestorCompanyTableProps) {
  const { t, lang } = useLanguage();
  const columnCount = 7;

  return (
    <Table caption={caption}>
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          <Th>{t.admin.table.sectorColumn}</Th>
          <Th>{t.admin.table.customerModelColumn}</Th>
          <Th>{t.admin.table.entryStageColumn}</Th>
          <Th>{t.admin.table.currentStageColumn}</Th>
          <Th>{t.admin.table.revenueColumn}</Th>
          <Th>{t.admin.table.lastUpdatedColumn}</Th>
        </Tr>
      </THead>
      <TBody>
        {companies.length === 0 ? (
          <Tr>
            <Td colSpan={columnCount} className="py-8 text-center text-muted-foreground">
              {emptyStateText}
            </Td>
          </Tr>
        ) : (
          companies.map((company) => (
            <Tr key={company.id} className="hover:bg-surface-muted/60">
              <Td className="font-medium">{lang === "ar" ? company.nameAr : company.nameEn}</Td>
              <Td>{lang === "ar" ? company.sectorAr : company.sectorEn}</Td>
              <Td>{t.customerModels[company.customerModel]}</Td>
              <Td>{t.stages[company.entryStage]}</Td>
              <Td>{t.stages[company.currentStage]}</Td>
              <Td>
                {company.revenue === null ? (
                  <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                ) : (
                  <Num>{formatCurrency(company.revenue, company.currency, lang)}</Num>
                )}
              </Td>
              <Td>
                <time dateTime={company.lastUpdated}>{formatDate(company.lastUpdated, lang)}</time>
              </Td>
            </Tr>
          ))
        )}
      </TBody>
    </Table>
  );
}
