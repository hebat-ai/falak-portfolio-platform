"use client";

import { useActionState, type RefObject } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/admin/overdue";
import { startReviewAction, requestChangesAction, approveSubmissionAction, type ReviewActionState } from "../actions";
import type { AdminCompanyDTO, AdminCompanyPeriodData, AdminPeriodOption } from "@/lib/admin/dto";

const primaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60";

const initialActionState: ReviewActionState = { error: null };

interface ReviewActionPanelProps {
  company: AdminCompanyDTO | null;
  period: AdminPeriodOption;
  effectiveData: AdminCompanyPeriodData | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

// Real Server Actions replace the former onTransition callback -- a
// successful submission triggers Next.js's own post-Server-Action refresh
// of the page's Server Component tree, which re-fetches
// getAdminPortfolioData() and flows fresh props back down here; there is
// no local status-overlay anymore.
export function ReviewActionPanel({ company, period, effectiveData, headingRef }: ReviewActionPanelProps) {
  const { t, lang } = useLanguage();

  const [startState, startFormAction, startPending] = useActionState(startReviewAction, initialActionState);
  const [changesState, changesFormAction, changesPending] = useActionState(requestChangesAction, initialActionState);
  const [approveState, approveFormAction, approvePending] = useActionState(approveSubmissionAction, initialActionState);

  const overdueDays =
    effectiveData?.currentDeadline ? getOverdueDays(effectiveData.status, effectiveData.currentDeadline) : null;
  const companyName = company ? (lang === "ar" ? company.nameAr : company.nameEn) : null;
  const submissionId = effectiveData?.submissionId ?? null;

  return (
    <Card>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-heading text-sm font-semibold text-foreground focus-visible:outline-none"
      >
        {companyName ? `${t.reviewWorkspace.actionPanelTitle} — ${companyName}` : t.reviewWorkspace.actionPanelTitle}
      </h2>

      {!company || !effectiveData || !submissionId ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.reviewWorkspace.selectPrompt}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">{companyName}</span>
            <span className="text-xs text-muted-foreground">{period.label}</span>
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
            {effectiveData.currentDeadline ? (
              <span>
                {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
                <time dateTime={effectiveData.currentDeadline}>{formatDate(effectiveData.currentDeadline, lang)}</time>
              </span>
            ) : null}
            {overdueDays !== null ? (
              <span className="font-medium text-foreground">
                <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {effectiveData.status === "submitted" ? (
              <form action={startFormAction} className="flex flex-col gap-1">
                <input type="hidden" name="submissionId" value={submissionId} />
                <button type="submit" disabled={startPending} className={primaryButtonClass}>
                  {t.reviewWorkspace.startReviewAction}
                </button>
                {startState.error ? (
                  <p role="alert" className="text-xs font-medium text-foreground">
                    {startState.error}
                  </p>
                ) : null}
              </form>
            ) : null}

            {effectiveData.status === "under_review" ? (
              <>
                <form action={changesFormAction} className="flex w-full flex-col gap-2 sm:max-w-sm">
                  <label htmlFor="review-comment" className="text-xs font-medium text-muted-foreground">
                    {t.reviewWorkspace.requestChangesAction}
                  </label>
                  <input type="hidden" name="submissionId" value={submissionId} />
                  <textarea
                    id="review-comment"
                    name="comment"
                    required
                    rows={2}
                    className="w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                  />
                  <button type="submit" disabled={changesPending} className={`${secondaryButtonClass} w-fit`}>
                    {t.reviewWorkspace.requestChangesAction}
                  </button>
                  {changesState.error ? (
                    <p role="alert" className="text-xs font-medium text-foreground">
                      {changesState.error}
                    </p>
                  ) : null}
                </form>

                <form action={approveFormAction} className="flex flex-col gap-1">
                  <input type="hidden" name="submissionId" value={submissionId} />
                  <button type="submit" disabled={approvePending} className={primaryButtonClass}>
                    {t.reviewWorkspace.approveAction}
                  </button>
                  {approveState.error ? (
                    <p role="alert" className="text-xs font-medium text-foreground">
                      {approveState.error}
                    </p>
                  ) : null}
                </form>
              </>
            ) : null}

            {effectiveData.status === "draft" ||
            effectiveData.status === "changes_requested" ||
            effectiveData.status === "approved" ? (
              <p className="text-sm text-muted-foreground">{t.reviewWorkspace.noActionAvailable}</p>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
