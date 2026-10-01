// Shared by admin/company/vehicle/investor queries.ts -- revenue is now
// two metrics (B2B + B2C), not one. revenue_b2b is the exact key every
// existing company's template already uses (reused verbatim, not
// renamed, so nothing already-submitted needs migrating); fin_revenue_b2c
// is new.
// Plain (mutable) string[], not `as const` -- Prisma's `key: { in: ... }`
// filter expects a mutable string[] for its generated type, and a
// readonly tuple there breaks its overload resolution (cascades into
// every nested `select` on the same query losing its real inferred
// type).
export const REVENUE_METRIC_KEYS: string[] = ["revenue_b2b", "fin_revenue_b2c"];

export interface RevenueMetricValueInput {
  metricDefinition: { key: string };
  numericValue: { toNumber: () => number } | null;
  isNa: boolean;
}

/**
 * Each missing/isNa line is treated as contributing 0 to the total,
 * UNLESS every line is missing/isNa, in which case the total is null --
 * same "don't coerce genuine absence into a false number" rule
 * computeRevenueByCurrency already follows for the portfolio-wide KPI.
 * A company that only reports B2B (B2C truly not applicable) still gets
 * a real total; a company that reports nothing gets null, not 0.
 */
export function sumRevenueMetricValues(values: RevenueMetricValueInput[]): number | null {
  const relevant = values.filter((v) => REVENUE_METRIC_KEYS.includes(v.metricDefinition.key));
  const withData = relevant.filter((v) => !v.isNa && v.numericValue !== null);

  if (withData.length === 0) return null;

  return withData.reduce((sum, v) => sum + v.numericValue!.toNumber(), 0);
}
