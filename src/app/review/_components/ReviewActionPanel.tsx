"use client";

import type { RefObject } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import { REPORTING_CYCLES } from "@/lib/mock/companies";
import type { Company, CyclePeriodData, ReportingPeriod, ReportingStatus } from "@/lib/mock/types";

const primaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const secondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

interface ReviewActionPanelProps {
  company: Company | null;
  period: ReportingPeriod;
  effectiveData: CyclePeriodData | null;
  onTransition: (newStatus: ReportingStatus) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

// Presentational only -- this component owns no state and never writes
// anywhere. Every value it shows (company, period, effectiveData) is
// already resolved by the parent page from its single overlay, and every
// action just calls onTransition; the parent page is the sole writer.
export function ReviewActionPanel({ company, period, effectiveData, onTransition, headingRef }: ReviewActionPanelProps) {
  const { t, lang } = useLanguage();
  const cycle = REPORTING_CYCLES[period];
  const overdueDays = effectiveData ? getOverdueDays(effectiveData.status, cycle.deadline) : null;
  const periodLabel = lang === "ar" ? cycle.labelAr : cycle.labelEn;
  const companyName = company ? (lang === "ar" ? company.nameAr : company.nameEn) : null;

  return (
    <Card>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-heading text-sm font-semibold text-foreground focus-visible:outline-none"
      >
        {companyName ? `${t.reviewWorkspace.actionPanelTitle} — ${companyName}` : t.reviewWorkspace.actionPanelTitle}
      </h2>

      {!company || !effectiveData ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.reviewWorkspace.selectPrompt}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">{companyName}</span>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
            <StatusBadge status={effectiveData.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t.companyReport.revenueLabel}:{" "}
              {effectiveData.revenue === null ? (
                t.admin.table.noDataValue
              ) : (
                <Num>{formatCurrency(effectiveData.revenue, company.currency, lang)}</Num>
              )}
            </span>
            <span>
              {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
              <time dateTime={cycle.deadline}>{formatDate(cycle.deadline, lang)}</time>
            </span>
            {overdueDays !== null ? (
              <span className="font-medium text-foreground">
                <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {effectiveData.status === "submitted" ? (
              <button type="button" onClick={() => onTransition("under_review")} className={primaryButtonClass}>
                {t.reviewWorkspace.startReviewAction}
              </button>
            ) : null}
            {effectiveData.status === "under_review" ? (
              <>
                <button
                  type="button"
                  onClick={() => onTransition("changes_requested")}
                  className={secondaryButtonClass}
                >
                  {t.reviewWorkspace.requestChangesAction}
                </button>
                <button type="button" onClick={() => onTransition("approved")} className={primaryButtonClass}>
                  {t.reviewWorkspace.approveAction}
                </button>
              </>
            ) : null}
            {effectiveData.status === "approved" ? (
              <button type="button" onClick={() => onTransition("published")} className={primaryButtonClass}>
                {t.reviewWorkspace.publishAction}
              </button>
            ) : null}
            {effectiveData.status === "draft" ||
            effectiveData.status === "changes_requested" ||
            effectiveData.status === "published" ? (
              <p className="text-sm text-muted-foreground">{t.reviewWorkspace.noActionAvailable}</p>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
