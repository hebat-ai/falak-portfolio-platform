"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ExportButton } from "@/components/ui/ExportButton";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { TimeSeriesBreakdownChart } from "./_components/overview/TimeSeriesBreakdownChart";
import { MarketCapBreakdownChart } from "./_components/overview/MarketCapBreakdownChart";
import { MarketCapByStartupChart } from "./_components/overview/MarketCapByStartupChart";
import { VintageVsInvestmentChart } from "./_components/overview/VintageVsInvestmentChart";
import { ReportingStatusChart } from "./_components/overview/ReportingStatusChart";
import { FundListTable } from "./_components/overview/FundListTable";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatNumber } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency/convert";
import {
  getStartupCountSeries,
  getInvestedCapitalSeries,
  getNavSeries,
  getMarketCapCurrent,
  getMarketCapSeriesByCompany,
  getVintageVsInvestmentYearSeries,
  getReportingSeries,
  getFundListRows,
} from "@/lib/admin/portfolio-overview-compute";
import type { PortfolioOverviewRaw } from "@/lib/admin/portfolio-overview";

interface PortfolioOverviewClientProps {
  raw: PortfolioOverviewRaw;
}

export function PortfolioOverviewClient({ raw }: PortfolioOverviewClientProps) {
  const { t, lang } = useLanguage();
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("USD");

  const moneyFormatter = useMemo(() => (value: number) => formatCurrency(value, displayCurrency, lang), [displayCurrency, lang]);
  const countFormatter = useMemo(() => (value: number) => formatNumber(value, lang), [lang]);
  const moneyAxisFormatter = useMemo(() => (value: number) => formatCompactCurrency(value, displayCurrency, lang), [displayCurrency, lang]);
  const countAxisFormatter = useMemo(() => (value: number) => formatCompactNumber(value, lang), [lang]);

  const startupCountSeries = useMemo(() => getStartupCountSeries(raw), [raw]);
  const investedCapitalSeries = useMemo(() => getInvestedCapitalSeries(raw, displayCurrency), [raw, displayCurrency]);
  const navSeries = useMemo(() => getNavSeries(raw, displayCurrency), [raw, displayCurrency]);
  const marketCapCurrent = useMemo(() => getMarketCapCurrent(raw, displayCurrency), [raw, displayCurrency]);
  const marketCapByStartup = useMemo(() => getMarketCapSeriesByCompany(raw, displayCurrency), [raw, displayCurrency]);
  const vintageVsInvestment = useMemo(() => getVintageVsInvestmentYearSeries(raw), [raw]);
  const reportingSeries = useMemo(() => getReportingSeries(raw), [raw]);
  const fundListRows = useMemo(() => getFundListRows(raw, displayCurrency), [raw, displayCurrency]);

  return (
    <AppShell title={t.admin.title} subtitle={t.admin.subtitle}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{t.admin.charts.currencyToggleLabel}</span>
            <SegmentedToggle
              value={displayCurrency}
              onChange={setDisplayCurrency}
              ariaLabel={t.admin.charts.currencyToggleLabel}
              options={[
                { value: "USD", label: t.currencyNames.USD },
                { value: "SAR", label: t.currencyNames.SAR },
              ]}
            />
          </div>
          <ExportButton href="/api/export/portfolio" label={t.admin.exportPortfolioLabel} />
        </div>

        {/* Two charts per row; the seventh sits on the left. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TimeSeriesBreakdownChart
            title={t.admin.charts.startupCountChartTitle}
            data={startupCountSeries}
            vehicles={raw.vehicles}
            valueFormatter={countFormatter}
            axisFormatter={countAxisFormatter}
            emptyMessage={t.admin.charts.noDataMessage}
            totalLabel={t.admin.charts.totalLabel}
            byVehicleLabel={t.admin.charts.byVehicleLabel}
            byDepartmentLabel={t.admin.charts.byDepartmentLabel}
          />

          <TimeSeriesBreakdownChart
            title={t.admin.charts.investedCapitalChartTitle}
            data={investedCapitalSeries}
            vehicles={raw.vehicles}
            valueFormatter={moneyFormatter}
            axisFormatter={moneyAxisFormatter}
            emptyMessage={t.admin.charts.noDataMessage}
            totalLabel={t.admin.charts.totalLabel}
            byVehicleLabel={t.admin.charts.byVehicleLabel}
            byDepartmentLabel={t.admin.charts.byDepartmentLabel}
          />

          <TimeSeriesBreakdownChart
            title={t.admin.charts.navChartTitle}
            data={navSeries}
            vehicles={raw.vehicles}
            valueFormatter={moneyFormatter}
            axisFormatter={moneyAxisFormatter}
            emptyMessage={t.admin.charts.noDataMessage}
            totalLabel={t.admin.charts.totalLabel}
            byVehicleLabel={t.admin.charts.byVehicleLabel}
            byDepartmentLabel={t.admin.charts.byDepartmentLabel}
          />

          <MarketCapBreakdownChart
            title={t.admin.charts.marketCapChartTitle}
            data={marketCapCurrent}
            vehicles={raw.vehicles}
            valueFormatter={moneyFormatter}
            axisFormatter={moneyAxisFormatter}
            byVehicleLabel={t.admin.charts.byVehicleLabel}
            byDepartmentLabel={t.admin.charts.byDepartmentLabel}
            emptyMessage={t.admin.charts.noDataMessage}
          />

          <MarketCapByStartupChart
            title={t.admin.charts.marketCapByStartupChartTitle}
            series={marketCapByStartup}
            vehicles={raw.vehicles}
            valueFormatter={moneyFormatter}
            axisFormatter={moneyAxisFormatter}
            allOption={t.admin.charts.allOption}
            byVehicleLabel={t.admin.charts.byVehicleLabel}
            byDepartmentLabel={t.admin.charts.byDepartmentLabel}
            emptyMessage={t.admin.charts.noDataMessage}
          />

          <VintageVsInvestmentChart
            title={t.admin.charts.vintageVsInvestmentChartTitle}
            data={vintageVsInvestment}
            fundsFormedLabel={t.admin.charts.fundsFormedLabel}
            startupsInvestedLabel={t.admin.charts.startupsInvestedLabel}
            emptyMessage={t.admin.charts.noDataMessage}
          />

          <ReportingStatusChart
            title={t.admin.charts.reportingStatusChartTitle}
            data={reportingSeries}
            submissionViewLabel={t.admin.charts.submissionViewLabel}
            auditedViewLabel={t.admin.charts.auditedViewLabel}
            submittedLabel={t.admin.charts.submittedLabel}
            notSubmittedLabel={t.admin.charts.notSubmittedLabel}
            auditedLabel={t.admin.charts.auditedLabel}
            notAuditedLabel={t.admin.charts.notAuditedLabel}
            emptyMessage={t.admin.charts.noDataMessage}
          />
        </div>

        <FundListTable
          title={t.admin.charts.fundListTitle}
          rows={fundListRows}
          displayCurrency={displayCurrency}
          columns={{
            fundName: t.admin.charts.fundNameColumn,
            vintageYear: t.admin.manage.vintageYearLabel,
            investedCapital: t.admin.charts.investedCapitalLabel,
            nav: t.admin.charts.navColumn,
            moic: t.admin.charts.portfolioMoicLabel,
            numberOfInvestors: t.admin.charts.numberOfInvestorsColumn,
          }}
          notAvailableLabel={t.admin.charts.moicNotAvailableLabel}
          emptyMessage={t.admin.charts.noDataMessage}
        />
      </div>
    </AppShell>
  );
}
