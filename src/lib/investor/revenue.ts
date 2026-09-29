import type { RevenueByCurrencyEntry } from "@/lib/revenue";
import type { InvestorVisibleCompanyDTO } from "./dto";

const CURRENCY_ORDER: readonly RevenueByCurrencyEntry["currency"][] = ["SAR", "USD"] as const;

/**
 * Same rule as src/lib/admin/revenue.ts (never combine currencies,
 * exclude a company with no revenue value rather than treating it as
 * zero), applied to the flat, already period-scoped
 * InvestorVisibleCompanyDTO[] the client passes in (no periods record to
 * index into -- each row is already one company's one granted period).
 */
export function computeInvestorRevenueByCurrency(
  companies: InvestorVisibleCompanyDTO[]
): RevenueByCurrencyEntry[] {
  const currenciesPresent = CURRENCY_ORDER.filter((currency) => companies.some((c) => c.currency === currency));

  return currenciesPresent.map((currency) => {
    const companiesInCurrency = companies.filter((c) => c.currency === currency);
    let total = 0;
    let excludedCount = 0;
    for (const company of companiesInCurrency) {
      if (company.revenue === null) {
        excludedCount += 1;
      } else {
        total += company.revenue;
      }
    }
    return { currency, total, excludedCount };
  });
}
