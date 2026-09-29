import type { Currency } from "@/generated/prisma/client";

// Shared shape for every per-currency revenue KPI (InvestorKpis,
// VehicleKpis); each feature module computes its own entries from its own
// DTOs -- see src/lib/{admin,investor,vehicle}/revenue.ts.
export interface RevenueByCurrencyEntry {
  currency: Currency;
  total: number;
  excludedCount: number;
}
