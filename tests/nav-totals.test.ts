import { test } from "node:test";
import assert from "node:assert/strict";
import { computeNavTotalsByCurrency } from "../src/lib/admin/valuation-totals.ts";
import type { AdminVehicleValuationDTO } from "../src/lib/admin/dto.ts";

function vehicle(id: string, amount: number | null, currency: "SAR" | "USD" = "SAR"): AdminVehicleValuationDTO {
  return {
    id,
    nameEn: id,
    nameAr: id,
    latest: amount === null ? null : { asOfDate: "2026-01-01", amount, currency },
  };
}

test("sums every vehicle's latest NAV, grouped by currency", () => {
  const totals = computeNavTotalsByCurrency([vehicle("v1", 1000, "SAR"), vehicle("v2", 2000, "SAR"), vehicle("v3", 500, "USD")]);
  const sar = totals.find((t) => t.currency === "SAR");
  const usd = totals.find((t) => t.currency === "USD");
  assert.equal(sar?.total, 3000);
  assert.equal(usd?.total, 500);
});

test("a vehicle with no NAV mark is excluded, not coerced to 0", () => {
  const totals = computeNavTotalsByCurrency([vehicle("v1", 1000, "SAR"), vehicle("v2", null)]);
  const sar = totals.find((t) => t.currency === "SAR");
  assert.equal(sar?.total, 1000);
  assert.equal(sar?.excludedCount, 1);
});

test("vehicleId filters the total to a single vehicle", () => {
  const totals = computeNavTotalsByCurrency([vehicle("v1", 1000, "SAR"), vehicle("v2", 2000, "SAR")], "v1");
  const sar = totals.find((t) => t.currency === "SAR");
  assert.equal(sar?.total, 1000);
});

test("no vehicles at all -> empty array, not an error", () => {
  assert.deepEqual(computeNavTotalsByCurrency([]), []);
});

test("every vehicle missing a NAV mark -> empty array (no currency has any data)", () => {
  assert.deepEqual(computeNavTotalsByCurrency([vehicle("v1", null), vehicle("v2", null)]), []);
});
