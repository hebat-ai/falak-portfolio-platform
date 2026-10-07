import { test } from "node:test";
import assert from "node:assert/strict";

const { computeAnnualRevenue, quarterOf } = await import("../src/lib/reporting/annual-revenue.ts");

const p = (label: string, revenue: number | null, periodStart = "2026-01-01") => ({ label, periodStart, revenue });

test("quarterOf parses 'Q3 2026' and falls back to the start date", () => {
  assert.deepEqual(quarterOf("Q3 2026", "2026-07-01"), { quarter: 3, year: 2026 });
  assert.deepEqual(quarterOf("Half 2", "2025-10-01"), { quarter: 4, year: 2025 });
});

test("mid-year: projects the latest quarter's run rate for the remaining quarters", () => {
  const s = computeAnnualRevenue([p("Q1 2026", 100), p("Q2 2026", 150), p("Q4 2025", 999)], 2026);
  assert.equal(s.isActual, false);
  assert.deepEqual(
    s.quarters.map((q) => [q.label, q.actual, q.projected]),
    [
      ["Q1", 100, null],
      ["Q2", 150, null],
      ["Q3", null, 150],
      ["Q4", null, 150],
    ]
  );
  assert.equal(s.annualRevenue, 550);
});

test("Q4 reported: the annual figure is the actual sum, nothing projected", () => {
  const s = computeAnnualRevenue([p("Q1 2026", 100), p("Q2 2026", 150), p("Q3 2026", 200), p("Q4 2026", 250)], 2026);
  assert.equal(s.isActual, true);
  assert.equal(s.annualRevenue, 700);
  assert.ok(s.quarters.every((q) => q.projected === null));
});

test("no revenue reported for the year: no annual figure", () => {
  const s = computeAnnualRevenue([p("Q1 2026", null)], 2026);
  assert.equal(s.annualRevenue, null);
  assert.ok(s.quarters.every((q) => q.actual === null && q.projected === null));
});
