import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makePortfolioReturnsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getPortfolioReturns } = await import("../src/lib/admin/portfolio-returns.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makePortfolioReturnsDbStub({ falakRoles: [] }));
  await assert.rejects(() => getPortfolioReturns(), ForbiddenError);
});

test("nothing recorded anywhere -> empty list, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makePortfolioReturnsDbStub({ falakRoles: ADMIN_ROLE }));
  const result = await getPortfolioReturns();
  assert.deepEqual(result, []);
});

test("invested capital sums Active and Superseded agreements, per currency", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [
        { investedAmount: 1000, currency: "SAR", status: "Active" },
        { investedAmount: 500, currency: "SAR", status: "Superseded" },
      ],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result.length, 1);
  assert.equal(result[0].currency, "SAR");
  assert.equal(result[0].investedCapital, 1500);
  assert.equal(result[0].currentValue, 0);
  assert.equal(result[0].moic, 0);
});

test("current value is ownership-weighted: ownershipPct x latest company valuation", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [{ investedAmount: 1000, currency: "SAR", status: "Active" }],
      positions: [{ companyId: "co_1", ownershipPct: 0.2 }],
      valuations: [{ companyId: "co_1", valuationAmount: 10000, currency: "SAR" }],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].currentValue, 2000);
  assert.equal(result[0].moic, 2); // (0 distributed + 2000 current) / 1000 invested
});

test("a position with no ownership snapshot yet contributes nothing to current value", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [{ investedAmount: 1000, currency: "SAR", status: "Active" }],
      positions: [{ companyId: "co_1", ownershipPct: null }],
      valuations: [{ companyId: "co_1", valuationAmount: 10000, currency: "SAR" }],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].currentValue, 0);
});

test("a company with no valuation yet contributes nothing to current value", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [{ investedAmount: 1000, currency: "SAR", status: "Active" }],
      positions: [{ companyId: "co_1", ownershipPct: 0.5 }],
      valuations: [],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].currentValue, 0);
});

test("distributions (AgreementCashFlow, type Distribution) are summed into distributed", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [{ investedAmount: 1000, currency: "SAR", status: "Active" }],
      cashFlows: [{ type: "Distribution", amount: 300, currency: "SAR" }],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].distributed, 300);
  assert.equal(result[0].moic, 0.3);
});

test("currencies are never blended -- one summary row per currency", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [
        { investedAmount: 1000, currency: "SAR", status: "Active" },
        { investedAmount: 500, currency: "USD", status: "Active" },
      ],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result.length, 2);
  const sar = result.find((r) => r.currency === "SAR")!;
  const usd = result.find((r) => r.currency === "USD")!;
  assert.equal(sar.investedCapital, 1000);
  assert.equal(usd.investedCapital, 500);
});

test("a Draft or Terminated agreement is excluded from invested capital", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [
        { investedAmount: 1000, currency: "SAR", status: "Active" },
        { investedAmount: 999, currency: "SAR", status: "Draft" },
        { investedAmount: 888, currency: "SAR", status: "Terminated" },
      ],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].investedCapital, 1000, "Draft/Terminated amounts must not be counted");
});

test("an agreement with a null investedAmount is skipped, not treated as 0", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioReturnsDbStub({
      falakRoles: ADMIN_ROLE,
      agreements: [
        { investedAmount: 1000, currency: "SAR", status: "Active" },
        { investedAmount: null, currency: "SAR", status: "Active" },
      ],
    })
  );
  const result = await getPortfolioReturns();
  assert.equal(result[0].investedCapital, 1000);
});
