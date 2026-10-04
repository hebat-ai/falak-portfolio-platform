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
const { adminUploadSubmissionAttachment } = await import("../src/lib/reporting/attachments.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];
const SUBMISSION = { id: "sub_1", cycleCompanyId: "co_1", status: "submitted" };

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAttachmentUploadDbStub({ falakRoles: [], submission: SUBMISSION }));
  await assert.rejects(
    () => adminUploadSubmissionAttachment("sub_1", makeFile("a.pdf", "data", "application/pdf")),
    ForbiddenError
  );
});

test("a valid PDF upload succeeds and creates one Attachment row", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("deck.pdf", "hello world", "application/pdf"));
  assert.equal(result.success, true);
  assert.equal(db.getCreatedAttachments().length, 1);
  assert.equal(db.getCreatedAttachments()[0].fileName, "deck.pdf");
  assert.equal(db.getCreatedAttachments()[0].kind, "General");
});

test("isAuditedFinancials stores kind: AuditedFinancials", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("audited.pdf", "data", "application/pdf"), true);
  assert.equal(result.success, true);
  assert.equal(db.getCreatedAttachments()[0].kind, "AuditedFinancials");
});

test("upload is allowed regardless of submission status -- draft, approved, or anything else", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: { ...SUBMISSION, status: "approved" } });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("deck.pdf", "data", "application/pdf"));
  assert.equal(result.success, true);
});

test("an unknown submissionId is rejected, no attachment created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: null });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_missing", makeFile("deck.pdf", "data", "application/pdf"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});

test("a disallowed mime type is rejected", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("script.exe", "data", "application/x-msdownload"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});

test("an empty file is rejected", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: SUBMISSION });
  setDbStub(db);
  setUploadAttachmentSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("empty.pdf", "", "application/pdf"));
  assert.equal(result.success, false);
});

test("a storage upload failure is reported as a generic error, no attachment created", async () => {
  setCurrentUser(REAL_USER);
  const db = makeAttachmentUploadDbStub({ falakRoles: ADMIN_ROLE, submission: SUBMISSION });
  setDbStub(db);
  setUploadAttachmentFailureSpy();

  const result = await adminUploadSubmissionAttachment("sub_1", makeFile("deck.pdf", "data", "application/pdf"));
  assert.equal(result.success, false);
  assert.equal(db.getCreatedAttachments().length, 0);
});
