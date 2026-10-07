// Client-safe (no db import).

export interface QuarterPeriodInput {
  label: string;
  periodStart: string;
  revenue: number | null;
}

export interface QuarterBar {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  actual: number | null;
  projected: number | null;
}

export interface AnnualRevenueSummary {
  year: number;
  quarters: QuarterBar[];
  annualRevenue: number | null;
  isActual: boolean;
}

/** "Q2 2026" → {quarter 2, year 2026}; otherwise derived from the period's start date. */
export function quarterOf(label: string, periodStart: string): { quarter: 1 | 2 | 3 | 4; year: number } {
  const match = /^Q([1-4])\s+(\d{4})$/i.exec(label.trim());
  if (match) return { quarter: Number(match[1]) as 1 | 2 | 3 | 4, year: Number(match[2]) };
  const date = new Date(periodStart);
  return { quarter: (Math.floor(date.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4, year: date.getUTCFullYear() };
}

/**
 * The year's four quarters with reported revenue, and the full-year figure:
 * - Q4 reported: actual -- the sum of the year's reported quarters.
 * - Otherwise: projected -- year-to-date reported revenue plus the latest
 *   reported quarter's revenue for each remaining quarter (run rate).
 *   Unreported quarters before the latest reported one count as 0.
 */
export function computeAnnualRevenue(periods: QuarterPeriodInput[], year: number): AnnualRevenueSummary {
  const revenueByQuarter = new Map<number, number>();
  for (const p of periods) {
    const q = quarterOf(p.label, p.periodStart);
    if (q.year === year && p.revenue !== null) revenueByQuarter.set(q.quarter, p.revenue);
  }

  const reportedQuarters = [...revenueByQuarter.keys()].sort();
  const latestQuarter = reportedQuarters.at(-1) ?? null;
  const isActual = revenueByQuarter.has(4);
  const runRate = latestQuarter === null ? null : revenueByQuarter.get(latestQuarter)!;

  const quarters: QuarterBar[] = ([1, 2, 3, 4] as const).map((quarter) => {
    const actual = revenueByQuarter.get(quarter) ?? null;
    const projected =
      !isActual && actual === null && latestQuarter !== null && quarter > latestQuarter ? runRate : null;
    return { quarter, label: `Q${quarter}`, actual, projected };
  });

  const annualRevenue =
    latestQuarter === null ? null : quarters.reduce((sum, q) => sum + (q.actual ?? 0) + (q.projected ?? 0), 0);

  return { year, quarters, annualRevenue, isActual };
}
