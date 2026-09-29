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
import { SubmitReportButton } from "./SubmitReportButton";

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
}

export function StartupReportForm({ company, submission }: StartupReportFormProps) {
  const { t, lang } = useLanguage();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <AppShell title={lang === "ar" ? company.nameAr : company.nameEn} subtitle={t.submitReport.formTitle}>
      <div className="space-y-6">
        <Link
          href={`/company/${company.slug}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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

            {/* Metric-value entry (e.g. revenue) is deliberately not wired
                to real data in this slice -- only the status-transition
                action below is real. Three distinct, honest states below,
                matching the SubmissionDTO's own completeness hints
                (never the authoritative gate -- the Server Action
                re-derives and re-checks all of this itself). */}
            {!submission.hasApplicableMetrics ? (
              <p className="rounded-md border border-border-subtle bg-surface-muted p-3 text-xs text-muted-foreground">
                {t.submitReport.metricsNotConfiguredMessage}
              </p>
            ) : !submission.requiredMetricsComplete ? (
              <p className="rounded-md border border-border-subtle bg-surface-muted p-3 text-xs text-muted-foreground">
                {t.submitReport.metricsIncompleteMessage}
              </p>
            ) : null}

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
