import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeTrendDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getPortfolioTrend } = await import("../src/lib/admin/portfolio-trend.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeTrendDbStub({ falakRoles: [], cycles: [] }));
  await assert.rejects(() => getPortfolioTrend(), ForbiddenError);
});

test("sums revenue and burn across companies within the same period", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeTrendDbStub({
      falakRoles: ADMIN_ROLE,
      cycles: [
        {
          periodLabel: "Q2 2026",
          periodStart: new Date("2026-04-01"),
          templateId: "t1",
          submissionId: "s1",
          revenueMetricValues: [{ key: "revenue_b2b", value: 100 }],
        },
        {
          periodLabel: "Q2 2026",
          periodStart: new Date("2026-04-01"),
          templateId: "t1",
          submissionId: "s2",
          revenueMetricValues: [{ key: "revenue_b2b", value: 50 }],
        },
      ],
      metricsBySubmissionId: {
        s1: [{ key: "fin_burn_rate", value: 20, dataType: "Currency" }],
        s2: [{ key: "fin_burn_rate", value: 10, dataType: "Currency" }],
      },
    })
  );

  const trend = await getPortfolioTrend();
  assert.equal(trend.length, 1);
  assert.equal(trend[0].totalRevenue, 150);
  assert.equal(trend[0].totalBurn, 30);
});

test("periods are sorted by periodStart ascending", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeTrendDbStub({
      falakRoles: ADMIN_ROLE,
      cycles: [
        { periodLabel: "Q3 2026", periodStart: new Date("2026-07-01"), templateId: "t1", submissionId: "s1", revenueMetricValues: [] },
        { periodLabel: "Q1 2026", periodStart: new Date("2026-01-01"), templateId: "t1", submissionId: "s2", revenueMetricValues: [] },
      ],
      metricsBySubmissionId: { s1: [], s2: [] },
    })
  );

  const trend = await getPortfolioTrend();
  assert.deepEqual(trend.map((p) => p.periodLabel), ["Q1 2026", "Q3 2026"]);
});

test("a cycle with no submission contributes nothing, not a zero", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeTrendDbStub({
      falakRoles: ADMIN_ROLE,
      cycles: [{ periodLabel: "Q2 2026", periodStart: new Date("2026-04-01"), templateId: "t1", submissionId: null }],
    })
  );

  const trend = await getPortfolioTrend();
  assert.equal(trend.length, 0, "a cycle with no submission never even creates a period entry");
});

test("a period where nobody reported revenue returns null, not 0", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeTrendDbStub({
      falakRoles: ADMIN_ROLE,
      cycles: [
        {
          periodLabel: "Q2 2026",
          periodStart: new Date("2026-04-01"),
          templateId: "t1",
          submissionId: "s1",
          revenueMetricValues: [],
        },
      ],
      metricsBySubmissionId: { s1: [] },
    })
  );

  const trend = await getPortfolioTrend();
  assert.equal(trend[0].totalRevenue, null);
  assert.equal(trend[0].totalBurn, null);
});
