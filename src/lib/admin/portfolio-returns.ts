import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { computeMoic } from "@/lib/finance/irr";
import type { Currency } from "@/generated/prisma/client";

export interface PortfolioReturnSummary {
  currency: Currency;
  investedCapital: number;
  distributed: number;
  currentValue: number;
  moic: number | null;
}

// Draft agreements haven't actually moved money yet; Terminated ones had
// their capital returned/written off outside this ledger. Active and
// Superseded are the two states where the invested amount is real,
// historical capital-in-the-ground -- Superseded still counts because a
// later round doesn't erase that an earlier tranche was actually funded.
const INVESTED_STATUSES = ["Active", "Superseded"] as const;

/**
 * GP-level "how is Falak's deployed capital performing" view -- distinct
 * from getInvestorReturns (one LP's own return) and from
 * computeNavTotalsByCurrency (a vehicle's own NAV mark). Per currency,
 * never blended, same discipline as every other portfolio total in this
 * codebase:
 *   - investedCapital: sum of InvestmentAgreement.investedAmount across
 *     every counted tranche, in the agreement's own currency.
 *   - distributed: sum of AgreementCashFlow rows of type Distribution
 *     (this table has no app-level writer yet -- Falak needs to backfill
 *     it the same way investor capital transactions were backfilled for
 *     getInvestorReturns; 0 until then, which is accurate, not a bug).
 *   - currentValue: each OwnershipPosition's latest ownershipPct times
 *     its company's latest valuation mark, summed by the valuation's own
 *     currency -- ownership-weighted, so dilution from later rounds is
 *     reflected automatically. A position or company with no snapshot/
 *     valuation yet simply contributes nothing (never coerced to 0 of a
 *     guessed currency).
 */
export async function getPortfolioReturns(): Promise<PortfolioReturnSummary[]> {
  await requireFalakRole("FALAK_OPERATIONS");

  const [agreements, distributions, positions, latestValuations] = await Promise.all([
    db.investmentAgreement.findMany({
      where: { status: { in: [...INVESTED_STATUSES] } },
      select: { investedAmount: true, currency: true },
    }),
    db.agreementCashFlow.findMany({
      where: { type: "Distribution" },
      select: { amount: true, currency: true },
    }),
    db.ownershipPosition.findMany({
      where: { company: { archivedAt: null } },
      select: {
        companyId: true,
        snapshots: { orderBy: { asOfDate: "desc" }, take: 1, select: { ownershipPct: true } },
      },
    }),
    db.companyValuationSnapshot.findMany({
      where: { company: { archivedAt: null } },
      orderBy: { asOfDate: "desc" },
      distinct: ["companyId"],
      select: { companyId: true, valuationAmount: true, currency: true },
    }),
  ]);

  const valuationByCompanyId = new Map(latestValuations.map((v) => [v.companyId, v]));

  const investedByCurrency = new Map<Currency, number>();
  for (const a of agreements) {
    if (a.investedAmount === null || a.currency === null) continue;
    investedByCurrency.set(a.currency, (investedByCurrency.get(a.currency) ?? 0) + a.investedAmount.toNumber());
  }

  const distributedByCurrency = new Map<Currency, number>();
  for (const cf of distributions) {
    distributedByCurrency.set(cf.currency, (distributedByCurrency.get(cf.currency) ?? 0) + cf.amount.toNumber());
  }

  const currentValueByCurrency = new Map<Currency, number>();
  for (const position of positions) {
    const snapshot = position.snapshots[0];
    const valuation = valuationByCompanyId.get(position.companyId);
    if (!snapshot || !valuation) continue;
    const attributable = snapshot.ownershipPct.toNumber() * valuation.valuationAmount.toNumber();
    currentValueByCurrency.set(valuation.currency, (currentValueByCurrency.get(valuation.currency) ?? 0) + attributable);
  }

  const currencies = [
    ...new Set([...investedByCurrency.keys(), ...distributedByCurrency.keys(), ...currentValueByCurrency.keys()]),
  ];

  return currencies.map((currency) => {
    const investedCapital = investedByCurrency.get(currency) ?? 0;
    const distributed = distributedByCurrency.get(currency) ?? 0;
    const currentValue = currentValueByCurrency.get(currency) ?? 0;
    return {
      currency,
      investedCapital,
      distributed,
      currentValue,
      moic: computeMoic(investedCapital, distributed, currentValue),
    };
  });
}
