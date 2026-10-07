import { deriveMonthlyBurn, deriveRunwayMonths } from "@/lib/reporting/computed-metrics";
import { findNumericMetricValue } from "@/lib/reporting/metric-format";
import type { SubmissionMetricFieldDTO } from "@/lib/reporting/dto";

// Metric keys for the cash/runway figures, in order of preference.
// Templates name the same measure differently (the original 6-metric
// template uses "cash_balance_current"/"expenses_total", the 30-metric
// one "fin_cash_balance"/"fin_expenses"); the first key present is used.
export const CASH_KEYS = ["fin_cash_balance", "cash_balance_current"];
export const BURN_KEYS = ["fin_burn_rate"];
export const NET_CASH_FLOW_KEYS = ["fin_monthly_net_cash_flow"];
export const RUNWAY_KEYS = ["fin_runway_months"];
export const EXPENSES_KEYS = ["fin_expenses", "expenses_total"];

function firstValue(metrics: SubmissionMetricFieldDTO[], keys: string[]): number | null {
  for (const key of keys) {
    const value = findNumericMetricValue(metrics, key);
    if (value !== null) return value;
  }
  return null;
}

/**
 * One period's cash balance and runway in months. Runway is the reported
 * figure when there is one, otherwise cash / monthly burn, with burn
 * worked out from expenses or cash flow when not reported directly --
 * the same rules the quarterly report uses.
 */
export function cashAndRunway(
  metrics: SubmissionMetricFieldDTO[],
  quarterRevenue: number | null
): { cash: number | null; runway: number | null } {
  const cash = firstValue(metrics, CASH_KEYS);
  const burn = deriveMonthlyBurn({
    reportedBurn: firstValue(metrics, BURN_KEYS),
    monthlyNetCashFlow: firstValue(metrics, NET_CASH_FLOW_KEYS),
    quarterRevenue,
    quarterExpenses: firstValue(metrics, EXPENSES_KEYS),
  });
  return { cash, runway: deriveRunwayMonths(firstValue(metrics, RUNWAY_KEYS), cash, burn) };
}
