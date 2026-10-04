"use client";

import { useActionState, useEffect, useState, type RefObject } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import {
  startReviewAction,
  requestChangesAction,
  approveSubmissionAction,
  publishSubmissionAction,
  getSubmissionMetricsForReviewAction,
  type ReviewActionState,
} from "../actions";
import { ReviewMetricsEditForm } from "./ReviewMetricsEditForm";
import type { AdminCompanyDTO, AdminCompanyPeriodData, AdminPeriodOption } from "@/lib/admin/dto";
import type { NarrativeKind } from "@/generated/prisma/client";
import type { SubmissionMetricFieldDTO } from "@/lib/reporting/dto";

const NARRATIVE_KINDS: NarrativeKind[] = [
  "operational_update",
  "quarter_highlights",
  "investment_review_notes",
  "management_commentary",
];

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
  const [publishState, publishFormAction, publishPending] = useActionState(publishSubmissionAction, initialActionState);

  const overdueDays =
    effectiveData?.currentDeadline ? getOverdueDays(effectiveData.status, effectiveData.currentDeadline) : null;
  const companyName = company ? (lang === "ar" ? company.nameAr : company.nameEn) : null;
  const submissionId = effectiveData?.submissionId ?? null;

  const isEditableStatus = effectiveData?.status === "submitted" || effectiveData?.status === "under_review";
  // Keyed by the submissionId the fetch was actually for -- lets the
  // render below ignore a stale result instead of needing a synchronous
  // setState([]) in the effect body (which react-hooks/set-state-in-effect
  // flags) every time the selection changes away from an editable status.
  const [metricsResult, setMetricsResult] = useState<{ submissionId: string; metrics: SubmissionMetricFieldDTO[] } | null>(
    null
  );

  useEffect(() => {
    if (!submissionId || !isEditableStatus) return;
    let cancelled = false;
    getSubmissionMetricsForReviewAction(submissionId).then((result) => {
      if (!cancelled) setMetricsResult({ submissionId, metrics: result });
    });
    return () => {
      cancelled = true;
    };
  }, [submissionId, isEditableStatus]);

  const metrics = isEditableStatus && metricsResult?.submissionId === submissionId ? metricsResult.metrics : [];

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

          {isEditableStatus && metrics.length > 0 ? (
            <ReviewMetricsEditForm submissionId={submissionId} metrics={metrics} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            {effectiveData.status === "submitted" ? (
              <form action={startFormAction} className="flex flex-col gap-1">
                <input type="hidden" name="submissionId" value={submissionId} />
                <Button type="submit" disabled={startPending}>
                  {t.reviewWorkspace.startReviewAction}
                </Button>
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
                  <Textarea id="review-comment" name="comment" required rows={2} />
                  <Button type="submit" variant="outline" disabled={changesPending} className="w-fit">
                    {t.reviewWorkspace.requestChangesAction}
                  </Button>
                  {changesState.error ? (
                    <p role="alert" className="text-xs font-medium text-foreground">
                      {changesState.error}
                    </p>
                  ) : null}
                </form>

                <form action={approveFormAction} className="flex flex-col gap-1">
                  <input type="hidden" name="submissionId" value={submissionId} />
                  <Button type="submit" disabled={approvePending}>
                    {t.reviewWorkspace.approveAction}
                  </Button>
                  {approveState.error ? (
                    <p role="alert" className="text-xs font-medium text-foreground">
                      {approveState.error}
                    </p>
                  ) : null}
                </form>
              </>
            ) : null}

            {effectiveData.status === "approved" ? (
              <form action={publishFormAction} className="flex w-full flex-col gap-3">
                <input type="hidden" name="submissionId" value={submissionId} />
                {NARRATIVE_KINDS.map((kind) => (
                  <div key={kind} className="chamfer-br-sm flex flex-col gap-1.5 p-3 shadow-[var(--inner-line)]">
                    <span className="text-xs font-medium text-foreground">{t.reviewWorkspace.narrativeKinds[kind]}</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`${kind}En`} className="text-xs text-muted-foreground">
                          {t.reviewWorkspace.narrativeEnLabel}
                        </label>
                        <Textarea id={`${kind}En`} name={`${kind}En`} rows={2} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`${kind}Ar`} className="text-xs text-muted-foreground">
                          {t.reviewWorkspace.narrativeArLabel}
                        </label>
                        <Textarea id={`${kind}Ar`} name={`${kind}Ar`} dir="rtl" rows={2} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="submit" disabled={publishPending} className="w-fit">
                  {t.reviewWorkspace.publishAction}
                </Button>
                {publishState.error ? (
                  <p role="alert" className="text-xs font-medium text-foreground">
                    {publishState.error}
                  </p>
                ) : null}
              </form>
            ) : null}

            {effectiveData.status === "draft" || effectiveData.status === "changes_requested" ? (
              <p className="text-sm text-muted-foreground">{t.reviewWorkspace.noActionAvailable}</p>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
