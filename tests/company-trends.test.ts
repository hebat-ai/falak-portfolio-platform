import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeCompanyTrendsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getCompanyPerformanceTrends } = await import("../src/lib/admin/company-trends.ts");
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
  assert.equal(trend.points.length, 2);
  assert.equal(trend.latestRevenue, 150);
  assert.equal(trend.previousRevenue, 100);
  assert.equal(trend.revenueGrowth, 0.5);
  assert.equal(trend.latestBurn, 30);
  assert.equal(trend.previousBurn, 20);
  assert.equal(trend.burnChange, 0.5);
  assert.equal(trend.runwayMonths, 8);
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
  assert.equal(trends[0].latestRevenue, 100);
  assert.equal(trends[0].previousRevenue, null);
  assert.equal(trends[0].revenueGrowth, null);
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
  assert.equal(trends[0].latestRevenue, null);
  assert.equal(trends[0].runwayMonths, null);
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
