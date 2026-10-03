"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Select } from "@/components/ui/Select";
import { PortfolioSummaryKpis } from "./_components/PortfolioSummaryKpis";
import { PortfolioAlertsPanel } from "./_components/PortfolioAlertsPanel";
import { ReportingStatusPanel } from "./_components/ReportingStatusPanel";
import { DashboardViewSwitcher, type DashboardView } from "./_components/charts/DashboardViewSwitcher";
import { CompaniesByStageBarChart } from "./_components/charts/CompaniesByStageBarChart";
import { StatusBreakdownPieChart } from "./_components/charts/StatusBreakdownPieChart";
import { RevenueOverdueScatterChart } from "./_components/charts/RevenueOverdueScatterChart";
import { CompanyValuationsBarChart } from "./_components/charts/CompanyValuationsBarChart";
import { VehicleValuationsBarChart } from "./_components/charts/VehicleValuationsBarChart";
import { PortfolioValuationSummary } from "./_components/charts/PortfolioValuationSummary";
import { PortfolioTrendChart } from "./_components/charts/PortfolioTrendChart";
import { BenchmarksView } from "./_components/charts/BenchmarksView";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { computeRevenueByCurrency } from "@/lib/admin/revenue";
import { getOverdueDays } from "@/lib/reportingStatus";
import type { AdminPortfolioData, PortfolioValuationData } from "@/lib/admin/dto";
import type { PortfolioAlert } from "@/lib/admin/alerts";
import type { CompanyBenchmark } from "@/lib/admin/benchmarking";
import type { PortfolioTrendPoint } from "@/lib/admin/portfolio-trend";

interface PortfolioDashboardClientProps extends AdminPortfolioData {
  valuationData: PortfolioValuationData;
  alerts: PortfolioAlert[];
  trend: PortfolioTrendPoint[];
  benchmarksByPeriod: Record<string, CompanyBenchmark[]>;
}

// Portfolio-wide KPIs and the Reporting Status panel always reflect the
// full portfolio for the selected period -- this page has no company
// filters of its own (those live on /admin/companies now), only its own
// period picker, independent from Company List's.
export function PortfolioDashboardClient({
  companies,
  vehicles,
  investors,
  periods,
  valuationData,
  alerts,
  trend,
  benchmarksByPeriod,
}: PortfolioDashboardClientProps) {
  const { t } = useLanguage();
  const latestPeriodKey = periods.at(-1)?.key ?? "";
  const [periodKey, setPeriodKey] = useState(latestPeriodKey);
  const [view, setView] = useState<DashboardView>("kpi");
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
        <PortfolioAlertsPanel alerts={alerts} />
        <DashboardViewSwitcher view={view} onChange={setView} />
        {view === "kpi" ? <PortfolioSummaryKpis {...summary} /> : null}
        {view === "bar" ? <CompaniesByStageBarChart companies={companies} periodKey={periodKey} /> : null}
        {view === "pie" ? <StatusBreakdownPieChart companies={companies} periodKey={periodKey} /> : null}
        {view === "scatter" ? <RevenueOverdueScatterChart companies={companies} periodKey={periodKey} /> : null}
        {view === "company-valuations" ? <CompanyValuationsBarChart companies={valuationData.companies} /> : null}
        {view === "vehicle-valuations" ? <VehicleValuationsBarChart vehicles={valuationData.vehicles} /> : null}
        {view === "portfolio-valuation" ? <PortfolioValuationSummary companies={valuationData.companies} /> : null}
        {view === "trend" ? <PortfolioTrendChart points={trend} /> : null}
        {view === "benchmarks" ? <BenchmarksView benchmarks={benchmarksByPeriod[periodKey] ?? []} periodKey={periodKey} /> : null}
        {selectedPeriod ? <ReportingStatusPanel companies={companies} period={selectedPeriod} /> : null}
      </div>
    </AppShell>
  );
}
