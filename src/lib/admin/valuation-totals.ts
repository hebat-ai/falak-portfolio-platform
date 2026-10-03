import type { Currency } from "@/generated/prisma/client";
import type { AdminCompanyValuationDTO, AdminVehicleValuationDTO } from "./dto";

// Deliberately NOT server-only and NOT importing @/lib/db -- a pure
// function over already-fetched DTOs, same split as revenue.ts's
// computeRevenueByCurrency, so client components (PortfolioValuationSummary.tsx)
// can import it directly without pulling the database client (which
// valuations.ts's getPortfolioValuationData depends on) into the browser
// bundle.

export interface ValuationTotalByCurrency {
  currency: Currency;
  total: number;
  excludedCount: number;
}

const CURRENCY_ORDER: readonly Currency[] = ["SAR", "USD"] as const;

/**
 * Sums each company's LATEST valuation per currency -- never combined
 * across currencies, same rule as computeRevenueByCurrency. A company
 * with no valuation recorded yet is excluded (and counted), never
 * assumed to be worth 0.
 */
export function computeValuationTotalsByCurrency(companies: AdminCompanyValuationDTO[]): ValuationTotalByCurrency[] {
  const withValuation = companies.filter((c) => c.latest !== null);
  const currenciesPresent = CURRENCY_ORDER.filter((currency) => withValuation.some((c) => c.latest?.currency === currency));

  return currenciesPresent.map((currency) => {
    let total = 0;
    let excludedCount = 0;
    for (const company of companies) {
      if (!company.latest) {
        excludedCount += 1;
        continue;
      }
      if (company.latest.currency !== currency) continue;
      total += company.latest.amount;
    }
    return { currency, total, excludedCount };
  });
}

/**
 * NAV (Net Asset Value) of the total portfolio -- the sum of each
 * VEHICLE's latest NAV mark, never a company's own valuation (that's
 * computeValuationTotalsByCurrency above, a different, gross-of-fund-
 * structure number). `vehicleId` optionally scopes this to a single
 * vehicle (the admin dashboard's vehicle filter); omitted/undefined
 * sums every non-archived vehicle. Same "never blend currencies, never
 * coerce a missing mark into 0" discipline as every other portfolio
 * total in this file.
 */
export function computeNavTotalsByCurrency(vehicles: AdminVehicleValuationDTO[], vehicleId?: string): ValuationTotalByCurrency[] {
  const scoped = vehicleId ? vehicles.filter((v) => v.id === vehicleId) : vehicles;
  const withNav = scoped.filter((v) => v.latest !== null);
  const currenciesPresent = CURRENCY_ORDER.filter((currency) => withNav.some((v) => v.latest?.currency === currency));

  return currenciesPresent.map((currency) => {
    let total = 0;
    let excludedCount = 0;
    for (const vehicle of scoped) {
      if (!vehicle.latest) {
        excludedCount += 1;
        continue;
      }
      if (vehicle.latest.currency !== currency) continue;
      total += vehicle.latest.amount;
    }
    return { currency, total, excludedCount };
  });
}
