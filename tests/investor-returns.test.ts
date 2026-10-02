import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeInvestorReturnsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getInvestorReturns } = await import("../src/lib/investor/returns.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const MEMBER = { userId: REAL_USER.id, investorId: "inv_1", role: "MEMBER" };

test("denies a caller with no investor membership", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorReturnsDbStub({ membership: null }));
  await assert.rejects(() => getInvestorReturns("inv_1"), ForbiddenError);
});

test("no transactions -> empty list, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorReturnsDbStub({ membership: MEMBER, transactions: [] }));
  const result = await getInvestorReturns("inv_1");
  assert.deepEqual(result, []);
});

test("contributed/distributed are summed correctly, MOIC computed with no current value", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [
        { type: "Contribution", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") },
        { type: "Distribution", amount: 300, currency: "SAR", transactionDate: new Date("2024-01-01") },
      ],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result.length, 1);
  assert.equal(result[0].currency, "SAR");
  assert.equal(result[0].contributed, 1000);
  assert.equal(result[0].distributed, 300);
  assert.equal(result[0].currentValue, 0);
  assert.equal(result[0].moic, 0.3);
});

test("current value is attributed from ownershipPct x latest VehicleNavSnapshot", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [{ type: "Contribution", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") }],
      vehiclePositions: [{ vehicleId: "veh_1", ownershipPct: 0.1, currency: "SAR" }],
      navSnapshots: [{ vehicleId: "veh_1", asOfDate: new Date("2026-01-01"), navAmount: 20000, currency: "SAR" }],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result[0].currentValue, 2000);
  assert.equal(result[0].moic, 2); // (0 distributed + 2000 current) / 1000 contributed
});

test("multiple NAV snapshots: only the latest asOfDate is used", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [{ type: "Contribution", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") }],
      vehiclePositions: [{ vehicleId: "veh_1", ownershipPct: 0.5, currency: "SAR" }],
      navSnapshots: [
        { vehicleId: "veh_1", asOfDate: new Date("2025-01-01"), navAmount: 1000, currency: "SAR" },
        { vehicleId: "veh_1", asOfDate: new Date("2026-01-01"), navAmount: 4000, currency: "SAR" },
      ],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result[0].currentValue, 2000, "must use the 2026 NAV (4000 x 0.5), not the stale 2025 one");
});

test("currencies are never blended -- one summary row per currency", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [
        { type: "Contribution", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") },
        { type: "Contribution", amount: 500, currency: "USD", transactionDate: new Date("2023-02-01") },
      ],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result.length, 2);
  const sar = result.find((r) => r.currency === "SAR")!;
  const usd = result.find((r) => r.currency === "USD")!;
  assert.equal(sar.contributed, 1000);
  assert.equal(usd.contributed, 500);
});

test("management fees are tracked separately from contributed", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [
        { type: "Contribution", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") },
        { type: "ManagementFee", amount: 20, currency: "SAR", transactionDate: new Date("2023-06-01") },
      ],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result[0].contributed, 1000, "management fees must not inflate contributed");
  assert.equal(result[0].managementFees, 20);
});

test("CapitalCall counts the same as Contribution toward contributed", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorReturnsDbStub({
      membership: MEMBER,
      transactions: [{ type: "CapitalCall", amount: 1000, currency: "SAR", transactionDate: new Date("2023-01-01") }],
    })
  );

  const result = await getInvestorReturns("inv_1");
  assert.equal(result[0].contributed, 1000);
});
