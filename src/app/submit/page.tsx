"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays, isReportEditable } from "@/lib/reportingStatus";
import { companies, REPORTING_CYCLES, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { ReportingPeriod } from "@/lib/mock/types";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

export default function StartupPortalPage() {
  const { t, lang } = useLanguage();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [period, setPeriod] = useState<ReportingPeriod>(
    REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1]
  );

  const periodsNewestFirst = [...REPORTING_PERIODS_ORDER].reverse();
  const selectedCompany = companies.find((c) => c.id === companyId) ?? null;
  const periodData = selectedCompany ? selectedCompany.periods[period] : null;
  const cycle = REPORTING_CYCLES[period];
  const overdueDays = periodData ? getOverdueDays(periodData.status, cycle.deadline) : null;
  const editable = periodData ? isReportEditable(periodData.status) : false;

  return (
    <AppShell
      title={t.nav.startupForm}
      subtitle={t.submitPortal.subtitle}
      viewerRoleLabel={t.submitPortal.viewerRoleLabel}
      showSyntheticDataNotice
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm text-muted-foreground">
          {t.submitPortal.prototypeNotice}
        </div>

        {!selectedCompany || !periodData ? (
          <p className="text-sm text-muted-foreground">{t.submitPortal.noCompaniesMessage}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label htmlFor="portal-company" className="text-xs font-medium text-muted-foreground">
                  {t.submitPortal.companySelectLabel}
                </label>
                <select
                  id="portal-company"
                  className={selectClass}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === "ar" ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label htmlFor="portal-period" className="text-xs font-medium text-muted-foreground">
                  {t.admin.filters.periodLabel}
                </label>
                <select
                  id="portal-period"
                  className={selectClass}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as ReportingPeriod)}
                >
                  {periodsNewestFirst.map((p) => (
                    <option key={p} value={p}>
                      {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Card className="max-w-xl space-y-3">
              <div>
                <p className="font-heading text-base font-semibold text-foreground">
                  {lang === "ar" ? selectedCompany.nameAr : selectedCompany.nameEn}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? cycle.labelAr : cycle.labelEn}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={periodData.status} />
                {overdueDays !== null ? (
                  <span className="text-xs font-medium text-foreground">
                    <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
                  </span>
                ) : null}
              </div>

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.companyReport.revenueLabel}</dt>
                  <dd className="text-foreground">
                    {periodData.revenue === null ? (
                      <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                    ) : (
                      <Num>{formatCurrency(periodData.revenue, selectedCompany.currency, lang)}</Num>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.admin.reportingStatusPanel.deadlineColumn}</dt>
                  <dd className="text-foreground">
                    <time dateTime={cycle.deadline}>{formatDate(cycle.deadline, lang)}</time>
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                {editable ? t.submitPortal.willOpenEditableMessage : t.submitPortal.willOpenLockedMessage}
              </p>

              <Link
                href={`/submit/${selectedCompany.slug}?period=${period}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {t.submitReport.openFormLinkLabel}
              </Link>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
