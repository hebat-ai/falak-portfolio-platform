// Pure, deliberately dependency-free functions (no @/lib/db, no
// server-only) -- margins/growth/projection are display-time
// computations over already-fetched numbers, never stored as their own
// SubmissionMetricValue. Confirmed with the project owner: COGS is a
// real submitted field precisely so Gross Margin can be computed
// correctly instead of guessed.

/**
 * Gross Margin % = (Revenue - COGS) / Revenue. null whenever Revenue or
 * COGS themselves are null/not yet reported, or Revenue is 0 (division
 * by zero is not "0% margin", it's "undefined") -- never silently
 * produces a misleading number from incomplete data.
 */
export function computeGrossMargin(revenue: number | null, cogs: number | null): number | null {
  if (revenue === null || cogs === null || revenue === 0) return null;
  return (revenue - cogs) / revenue;
}

/** Net Margin % = (Revenue - Expenses) / Revenue. Same null/zero rules. */
export function computeNetMargin(revenue: number | null, expenses: number | null): number | null {
  if (revenue === null || expenses === null || revenue === 0) return null;
  return (revenue - expenses) / revenue;
}

/**
 * Generic prior-vs-current percentage change -- used for Revenue Growth
 * % and every row of the branded report's QoQ Growth column alike. null
 * when either side is missing or the prior value is 0 (a "from zero"
 * growth rate is not a meaningful percentage).
 */
export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

/**
 * Revenue Projection = latest period's Total Revenue x 4 (a simple
 * run-rate annualization) -- verified against the source PDF's own
 * numbers: $160.0K x 4 = $640.0K exactly.
 */
export function computeRevenueProjection(latestPeriodRevenue: number | null): number | null {
  if (latestPeriodRevenue === null) return null;
  return latestPeriodRevenue * 4;
}
