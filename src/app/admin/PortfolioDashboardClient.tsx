"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Select } from "@/components/ui/Select";
import { PortfolioSummaryKpis } from "./_components/PortfolioSummaryKpis";
import { ReportingStatusPanel } from "./_components/ReportingStatusPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { computeRevenueByCurrency } from "@/lib/admin/revenue";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminPortfolioData } from "@/lib/admin/dto";

// Portfolio-wide KPIs and the Reporting Status panel always reflect the
// full portfolio for the selected period -- this page has no company
// filters of its own (those live on /admin/companies now), only its own
// period picker, independent from Company List's.
export function PortfolioDashboardClient({ companies, vehicles, investors, periods }: AdminPortfolioData) {
  const { t } = useLanguage();
  const latestPeriodKey = periods.at(-1)?.key ?? "";
  const [periodKey, setPeriodKey] = useState(latestPeriodKey);
  const selectedPeriod = periods.find((p) => p.key === periodKey) ?? periods[0];

  const summary = useMemo(() => {
    const completeCount = companies.filter((c) => c.periods[periodKey]?.status === "approved").length;

    const overdueCount = companies.filter((c) => {
      const periodData = c.periods[periodKey];
      return periodData?.currentDeadline ? getOverdueDays(periodData.status, periodData.currentDeadline) !== null : false;
    }).length;

    const revenueByCurrency = computeRevenueByCurrency(companies, periodKey);

    return {
      companiesCount: companies.length,
      vehiclesCount: vehicles.length,
      investorsCount: investors.length,
      completionRate: companies.length === 0 ? 0 : completeCount / companies.length,
      overdueCount,
      revenueByCurrency,
    };
  }, [periodKey, companies, vehicles.length, investors.length]);

  return (
    <AppShell title={t.admin.title} subtitle={t.admin.subtitle}>
      <div className="space-y-6">
        {periods.length > 0 ? (
          <div className="flex w-full max-w-xs flex-col gap-1">
            <label htmlFor="dashboard-period" className="text-xs font-medium text-muted-foreground">
              {t.admin.dashboardPeriodLabel}
            </label>
            <Select id="dashboard-period" value={periodKey} onChange={(e) => setPeriodKey(e.target.value)}>
              {periods.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </Select>
          </div>
        ) : null}
        <PortfolioSummaryKpis {...summary} />
        {selectedPeriod ? <ReportingStatusPanel companies={companies} period={selectedPeriod} /> : null}
      </div>
    </AppShell>
  );
}
