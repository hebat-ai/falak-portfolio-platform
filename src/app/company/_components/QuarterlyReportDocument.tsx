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
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  computeGrossMargin,
  computeNetMargin,
  computeRevenueProjection,
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

  const cogs = findNumericMetricValue(metrics, "fin_cogs");
  const expenses = findNumericMetricValue(metrics, "fin_expenses");
  const grossMargin = computeGrossMargin(revenue, cogs);
  const netMargin = computeNetMargin(revenue, expenses);
  const revenueGrowth = percentChange(revenue, previousRevenue);
  const projection = computeRevenueProjection(revenue);
  const runwayField = findMetric(metrics, "fin_runway_months");

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

  const customerTileKeys = ["cust_b2b_clients", "cust_b2c_users", "cust_new_customers", "cust_active_customers", "cust_b2b_deals", "cust_b2c_deals"];
  const growthIndicatorKeys = ["cust_active_customers", "cust_churn_rate", "cust_arpu", "cust_cac"];

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
            label={runwayField ? (lang === "ar" ? runwayField.labelAr : runwayField.labelEn) : t.companyReport.naValueDisplay}
            value={
              runwayField ? (formatMetricValue(runwayField, company.currency, lang) ?? t.companyReport.naValueDisplay) : t.companyReport.naValueDisplay
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
