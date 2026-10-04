import type { Currency } from "@/generated/prisma/client";
import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";

// Client-safe (no db import) -- recomputed instantly on currency change.

export interface MoneyAmount {
  amount: number;
  currency: Currency;
}

export interface VehicleCapTableInvestorRaw {
  investorId: string;
  nameEn: string;
  nameAr: string;
  contributions: MoneyAmount[];
  managementFees: MoneyAmount[];
  storedOwnershipPct: number | null;
}

export interface VehicleCapitalOverview {
  investedCapital: MoneyAmount[];
  investors: VehicleCapTableInvestorRaw[];
}

export interface VehicleCapTableRow {
  investorId: string;
  nameEn: string;
  nameAr: string;
  contributed: number;
  netInvested: number;
  ownershipPct: number | null;
}

export interface VehicleCapTable {
  investedCapital: number;
  rows: VehicleCapTableRow[];
  totals: { contributed: number; netInvested: number; ownershipPct: number | null };
}

export function sumInDisplay(amounts: MoneyAmount[], display: DisplayCurrency): number {
  return amounts.reduce((sum, a) => sum + convertToDisplay(a.amount, a.currency, display), 0);
}

/**
 * Contributed = the investor's recorded contributions. Net invested =
 * contributed minus management fees charged on this vehicle. Ownership =
 * the investor's share of all investors' contributions, so the cap table
 * always sums to 100%; falls back to the stored % when nothing has been
 * contributed yet.
 */
export function computeVehicleCapTable(overview: VehicleCapitalOverview, display: DisplayCurrency): VehicleCapTable {
  const investedCapital = sumInDisplay(overview.investedCapital, display);
  const contributedByInvestor = overview.investors.map((inv) => sumInDisplay(inv.contributions, display));
  const totalContributed = contributedByInvestor.reduce((s, c) => s + c, 0);

  const rows = overview.investors
    .map((inv, i) => {
      const contributed = contributedByInvestor[i];
      return {
        investorId: inv.investorId,
        nameEn: inv.nameEn,
        nameAr: inv.nameAr,
        contributed,
        netInvested: contributed - sumInDisplay(inv.managementFees, display),
        ownershipPct: totalContributed > 0 ? contributed / totalContributed : inv.storedOwnershipPct,
      };
    })
    .sort((a, b) => b.contributed - a.contributed);

  const ownershipValues = rows.map((r) => r.ownershipPct).filter((p): p is number => p !== null);

  return {
    investedCapital,
    rows,
    totals: {
      contributed: rows.reduce((s, r) => s + r.contributed, 0),
      netInvested: rows.reduce((s, r) => s + r.netInvested, 0),
      ownershipPct: ownershipValues.length > 0 ? ownershipValues.reduce((s, p) => s + p, 0) : null,
    },
  };
}
