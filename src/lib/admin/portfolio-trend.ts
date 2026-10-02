import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { fetchSubmissionMetricFields } from "@/lib/reporting/metrics";
import { findNumericMetricValue } from "@/lib/reporting/metric-format";
import { REVENUE_METRIC_KEYS, sumRevenueMetricValues } from "@/lib/reporting/revenue-metrics";

export interface PortfolioTrendPoint {
  periodLabel: string;
  periodStart: string;
  // Sum across every company that reported revenue/burn that period --
  // a company with no submission that period simply doesn't contribute,
  // same "absence isn't a false zero" discipline sumRevenueMetricValues
  // itself already follows for a single company.
  totalRevenue: number | null;
  totalBurn: number | null;
}

/**
 * Falak-staff-only. Portfolio-wide Total Revenue and burn rate by
 * period, across every non-archived company -- the cross-company
 * counterpart to CompanyKpis' own single-company trend, for the
 * admin dashboard's portfolio-trend chart.
 */
export async function getPortfolioTrend(): Promise<PortfolioTrendPoint[]> {
  await requireFalakRole("FALAK_OPERATIONS");

  const cycles = await db.reportingCycle.findMany({
    where: { company: { archivedAt: null } },
    select: {
      periodLabel: true,
      periodStart: true,
      templateId: true,
      submission: {
        select: {
          id: true,
          metricValues: {
            where: { metricDefinition: { key: { in: REVENUE_METRIC_KEYS } } },
            select: { metricDefinition: { select: { key: true } }, numericValue: true, isNa: true },
          },
        },
      },
    },
  });

  const byPeriod = new Map<string, { periodStart: Date; revenue: number[]; burn: number[] }>();

  for (const cycle of cycles) {
    if (!cycle.submission) continue;
    const entry = byPeriod.get(cycle.periodLabel) ?? { periodStart: cycle.periodStart, revenue: [], burn: [] };

    const revenue = sumRevenueMetricValues(cycle.submission.metricValues);
    if (revenue !== null) entry.revenue.push(revenue);

    const metrics = await fetchSubmissionMetricFields(db, cycle.submission.id, cycle.templateId);
    const burn = findNumericMetricValue(metrics, "fin_burn_rate");
    if (burn !== null) entry.burn.push(burn);

    byPeriod.set(cycle.periodLabel, entry);
  }

  return [...byPeriod.entries()]
    .map(([periodLabel, { periodStart, revenue, burn }]) => ({
      periodLabel,
      periodStart: periodStart.toISOString().slice(0, 10),
      totalRevenue: revenue.length === 0 ? null : revenue.reduce((a, b) => a + b, 0),
      totalBurn: burn.length === 0 ? null : burn.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}
