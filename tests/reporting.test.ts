import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeReportingDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production modules -- src/lib/reporting/submissions.ts
// and submission-errors.ts, and (transitively, unmodified)
// src/lib/auth/authorization.ts, authorization-errors.ts -- via
// tests/support/mock-loader.mjs.
const { getCurrentSubmissionForCompanyMember, submitCompanySubmission } = await import("../src/lib/reporting/submissions.ts");
const { InvalidTransitionError } = await import("../src/lib/reporting/submission-errors.ts");
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const MEMBER_CO1 = { userId: "user_1", companyId: "co_1", role: "MEMBER" };
const BASE_SUBMISSION = {
  id: "sub_1",
  cycleCompanyId: "co_1",
  templateId: "tmpl_1",
  status: "draft",
  periodLabel: "Q1 2026",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-03-31"),
  currentDeadline: new Date("2026-04-15"),
};
const ONE_REQUIRED_METRIC = [{ id: "metric_1", templateId: "tmpl_1", isActive: true, required: true }];
const VALUE_FOR_METRIC_1 = { submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: false, numericValue: 100, textValue: null };

test("unauthenticated caller is denied", async () => {
  setCurrentUser(null);
  setDbStub(makeReportingDbStub({ membership: null, submission: null }));
  await assert.rejects(() => getCurrentSubmissionForCompanyMember("co_1"), UnauthenticatedError);
  setCurrentUser(REAL_USER);
});

test("revoked membership is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: { ...MEMBER_CO1, revoked: true }, submission: BASE_SUBMISSION, metricDefinitions: ONE_REQUIRED_METRIC }));
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), ForbiddenError);
});

test("archived company is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: { ...MEMBER_CO1, archived: true }, submission: BASE_SUBMISSION, metricDefinitions: ONE_REQUIRED_METRIC }));
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), ForbiddenError);
});

test("wrong-company submission is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: { ...BASE_SUBMISSION, cycleCompanyId: "co_2" }, metricDefinitions: ONE_REQUIRED_METRIC }));
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("zero applicable metric definitions -> denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: BASE_SUBMISSION, metricDefinitions: [] }));
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("missing required metric value -> denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: BASE_SUBMISSION, metricDefinitions: ONE_REQUIRED_METRIC, submissionMetricValues: [] }));
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("textValue: '' (empty string) does not satisfy a required metric", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: BASE_SUBMISSION,
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [{ submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: false, numericValue: null, textValue: "" }],
    })
  );
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("textValue: '   ' (whitespace-only) does not satisfy a required metric", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: BASE_SUBMISSION,
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [{ submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: false, numericValue: null, textValue: "   " }],
    })
  );
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("non-empty textValue satisfies a required metric -> submit succeeds", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: BASE_SUBMISSION,
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [{ submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: false, numericValue: null, textValue: "Grew 12% this quarter" }],
    })
  );
  const result = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(result.status, "submitted");
});

test("numericValue: 0 satisfies a required metric -> submit succeeds", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: BASE_SUBMISSION,
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [{ submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: false, numericValue: 0, textValue: null }],
    })
  );
  const result = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(result.status, "submitted");
});

test("isNa: true satisfies a required metric -> submit succeeds", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: BASE_SUBMISSION,
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [{ submissionId: "sub_1", metricDefinitionId: "metric_1", isNa: true, numericValue: null, textValue: null }],
    })
  );
  const result = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(result.status, "submitted");
});

test("complete required values, draft -> submitted, allowed", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReportingDbStub({ membership: MEMBER_CO1, submission: BASE_SUBMISSION, metricDefinitions: ONE_REQUIRED_METRIC, submissionMetricValues: [VALUE_FOR_METRIC_1] }));
  const result = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(result.status, "submitted");
});

test("complete required values, changes_requested -> submitted, allowed", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeReportingDbStub({
      membership: MEMBER_CO1,
      submission: { ...BASE_SUBMISSION, status: "changes_requested" },
      metricDefinitions: ONE_REQUIRED_METRIC,
      submissionMetricValues: [VALUE_FOR_METRIC_1],
    })
  );
  const result = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(result.status, "submitted");
});

for (const forbiddenStatus of ["submitted", "under_review", "approved"]) {
  test(`forbidden transition: ${forbiddenStatus} -> submitted is rejected`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(
      makeReportingDbStub({
        membership: { ...MEMBER_CO1, role: "ADMIN" },
        submission: { ...BASE_SUBMISSION, status: forbiddenStatus },
        metricDefinitions: ONE_REQUIRED_METRIC,
        submissionMetricValues: [VALUE_FOR_METRIC_1],
      })
    );
    await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
  });
}

test("conditional update count=0 (archived company) -> denied, no event created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({
    membership: MEMBER_CO1,
    submission: { ...BASE_SUBMISSION, companyArchived: true },
    metricDefinitions: ONE_REQUIRED_METRIC,
    submissionMetricValues: [VALUE_FOR_METRIC_1],
  });
  setDbStub(db);
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
  assert.equal(await db.submissionWorkflowEvent.count(), 0);
});

test("conditional update count=0 via a true status race -> denied, event never attempted", async () => {
  setCurrentUser(REAL_USER);
  let readCount = 0;
  const raceState = { status: "draft" };
  const db = {
    companyMembership: { findFirst: async () => ({ role: "MEMBER" }) },
    metricDefinition: { findMany: async () => ONE_REQUIRED_METRIC },
    submissionMetricValue: { findMany: async () => [VALUE_FOR_METRIC_1] },
    companySubmission: {
      findFirst: async () => {
        readCount += 1;
        const observedStatus = raceState.status;
        if (readCount === 1) raceState.status = "submitted"; // concurrent change, simulated
        return {
          id: "sub_1",
          status: observedStatus,
          cycle: { companyId: "co_1", templateId: "tmpl_1", periodLabel: "Q1", periodStart: new Date(), periodEnd: new Date(), currentDeadline: new Date() },
        };
      },
      updateMany: async ({ where }: { where: { status: string } }) => (where.status === raceState.status ? { count: 1 } : { count: 0 }),
    },
    submissionWorkflowEvent: {
      count: async () => 0,
      create: async () => {
        throw new Error("must not be called when the conditional update matched zero rows");
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };
  setDbStub(db);
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
});

test("conditional update count=1 -> exactly one SubmissionWorkflowEvent created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({
    membership: { ...MEMBER_CO1, role: "MEMBER" },
    submission: { ...BASE_SUBMISSION, status: "changes_requested" },
    metricDefinitions: ONE_REQUIRED_METRIC,
    submissionMetricValues: [VALUE_FOR_METRIC_1],
  });
  setDbStub(db);
  await submitCompanySubmission("co_1", "sub_1");
  assert.equal(await db.submissionWorkflowEvent.count(), 1);
});

test("two competing submissions -> only the first conditional claim succeeds", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({ membership: MEMBER_CO1, submission: BASE_SUBMISSION, metricDefinitions: ONE_REQUIRED_METRIC, submissionMetricValues: [VALUE_FOR_METRIC_1] });
  setDbStub(db);
  const first = await submitCompanySubmission("co_1", "sub_1");
  assert.equal(first.status, "submitted");
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), InvalidTransitionError);
  assert.equal(await db.submissionWorkflowEvent.count(), 1);
});

test("SubmissionWorkflowEvent creation failure rolls back the status update (transaction atomicity)", async () => {
  setCurrentUser(REAL_USER);
  const eventError = new Error("unique constraint violation");
  const db = makeReportingDbStub({
    membership: MEMBER_CO1,
    submission: BASE_SUBMISSION,
    metricDefinitions: ONE_REQUIRED_METRIC,
    submissionMetricValues: [VALUE_FOR_METRIC_1],
    throwOnEventCreate: eventError,
  });
  setDbStub(db);
  await assert.rejects(() => submitCompanySubmission("co_1", "sub_1"), (err: unknown) => err === eventError);
  const stillThere = await db.companySubmission.findFirst({ where: { id: "sub_1", cycle: { companyId: "co_1" } } });
  assert.equal(stillThere?.status, "draft", "status update must have been rolled back, not left at 'submitted'");
});

test("SubmissionWorkflowEvent fields: actor, fromStatus, toStatus, submission identity, versionNo, and no application-set timestamp", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReportingDbStub({
    membership: MEMBER_CO1,
    submission: { ...BASE_SUBMISSION, status: "changes_requested" },
    metricDefinitions: ONE_REQUIRED_METRIC,
    submissionMetricValues: [VALUE_FOR_METRIC_1],
    eventCount: 2, // two prior events already recorded for this submission
  });
  setDbStub(db);
  await submitCompanySubmission("co_1", "sub_1");

  const event = db.getLastEventData();
  assert.ok(event, "an event must have been created");
  assert.equal(event.submissionId, "sub_1", "correct submission identity");
  assert.equal(event.actorId, REAL_USER.id, "correct actor -- the authenticated user, never client-supplied");
  assert.equal(event.fromStatus, "changes_requested", "correct from-status -- the exact status observed before the transition, not a hardcoded guess");
  assert.equal(event.toStatus, "submitted", "correct to-status");
  assert.equal(event.versionNo, 3, "correct version identity -- one past the prior event count (2)");
  assert.equal("createdAt" in event, false, "createdAt must be left to the schema's own @default(now()), never set by application code");
});
