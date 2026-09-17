"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CircleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { DASHBOARD_SNAPSHOT_DATE, formatDate } from "@/lib/format";
import { getOverdueDays, isReportEditable } from "@/lib/reportingStatus";
import { REPORTING_CYCLES, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { Company, CyclePeriodData, ReportingPeriod } from "@/lib/mock/types";

const selectClass =
  "w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground sm:w-auto";

const inputClass =
  "w-full max-w-xs rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

type ValidationError = "required" | "negative" | "invalid";

function revenueToInput(revenue: number | null): string {
  return revenue === null ? "" : String(revenue);
}

function parseRevenueInput(raw: string): { value: number | null; error: ValidationError | null } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, error: null };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { value: null, error: "invalid" };
  if (parsed < 0) return { value: null, error: "negative" };
  return { value: parsed, error: null };
}

interface StartupReportFormProps {
  company: Company;
  initialPeriod: ReportingPeriod;
}

export function StartupReportForm({ company, initialPeriod }: StartupReportFormProps) {
  const { t, lang } = useLanguage();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const todayIso = DASHBOARD_SNAPSHOT_DATE.toISOString().slice(0, 10);

  // Prototype only: draft/submitted data below lives in component state,
  // never written back to the imported `companies` mock module and never
  // sent anywhere. It resets the moment this page reloads. The
  // draft/changes_requested-only editability check further down is a UI
  // convenience, not a server-enforced permission -- there is no server
  // here to enforce anything against.
  const [selectedPeriod, setSelectedPeriod] = useState<ReportingPeriod>(initialPeriod);
  const [drafts, setDrafts] = useState<Partial<Record<ReportingPeriod, CyclePeriodData>>>({});
  const [revenueInput, setRevenueInput] = useState(() =>
    revenueToInput((drafts[initialPeriod] ?? company.periods[initialPeriod]).revenue)
  );
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [justSubmittedPeriod, setJustSubmittedPeriod] = useState<ReportingPeriod | null>(null);

  const effective = drafts[selectedPeriod] ?? company.periods[selectedPeriod];
  const isEditable = isReportEditable(effective.status);
  const isDirty = revenueInput !== revenueToInput(effective.revenue);
  const cycle = REPORTING_CYCLES[selectedPeriod];
  const overdueDays = getOverdueDays(effective.status, cycle.deadline);

  // Covers actual browser reload/tab close only -- does not intercept
  // in-app navigation (Sidebar links, mobile drawer, language/theme
  // switchers). Only the period select and this form's own back link,
  // below, are separately guarded for those in-app cases.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function confirmDiscardIfDirty(): boolean {
    if (!isDirty) return true;
    return window.confirm(t.submitReport.unsavedChangesConfirm);
  }

  function handlePeriodChange(next: ReportingPeriod) {
    if (!confirmDiscardIfDirty()) return;
    setSelectedPeriod(next);
    setRevenueInput(revenueToInput((drafts[next] ?? company.periods[next]).revenue));
    setValidationError(null);
    setShowDraftSaved(false);
    setJustSubmittedPeriod(null);
  }

  function handleBackClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!confirmDiscardIfDirty()) {
      e.preventDefault();
    }
  }

  function handleRevenueChange(value: string) {
    setRevenueInput(value);
    setValidationError(null);
    setShowDraftSaved(false);
  }

  function handleSaveDraft() {
    const parsed = parseRevenueInput(revenueInput);
    if (parsed.error) {
      setValidationError(parsed.error);
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [selectedPeriod]: { status: "draft", revenue: parsed.value, lastUpdated: todayIso },
    }));
    // Normalizes the visible input to match what was actually saved (e.g.
    // "01" -> "1", "1000.0" -> "1000") so it doesn't read as still-dirty
    // against its own just-saved value.
    setRevenueInput(revenueToInput(parsed.value));
    setValidationError(null);
    setShowDraftSaved(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseRevenueInput(revenueInput);
    if (parsed.error) {
      setValidationError(parsed.error);
      return;
    }
    if (parsed.value === null) {
      setValidationError("required");
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [selectedPeriod]: { status: "submitted", revenue: parsed.value, lastUpdated: todayIso },
    }));
    setValidationError(null);
    setShowDraftSaved(false);
    setJustSubmittedPeriod(selectedPeriod);
  }

  const errorMessage =
    validationError === "required"
      ? t.submitReport.validationRequired
      : validationError === "negative"
        ? t.submitReport.validationNegative
        : validationError === "invalid"
          ? t.submitReport.validationInvalid
          : null;

  return (
    <AppShell
      title={lang === "ar" ? company.nameAr : company.nameEn}
      subtitle={t.nav.startupForm}
      viewerRoleLabel={t.submitPortal.viewerRoleLabel}
    >
      <div className="space-y-6">
        <Link
          href={`/company/${company.slug}`}
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {t.submitReport.backToCompanyReport}
        </Link>

        <Card>
          <p className="text-xs text-muted-foreground">{t.submitReport.prototypeNotice}</p>
        </Card>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="submit-report-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.filters.periodLabel}
            </label>
            <select
              id="submit-report-period"
              className={selectClass}
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value as ReportingPeriod)}
            >
              {REPORTING_PERIODS_ORDER.map((p) => (
                <option key={p} value={p}>
                  {lang === "ar" ? REPORTING_CYCLES[p].labelAr : REPORTING_CYCLES[p].labelEn}
                </option>
              ))}
            </select>
          </div>
          <StatusBadge status={effective.status} />
          <span className="text-xs text-muted-foreground">
            {t.admin.reportingStatusPanel.deadlineColumn}:{" "}
            <time dateTime={cycle.deadline}>{formatDate(cycle.deadline, lang)}</time>
          </span>
          {overdueDays !== null ? (
            <span className="text-xs font-medium text-foreground">
              <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
            </span>
          ) : null}
        </div>

        {justSubmittedPeriod === selectedPeriod ? (
          <Card>
            <p role="status" className="text-sm font-medium text-foreground">
              {t.submitReport.submitSuccessMessage}
            </p>
            <Link
              href={`/company/${company.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {t.submitReport.backToCompanyReport}
            </Link>
          </Card>
        ) : isEditable ? (
          <Card className="max-w-xl">
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="revenue-input" className="text-xs font-medium text-muted-foreground">
                {t.companyReport.revenueLabel} ({t.currencyNames[company.currency]})
              </label>
              <input
                id="revenue-input"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                dir="ltr"
                value={revenueInput}
                onChange={(e) => handleRevenueChange(e.target.value)}
                aria-describedby={errorMessage ? "revenue-hint revenue-error" : "revenue-hint"}
                aria-invalid={errorMessage ? true : undefined}
                className={`${inputClass} mt-1`}
              />
              <p id="revenue-hint" className="mt-1 text-xs text-muted-foreground">
                {t.submitReport.revenueHint}
              </p>
              {errorMessage ? (
                <p id="revenue-error" role="alert" className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {errorMessage}
                </p>
              ) : null}
              {showDraftSaved ? (
                <p role="status" className="mt-1 text-xs font-medium text-foreground">
                  {t.submitReport.draftSavedMessage}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {t.submitReport.saveDraftButton}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {t.submitReport.submitButton}
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <Card className="max-w-xl">
            <p className="text-sm text-muted-foreground">{t.submitReport.lockedMessage}</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
