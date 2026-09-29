"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { MyCompanyDTO } from "@/lib/submit/dto";

// Same rule submitCompanySubmission enforces (SUBMITTABLE_FROM_STATUSES in
// src/lib/reporting/submissions.ts) -- a UI hint only, never the gate.
const EDITABLE_STATUSES = new Set(["draft", "changes_requested"]);

export function MyCompaniesClient({ companies }: { companies: MyCompanyDTO[] }) {
  const { t, lang } = useLanguage();

  return (
    <AppShell title={t.nav.startupForm} subtitle={t.submitPortal.subtitle}>
      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.submitPortal.noMembershipsMessage}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {companies.map((company) => {
            const period = company.currentPeriod;
            const overdueDays = period ? getOverdueDays(period.status, period.currentDeadline) : null;

            return (
              <Card key={company.id} className="flex min-w-0 flex-col gap-3">
                <p className="font-heading text-base font-semibold text-foreground">
                  {lang === "ar" ? company.nameAr : company.nameEn}
                </p>

                {period ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-muted-foreground">{period.label}</span>
                      <StatusBadge status={period.status} />
                      {overdueDays !== null ? (
                        <span className="text-xs font-medium text-foreground">
                          <Num>{overdueDays}</Num> {t.admin.reportingStatusPanel.daysOverdueSuffix}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">{t.admin.reportingStatusPanel.deadlineColumn}: </span>
                      <time dateTime={period.currentDeadline}>{formatDate(period.currentDeadline, lang)}</time>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {EDITABLE_STATUSES.has(period.status)
                        ? t.submitPortal.willOpenEditableMessage
                        : t.submitPortal.willOpenLockedMessage}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.submitReport.noActiveCycleMessage}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-3">
                  {period ? (
                    <Link
                      href={`/submit/${company.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      {t.submitReport.openFormLinkLabel}
                    </Link>
                  ) : null}
                  <Link
                    href={`/company/${company.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-control-border px-3 py-1.5 text-sm font-medium text-link-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    {t.admin.table.viewCompanyAction}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
