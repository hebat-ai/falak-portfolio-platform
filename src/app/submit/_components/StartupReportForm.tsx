"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import type { Currency } from "@/generated/prisma/client";
import type { SubmissionDTO } from "@/lib/reporting/dto";
import type { SubmissionAttachmentDTO } from "@/lib/reporting/attachments";
import { SUBMITTABLE_FROM_STATUSES } from "@/lib/reporting/submission-status";
import { SubmitReportButton } from "./SubmitReportButton";
import { MetricsEntryForm } from "./MetricsEntryForm";
import { AttachmentsPanel } from "./AttachmentsPanel";

interface StartupReportFormCompany {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  currency: Currency;
}

interface StartupReportFormProps {
  company: StartupReportFormCompany;
  submission: SubmissionDTO | null;
  attachments: SubmissionAttachmentDTO[];
}

export function StartupReportForm({ company, submission, attachments }: StartupReportFormProps) {
  const { t, lang } = useLanguage();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <AppShell title={lang === "ar" ? company.nameAr : company.nameEn} subtitle={t.submitReport.formTitle}>
      <div className="space-y-6">
        <Link
          href={`/company/${company.slug}`}
          className="chamfer-br-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.submitReport.backToCompanyReport}
        </Link>

        {submission === null ? (
          <Card>
            <p className="text-sm text-muted-foreground">{t.submitReport.noActiveCycleMessage}</p>
          </Card>
        ) : (
          <Card className="max-w-xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-medium text-foreground">{submission.periodLabel}</p>
              <StatusBadge status={submission.status} />
            </div>

            <p className="text-xs text-muted-foreground">
              {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
              <time dateTime={submission.currentDeadline.toISOString()}>
                {formatDate(submission.currentDeadline.toISOString().slice(0, 10), lang)}
              </time>
            </p>

            {/* The three states below are honest hints from the
                SubmissionDTO's own completeness computation -- never the
                authoritative gate. Both the Save action (saveMetricValues)
                and the Submit action (submitCompanySubmission) re-derive
                and re-check everything themselves, fresh, server-side. */}
            {!submission.hasApplicableMetrics ? (
              <p className="chamfer-br-sm bg-surface-muted p-3 text-xs text-muted-foreground shadow-[var(--inner-line)]">
                {t.submitReport.metricsNotConfiguredMessage}
              </p>
            ) : (
              <MetricsEntryForm
                companyId={company.id}
                submissionId={submission.id}
                slug={company.slug}
                metrics={submission.metrics}
              />
            )}

            {submission.hasApplicableMetrics && !submission.requiredMetricsComplete ? (
              <p className="chamfer-br-sm bg-surface-muted p-3 text-xs text-muted-foreground shadow-[var(--inner-line)]">
                {t.submitReport.metricsIncompleteMessage}
              </p>
            ) : null}

            <AttachmentsPanel
              companyId={company.id}
              submissionId={submission.id}
              slug={company.slug}
              attachments={attachments}
              editable={SUBMITTABLE_FROM_STATUSES.includes(submission.status)}
            />

            {submission.canSubmit ? (
              <SubmitReportButton companyId={company.id} submissionId={submission.id} slug={company.slug} />
            ) : (
              <p className="text-xs text-muted-foreground">{t.submitReport.lockedMessage}</p>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
