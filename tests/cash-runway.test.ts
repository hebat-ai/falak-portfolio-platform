import { test } from "node:test";
import assert from "node:assert/strict";
import { cashAndRunway } from "../src/lib/reporting/cash-runway.ts";
import type { SubmissionMetricFieldDTO } from "../src/lib/reporting/dto.ts";

function metric(key: string, value: string | null, isNa = false): SubmissionMetricFieldDTO {
  return { metricDefinitionId: key, key, labelEn: key, labelAr: key, dataType: "Currency", required: false, sortOrder: 0, value, isNa };
}

test("cash and runway: the reported runway wins", () => {
  assert.deepEqual(cashAndRunway([metric("fin_cash_balance", "900000"), metric("fin_runway_months", "14")], 100_000), {
    cash: 900_000,
    runway: 14,
  });
});

test("cash and runway: runway falls back to cash / reported burn", () => {
  assert.deepEqual(cashAndRunway([metric("fin_cash_balance", "900000"), metric("fin_burn_rate", "50000")], null), {
    cash: 900_000,
    runway: 18,
  });
});

test("cash and runway: burn worked out from quarter expenses and revenue; older template keys", () => {
  // (expenses 450K - revenue 150K) / 3 months = 100K a month; 600K / 100K = 6 months.
  assert.deepEqual(cashAndRunway([metric("cash_balance_current", "600000"), metric("expenses_total", "450000")], 150_000), {
    cash: 600_000,
    runway: 6,
  });
});

test("cash and runway: nothing reported gives nulls, and N/A counts as not reported", () => {
  assert.deepEqual(cashAndRunway([], 100_000), { cash: null, runway: null });
  assert.deepEqual(cashAndRunway([metric("fin_cash_balance", null, true)], null), { cash: null, runway: null });
});
