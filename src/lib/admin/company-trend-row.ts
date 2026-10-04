import type { Currency } from "@/generated/prisma/client";
import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";
import { percentChange } from "@/lib/reporting/computed-metrics";

// Client-safe (no db import): the Company Performance Trends table
// recomputes rows instantly when the viewer switches period or currency.

export interface CompanyTrendPoint {
  periodLabel: string;
  periodStart: string;
  revenue: number | null;
  burn: number | null;
  runwayMonths: number | null;
}

export interface CompanyTrendRow {
  revenue: number | null;
  revenueGrowth: number | null;
  burn: number | null;
  burnChange: number | null;
  runwayMonths: number | null;
}

/**
 * The selected period's figures vs the company's immediately preceding
 * reported period, with amounts converted to the display currency.
 * Growth ratios are currency-independent, so they are computed on the
 * original amounts. A company that didn't report the selected period
 * gets an all-null row rather than silently showing another period.
 */
export function computeTrendRow(
  points: CompanyTrendPoint[],
  currency: Currency,
  periodKey: string,
  display: DisplayCurrency
): CompanyTrendRow {
  const index = points.findIndex((p) => p.periodLabel === periodKey);
  const current = index === -1 ? null : points[index];
  const previous = index > 0 ? points[index - 1] : null;
  const convert = (v: number | null) => (v === null ? null : convertToDisplay(v, currency, display));

  return {
    revenue: convert(current?.revenue ?? null),
    revenueGrowth: percentChange(current?.revenue ?? null, previous?.revenue ?? null),
    burn: convert(current?.burn ?? null),
    burnChange: percentChange(current?.burn ?? null, previous?.burn ?? null),
    runwayMonths: current?.runwayMonths ?? null,
  };
}
