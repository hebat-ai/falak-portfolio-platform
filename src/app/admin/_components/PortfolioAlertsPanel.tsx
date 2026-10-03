"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/lib/format";
import type { PortfolioAlert } from "@/lib/admin/alerts";

const SEVERITY_CLASS: Record<PortfolioAlert["severity"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
};

function alertMessage(alert: PortfolioAlert, t: ReturnType<typeof useLanguage>["t"], lang: "en" | "ar"): string {
  switch (alert.kind) {
    case "reporting_overdue":
      return `${t.admin.alerts.reportingOverduePrefix} (${alert.deadline ? formatDate(alert.deadline, lang) : ""})`;
    case "low_runway": {
      const months = alert.runwayMonths ?? 0;
      const unit = months === 1 ? t.admin.alerts.lowRunwaySingular : t.admin.alerts.lowRunwayPlural;
      return `${formatNumber(months, lang)} ${unit}`;
    }
    case "overdue_payables":
      return t.admin.alerts.overduePayables;
    case "overdue_receivables":
      return t.admin.alerts.overdueReceivables;
  }
}

interface PortfolioAlertsPanelProps {
  alerts: PortfolioAlert[];
}

export function PortfolioAlertsPanel({ alerts }: PortfolioAlertsPanelProps) {
  const { t, lang } = useLanguage();

  return (
    <Card className="min-w-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.alerts.title}</h2>
      {alerts.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.admin.alerts.noAlerts}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((alert, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle py-2 text-sm last:border-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[alert.severity]}`}>
                  {alert.severity === "high" ? t.admin.alerts.severityHigh : t.admin.alerts.severityMedium}
                </span>
                <Link
                  href={`/company/${alert.companySlug}?from=admin`}
                  className="chamfer-br-sm min-w-0 truncate font-medium text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                >
                  {lang === "ar" ? alert.companyNameAr : alert.companyNameEn}
                </Link>
              </div>
              <span className="text-muted-foreground">{alertMessage(alert, t, lang)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
