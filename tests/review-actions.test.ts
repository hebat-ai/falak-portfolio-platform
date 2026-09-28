import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAuthorizationDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/app/review/actions.ts -- via
// tests/support/mock-loader.mjs. This covers the Server Action wrapper
// layer specifically (the {error}-state translation added for the
// session-expiry fix); tests/review-workflow.test.ts and
// tests/publish-workflow.test.ts already cover the underlying
// src/lib/reporting/*.ts functions these wrap, which still throw
// ForbiddenError/UnauthenticatedError directly -- unchanged.
const actions = await import("../src/app/review/actions.ts");
const { GENERIC_ACCESS_DENIED } = await import("../src/lib/auth/action-error.ts");

const NO_ROLE_STUB = makeAuthorizationDbStub({ falakRoles: [] });

// A valid submissionId (and, where required, a non-empty comment) so each
// wrapper actually reaches its library call -- and therefore the
// authorization check -- rather than returning early on its own
// missing-field validation.
function formDataFor(name: string): FormData {
  const formData = new FormData();
  formData.set("submissionId", "sub_1");
  if (name === "requestChangesAction") {
    formData.set("comment", "please fix the numbers");
  }
  return formData;
}

const REVIEW_ACTIONS = [
  { name: "startReviewAction", action: actions.startReviewAction },
  { name: "requestChangesAction", action: actions.requestChangesAction },
  { name: "approveSubmissionAction", action: actions.approveSubmissionAction },
  { name: "publishSubmissionAction", action: actions.publishSubmissionAction },
] as const;

for (const { name, action } of REVIEW_ACTIONS) {
  test(`${name} resolves with the generic access-denied message for a caller with no Falak role, instead of crashing`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(NO_ROLE_STUB);
    const result = await action({ error: null }, formDataFor(name));
    assert.equal(result.error, GENERIC_ACCESS_DENIED);
  });
}
