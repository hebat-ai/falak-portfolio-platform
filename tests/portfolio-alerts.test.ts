import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makePortfolioAlertsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getPortfolioAlerts } = await import("../src/lib/admin/alerts.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makePortfolioAlertsDbStub({ falakRoles: [], companies: [] }));
  await assert.rejects(() => getPortfolioAlerts(), ForbiddenError);
});

test("flags a cycle whose deadline has passed with no submission", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2020-01-01"), submissionId: null, submissionStatus: null },
          ],
        },
      ],
    })
  );

  const alerts = await getPortfolioAlerts();
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, "reporting_overdue");
  assert.equal(alerts[0].severity, "high");
});

test("a submitted cycle past its deadline is not flagged overdue", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2020-01-01"), submissionId: "sub_1", submissionStatus: "approved" },
          ],
        },
      ],
      metricsBySubmissionId: { sub_1: [] },
    })
  );

  const alerts = await getPortfolioAlerts();
  assert.equal(alerts.filter((a) => a.kind === "reporting_overdue").length, 0);
});

test("runway under the critical threshold is high severity; under the low threshold but above critical is medium", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2030-01-01"), submissionId: "sub_1", submissionStatus: "draft" },
          ],
        },
        {
          id: "co_2",
          slug: "beta",
          nameEn: "Beta",
          nameAr: "Beta AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2030-01-01"), submissionId: "sub_2", submissionStatus: "draft" },
          ],
        },
      ],
      metricsBySubmissionId: {
        sub_1: [{ key: "fin_runway_months", value: 2, dataType: "Number" }],
        sub_2: [{ key: "fin_runway_months", value: 5, dataType: "Number" }],
      },
    })
  );

  const alerts = await getPortfolioAlerts();
  const co1 = alerts.find((a) => a.companyId === "co_1" && a.kind === "low_runway");
  const co2 = alerts.find((a) => a.companyId === "co_2" && a.kind === "low_runway");
  assert.equal(co1?.severity, "high");
  assert.equal(co2?.severity, "medium");
});

test("runway at or above the low threshold is not flagged", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2030-01-01"), submissionId: "sub_1", submissionStatus: "draft" },
          ],
        },
      ],
      metricsBySubmissionId: { sub_1: [{ key: "fin_runway_months", value: 12, dataType: "Number" }] },
    })
  );

  const alerts = await getPortfolioAlerts();
  assert.equal(alerts.filter((a) => a.kind === "low_runway").length, 0);
});

test("overdue payables/receivables flagged only when Yes and not N/A", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2030-01-01"), submissionId: "sub_1", submissionStatus: "draft" },
          ],
        },
      ],
      metricsBySubmissionId: {
        sub_1: [
          { key: "health_overdue_payables", value: "Yes", dataType: "Boolean" },
          { key: "health_overdue_receivables", value: "Yes", dataType: "Boolean", isNa: true },
        ],
      },
    })
  );

  const alerts = await getPortfolioAlerts();
  assert.equal(alerts.some((a) => a.kind === "overdue_payables"), true);
  assert.equal(alerts.some((a) => a.kind === "overdue_receivables"), false, "isNa:true must suppress the alert");
});

test("archived companies are excluded entirely", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makePortfolioAlertsDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        {
          id: "co_1",
          slug: "acme",
          nameEn: "Acme",
          nameAr: "Acme AR",
          archivedAt: new Date(),
          cycles: [
            { templateId: "tpl_1", currentDeadline: new Date("2020-01-01"), submissionId: null, submissionStatus: null },
          ],
        },
      ],
    })
  );

  const alerts = await getPortfolioAlerts();
  assert.equal(alerts.length, 0);
});
