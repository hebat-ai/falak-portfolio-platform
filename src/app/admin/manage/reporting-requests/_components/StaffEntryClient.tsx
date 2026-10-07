"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useForm } from "@/components/forms/useForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { METRIC_SECTIONS, MetricField, groupMetrics } from "@/app/submit/_components/MetricsEntryForm";
import { staffEntryAction, type StaffEntryState } from "../actions";
import type { StaffEntryCycle } from "@/lib/reporting/staff-entry";

const initialState: StaffEntryState = { error: null, success: false };

const linkButton =
  "chamfer-br-sm inline-flex shrink-0 items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-bold text-foreground shadow-[inset_0_0_0_2px_var(--brand-dark-nebula)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

// Same fields, sections and validation as the form the startup receives;
// staff can also submit it for review on the startup's behalf.
export function StaffEntryClient({ entry }: { entry: StaffEntryCycle }) {
  const { t, lang } = useLanguage();
  const m = t.admin.manage;
  const { state, isPending, errorFor, formProps } = useForm(staffEntryAction.bind(null, entry.cycleId), initialState, {
    resetOnSuccess: false,
  });
  const groups = groupMetrics(entry.metrics);
  const companyName = lang === "ar" ? entry.company.nameAr : entry.company.nameEn;
  const requestHref = `/admin/manage/reporting-requests/request/${entry.request.templateId}/${entry.request.periodStart}/${entry.request.periodEnd}`;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-foreground">
              {companyName} · {entry.periodLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? entry.templateNameAr : entry.templateNameEn} · {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
              {formatDate(entry.currentDeadline, lang)}
            </p>
          </div>
          <StatusBadge status={entry.status} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {entry.editable
            ? m.entryIntro.replace("{startup}", companyName).replace("{period}", entry.periodLabel)
            : m.entryLockedMessage}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={requestHref} className={linkButton}>
            {m.requestDetailTitle}
          </Link>
          <Link href={`/company/${entry.company.slug}`} className={linkButton}>
            {m.openStartupPageAction}
          </Link>
          {entry.status !== "draft" && entry.status !== "changes_requested" ? (
            <Link href="/review" className={linkButton}>
              {m.goToReviewAction}
            </Link>
          ) : null}
        </div>
      </Card>

      <form {...formProps} className="space-y-6">
        <fieldset disabled={!entry.editable || isPending} className="space-y-6">
          {METRIC_SECTIONS.map((sectionKey) =>
            groups[sectionKey].length > 0 ? (
              <Card key={sectionKey} padding="sm" className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t.submitReport[sectionKey]}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {groups[sectionKey].map((field) => (
                    <MetricField
                      key={field.metricDefinitionId}
                      field={field}
                      lang={lang}
                      naLabel={t.submitReport.naLabel}
                      error={errorFor(`value_${field.metricDefinitionId}`)}
                    />
                  ))}
                </div>
              </Card>
            ) : null
          )}
        </fieldset>

        {state.error ? (
          <p role="alert" className="text-xs font-semibold text-danger">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p role="status" className="text-xs font-medium text-nebula-aqua">
            {state.submitted ? m.entrySubmittedMessage : m.entrySavedMessage}
          </p>
        ) : null}

        {entry.editable ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button type="submit" name="intent" value="save" variant={entry.canSubmit ? "outline" : "primary"} size="sm" disabled={isPending}>
                {m.entrySaveAction}
              </Button>
              {entry.canSubmit ? (
                <Button type="submit" name="intent" value="submit" size="sm" disabled={isPending}>
                  {m.entrySubmitAction}
                </Button>
              ) : null}
            </div>
            {entry.canSubmit ? <p className="text-xs text-muted-foreground">{m.entrySubmitHint}</p> : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
