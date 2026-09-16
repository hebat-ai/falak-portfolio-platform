import type { Company, Currency, ReportingPeriod } from "./mock/types";

export interface RevenueByCurrencyEntry {
  currency: Currency;
  total: number;
  excludedCount: number;
}

// Fixed, deterministic display order -- matches the Admin dashboard's
// established SAR-then-USD ordering, independent of company-array order.
const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

/**
 * Revenue summed per company currency, never combined across currencies.
 * A bucket exists only for currencies actually represented in `companies`,
 * in the fixed CURRENCY_ORDER -- no currency is shown with a phantom zero
 * total just because it exists elsewhere in the dataset. A company with
 * revenue === null for the period is excluded from its bucket's total and
 * counted in excludedCount; revenue === 0 is a real, included value, not
 * treated as missing. Pure -- never mutates `companies`. Single source of
 * truth shared by the Admin portfolio summary and the Vehicle Dashboard.
 */
export function computeRevenueByCurrency(
  companies: readonly Company[],
  period: ReportingPeriod
): RevenueByCurrencyEntry[] {
  const currenciesPresent = CURRENCY_ORDER.filter((currency) =>
    companies.some((c) => c.currency === currency)
  );

  return currenciesPresent.map((currency) => {
    const companiesInCurrency = companies.filter((c) => c.currency === currency);
    let total = 0;
    let excludedCount = 0;
    for (const company of companiesInCurrency) {
      const revenue = company.periods[period].revenue;
      if (revenue === null) {
        excludedCount += 1;
      } else {
        total += revenue;
      }
    }
    return { currency, total, excludedCount };
  });
}
