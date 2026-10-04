import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { adminUpdateSubmissionMetricValues } = await import("../src/lib/reporting/metrics.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_ADMIN" }];
const CURRENCY_METRIC_DEF = { id: "metric_1", key: "fin_revenue", labelEn: "Revenue", labelAr: "الإيرادات", dataType: "Currency", required: false, sortOrder: 0 };

function makeStub(options: { falakRoles?: typeof ADMIN_ROLE; submissionStatus?: string | null; submissionFound?: boolean }) {
  let upsertCalls = 0;
  const stub = makeAdminActionDbStub({
    falakRoles: options.falakRoles ?? ADMIN_ROLE,
    models: {
      companySubmission: {
        findFirst: async () =>
          options.submissionFound === false ? null : { id: "sub_1", status: options.submissionStatus ?? "submitted" },
      },
      metricDefinition: { findMany: async () => [CURRENCY_METRIC_DEF] },
      submissionMetricValue: {
        upsert: async ({ create }: { create: Record<string, unknown> }) => {
          upsertCalls += 1;
          return create;
        },
      },
    },
  });
  return { stub, getUpsertCalls: () => upsertCalls };
}

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  const { stub } = makeStub({ falakRoles: [] });
  setDbStub(stub);
  await assert.rejects(
    () => adminUpdateSubmissionMetricValues("sub_1", [{ metricDefinitionId: "metric_1", rawValue: "100", isNa: false }]),
    ForbiddenError
  );
});

test("an unknown submissionId resolves to a generic error, not a throw", async () => {
  setCurrentUser(REAL_USER);
  const { stub } = makeStub({ submissionFound: false });
  setDbStub(stub);
  const result = await adminUpdateSubmissionMetricValues("sub_missing", [
    { metricDefinitionId: "metric_1", rawValue: "100", isNa: false },
  ]);
  assert.equal(result.success, false);
  assert.ok(result.error);
});

test("a draft submission is not yet under review -- locked, not editable by staff", async () => {
  setCurrentUser(REAL_USER);
  const { stub, getUpsertCalls } = makeStub({ submissionStatus: "draft" });
  setDbStub(stub);
  const result = await adminUpdateSubmissionMetricValues("sub_1", [
    { metricDefinitionId: "metric_1", rawValue: "100", isNa: false },
  ]);
  assert.equal(result.success, false);
  assert.equal(getUpsertCalls(), 0);
});

test("an already-approved submission is locked -- corrections must happen before approval", async () => {
  setCurrentUser(REAL_USER);
  const { stub, getUpsertCalls } = makeStub({ submissionStatus: "approved" });
  setDbStub(stub);
  const result = await adminUpdateSubmissionMetricValues("sub_1", [
    { metricDefinitionId: "metric_1", rawValue: "100", isNa: false },
  ]);
  assert.equal(result.success, false);
  assert.equal(getUpsertCalls(), 0);
});

test("a submitted submission is editable by staff and writes an audit event", async () => {
  setCurrentUser(REAL_USER);
  const { stub, getUpsertCalls } = makeStub({ submissionStatus: "submitted" });
  setDbStub(stub);
  const result = await adminUpdateSubmissionMetricValues("sub_1", [
    { metricDefinitionId: "metric_1", rawValue: "100", isNa: false },
  ]);
  assert.equal(result.success, true);
  assert.equal(getUpsertCalls(), 1);

  const events = stub.getAuditEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].action, "submission.values_corrected_by_staff");
  assert.equal(events[0].targetId, "sub_1");
});

test("an under_review submission is editable by staff", async () => {
  setCurrentUser(REAL_USER);
  const { stub, getUpsertCalls } = makeStub({ submissionStatus: "under_review" });
  setDbStub(stub);
  const result = await adminUpdateSubmissionMetricValues("sub_1", [
    { metricDefinitionId: "metric_1", rawValue: "100", isNa: false },
  ]);
  assert.equal(result.success, true);
  assert.equal(getUpsertCalls(), 1);
});
