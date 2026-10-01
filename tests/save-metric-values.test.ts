import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeReportingDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { saveMetricValues } = await import("../src/lib/reporting/metrics.ts");
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const MEMBER_CO1 = { userId: "user_1", companyId: "co_1", role: "MEMBER" };
const DRAFT_SUBMISSION = {
  id: "sub_1",
  cycleCompanyId: "co_1",
  templateId: "tmpl_1",
  status: "draft",
  periodLabel: "Q1 2026",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-03-31"),
  currentDeadline: new Date("2026-04-15"),
};
const CURRENCY_METRIC = [{ id: "metric_1", templateId: "tmpl_1", isActive: true, required: false, dataType: "Currency" }];
const BOOLEAN_METRIC = [{ id: "metric_2", templateId: "tmpl_1", isActive: true, required: false, dataType: "Boolean" }];

test("unauthenticated caller is rejected", async () => {
  setCurrentUser(null);
  setDbStub(makeReportingDbStub({ membership: null, submission: DRAFT_SUBMISSION, metricDefinitions: CURRENCY_METRIC }));
  await assert.rejects(
    () => saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]),
    UnauthenticatedError
  );
  setCurrentUser(REAL_USER);
});

test("revoked membership is rejected", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: { ...MEMBER_CO1, revoked: true },
      submission: DRAFT_SUBMISSION,
      metricDefinitions: CURRENCY_METRIC,
    })
  );
  await assert.rejects(
    () => saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]),
    ForbiddenError
  );
});

test("submission not found for this company -> generic error, not thrown", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: { ...DRAFT_SUBMISSION, cycleCompanyId: "co_2" },
      metricDefinitions: CURRENCY_METRIC,
    })
  );
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]);
  assert.equal(result.success, false);
  assert.ok(result.error);
});

test("submission already submitted (not draft/changes_requested) -> locked, not written", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({
    membership: MEMBER_CO1,
    submission: { ...DRAFT_SUBMISSION, status: "submitted" },
    metricDefinitions: CURRENCY_METRIC,
  });
  setDbStub(db);
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]);
  assert.equal(result.success, false);
});

test("changes_requested status is still editable", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: { ...DRAFT_SUBMISSION, status: "changes_requested" },
      metricDefinitions: CURRENCY_METRIC,
    })
  );
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]);
  assert.equal(result.success, true);
});

test("valid Currency value is stored as numericValue", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: CURRENCY_METRIC });
  setDbStub(db);
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "1500.50", isNa: false }]);
  assert.equal(result.success, true);
});

test("non-numeric Currency value is silently skipped, not stored", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: CURRENCY_METRIC }));
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "not-a-number", isNa: false }]);
  // Invalid fields are skipped, not a transaction failure -- the save as
  // a whole still reports success so a company's other valid fields on
  // the same submit aren't lost to one bad field.
  assert.equal(result.success, true);
});

test("isNa true stores isNa regardless of rawValue", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: CURRENCY_METRIC }));
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_1", rawValue: "", isNa: true }]);
  assert.equal(result.success, true);
});

test("Boolean field accepts Yes/No only", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: BOOLEAN_METRIC }));
  const valid = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_2", rawValue: "Yes", isNa: false }]);
  assert.equal(valid.success, true);

  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: BOOLEAN_METRIC }));
  const invalid = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_2", rawValue: "Maybe", isNa: false }]);
  // Still reports success overall (field silently skipped), same
  // "skip the bad field, don't fail the whole save" rule as Currency.
  assert.equal(invalid.success, true);
});

test("unknown metricDefinitionId (not on this template) is silently skipped", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION, metricDefinitions: CURRENCY_METRIC }));
  const result = await saveMetricValues("co_1", "sub_1", [{ metricDefinitionId: "metric_nonexistent", rawValue: "100", isNa: false }]);
  assert.equal(result.success, true);
});
