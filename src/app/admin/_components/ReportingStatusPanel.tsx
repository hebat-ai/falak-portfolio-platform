"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminCompanyDTO, AdminPeriodOption } from "@/lib/admin/dto";

interface ReportingStatusPanelProps {
  companies: AdminCompanyDTO[];
  period: AdminPeriodOption;
}

export function ReportingStatusPanel({ companies, period }: ReportingStatusPanelProps) {
  const { t, lang } = useLanguage();

  return (
    <section
      aria-label={t.admin.reportingStatusPanel.title}
      className="rounded-xl border border-border-subtle bg-surface"
    >
      <h2 className="font-heading border-b border-border-subtle px-4 py-3 text-sm font-semibold text-foreground">
        {t.admin.reportingStatusPanel.title} — {period.label}
      </h2>
      <ul className="divide-y divide-border-subtle">
        {companies.map((company) => {
          const periodData = company.periods[period.key];
          const overdueDays = periodData.currentDeadline
            ? getOverdueDays(periodData.status, periodData.currentDeadline)
            : null;
          const isWithinDeadline = periodData.currentDeadline
            ? new Date() <= new Date(`${periodData.currentDeadline}T00:00:00Z`)
            : false;

          return (
            <li key={company.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-foreground">
                {lang === "ar" ? company.nameAr : company.nameEn}
              </span>
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
                {periodData.currentDeadline ? (
                  <span className="text-xs text-muted-foreground">
                    {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
                    <time dateTime={periodData.currentDeadline}>{formatDate(periodData.currentDeadline, lang)}</time>
                  </span>
                ) : null}
                {overdueDays !== null ? (
                  <span className="text-xs font-medium text-foreground">
                    <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
                  </span>
                ) : isWithinDeadline ? (
                  <span className="text-xs text-muted-foreground">{t.admin.reportingStatusPanel.withinDeadline}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
