"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { Currency } from "@/generated/prisma/client";
import type { CompanyReportPeriodOption, CompanyReportPeriodData } from "@/lib/company/dto";
import { useListView, byText, byValue } from "@/components/lists/useListView";

interface ReportingHistoryListProps {
  periodOptions: CompanyReportPeriodOption[];
  periodsData: Record<string, CompanyReportPeriodData>;
  currency: Currency;
}

const HISTORY_HEADING_ID = "reporting-history-heading";

// Newest period first -- periodOptions is oldest-first (the single source
// of truth shared with the revenue-growth lookup), so this view reverses
// a copy of it rather than hard-coding its own order.
export function ReportingHistoryList({ periodOptions, periodsData, currency }: ReportingHistoryListProps) {
  const { t, lang } = useLanguage();
  const order = (o: CompanyReportPeriodOption) => periodOptions.indexOf(o);
  const { visible, controls, empty } = useListView(periodOptions, {
    id: "reporting-history",
    searchText: (o) => `${o.label} ${periodsData[o.key]?.status ?? ""}`,
    sorts: [
      byValue("periodDesc", t.lists.periodDesc, order, true),
      byValue("periodAsc", t.lists.periodAsc, order),
      byText("statusAsc", t.lists.statusAsc, (o) => periodsData[o.key]?.status),
      byValue("revenueDesc", t.lists.revenueDesc, (o) => periodsData[o.key]?.revenue, true),
    ],
  });

  return (
    <section aria-labelledby={HISTORY_HEADING_ID} className="chamfer-br-md bg-surface shadow-[var(--inner-line)]">
      <h2
        id={HISTORY_HEADING_ID}
        className="font-heading border-b border-border-subtle px-4 py-3 text-sm font-semibold text-foreground"
      >
        {t.companyReport.historyTitle}
      </h2>
      {periodOptions.length > 0 ? <div className="border-b border-border-subtle px-4 py-3">{controls}</div> : null}
      {empty ? <div className="px-4 py-3">{empty}</div> : null}
      <ul className="divide-y divide-border-subtle">
        {visible.map((option) => {
          const periodData = periodsData[option.key];
          const overdueDays = getOverdueDays(periodData.status, periodData.currentDeadline);

          return (
            <li key={option.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">{option.label}</span>
                <span className="text-sm text-foreground">
                  {periodData.revenue === null ? (
                    <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                  ) : (
                    <Num>{formatCurrency(periodData.revenue, currency, lang)}</Num>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <StatusBadge status={periodData.status} />
                {periodData.lastUpdated ? (
                  <span className="text-xs text-muted-foreground">
                    {t.admin.reportingStatusPanel.lastUpdatedColumn}:{" "}
                    <time dateTime={periodData.lastUpdated}>{formatDate(periodData.lastUpdated, lang)}</time>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t.admin.reportingStatusPanel.neverSubmitted}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
                  <time dateTime={periodData.currentDeadline}>{formatDate(periodData.currentDeadline, lang)}</time>
                </span>
                {overdueDays !== null ? (
                  <span className="text-xs font-medium text-foreground">
                    <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
