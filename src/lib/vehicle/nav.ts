import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import type { Currency } from "@/generated/prisma/client";

export interface VehicleNavPoint {
  asOfDate: string;
  amount: number;
  currency: Currency;
}

export interface VehicleNavSummary {
  latest: VehicleNavPoint | null;
  history: VehicleNavPoint[];
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * This one vehicle's own NAV headline + its full NAV-over-time history
 * -- the fund-level counterpart to CompanyMetricsTrendChart's revenue/
 * burn history, and the one figure the vehicle dashboard was missing
 * (previously only reachable by filtering the portfolio-wide NAV panel
 * down to this vehicle). `latest` is the most recent mark by asOfDate;
 * `history` is every mark, oldest first, for the trend chart. A vehicle
 * with zero marks recorded yet gets `{ latest: null, history: [] }`, not
 * an error -- the UI renders an honest "no NAV recorded yet" state.
 */
export async function getVehicleNavSummary(vehicleId: string): Promise<VehicleNavSummary> {
  await requireFalakRole("FALAK_OPERATIONS");

  const snapshots = await db.vehicleNavSnapshot.findMany({
    where: { vehicleId },
    orderBy: { asOfDate: "asc" },
    select: { asOfDate: true, navAmount: true, currency: true },
  });

  const history: VehicleNavPoint[] = snapshots.map((s) => ({
    asOfDate: toDateOnly(s.asOfDate),
    amount: s.navAmount.toNumber(),
    currency: s.currency,
  }));

  return { latest: history.at(-1) ?? null, history };
}
