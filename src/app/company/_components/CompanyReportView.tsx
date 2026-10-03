"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Select";
import { CompanyKpis } from "./CompanyKpis";
import { MetricsBreakdown } from "./MetricsBreakdown";
import { CompanyMetricsTrendChart } from "./CompanyMetricsTrendChart";
import { ReportingHistoryList } from "./ReportingHistoryList";
import { ValuationHistoryChart } from "./ValuationHistoryChart";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { CompanyReportData } from "@/lib/company/dto";

interface CompanyReportViewProps {
  data: CompanyReportData;
  initialPeriodKey: string;
  // Set when the report was opened from a vehicle dashboard's companies
  // table, so the back link returns there instead of the register.
  fromVehicleSlug: string | null;
  // Set when opened from the Falak admin dashboard or Company List, so
  // the back link returns there instead of the register -- the same
  // "remember where staff came from" idea as fromVehicleSlug, just for
  // the two other staff-side entry points. Never resource-scoped (no
  // slug to validate), so unlike fromVehicleSlug this needs no
  // linkedVehicles-style lookup -- the page.tsx caller already narrows
  // it to exactly "admin" | "companies" | null.
  from: "admin" | "companies" | null;
}

export function CompanyReportView({ data, initialPeriodKey, fromVehicleSlug, from }: CompanyReportViewProps) {
  const { company, periods, linkedVehicles, viewerRole } = data;
  const { t, lang } = useLanguage();
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(initialPeriodKey);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  // Company members go back to their own "My Companies" page (they can't
  // see the register, vehicles, or admin views). Falak staff go back to
  // the vehicle the report was opened from -- only honored for a vehicle
  // actually linked to this company, so a hand-edited ?fromVehicle= can't
  // point elsewhere -- then to the admin dashboard or Company List if
  // that's where they came from, or to the register as the final
  // fallback.
  const fromVehicle =
    viewerRole === "FALAK_STAFF" && fromVehicleSlug
      ? linkedVehicles.find((v) => v.slug === fromVehicleSlug)
      : undefined;
  const backHref =
    viewerRole === "COMPANY_MEMBER"
      ? "/submit"
      : fromVehicle
        ? `/vehicle/${fromVehicle.slug}`
        : from === "admin"
          ? "/admin"
          : from === "companies"
            ? "/admin/companies"
            : "/company";
  const backLabel =
    viewerRole === "COMPANY_MEMBER"
      ? t.companyReport.backToMyCompanies
      : fromVehicle
        ? `${t.companyReport.backToPrefix} ${lang === "ar" ? fromVehicle.nameAr : fromVehicle.nameEn}`
        : from === "admin"
          ? `${t.companyReport.backToPrefix} ${t.nav.portfolioDashboard}`
          : from === "companies"
            ? `${t.companyReport.backToPrefix} ${t.nav.companyList}`
            : t.companyReport.backToRegister;

  const periodData = company.periods[selectedPeriodKey];
  const selectedIndex = periods.findIndex((p) => p.key === selectedPeriodKey);
  const previousPeriodOption = selectedIndex > 0 ? periods[selectedIndex - 1] : null;
  const previousRevenue = previousPeriodOption ? company.periods[previousPeriodOption.key].revenue : null;

  // Falak-staff-only (confirmed with the project owner) -- investors and
  // company members never see valuation, so both the KPI card and the
  // evolution chart below are gated on this, not just fetched-or-not.
  const isFalakStaff = viewerRole === "FALAK_STAFF";
  const latestValuation = isFalakStaff && data.valuations.length > 0 ? data.valuations[data.valuations.length - 1] : null;

  return (
    <AppShell title={lang === "ar" ? company.nameAr : company.nameEn} subtitle={lang === "ar" ? company.sectorAr : company.sectorEn}>
      <div className="space-y-6">
        <Link
          href={backHref}
          className="chamfer-br-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
                <Select
                  id="report-period"
                  className="sm:w-auto"
                  value={selectedPeriodKey}
                  onChange={(e) => setSelectedPeriodKey(e.target.value)}
                >
                  {periods.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <StatusBadge status={periodData.status} />
              {viewerRole === "COMPANY_MEMBER" ? (
                // Label says "Open" rather than "Edit" because some statuses
                // (submitted/under_review/approved/published) open the form
                // in a locked, read-only state -- see StartupReportForm.
                <Link
                  href={`/submit/${company.slug}?period=${selectedPeriodKey}`}
                  className="chamfer-br-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:ms-auto"
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
              latestValuation={latestValuation}
            />

            <MetricsBreakdown
              metrics={periodData.metrics}
              currency={company.currency}
              revenue={periodData.revenue}
              previousRevenue={previousRevenue}
            />

            {periods.length > 1 ? (
              <Card className="min-w-0">
                <h2 className="font-heading text-sm font-semibold text-foreground">{t.companyReport.trendTitle}</h2>
                <div className="mt-3">
                  <CompanyMetricsTrendChart periods={periods} periodsData={company.periods} currency={company.currency} />
                </div>
              </Card>
            ) : null}
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
                      className="chamfer-br-sm min-w-0 break-words text-start text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
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

        {isFalakStaff && data.valuations.length > 0 ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.companyReport.valuationHistoryTitle}</h2>
            <div className="mt-3">
              <ValuationHistoryChart valuations={data.valuations} currency={company.currency} />
            </div>
          </Card>
        ) : null}

        {periodData && isFalakStaff && periodData.narratives.length > 0 ? (
          <Link
            href={`/company/${company.slug}/report?period=${selectedPeriodKey}`}
            className="chamfer-br-sm inline-flex w-fit items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t.quarterlyReport.viewFormattedReportLabel}
          </Link>
        ) : null}

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
