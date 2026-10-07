"use client";

import Link from "next/link";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvestorVisibleCompanyDTO } from "@/lib/investor/dto";

// Investor-only counterpart to AdminCompanyTable (which has an
// Archive/Review action column and a vehicle column this view
// deliberately never shows). No status column -- every row here is, by
// construction, a published version this investor org was actually
// granted, so there is nothing to badge. No link to the internal
// /company/[slug] live report, ever -- that page must not be reachable
// from this read-only view. The one link this table does carry is to
// /company/[slug]/report (the separate, branded, published-only
// one-pager) -- every row here already implies a non-revoked
// ReportAccessGrant on a published version of exactly this company and
// period, which is the same thing getQuarterlyReportData itself
// re-checks, so there's no new access surface opened by linking it.
interface InvestorCompanyTableProps {
  companies: InvestorVisibleCompanyDTO[];
  // Each company's most recent period this org can see a report for,
  // independent of the period currently selected on the page.
  latestPeriodByCompanyId: Record<string, string>;
  caption: string;
  emptyStateText: string;
}

export function InvestorCompanyTable({ companies, latestPeriodByCompanyId, caption, emptyStateText }: InvestorCompanyTableProps) {
  const { t, lang } = useLanguage();
  const columnCount = 8;

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
          <Th>
            <span className="sr-only">{t.quarterlyReport.viewLatestReportLabel}</span>
          </Th>
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
          companies.map((company) => {
            const latestPeriod = latestPeriodByCompanyId[company.id] ?? company.periodKey;
            return (
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
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <Link
                    href={`/company/${company.slug}/report?period=${encodeURIComponent(latestPeriod)}&from=investor`}
                    className="chamfer-br-sm inline-flex items-center whitespace-nowrap px-2.5 py-1 text-xs font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
                  >
                    {t.quarterlyReport.viewLatestReportLabel}
                  </Link>
                  <span className="text-xs text-muted-foreground">{latestPeriod}</span>
                </div>
              </Td>
            </Tr>
            );
          })
        )}
      </TBody>
    </Table>
  );
}
