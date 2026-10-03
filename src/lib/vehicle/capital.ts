import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import type { Currency } from "@/generated/prisma/client";

export interface VehicleCapitalTotal {
  currency: Currency;
  committed: number;
  called: number;
}

/**
 * Committed vs called capital across every LP position ever recorded
 * against this vehicle -- summed per currency, never blended, same
 * discipline as every other portfolio total in this codebase. Every
 * InvestorVehiclePosition row is included regardless of its current
 * `status` (Active/Exited/WrittenOff): a commitment and the capital
 * actually called against it are historical facts about the fund's
 * capital structure, not something that stops counting just because a
 * position was later marked Exited. A row with a null commitmentAmount/
 * calledAmount (not yet recorded) contributes 0 to that specific sum,
 * never excludes the row from the other one.
 */
export async function getVehicleCapitalSummary(vehicleId: string): Promise<VehicleCapitalTotal[]> {
  await requireFalakRole("FALAK_OPERATIONS");

  const positions = await db.investorVehiclePosition.findMany({
    where: { vehicleId },
    select: { commitmentAmount: true, calledAmount: true, currency: true },
  });

  const totalsByCurrency = new Map<Currency, VehicleCapitalTotal>();
  for (const position of positions) {
    const entry = totalsByCurrency.get(position.currency) ?? { currency: position.currency, committed: 0, called: 0 };
    entry.committed += position.commitmentAmount?.toNumber() ?? 0;
    entry.called += position.calledAmount?.toNumber() ?? 0;
    totalsByCurrency.set(position.currency, entry);
  }

  return [...totalsByCurrency.values()];
}
