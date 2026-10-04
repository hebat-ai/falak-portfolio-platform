import type { Currency } from "@/generated/prisma/client";

// Deliberately NOT server-only, no db import -- a pure function the
// client bundle can import directly, same split as
// src/lib/admin/valuation-totals.ts. Unlike every other portfolio total
// in this codebase, the new portfolio overview dashboard intentionally
// DOES blend currencies: the user asked for a single display-currency
// toggle (USD default, SAR available) backed by one fixed rate, not a
// market rate -- an explicit, deliberate exception to the "never blend
// currencies" rule everywhere else (investor returns, vehicle NAV,
// company valuations), scoped to this one dashboard only.
export type DisplayCurrency = "USD" | "SAR";

export const SAR_PER_USD = 3.75;

export function convertToDisplay(amount: number, from: Currency, display: DisplayCurrency): number {
  if (from === display) return amount;
  if (from === "SAR" && display === "USD") return amount / SAR_PER_USD;
  if (from === "USD" && display === "SAR") return amount * SAR_PER_USD;
  return amount;
}
