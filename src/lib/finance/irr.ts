// Pure, dependency-free financial math -- no db/server-only imports, so
// this is directly unit-testable and safely importable from a client
// component (InvestorReturnsPanel) as well as the server-side
// src/lib/investor/returns.ts.

export interface DatedCashFlow {
  date: Date;
  // Signed: negative = money out (a call/contribution), positive =
  // money in (a distribution) or the final synthetic "current value"
  // flow. The sign convention a real cash-flow ledger already uses.
  amount: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_YEAR = 365;
const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-7;
const DEFAULT_GUESS = 0.1;

function yearsSince(t0: Date, date: Date): number {
  return (date.getTime() - t0.getTime()) / MS_PER_DAY / DAYS_PER_YEAR;
}

function npv(rate: number, flows: DatedCashFlow[], t0: Date): number {
  return flows.reduce((sum, cf) => sum + cf.amount / Math.pow(1 + rate, yearsSince(t0, cf.date)), 0);
}

function npvDerivative(rate: number, flows: DatedCashFlow[], t0: Date): number {
  return flows.reduce((sum, cf) => {
    const years = yearsSince(t0, cf.date);
    if (years === 0) return sum;
    return sum - (years * cf.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

/**
 * XIRR via Newton-Raphson on irregularly-dated cash flows (the standard
 * approach -- the same one Excel's own XIRR function uses). Returns
 * null rather than throwing when there's nothing sensible to solve for:
 * fewer than 2 flows, all flows the same sign (no real rate makes an
 * all-outflow or all-inflow series balance), or the iteration fails to
 * converge.
 */
export function computeXirr(flows: DatedCashFlow[]): number | null {
  if (flows.length < 2) return null;
  const hasNegative = flows.some((f) => f.amount < 0);
  const hasPositive = flows.some((f) => f.amount > 0);
  if (!hasNegative || !hasPositive) return null;

  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date;

  let rate = DEFAULT_GUESS;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const value = npv(rate, sorted, t0);
    const derivative = npvDerivative(rate, sorted, t0);
    if (Math.abs(derivative) < 1e-12) return null;

    let nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate)) return null;
    // Keep the iteration inside the domain where (1+rate) stays
    // positive -- a Newton step can otherwise overshoot past -100%,
    // where the power function is undefined for non-integer exponents.
    if (nextRate <= -1) nextRate = (rate - 1) / 2;

    if (Math.abs(nextRate - rate) < TOLERANCE) {
      return nextRate;
    }
    rate = nextRate;
  }
  return null;
}

/**
 * MOIC = (distributed + current unrealized value) / contributed.
 * `contributed`/`distributed` are positive magnitudes (unlike
 * computeXirr's signed flows) -- the caller sums them from the same
 * ledger, just unsigned. null when nothing was ever contributed (MOIC
 * is undefined, not infinite or zero).
 */
export function computeMoic(contributed: number, distributed: number, currentValue: number): number | null {
  if (contributed <= 0) return null;
  return (distributed + currentValue) / contributed;
}
