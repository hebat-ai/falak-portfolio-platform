"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CompanyKpis } from "./CompanyKpis";
import { ReportingHistoryList } from "./ReportingHistoryList";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { REPORTING_CYCLES, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { Company, ReportingPeriod, Vehicle } from "@/lib/mock/types";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto";

interface CompanyReportViewProps {
  company: Company;
  linkedVehicles: Vehicle[];
}

export function CompanyReportView({ company, linkedVehicles }: CompanyReportViewProps) {
  const { t, lang } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportingPeriod>(
    REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1]
  );
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  const periodData = company.periods[selectedPeriod];
  const selectedIndex = REPORTING_PERIODS_ORDER.indexOf(selectedPeriod);
  const previousPeriod = selectedIndex > 0 ? REPORTING_PERIODS_ORDER[selectedIndex - 1] : null;
  const previousRevenue = previousPeriod ? company.periods[previousPeriod].revenue : null;

  return (
    <AppShell
      title={lang === "ar" ? company.nameAr : company.nameEn}
      subtitle={lang === "ar" ? company.sectorAr : company.sectorEn}
    >
      <div className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.stub.backToOverview}
        </Link>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="report-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.filters.periodLabel}
            </label>
            <select
              id="report-period"
              className={selectClass}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ReportingPeriod)}
            >
              {REPORTING_PERIODS_ORDER.map((p) => (
                <option key={p} value={p}>
                  {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
                </option>
              ))}
            </select>
          </div>
          <StatusBadge status={periodData.status} />
          {/* Label says "Open" rather than "Edit" because some statuses
              (submitted/under_review/approved/published) open the form in a
              locked, read-only state -- see StartupReportForm. */}
          <Link
            href={`/submit/${company.slug}?period=${selectedPeriod}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:ms-auto"
          >
            {t.submitReport.openFormLinkLabel}
          </Link>
        </div>

        <CompanyKpis
          currency={company.currency}
          currentRevenue={periodData.revenue}
          previousRevenue={previousRevenue}
          previousPeriod={previousPeriod}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.companyReport.profileTitle}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.admin.table.customerModelColumn}</dt>
                <dd className="min-w-0 break-words text-end text-foreground">
                  {t.customerModels[company.customerModel]}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.admin.filters.currencyLabel}</dt>
                <dd className="min-w-0 break-words text-end text-foreground">{t.currencyNames[company.currency]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.admin.table.entryStageColumn}</dt>
                <dd className="min-w-0 break-words text-end text-foreground">{t.stages[company.entryStage]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.admin.table.currentStageColumn}</dt>
                <dd className="min-w-0 break-words text-end text-foreground">{t.stages[company.currentStage]}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{t.companyReport.revenueModelsLabel}</dt>
                <dd className="flex min-w-0 flex-wrap justify-end gap-1.5">
                  {company.revenueModels.map((m) => (
                    <span
                      key={m}
                      className="break-words rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground"
                    >
                      {t.revenueModels[m]}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.companyReport.linkedVehiclesTitle}</h2>
            {linkedVehicles.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.companyReport.noVehiclesLinked}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {linkedVehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link
                      href={`/vehicle/${v.slug}`}
                      className="min-w-0 break-words rounded text-start text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                    >
                      {lang === "ar" ? v.nameAr : v.nameEn}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">{t.vehicleTypes[v.type]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <ReportingHistoryList periods={company.periods} currency={company.currency} />
      </div>
    </AppShell>
  );
}
