import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeInvestorDocumentsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getInvestorDocuments } = await import("../src/lib/investor/documents.ts");
const { UnauthenticatedError } = await import("../src/lib/auth/authorization-errors.ts");

test("unauthenticated caller is rejected", async () => {
  setCurrentUser(null);
  setDbStub(makeInvestorDocumentsDbStub({}));
  await assert.rejects(() => getInvestorDocuments(), UnauthenticatedError);
  setCurrentUser(REAL_USER);
});

test("no investor memberships -> empty list, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeInvestorDocumentsDbStub({ memberships: [] }));
  const docs = await getInvestorDocuments();
  assert.deepEqual(docs, []);
});

test("a granted, published report surfaces as one document with its attachments", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorDocumentsDbStub({
      memberships: [{ userId: REAL_USER.id, investorId: "inv_1" }],
      grants: [
        {
          investorId: "inv_1",
          reportId: "rep_1",
          versionNo: 1,
          reportVersionId: "ver_1",
          publishedAt: new Date("2026-04-01"),
          companySlug: "acme",
          companyNameEn: "Acme",
          companyNameAr: "Acme AR",
          periodLabel: "Q1 2026",
          attachments: [{ id: "att_1", fileName: "deck.pdf" }],
        },
      ],
    })
  );

  const docs = await getInvestorDocuments();
  assert.equal(docs.length, 1);
  assert.equal(docs[0].companySlug, "acme");
  assert.equal(docs[0].attachments.length, 1);
});

test("a revoked grant is excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorDocumentsDbStub({
      memberships: [{ userId: REAL_USER.id, investorId: "inv_1" }],
      grants: [
        {
          investorId: "inv_1",
          revoked: true,
          reportId: "rep_1",
          versionNo: 1,
          reportVersionId: "ver_1",
          publishedAt: new Date("2026-04-01"),
          companySlug: "acme",
          companyNameEn: "Acme",
          companyNameAr: "Acme AR",
          periodLabel: "Q1 2026",
        },
      ],
    })
  );

  const docs = await getInvestorDocuments();
  assert.equal(docs.length, 0);
});

test("two grants on the same report keep only the highest versionNo", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorDocumentsDbStub({
      memberships: [{ userId: REAL_USER.id, investorId: "inv_1" }],
      grants: [
        {
          investorId: "inv_1",
          reportId: "rep_1",
          versionNo: 1,
          reportVersionId: "ver_1",
          publishedAt: new Date("2026-04-01"),
          companySlug: "acme",
          companyNameEn: "Acme",
          companyNameAr: "Acme AR",
          periodLabel: "Q1 2026",
          attachments: [{ id: "att_old", fileName: "old.pdf" }],
        },
        {
          investorId: "inv_1",
          reportId: "rep_1",
          versionNo: 2,
          reportVersionId: "ver_2",
          publishedAt: new Date("2026-04-05"),
          companySlug: "acme",
          companyNameEn: "Acme",
          companyNameAr: "Acme AR",
          periodLabel: "Q1 2026",
          attachments: [{ id: "att_new", fileName: "new.pdf" }],
        },
      ],
    })
  );

  const docs = await getInvestorDocuments();
  assert.equal(docs.length, 1);
  assert.equal(docs[0].attachments[0].fileName, "new.pdf");
});

test("a grant whose company is archived is excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeInvestorDocumentsDbStub({
      memberships: [{ userId: REAL_USER.id, investorId: "inv_1" }],
      grants: [
        {
          investorId: "inv_1",
          companyArchived: true,
          reportId: "rep_1",
          versionNo: 1,
          reportVersionId: "ver_1",
          publishedAt: new Date("2026-04-01"),
          companySlug: "acme",
          companyNameEn: "Acme",
          companyNameAr: "Acme AR",
          periodLabel: "Q1 2026",
        },
      ],
    })
  );

  const docs = await getInvestorDocuments();
  assert.equal(docs.length, 0);
});
