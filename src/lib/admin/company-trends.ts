import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { fetchSubmissionMetricFields } from "@/lib/reporting/metrics";
import { findNumericMetricValue } from "@/lib/reporting/metric-format";
import { REVENUE_METRIC_KEYS, sumRevenueMetricValues } from "@/lib/reporting/revenue-metrics";
import { percentChange } from "@/lib/reporting/computed-metrics";
import type { Currency } from "@/generated/prisma/client";

export interface CompanyTrendPoint {
  periodLabel: string;
  periodStart: string;
  revenue: number | null;
  burn: number | null;
}

export interface CompanyTrendDTO {
  companyId: string;
  companySlug: string;
  companyNameEn: string;
  companyNameAr: string;
  currency: Currency;
  points: CompanyTrendPoint[];
  latestPeriodLabel: string | null;
  latestRevenue: number | null;
  previousRevenue: number | null;
  revenueGrowth: number | null;
  latestBurn: number | null;
  previousBurn: number | null;
  burnChange: number | null;
  runwayMonths: number | null;
}

/**
 * Falak-staff-only. One row per non-archived company: its full
 * reported-period revenue/burn history (for the sparkline), plus the
 * latest-vs-prior QoQ growth figures the Company Performance Trends
 * table surfaces directly. A company with fewer than two reported
 * periods still gets a row (with nulls for the growth figures it can't
 * compute yet) -- it's never silently dropped, since "no trend data yet"
 * is itself something a fund manager needs to see, not hide.
 *
 * `companyIds`, when given, scopes this to exactly that set (e.g. one
 * vehicle's linked companies) -- omitted/undefined covers every
 * non-archived company, the original portfolio-wide behavior.
 */
export async function getCompanyPerformanceTrends(companyIds?: string[]): Promise<CompanyTrendDTO[]> {
  await requireFalakRole("FALAK_OPERATIONS");

  const companies = await db.company.findMany({
    where: { archivedAt: null, ...(companyIds ? { id: { in: companyIds } } : {}) },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      currency: true,
      cycles: {
        orderBy: { periodStart: "asc" },
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
      },
    },
  });

  return Promise.all(
    companies.map(async (company) => {
      const points: CompanyTrendPoint[] = [];
      // Runway isn't part of CompanyTrendPoint (it's a point-in-time
      // figure, not something that makes sense to sparkline) -- just
      // keep whatever the most recently processed reported period's
      // value was; since cycles are already ordered oldest-first, that's
      // the latest one once the loop finishes.
      let latestRunway: number | null = null;
      for (const cycle of company.cycles) {
        if (!cycle.submission) continue;
        const revenue = sumRevenueMetricValues(cycle.submission.metricValues);
        const metrics = await fetchSubmissionMetricFields(db, cycle.submission.id, cycle.templateId);
        const burn = findNumericMetricValue(metrics, "fin_burn_rate");
        latestRunway = findNumericMetricValue(metrics, "fin_runway_months");
        points.push({
          periodLabel: cycle.periodLabel,
          periodStart: cycle.periodStart.toISOString().slice(0, 10),
          revenue,
          burn,
        });
      }

      const latest = points.at(-1) ?? null;
      const previous = points.length > 1 ? points.at(-2)! : null;

      return {
        companyId: company.id,
        companySlug: company.slug,
        companyNameEn: company.nameEn,
        companyNameAr: company.nameAr,
        currency: company.currency,
        points,
        latestPeriodLabel: latest?.periodLabel ?? null,
        latestRevenue: latest?.revenue ?? null,
        previousRevenue: previous?.revenue ?? null,
        revenueGrowth: percentChange(latest?.revenue ?? null, previous?.revenue ?? null),
        latestBurn: latest?.burn ?? null,
        previousBurn: previous?.burn ?? null,
        burnChange: percentChange(latest?.burn ?? null, previous?.burn ?? null),
        runwayMonths: latestRunway,
      };
    })
  );
}
