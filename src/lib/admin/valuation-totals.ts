import type { Currency } from "@/generated/prisma/client";
import type { AdminCompanyValuationDTO } from "./dto";

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
