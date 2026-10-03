import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeViewerNavFlagsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getViewerNavFlags } = await import("../src/lib/auth/viewer-roles.ts");

test("unauthenticated -> every flag false, no throw", async () => {
  setCurrentUser(null);
  setDbStub(makeViewerNavFlagsDbStub({}));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: false, isCompanyMember: false, isInvestorMember: false });
  setCurrentUser(REAL_USER);
});

test("a Falak-staff user gets isFalakStaff true, others false", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeViewerNavFlagsDbStub({ hasFalakRole: true }));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: true, isCompanyMember: false, isInvestorMember: false });
});

test("a company member gets isCompanyMember true, others false", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeViewerNavFlagsDbStub({ hasCompanyMembership: true }));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: false, isCompanyMember: true, isInvestorMember: false });
});

test("an investor member gets isInvestorMember true, others false", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeViewerNavFlagsDbStub({ hasInvestorMembership: true }));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: false, isCompanyMember: false, isInvestorMember: true });
});

test("a user can hold more than one flag at once", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeViewerNavFlagsDbStub({ hasFalakRole: true, hasInvestorMembership: true }));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: true, isCompanyMember: false, isInvestorMember: true });
});

test("an authenticated user with zero memberships gets every flag false", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeViewerNavFlagsDbStub({}));
  const flags = await getViewerNavFlags();
  assert.deepEqual(flags, { isFalakStaff: false, isCompanyMember: false, isInvestorMember: false });
});
