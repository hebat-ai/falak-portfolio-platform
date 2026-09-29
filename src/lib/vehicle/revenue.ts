import type { RevenueByCurrencyEntry } from "@/lib/revenue";
import type { VehicleCompanyDTO } from "./dto";

const CURRENCY_ORDER: readonly RevenueByCurrencyEntry["currency"][] = ["SAR", "USD"] as const;

/**
 * Same rule as src/lib/admin/revenue.ts (never combine currencies; a
 * company with no revenue value for the period is excluded and counted,
 * not treated as zero), applied to one vehicle's linked companies.
 */
export function computeVehicleRevenueByCurrency(
  companies: VehicleCompanyDTO[],
  periodKey: string
): RevenueByCurrencyEntry[] {
  const currenciesPresent = CURRENCY_ORDER.filter((currency) => companies.some((c) => c.currency === currency));

  return currenciesPresent.map((currency) => {
    let total = 0;
    let excludedCount = 0;
    for (const company of companies.filter((c) => c.currency === currency)) {
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
