import { test } from "node:test";
import assert from "node:assert/strict";
import {
  setCurrentUser,
  setDbStub,
  makeAttachmentUploadDbStub,
  setUploadAttachmentSpy,
  setUploadAttachmentFailureSpy,
  REAL_USER,
} from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { uploadSubmissionAttachment } = await import("../src/lib/reporting/attachments.ts");
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const MEMBER_CO1 = { userId: "user_1", companyId: "co_1", role: "MEMBER" };
const DRAFT_SUBMISSION = { id: "sub_1", cycleCompanyId: "co_1", status: "draft" };

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

test("unauthenticated caller is rejected", async () => {
  setCurrentUser(null);
  setDbStub(makeAttachmentUploadDbStub({ membership: null, submission: DRAFT_SUBMISSION }));
  await assert.rejects(
    () => uploadSubmissionAttachment("co_1", "sub_1", makeFile("a.pdf", "data", "application/pdf")),
    UnauthenticatedError
  );
  setCurrentUser(REAL_USER);
});

test("revoked membership is rejected", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAttachmentUploadDbStub({ membership: { ...MEMBER_CO1, revoked: true }, submission: DRAFT_SUBMISSION }));
  await assert.rejects(
    () => uploadSubmissionAttachment("co_1", "sub_1", makeFile("a.pdf", "data", "application/pdf")),
    ForbiddenError
  );
});

test("a valid PDF upload succeeds and creates one Attachment row", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await uploadSubmissionAttachment("co_1", "sub_1", makeFile("deck.pdf", "hello world", "application/pdf"));
  assert.equal(result.success, true);
  assert.equal(db.getCreatedAttachments().length, 1);
  assert.equal(db.getCreatedAttachments()[0].fileName, "deck.pdf");
});

test("a submission already submitted (locked) is rejected, no attachment created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ membership: MEMBER_CO1, submission: { ...DRAFT_SUBMISSION, status: "submitted" } });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await uploadSubmissionAttachment("co_1", "sub_1", makeFile("deck.pdf", "data", "application/pdf"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});

test("a disallowed mime type is rejected", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await uploadSubmissionAttachment("co_1", "sub_1", makeFile("script.exe", "data", "application/x-msdownload"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});

test("an empty file is rejected", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await uploadSubmissionAttachment("co_1", "sub_1", makeFile("empty.pdf", "", "application/pdf"));
  assert.equal(result.success, false);
});

test("a storage upload failure is reported as a generic error, no attachment created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ membership: MEMBER_CO1, submission: DRAFT_SUBMISSION });
  setDbStub(db);
  setUploadAttachmentFailureSpy();

  const result = await uploadSubmissionAttachment("co_1", "sub_1", makeFile("deck.pdf", "data", "application/pdf"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});
