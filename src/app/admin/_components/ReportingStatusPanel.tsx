"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, DASHBOARD_SNAPSHOT_DATE } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import { REPORTING_CYCLES } from "@/lib/mock/companies";
import type { Company, ReportingPeriod } from "@/lib/mock/types";

interface ReportingStatusPanelProps {
  companies: Company[];
  period: ReportingPeriod;
}

export function ReportingStatusPanel({ companies, period }: ReportingStatusPanelProps) {
  const { t, lang } = useLanguage();
  const cycle = REPORTING_CYCLES[period];
  const deadline = new Date(`${cycle.deadline}T00:00:00Z`);

  return (
    <section
      aria-label={t.admin.reportingStatusPanel.title}
      className="rounded-xl border border-border-subtle bg-surface"
    >
      <h2 className="font-heading border-b border-border-subtle px-4 py-3 text-sm font-semibold text-foreground">
        {t.admin.reportingStatusPanel.title} — {lang === "ar" ? cycle.labelAr : cycle.labelEn}
      </h2>
      <ul className="divide-y divide-border-subtle">
        {companies.map((company) => {
          const periodData = company.periods[period];
          const overdueDays = getOverdueDays(periodData.status, cycle.deadline);
          const isWithinDeadline = DASHBOARD_SNAPSHOT_DATE <= deadline;

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
                <span className="text-xs text-muted-foreground">
                  {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
                  <time dateTime={cycle.deadline}>{formatDate(cycle.deadline, lang)}</time>
                </span>
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
