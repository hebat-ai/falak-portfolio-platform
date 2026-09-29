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
import type { CompanyReportData } from "@/lib/company/dto";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto";

interface CompanyReportViewProps {
  data: CompanyReportData;
  initialPeriodKey: string;
  // Set when the report was opened from a vehicle dashboard's companies
  // table, so the back link returns there instead of the register.
  fromVehicleSlug: string | null;
}

export function CompanyReportView({ data, initialPeriodKey, fromVehicleSlug }: CompanyReportViewProps) {
  const { company, periods, linkedVehicles, viewerRole } = data;
  const { t, lang } = useLanguage();
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(initialPeriodKey);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  // Company members go back to their own "My Companies" page (they can't
  // see the register or vehicles). Falak staff go back to the vehicle the
  // report was opened from -- only honored for a vehicle actually linked
  // to this company, so a hand-edited ?fromVehicle= can't point elsewhere
  // -- or to the register.
  const fromVehicle =
    viewerRole === "FALAK_STAFF" && fromVehicleSlug
      ? linkedVehicles.find((v) => v.slug === fromVehicleSlug)
      : undefined;
  const backHref = viewerRole === "COMPANY_MEMBER" ? "/submit" : fromVehicle ? `/vehicle/${fromVehicle.slug}` : "/company";
  const backLabel =
    viewerRole === "COMPANY_MEMBER"
      ? t.companyReport.backToMyCompanies
      : fromVehicle
        ? `${t.companyReport.backToPrefix} ${lang === "ar" ? fromVehicle.nameAr : fromVehicle.nameEn}`
        : t.companyReport.backToRegister;

  const periodData = company.periods[selectedPeriodKey];
  const selectedIndex = periods.findIndex((p) => p.key === selectedPeriodKey);
  const previousPeriodOption = selectedIndex > 0 ? periods[selectedIndex - 1] : null;
  const previousRevenue = previousPeriodOption ? company.periods[previousPeriodOption.key].revenue : null;

  return (
    <AppShell title={lang === "ar" ? company.nameAr : company.nameEn} subtitle={lang === "ar" ? company.sectorAr : company.sectorEn}>
      <div className="space-y-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {backLabel}
        </Link>

        {periodData ? (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label htmlFor="report-period" className="text-xs font-medium text-muted-foreground">
                  {t.admin.filters.periodLabel}
                </label>
                <select
                  id="report-period"
                  className={selectClass}
                  value={selectedPeriodKey}
                  onChange={(e) => setSelectedPeriodKey(e.target.value)}
                >
                  {periods.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <StatusBadge status={periodData.status} />
              {viewerRole === "COMPANY_MEMBER" ? (
                // Label says "Open" rather than "Edit" because some statuses
                // (submitted/under_review/approved/published) open the form
                // in a locked, read-only state -- see StartupReportForm.
                <Link
                  href={`/submit/${company.slug}?period=${selectedPeriodKey}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:ms-auto"
                >
                  {t.submitReport.openFormLinkLabel}
                </Link>
              ) : null}
            </div>

            <CompanyKpis
              currency={company.currency}
              currentRevenue={periodData.revenue}
              previousRevenue={previousRevenue}
              previousPeriodLabel={previousPeriodOption?.label ?? null}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.companyReport.noReportingHistory}</p>
        )}

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

        {periodData && periodData.narratives.length > 0 ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.companyReport.narrativeTitle}</h2>
            <div className="mt-3 space-y-4">
              {periodData.narratives.map((n) => (
                <div key={n.kind}>
                  <h3 className="text-sm font-semibold text-foreground">{t.reviewWorkspace.narrativeKinds[n.kind]}</h3>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{t.reviewWorkspace.narrativeEnLabel}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{n.textEn}</p>
                    </div>
                    <div dir="rtl">
                      <p className="text-xs font-medium text-muted-foreground">{t.reviewWorkspace.narrativeArLabel}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{n.textAr}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {periods.length > 0 ? (
          <ReportingHistoryList periodOptions={periods} periodsData={company.periods} currency={company.currency} />
        ) : null}
      </div>
    </AppShell>
  );
}
