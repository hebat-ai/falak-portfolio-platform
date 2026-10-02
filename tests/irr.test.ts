import { test } from "node:test";
import assert from "node:assert/strict";
import { computeXirr, computeMoic } from "../src/lib/finance/irr.ts";

function closeTo(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) < tolerance;
}

test("computeXirr: simple 1-year, 10% return", () => {
  const rate = computeXirr([
    { date: new Date("2025-01-01"), amount: -1000 },
    { date: new Date("2026-01-01"), amount: 1100 },
  ]);
  assert.ok(rate !== null);
  assert.ok(closeTo(rate, 0.1, 0.005), `expected ~0.10, got ${rate}`);
});

test("computeXirr: 2-year investment doubling is ~41.4% (sqrt(2) - 1)", () => {
  const rate = computeXirr([
    { date: new Date("2024-01-01"), amount: -1000 },
    { date: new Date("2026-01-01"), amount: 2000 },
  ]);
  assert.ok(rate !== null);
  assert.ok(closeTo(rate, Math.sqrt(2) - 1, 0.01), `expected ~0.414, got ${rate}`);
});

test("computeXirr: multiple cash flows (call, then distribution, then exit)", () => {
  const flows = [
    { date: new Date("2023-01-01"), amount: -1000 },
    { date: new Date("2024-01-01"), amount: 100 },
    { date: new Date("2025-01-01"), amount: 1200 },
  ];
  const rate = computeXirr(flows);
  assert.ok(rate !== null);
  // Sanity check via NPV at the solved rate, using the exact same
  // 365-day-year convention computeXirr itself uses internally --
  // using calendar/integer years here would drift from the real
  // solved rate across a leap year.
  const t0 = flows[0].date.getTime();
  const npv = flows.reduce((sum, f) => {
    const years = (f.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365);
    return sum + f.amount / Math.pow(1 + rate, years);
  }, 0);
  assert.ok(Math.abs(npv) < 0.01, `NPV at solved rate should be ~0, got ${npv}`);
});

test("computeXirr: fewer than 2 flows returns null", () => {
  assert.equal(computeXirr([]), null);
  assert.equal(computeXirr([{ date: new Date(), amount: -100 }]), null);
});

test("computeXirr: all-negative flows returns null (no rate solves it)", () => {
  const rate = computeXirr([
    { date: new Date("2025-01-01"), amount: -100 },
    { date: new Date("2025-06-01"), amount: -50 },
  ]);
  assert.equal(rate, null);
});

test("computeXirr: all-positive flows returns null", () => {
  const rate = computeXirr([
    { date: new Date("2025-01-01"), amount: 100 },
    { date: new Date("2025-06-01"), amount: 50 },
  ]);
  assert.equal(rate, null);
});

test("computeMoic: standard case", () => {
  assert.equal(computeMoic(100, 50, 80), 1.3);
});

test("computeMoic: zero contributed returns null, not Infinity", () => {
  assert.equal(computeMoic(0, 50, 80), null);
});

test("computeMoic: pure unrealized (no distributions yet)", () => {
  assert.equal(computeMoic(100, 0, 150), 1.5);
});

test("computeMoic: total loss", () => {
  assert.equal(computeMoic(100, 0, 0), 0);
});
