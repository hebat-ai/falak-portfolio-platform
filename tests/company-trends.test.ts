import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeCompanyTrendsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getCompanyPerformanceTrends } = await import("../src/lib/admin/company-trends.ts");
const { computeTrendRow } = await import("../src/lib/admin/company-trend-row.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeCompanyTrendsDbStub({ falakRoles: [], companies: [] }));
  await assert.rejects(() => getCompanyPerformanceTrends(), ForbiddenError);
});

test("a company with two reported periods gets a full point history and QoQ growth", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          currency: "SAR",
          cycles: [
            {
              periodLabel: "Q1 2026",
              periodStart: new Date("2026-01-01"),
              templateId: "t1",
              submissionId: "s1",
              revenueMetricValues: [{ key: "revenue_b2b", value: 100 }],
            },
            {
              periodLabel: "Q2 2026",
              periodStart: new Date("2026-04-01"),
              templateId: "t1",
              submissionId: "s2",
              revenueMetricValues: [{ key: "revenue_b2b", value: 150 }],
            },
          ],
        },
      ],
      metricsBySubmissionId: {
        s1: [
          { key: "fin_burn_rate", value: 20, dataType: "Currency" },
          { key: "fin_runway_months", value: 12, dataType: "Number" },
        ],
        s2: [
          { key: "fin_burn_rate", value: 30, dataType: "Currency" },
          { key: "fin_runway_months", value: 8, dataType: "Number" },
        ],
      },
    })
  );

  const trends = await getCompanyPerformanceTrends();
  assert.equal(trends.length, 1);
  const trend = trends[0];
  assert.deepEqual(
    trend.points.map((p) => [p.periodLabel, p.revenue, p.burn, p.runwayMonths]),
    [
      ["Q1 2026", 100, 20, 12],
      ["Q2 2026", 150, 30, 8],
    ]
  );

  const q2 = computeTrendRow(trend.points, "SAR", "Q2 2026", "SAR");
  assert.equal(q2.revenue, 150);
  assert.equal(q2.revenueGrowth, 0.5);
  assert.equal(q2.burn, 30);
  assert.equal(q2.burnChange, 0.5);
  assert.equal(q2.runwayMonths, 8);

  // Selecting the earlier period shows its own figures, with no prior period to compare.
  const q1 = computeTrendRow(trend.points, "SAR", "Q1 2026", "SAR");
  assert.equal(q1.revenue, 100);
  assert.equal(q1.revenueGrowth, null);

  // Amounts convert to the display currency; growth ratios don't change.
  const q2Usd = computeTrendRow(trend.points, "SAR", "Q2 2026", "USD");
  assert.equal(q2Usd.revenue, 40);
  assert.equal(q2Usd.revenueGrowth, 0.5);

  // A period this company never reported gets an empty row.
  assert.equal(computeTrendRow(trend.points, "SAR", "Q3 2026", "SAR").revenue, null);
});

test("burn and runway are derived from expenses/cash when not reported directly", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          currency: "SAR",
          cycles: [
            {
              periodLabel: "Q1 2026",
              periodStart: new Date("2026-01-01"),
              templateId: "t1",
              submissionId: "s1",
              revenueMetricValues: [{ key: "revenue_b2b", value: 300 }],
            },
            {
              periodLabel: "Q2 2026",
              periodStart: new Date("2026-04-01"),
              templateId: "t1",
              submissionId: "s2",
              revenueMetricValues: [{ key: "revenue_b2b", value: 1000 }],
            },
          ],
        },
      ],
      metricsBySubmissionId: {
        // (900 - 300) / 3 = 200/month; runway = 1000 / 200 = 5.
        s1: [
          { key: "fin_expenses", value: 900, dataType: "Currency" },
          { key: "fin_cash_balance", value: 1000, dataType: "Currency" },
        ],
        // Expenses below revenue: burns nothing, runway undefined.
        s2: [{ key: "fin_expenses", value: 600, dataType: "Currency" }],
      },
    })
  );

  const [trend] = await getCompanyPerformanceTrends();
  assert.equal(trend.points[0].burn, 200);
  assert.equal(trend.points[0].runwayMonths, 5);
  assert.equal(trend.points[1].burn, 0);
  assert.equal(trend.points[1].runwayMonths, null);
});

test("a company with only one reported period gets null growth figures, not a crash", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          currency: "SAR",
          cycles: [
            {
              periodLabel: "Q1 2026",
              periodStart: new Date("2026-01-01"),
              templateId: "t1",
              submissionId: "s1",
              revenueMetricValues: [{ key: "revenue_b2b", value: 100 }],
            },
          ],
        },
      ],
      metricsBySubmissionId: { s1: [] },
    })
  );

  const trends = await getCompanyPerformanceTrends();
  const row = computeTrendRow(trends[0].points, "SAR", "Q1 2026", "SAR");
  assert.equal(row.revenue, 100);
  assert.equal(row.revenueGrowth, null);
  assert.equal(row.burn, null);
});

test("a company with zero submitted cycles still gets a row, with every figure null", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          currency: "SAR",
          cycles: [{ periodLabel: "Q1 2026", periodStart: new Date("2026-01-01"), templateId: "t1", submissionId: null }],
        },
      ],
    })
  );

  const trends = await getCompanyPerformanceTrends();
  assert.equal(trends.length, 1);
  assert.equal(trends[0].points.length, 0);
  assert.equal(computeTrendRow(trends[0].points, "SAR", "Q1 2026", "SAR").revenue, null);
});

test("archived companies are excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          currency: "SAR",
          archivedAt: new Date(),
          cycles: [],
        },
      ],
    })
  );

  const trends = await getCompanyPerformanceTrends();
  assert.equal(trends.length, 0);
});

test("companyIds scopes the result to exactly that set (e.g. one vehicle's companies)", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeCompanyTrendsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "acme", nameEn: "Acme", nameAr: "Acme AR", currency: "SAR", cycles: [] },
        { id: "co_2", slug: "beta", nameEn: "Beta", nameAr: "Beta AR", currency: "SAR", cycles: [] },
      ],
    })
  );

  const trends = await getCompanyPerformanceTrends(["co_1"]);
  assert.equal(trends.length, 1);
  assert.equal(trends[0].companyId, "co_1");
});
