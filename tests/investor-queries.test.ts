import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeInvestorQueriesDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/lib/investor/queries.ts --
// and (transitively, unmodified) src/lib/auth/authorization.ts,
// authorization-errors.ts -- via tests/support/mock-loader.mjs.
const { getInvestorPortfolioData } = await import("../src/lib/investor/queries.ts");
const { UnauthenticatedError } = await import("../src/lib/auth/authorization-errors.ts");

const MEMBERSHIP = {
  userId: "user_1",
  investorId: "inv_1",
  investorNameEn: "Nawras Capital",
  investorNameAr: "نورس كابيتال",
};

const BASE_GRANT = {
  investorId: "inv_1",
  reportVersionId: "ver_1",
  versionNo: 1,
  publishedAt: new Date("2026-04-15"),
  reportId: "rep_1",
  periodLabel: "Q1 2026",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-03-31"),
  companyId: "co_1",
  companyNameEn: "Tadween SaaS",
  companyNameAr: "تدوين",
  companySlug: "tadween-saas",
  companySectorEn: "SaaS",
  companySectorAr: "برمجيات",
  companyCustomerModel: "B2B",
  companyRevenueModels: ["SaaS"],
  companyCurrency: "SAR",
  companyEntryStage: "Seed",
  companyCurrentStage: "SeriesA",
  submissionId: "sub_1",
  revenue: 100000,
};

test("unauthenticated caller is denied", async () => {
  setCurrentUser(null);
  setDbStub(makeInvestorQueriesDbStub({}));
  await assert.rejects(() => getInvestorPortfolioData(), UnauthenticatedError);
});

test("zero memberships -> all-empty result, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorQueriesDbStub({ memberships: [] }));
  const result = await getInvestorPortfolioData();
  assert.deepEqual(result, { orgs: [], periods: [], companies: [], vehicleExposures: [] });
});

test("a revoked membership grants no org access", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorQueriesDbStub({ memberships: [{ ...MEMBERSHIP, revoked: true }] }));
  const result = await getInvestorPortfolioData();
  assert.equal(result.orgs.length, 0);
});

test("a membership on an archived investor grants no org access", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorQueriesDbStub({ memberships: [{ ...MEMBERSHIP, investorArchived: true }] }));
  const result = await getInvestorPortfolioData();
  assert.equal(result.orgs.length, 0);
});

test("a valid grant surfaces one visible company with the right period and revenue", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [BASE_GRANT],
    })
  );
  const result = await getInvestorPortfolioData();

  assert.equal(result.orgs.length, 1);
  assert.equal(result.orgs[0].id, "inv_1");
  assert.equal(result.periods.length, 1);
  assert.equal(result.periods[0].key, "Q1 2026");
  assert.equal(result.companies.length, 1);
  assert.equal(result.companies[0].id, "co_1");
  assert.equal(result.companies[0].revenue, 100000);
  assert.equal(result.companies[0].periodKey, "Q1 2026");
  assert.equal(result.companies[0].investorOrgId, "inv_1");
});

test("only the highest-versionNo grant per (investor, report) surfaces", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [
        { ...BASE_GRANT, reportVersionId: "ver_1", versionNo: 1, revenue: 50000 },
        { ...BASE_GRANT, reportVersionId: "ver_2", versionNo: 2, revenue: 75000 },
      ],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 1);
  assert.equal(result.companies[0].revenue, 75000);
});

test("a revoked grant is excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [{ ...BASE_GRANT, revoked: true }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 0);
  assert.equal(result.periods.length, 0);
});

test("an archived company's grant is excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [{ ...BASE_GRANT, companyArchived: true }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 0);
});

test("a non-COMPANY-scope grant never leaks into companies", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [{ ...BASE_GRANT, scope: "INVESTOR_PORTFOLIO" }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 0);
});

test("isNa true means no revenue value, not zero or excluded-as-missing", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [{ ...BASE_GRANT, revenue: 0, isNa: true }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 1);
  assert.equal(result.companies[0].revenue, null);
});

test("no metric value at all -> revenue is null, company still visible", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [{ ...BASE_GRANT, revenue: null }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.companies.length, 1);
  assert.equal(result.companies[0].revenue, null);
});

test("vehicle exposure: Active surfaces, Exited is excluded, direct investor position contributes to companies but no vehicle card", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [BASE_GRANT],
      investorVehiclePositions: [
        { investorId: "inv_1", vehicleId: "veh_1", status: "Active" },
        { investorId: "inv_1", vehicleId: "veh_2", status: "Exited" },
      ],
      vehicles: [
        { id: "veh_1", slug: "fund-one", nameEn: "Fund One", nameAr: "الصندوق الأول", type: "Fund", currency: "SAR" },
        { id: "veh_2", slug: "fund-two", nameEn: "Fund Two", nameAr: "الصندوق الثاني", type: "Fund", currency: "SAR" },
      ],
      ownershipLinks: [{ vehicleId: "veh_1", companyId: "co_1" }],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.vehicleExposures.length, 1);
  assert.equal(result.vehicleExposures[0].id, "veh_1");
  assert.deepEqual(result.vehicleExposures[0].linkedCompanyIds, ["co_1"]);
  // The company itself is still visible via its own direct grant, independent of vehicle exposure.
  assert.equal(result.companies.length, 1);
});

test("two Active positions on the same vehicle (different effectiveFrom) dedupe to one exposure entry", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [],
      investorVehiclePositions: [
        { investorId: "inv_1", vehicleId: "veh_1", status: "Active" },
        { investorId: "inv_1", vehicleId: "veh_1", status: "Active" },
      ],
      vehicles: [{ id: "veh_1", slug: "fund-one", nameEn: "Fund One", nameAr: "الصندوق الأول", type: "Fund", currency: "SAR" }],
      ownershipLinks: [],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.vehicleExposures.length, 1);
});

test("an archived vehicle is excluded from exposure cards", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorQueriesDbStub({
      memberships: [MEMBERSHIP],
      reportAccessGrants: [],
      investorVehiclePositions: [{ investorId: "inv_1", vehicleId: "veh_1", status: "Active" }],
      vehicles: [
        { id: "veh_1", slug: "fund-one", nameEn: "Fund One", nameAr: "الصندوق الأول", type: "Fund", currency: "SAR", archivedAt: new Date() },
      ],
      ownershipLinks: [],
    })
  );
  const result = await getInvestorPortfolioData();
  assert.equal(result.vehicleExposures.length, 0);
});
