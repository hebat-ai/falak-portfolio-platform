"use client";

import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowLeft, Printer } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Card } from "@/components/ui/Card";
import { ReportAttachmentsPanel } from "./ReportAttachmentsPanel";
import { KpiCard } from "@/components/ui/KpiCard";
import { Num } from "@/components/ui/Num";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import {
  computeGrossMargin,
  computeNetMargin,
  computeRevenueProjection,
  deriveMonthlyBurn,
  deriveRunwayMonths,
  percentChange,
} from "@/lib/reporting/computed-metrics";
import { findMetric, findNumericMetricValue, formatMetricValue } from "@/lib/reporting/metric-format";
import { REVENUE_METRIC_KEYS } from "@/lib/reporting/revenue-metrics";
import type { QuarterlyReportData } from "@/lib/company/quarterly-report";
import type { SubmissionMetricFieldDTO } from "@/lib/reporting/dto";

// Paragraphs/bullets are blank-line-separated runs of the same single
// narrative text field -- the schema allows exactly one row per
// NarrativeKind per version (see NarrativeSection's @@unique), so this is
// how multiple visual cards/bullets appear without a schema change. A
// deliberate, inspectable choice, not a silent approximation.
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// The metric keys each report section looks for, in order. Templates name
// the same measure differently (the original 6-metric template uses
// "expenses_total", the 30-metric one "fin_expenses"); the first key
// present in the report is used.
const METRIC_ALIASES = {
  cogs: ["fin_cogs"],
  expenses: ["fin_expenses", "expenses_total"],
  cash: ["fin_cash_balance", "cash_balance_current"],
  burn: ["fin_burn_rate"],
  netCashFlow: ["fin_monthly_net_cash_flow"],
  runway: ["fin_runway_months"],
  activeCustomers: ["cust_active_customers", "customers_active"],
  churn: ["cust_churn_rate", "churn_rate_pct"],
};

// Every metric the report's own template defines (plus any the prior
// period's template had), in template order -- so the table follows
// whatever Falak configures per template. Revenue lines are already the
// summed Revenue row; free-text answers don't fit a numeric comparison.
function comparisonFields(
  metrics: SubmissionMetricFieldDTO[],
  previousMetrics: SubmissionMetricFieldDTO[]
): SubmissionMetricFieldDTO[] {
  const byKey = new Map<string, SubmissionMetricFieldDTO>();
  for (const field of [...metrics, ...previousMetrics]) {
    if (byKey.has(field.key) || field.dataType === "Text" || REVENUE_METRIC_KEYS.includes(field.key)) continue;
    byKey.set(field.key, field);
  }
  return [...byKey.values()];
}

interface QuarterlyReportDocumentProps {
  data: QuarterlyReportData;
  fromInvestorDashboard: boolean;
}

export function QuarterlyReportDocument({ data, fromInvestorDashboard }: QuarterlyReportDocumentProps) {
  const { t, lang } = useLanguage();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const { company, metrics, previousMetrics, revenue, previousRevenue, narratives } = data;

  const narrativeByKind = new Map(narratives.map((n) => [n.kind, n]));
  const operationalUpdate = narrativeByKind.get("operational_update");
  const quarterHighlights = narrativeByKind.get("quarter_highlights");
  const investmentReviewNotes = narrativeByKind.get("investment_review_notes");
  const managementCommentary = narrativeByKind.get("management_commentary");

  const prior = previousMetrics ?? [];
  // A metric key from either period's template, for the given role.
  const keyFor = (role: keyof typeof METRIC_ALIASES) =>
    METRIC_ALIASES[role].find((k) => findMetric(metrics, k) || findMetric(prior, k)) ?? null;
  const num = (list: SubmissionMetricFieldDTO[], role: keyof typeof METRIC_ALIASES) => {
    const key = keyFor(role);
    return key ? findNumericMetricValue(list, key) : null;
  };

  const cogs = num(metrics, "cogs");
  const expenses = num(metrics, "expenses");
  const grossMargin = computeGrossMargin(revenue, cogs);
  const netMargin = computeNetMargin(revenue, expenses);
  const revenueGrowth = percentChange(revenue, previousRevenue);
  const projection = computeRevenueProjection(revenue);
  const runwayField = keyFor("runway") ? findMetric(metrics, keyFor("runway")!) : undefined;

  // Burn and runway, worked out from expenses / cash flow / cash balance
  // when a template doesn't ask for them directly.
  const burnFor = (list: SubmissionMetricFieldDTO[], rev: number | null) =>
    deriveMonthlyBurn({
      reportedBurn: num(list, "burn"),
      monthlyNetCashFlow: num(list, "netCashFlow"),
      quarterRevenue: rev,
      quarterExpenses: num(list, "expenses"),
    });
  const burn = burnFor(metrics, revenue);
  const priorBurn = previousMetrics ? burnFor(prior, previousRevenue) : null;
  const runway = deriveRunwayMonths(num(metrics, "runway"), num(metrics, "cash"), burn);
  const priorRunway = previousMetrics ? deriveRunwayMonths(num(prior, "runway"), num(prior, "cash"), priorBurn) : null;
  const showDerivedBurn = !keyFor("burn") && (burn !== null || priorBurn !== null);
  const showDerivedRunway = !keyFor("runway") && (runway !== null || priorRunway !== null);

  const chartData = [
    data.previousPeriodLabel ? { label: data.previousPeriodLabel, revenue: previousRevenue } : null,
    { label: data.periodLabel, revenue },
    { label: t.quarterlyReport.projectionLabel, revenue: projection },
  ].filter((d): d is { label: string; revenue: number | null } => d !== null);

  function comparisonRow(labelSource: SubmissionMetricFieldDTO) {
    const { key } = labelSource;
    const field = findMetric(metrics, key);
    const prevField = findMetric(previousMetrics ?? [], key);
    const label = lang === "ar" ? labelSource.labelAr : labelSource.labelEn;
    const currentDisplay = field ? formatMetricValue(field, company.currency, lang) : null;
    const priorDisplay = prevField ? formatMetricValue(prevField, company.currency, lang) : null;
    const growth = percentChange(findNumericMetricValue(metrics, key), findNumericMetricValue(previousMetrics ?? [], key));

    return (
      <Tr key={key}>
        <Td>{label}</Td>
        <Td>{currentDisplay === null ? t.companyReport.naValueDisplay : <Num>{currentDisplay}</Num>}</Td>
        <Td>{priorDisplay === null ? t.companyReport.naValueDisplay : <Num>{priorDisplay}</Num>}</Td>
        <Td className={`font-medium ${growth === null ? "" : growth >= 0 ? "text-nebula-aqua" : "text-danger"}`}>
          {growth === null ? t.companyReport.naValueDisplay : <Num>{formatPercent(growth, lang)}</Num>}
        </Td>
      </Tr>
    );
  }

  function derivedRow(key: string, label: string, current: number | null, previous: number | null, format: (v: number) => string, lowerIsBetter: boolean) {
    const growth = percentChange(current, previous);
    const good = growth === null ? null : lowerIsBetter ? growth <= 0 : growth >= 0;
    return (
      <Tr key={key}>
        <Td>{label}</Td>
        <Td>{current === null ? t.companyReport.naValueDisplay : <Num>{format(current)}</Num>}</Td>
        <Td>{previous === null ? t.companyReport.naValueDisplay : <Num>{format(previous)}</Num>}</Td>
        <Td className={`font-medium ${good === null ? "" : good ? "text-nebula-aqua" : "text-danger"}`}>
          {growth === null ? t.companyReport.naValueDisplay : <Num>{formatPercent(growth, lang)}</Num>}
        </Td>
      </Tr>
    );
  }
  const months = (v: number) => `${formatNumber(v, lang)} ${t.quarterlyReport.monthsUnit}`;

  const customerTileKeys = [
    "cust_b2b_clients",
    "cust_b2c_users",
    "cust_new_customers",
    keyFor("activeCustomers"),
    keyFor("churn"),
    "cust_arpu",
    "cust_cac",
    "cust_b2b_deals",
    "cust_b2c_deals",
  ].filter((k): k is string => k !== null && findMetric(metrics, k) !== undefined);
  const growthIndicatorKeys = [keyFor("activeCustomers"), keyFor("churn"), "cust_arpu", "cust_cac"].filter(
    (k): k is string => k !== null
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 print:px-0 print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Link
          href={fromInvestorDashboard ? "/investor" : `/company/${company.slug}?period=${data.periodLabel}`}
          className="chamfer-br-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
        >
          <BackIcon aria-hidden="true" className="h-4 w-4" />
          {fromInvestorDashboard ? t.nav.investorDashboard : t.quarterlyReport.backToReport}
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-4 w-4" />
          {t.quarterlyReport.printAction}
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">{t.quarterlyReport.brandSubtitle}</p>
                <h1 className="font-heading text-lg font-semibold text-foreground">{lang === "ar" ? company.nameAr : company.nameEn}</h1>
                <p className="text-sm text-muted-foreground">{lang === "ar" ? company.sectorAr : company.sectorEn}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs font-medium text-muted-foreground">{t.quarterlyReport.reportedPeriodLabel}</p>
              <p className="font-heading text-base font-semibold text-foreground">{data.periodLabel}</p>
              {data.publishedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.quarterlyReport.publishedLabel}: {formatDate(data.publishedAt.slice(0, 10), lang)}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t.quarterlyReport.currentRevenueLabel}
            value={revenue === null ? t.companyReport.naValueDisplay : <Num>{formatCurrency(revenue, company.currency, lang)}</Num>}
            hint={revenueGrowth === null ? undefined : `${t.companyReport.revenueGrowthLabel}: ${formatPercent(revenueGrowth, lang)}`}
          />
          <KpiCard
            label={t.quarterlyReport.priorRevenueLabel}
            value={
              previousRevenue === null ? t.companyReport.naValueDisplay : <Num>{formatCurrency(previousRevenue, company.currency, lang)}</Num>
            }
            hint={data.previousPeriodLabel ?? undefined}
          />
          <KpiCard
            label={t.quarterlyReport.projectionLabel}
            value={projection === null ? t.companyReport.naValueDisplay : <Num>{formatCurrency(projection, company.currency, lang)}</Num>}
            hint={t.quarterlyReport.projectionHint}
          />
          <KpiCard
            label={runwayField ? (lang === "ar" ? runwayField.labelAr : runwayField.labelEn) : t.quarterlyReport.runwayLabel}
            value={runway === null ? t.companyReport.naValueDisplay : <Num>{months(runway)}</Num>}
            hint={
              num(metrics, "cash") === null
                ? undefined
                : `${t.quarterlyReport.cashBalanceHint} ${formatCurrency(num(metrics, "cash")!, company.currency, lang)}`
            }
          />
        </div>

        {chartData.length > 1 ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.quarterlyReport.chartTitle}</h2>
            <div className="mt-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value: number) => formatCurrency(value, company.currency, lang)}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                    formatter={(value) => [formatCurrency(Number(value), company.currency, lang), t.companyReport.revenueLabel]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--chart-submitted)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : null}

        {operationalUpdate ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.reviewWorkspace.narrativeKinds.operational_update}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {splitParagraphs(lang === "ar" ? operationalUpdate.textAr : operationalUpdate.textEn).map((para, i) => (
                <div key={i} className="chamfer-br-sm bg-surface-muted p-3 text-sm text-foreground">
                  {para}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="min-w-0">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t.quarterlyReport.comparisonTitle}</h2>
          <div className="mt-3">
            <Table caption={t.quarterlyReport.comparisonCaption}>
              <THead>
                <Tr>
                  <Th>{t.quarterlyReport.metricColumnLabel}</Th>
                  <Th>{t.quarterlyReport.currentColumnLabel}</Th>
                  <Th>{t.quarterlyReport.priorColumnLabel}</Th>
                  <Th>{t.quarterlyReport.qoqGrowthColumnLabel}</Th>
                </Tr>
              </THead>
              <TBody>
                <Tr>
                  <Td>{t.companyReport.revenueLabel}</Td>
                  <Td>{revenue === null ? t.companyReport.naValueDisplay : <Num>{formatCurrency(revenue, company.currency, lang)}</Num>}</Td>
                  <Td>
                    {previousRevenue === null ? t.companyReport.naValueDisplay : <Num>{formatCurrency(previousRevenue, company.currency, lang)}</Num>}
                  </Td>
                  <Td className={`font-medium ${revenueGrowth === null ? "" : revenueGrowth >= 0 ? "text-nebula-aqua" : "text-danger"}`}>
                    {revenueGrowth === null ? t.companyReport.naValueDisplay : <Num>{formatPercent(revenueGrowth, lang)}</Num>}
                  </Td>
                </Tr>
                {comparisonFields(metrics, previousMetrics ?? []).map(comparisonRow)}
                {showDerivedBurn
                  ? derivedRow("derived-burn", t.quarterlyReport.burnRateLabel, burn, priorBurn, (v) => formatCurrency(v, company.currency, lang), true)
                  : null}
                {showDerivedRunway
                  ? derivedRow("derived-runway", t.quarterlyReport.runwayLabel, runway, priorRunway, months, false)
                  : null}
              </TBody>
            </Table>
          </div>
        </Card>

        <Card className="min-w-0">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t.quarterlyReport.growthIndicatorsTitle}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex justify-between gap-3 border-b border-border-subtle py-1.5 text-sm">
              <dt className="text-muted-foreground">{t.companyReport.grossMarginLabel}</dt>
              <dd className="text-end text-foreground">{grossMargin === null ? t.companyReport.naValueDisplay : <Num>{formatPercent(grossMargin, lang)}</Num>}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-border-subtle py-1.5 text-sm">
              <dt className="text-muted-foreground">{t.companyReport.netMarginLabel}</dt>
              <dd className="text-end text-foreground">{netMargin === null ? t.companyReport.naValueDisplay : <Num>{formatPercent(netMargin, lang)}</Num>}</dd>
            </div>
            {growthIndicatorKeys.map((key) => {
              const field = findMetric(metrics, key);
              const prevField = findMetric(previousMetrics ?? [], key);
              if (!field) return null;
              const current = formatMetricValue(field, company.currency, lang) ?? t.companyReport.naValueDisplay;
              const prior = prevField ? (formatMetricValue(prevField, company.currency, lang) ?? t.companyReport.naValueDisplay) : null;
              return (
                <div key={key} className="flex justify-between gap-3 border-b border-border-subtle py-1.5 text-sm">
                  <dt className="text-muted-foreground">{lang === "ar" ? field.labelAr : field.labelEn}</dt>
                  <dd className="text-end text-foreground">
                    <Num>{current}</Num>
                    {prior ? <span className="ms-1 text-xs text-muted-foreground">({prior})</span> : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>

        {quarterHighlights ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.reviewWorkspace.narrativeKinds.quarter_highlights}</h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-foreground">
              {splitParagraphs(lang === "ar" ? quarterHighlights.textAr : quarterHighlights.textEn).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        {customerTileKeys.length > 0 ? (
        <Card className="min-w-0">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t.quarterlyReport.customerMetricsTitle}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {customerTileKeys.map((key) => {
              const field = findMetric(metrics, key);
              if (!field) return null;
              const value = formatMetricValue(field, company.currency, lang) ?? t.companyReport.naValueDisplay;
              return (
                <div key={key} className="chamfer-br-sm bg-surface-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? field.labelAr : field.labelEn}</p>
                  <p className="font-heading mt-1 text-lg font-semibold text-foreground">
                    <Num>{value}</Num>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
        ) : null}

        {investmentReviewNotes ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.reviewWorkspace.narrativeKinds.investment_review_notes}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
              {lang === "ar" ? investmentReviewNotes.textAr : investmentReviewNotes.textEn}
            </p>
          </Card>
        ) : null}

        {managementCommentary ? (
          <Card className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t.reviewWorkspace.narrativeKinds.management_commentary}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
              {lang === "ar" ? managementCommentary.textAr : managementCommentary.textEn}
            </p>
          </Card>
        ) : null}

        <ReportAttachmentsPanel
          reportVersionId={data.reportVersionId}
          companySlug={company.slug}
          periodLabel={data.periodLabel}
          attachments={data.attachments}
          canManage={data.canManageAttachments && !fromInvestorDashboard}
        />

        <p className="text-center text-xs text-muted-foreground">{t.quarterlyReport.disclaimerText}</p>
      </div>
    </div>
  );
}
