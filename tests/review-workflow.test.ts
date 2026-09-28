import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeReviewWorkflowDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/lib/reporting/review-workflow.ts
// -- and (transitively, unmodified) src/lib/auth/authorization.ts,
// authorization-errors.ts, src/lib/reporting/submission-errors.ts -- via
// tests/support/mock-loader.mjs.
const { startReview, requestChanges, approveSubmission } = await import("../src/lib/reporting/review-workflow.ts");
const { InvalidTransitionError } = await import("../src/lib/reporting/submission-errors.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const NO_ROLE: { role: string; revoked?: boolean }[] = [];
const OPERATIONS_ROLE = [{ role: "FALAK_OPERATIONS" }];
const ADMIN_ROLE = [{ role: "FALAK_ADMIN" }];

// ============================================================
// Authorization denial (each action requires FALAK_OPERATIONS)
// ============================================================

test("startReview denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReviewWorkflowDbStub({ falakRoles: NO_ROLE, submission: { id: "sub_1", status: "submitted" } }));
  await assert.rejects(() => startReview("sub_1"), ForbiddenError);
});

test("requestChanges denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReviewWorkflowDbStub({ falakRoles: NO_ROLE, submission: { id: "sub_1", status: "under_review" } }));
  await assert.rejects(() => requestChanges("sub_1", "please fix the numbers"), ForbiddenError);
});

test("approveSubmission denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeReviewWorkflowDbStub({ falakRoles: NO_ROLE, submission: { id: "sub_1", status: "under_review" } }));
  await assert.rejects(() => approveSubmission("sub_1"), ForbiddenError);
});

test("startReview allows FALAK_OPERATIONS", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: "submitted" } });
  setDbStub(db);
  await startReview("sub_1");
  assert.equal(db.getSubmissionStatus(), "under_review");
});

test("startReview allows FALAK_ADMIN (superset)", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: ADMIN_ROLE, submission: { id: "sub_1", status: "submitted" } });
  setDbStub(db);
  await startReview("sub_1");
  assert.equal(db.getSubmissionStatus(), "under_review");
});

// ============================================================
// Transition matrix
// ============================================================

test("startReview: submitted -> under_review succeeds and records one workflow event", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: "submitted" } });
  setDbStub(db);
  await startReview("sub_1");
  assert.equal(db.getSubmissionStatus(), "under_review");
  assert.equal(db.getEventCount(), 1);
  assert.equal(db.getLastEventData()?.fromStatus, "submitted");
  assert.equal(db.getLastEventData()?.toStatus, "under_review");
});

test("startReview: any status other than submitted is rejected", async () => {
  for (const wrongStatus of ["draft", "under_review", "changes_requested", "approved"]) {
    setCurrentUser(REAL_USER);
    const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: wrongStatus } });
    setDbStub(db);
    await assert.rejects(() => startReview("sub_1"), InvalidTransitionError);
    assert.equal(db.getEventCount(), 0);
  }
});

test("requestChanges: under_review -> changes_requested succeeds, records one event, and creates one ReviewComment", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: "under_review" } });
  setDbStub(db);
  await requestChanges("sub_1", "the revenue figure looks wrong");
  assert.equal(db.getSubmissionStatus(), "changes_requested");
  assert.equal(db.getEventCount(), 1);
  const comments = db.getReviewComments();
  assert.equal(comments.length, 1);
  assert.equal(comments[0].targetType, "SUBMISSION");
  assert.equal(comments[0].submissionId, "sub_1");
  assert.equal(comments[0].body, "the revenue figure looks wrong");
  assert.equal(comments[0].status, "Open");
});

test("requestChanges: any status other than under_review is rejected", async () => {
  for (const wrongStatus of ["draft", "submitted", "changes_requested", "approved"]) {
    setCurrentUser(REAL_USER);
    const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: wrongStatus } });
    setDbStub(db);
    await assert.rejects(() => requestChanges("sub_1", "fix it"), InvalidTransitionError);
    assert.equal(db.getReviewComments().length, 0);
  }
});

test("requestChanges: ReviewComment creation failure rolls back the status change (transaction atomicity)", async () => {
  setCurrentUser(REAL_USER);
  const commentError = new Error("unique constraint violation");
  const db = makeReviewWorkflowDbStub({
    falakRoles: OPERATIONS_ROLE,
    submission: { id: "sub_1", status: "under_review" },
    throwOnCommentCreate: commentError,
  });
  setDbStub(db);
  await assert.rejects(() => requestChanges("sub_1", "fix it"), (err: unknown) => err === commentError);
  assert.equal(db.getSubmissionStatus(), "under_review", "status must roll back to its pre-transaction value");
  assert.equal(db.getEventCount(), 0, "the workflow event must roll back too");
});

test("approveSubmission: under_review -> approved succeeds and records one workflow event", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: "under_review" } });
  setDbStub(db);
  await approveSubmission("sub_1");
  assert.equal(db.getSubmissionStatus(), "approved");
  assert.equal(db.getEventCount(), 1);
  assert.equal(db.getLastEventData()?.fromStatus, "under_review");
  assert.equal(db.getLastEventData()?.toStatus, "approved");
});

test("approveSubmission: any status other than under_review is rejected", async () => {
  for (const wrongStatus of ["draft", "submitted", "changes_requested", "approved"]) {
    setCurrentUser(REAL_USER);
    const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: wrongStatus } });
    setDbStub(db);
    await assert.rejects(() => approveSubmission("sub_1"), InvalidTransitionError);
    assert.equal(db.getEventCount(), 0);
  }
});

test("startReview: archived company denies even a submitted row", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({
    falakRoles: OPERATIONS_ROLE,
    submission: { id: "sub_1", status: "submitted", companyArchived: true },
  });
  setDbStub(db);
  await assert.rejects(() => startReview("sub_1"), InvalidTransitionError);
});

test("two competing startReview calls on the same submission -- only the first conditional claim succeeds", async () => {
  setCurrentUser(REAL_USER);
  const db = makeReviewWorkflowDbStub({ falakRoles: OPERATIONS_ROLE, submission: { id: "sub_1", status: "submitted" } });
  setDbStub(db);
  await startReview("sub_1");
  assert.equal(db.getSubmissionStatus(), "under_review");
  await assert.rejects(() => startReview("sub_1"), InvalidTransitionError);
  assert.equal(db.getEventCount(), 1);
});
