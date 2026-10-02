import "server-only";
import { db } from "@/lib/db";
import { requireInvestorMembership } from "@/lib/auth/authorization";
import { computeXirr, computeMoic } from "@/lib/finance/irr";
import type { Currency } from "@/generated/prisma/client";

export interface InvestorReturnSummary {
  currency: Currency;
  contributed: number;
  distributed: number;
  managementFees: number;
  currentValue: number;
  moic: number | null;
  irr: number | null;
}

// Capital calls and contributions are both money going IN to the fund
// (out of the investor's pocket) -- a call is the request, a
// contribution is the money actually received against it. Both count as
// "contributed" for MOIC/IRR purposes; double-counting both only matters
// if Falak records both for the same cash event, which is a data-entry
// discipline question, not something this function can detect.
const OUTFLOW_TYPES = new Set(["CapitalCall", "Contribution"]);

/**
 * Per-currency (never blended, matching the policy
 * src/lib/admin/valuation-totals.ts already enforces for portfolio-wide
 * valuation) MOIC and XIRR for one investor, built from their own dated
 * InvestorCapitalTransaction rows plus a final synthetic "as of today"
 * cash flow from their current vehicle positions' attributable NAV.
 *
 * Known, deliberate scope limit: only vehicle-mediated positions
 * (InvestorVehiclePosition × VehicleNavSnapshot) contribute to
 * `currentValue` -- a direct (non-vehicle) investment's current value
 * would need resolving through InvestmentAgreement/OwnershipPosition/
 * CompanyValuationSnapshot instead, which this pass doesn't attempt.
 * contributed/distributed/managementFees are complete and correct
 * regardless (they're summed directly off the transaction ledger); only
 * the unrealized component is scoped down.
 *
 * Requires the caller to already hold at least MEMBER-level
 * InvestorMembership on `investorId` -- re-verified fresh here, never
 * trusted from an earlier page-render decision.
 */
export async function getInvestorReturns(investorId: string): Promise<InvestorReturnSummary[]> {
  await requireInvestorMembership(investorId, "MEMBER");

  const transactions = await db.investorCapitalTransaction.findMany({
    where: { investorId },
    select: { type: true, amount: true, currency: true, transactionDate: true },
  });

  if (transactions.length === 0) return [];

  const positions = await db.investorVehiclePosition.findMany({
    where: { investorId, status: "Active" },
    select: { vehicleId: true, ownershipPct: true, currency: true },
  });

  const currentValueByCurrency = new Map<Currency, number>();
  for (const position of positions) {
    if (position.ownershipPct === null) continue;
    const latestNav = await db.vehicleNavSnapshot.findFirst({
      where: { vehicleId: position.vehicleId },
      orderBy: { asOfDate: "desc" },
      select: { navAmount: true, currency: true },
    });
    if (!latestNav) continue;
    const value = position.ownershipPct.toNumber() * latestNav.navAmount.toNumber();
    currentValueByCurrency.set(latestNav.currency, (currentValueByCurrency.get(latestNav.currency) ?? 0) + value);
  }

  const currencies = [...new Set(transactions.map((t) => t.currency))];

  return currencies.map((currency) => {
    const rows = transactions.filter((t) => t.currency === currency);
    const currentValue = currentValueByCurrency.get(currency) ?? 0;

    let contributed = 0;
    let distributed = 0;
    let managementFees = 0;
    const cashFlows = rows.map((t) => {
      const amount = t.amount.toNumber();
      if (OUTFLOW_TYPES.has(t.type)) {
        contributed += amount;
        return { date: t.transactionDate, amount: -amount };
      }
      if (t.type === "Distribution") {
        distributed += amount;
        return { date: t.transactionDate, amount };
      }
      // ManagementFee: an outflow for IRR purposes (money leaving the
      // investor's position) but tracked separately from `contributed`
      // -- it's a cost against the investment, not capital put to work.
      managementFees += amount;
      return { date: t.transactionDate, amount: -amount };
    });

    if (currentValue > 0) {
      cashFlows.push({ date: new Date(), amount: currentValue });
    }

    return {
      currency,
      contributed,
      distributed,
      managementFees,
      currentValue,
      moic: computeMoic(contributed, distributed, currentValue),
      irr: computeXirr(cashFlows),
    };
  });
}
