import type { Currency } from "@/generated/prisma/client";
import type { AdminCompanyDTO } from "./dto";

export interface AdminRevenueByCurrencyEntry {
  currency: Currency;
  total: number;
  excludedCount: number;
}

const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

/**
 * Real-data equivalent of the mock prototype's computeRevenueByCurrency
 * (src/lib/revenue.ts) -- same rule (never combine currencies, exclude a
 * company with no data for the period rather than treating it as zero),
 * applied to AdminCompanyDTO instead of the mock Company shape.
 */
export function computeRevenueByCurrency(companies: AdminCompanyDTO[], periodKey: string): AdminRevenueByCurrencyEntry[] {
  const currenciesPresent = CURRENCY_ORDER.filter((currency) => companies.some((c) => c.currency === currency));

  return currenciesPresent.map((currency) => {
    const companiesInCurrency = companies.filter((c) => c.currency === currency);
    let total = 0;
    let excludedCount = 0;
    for (const company of companiesInCurrency) {
      const revenue = company.periods[periodKey]?.revenue ?? null;
      if (revenue === null) {
        excludedCount += 1;
      } else {
        total += revenue;
      }
    }
    return { currency, total, excludedCount };
  });
}
