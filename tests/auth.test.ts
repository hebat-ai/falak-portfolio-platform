import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAuthorizationDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/lib/auth/authorization.ts and
// authorization-errors.ts -- via tests/support/mock-loader.mjs, which
// intercepts only "server-only", "@/lib/db", and
// "@/lib/auth/current-user". Every other import (including this module
// itself) resolves to the real file on disk.
const { requireCurrentUser, requireFalakRole, requireCompanyMembership, requireInvestorMembership } = await import(
  "../src/lib/auth/authorization.ts"
);
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

test("requireCurrentUser throws UnauthenticatedError when there is no session", async () => {
  setCurrentUser(null);
  setDbStub(makeAuthorizationDbStub({}));
  await assert.rejects(() => requireCurrentUser(), UnauthenticatedError);
});

test("requireFalakRole: no matching role at all is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [] }));
  await assert.rejects(() => requireFalakRole("FALAK_ADMIN"), ForbiddenError);
});

test("requireFalakRole: a revoked role is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN", revoked: true }] }));
  await assert.rejects(() => requireFalakRole("FALAK_ADMIN"), ForbiddenError);
});

test("requireFalakRole: Admin only, Operations requirement -> returns FALAK_ADMIN", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN" }] }));
  const result = await requireFalakRole("FALAK_OPERATIONS");
  assert.equal(result.role, "FALAK_ADMIN");
});

test("requireFalakRole: Operations only, Operations requirement -> returns FALAK_OPERATIONS", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_OPERATIONS" }] }));
  const result = await requireFalakRole("FALAK_OPERATIONS");
  assert.equal(result.role, "FALAK_OPERATIONS");
});

test("requireFalakRole: both Admin and Operations active, Operations requirement -> deterministically FALAK_ADMIN, independent of row order", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN" }, { role: "FALAK_OPERATIONS" }] }));
  const first = await requireFalakRole("FALAK_OPERATIONS");
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_OPERATIONS" }, { role: "FALAK_ADMIN" }] }));
  const second = await requireFalakRole("FALAK_OPERATIONS");
  assert.equal(first.role, "FALAK_ADMIN");
  assert.equal(second.role, "FALAK_ADMIN");
});

test("requireFalakRole: revoked Admin + active Operations -> returns FALAK_OPERATIONS", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN", revoked: true }, { role: "FALAK_OPERATIONS" }] }));
  const result = await requireFalakRole("FALAK_OPERATIONS");
  assert.equal(result.role, "FALAK_OPERATIONS");
});

test("requireFalakRole: active Admin + revoked Operations -> returns FALAK_ADMIN", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN" }, { role: "FALAK_OPERATIONS", revoked: true }] }));
  const result = await requireFalakRole("FALAK_OPERATIONS");
  assert.equal(result.role, "FALAK_ADMIN");
});

test("requireFalakRole: Operations only, Admin requirement -> denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_OPERATIONS" }] }));
  await assert.rejects(() => requireFalakRole("FALAK_ADMIN"), ForbiddenError);
});

test("requireCompanyMembership: revoked membership is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "MEMBER", revoked: true } }));
  await assert.rejects(() => requireCompanyMembership("co_1", "MEMBER"), ForbiddenError);
});

test("requireCompanyMembership: archived company denies access even for ADMIN", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "ADMIN", archived: true } }));
  await assert.rejects(() => requireCompanyMembership("co_1", "MEMBER"), ForbiddenError);
});

test("requireCompanyMembership: MEMBER satisfies a MEMBER requirement", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "MEMBER" } }));
  const result = await requireCompanyMembership("co_1", "MEMBER");
  assert.equal(result.role, "MEMBER");
});

test("requireCompanyMembership: ADMIN satisfies a MEMBER requirement (superset)", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "ADMIN" } }));
  const result = await requireCompanyMembership("co_1", "MEMBER");
  assert.equal(result.role, "ADMIN");
});

test("requireCompanyMembership: MEMBER does not satisfy an ADMIN requirement", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "MEMBER" } }));
  await assert.rejects(() => requireCompanyMembership("co_1", "ADMIN"), ForbiddenError);
});

test("requireCompanyMembership: cross-company isolation -- membership on co_1 does not grant access to co_2", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_1", companyId: "co_1", role: "ADMIN" } }));
  await assert.rejects(() => requireCompanyMembership("co_2", "MEMBER"), ForbiddenError);
});

test("requireCompanyMembership: a membership belonging to a different user does not grant access", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ companyMembership: { userId: "user_2", companyId: "co_1", role: "ADMIN" } }));
  await assert.rejects(() => requireCompanyMembership("co_1", "MEMBER"), ForbiddenError);
});

test("requireInvestorMembership: archived investor denies access even for ADMIN", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuthorizationDbStub({ investorMembership: { userId: "user_1", investorId: "inv_1", role: "ADMIN", archived: true } }));
  await assert.rejects(() => requireInvestorMembership("inv_1", "MEMBER"), ForbiddenError);
});

test("unexpected database errors are rethrown unchanged, never converted to a denial", async () => {
  setCurrentUser(REAL_USER);
  const dbError = new Error("connection reset");
  setDbStub(makeAuthorizationDbStub({ throwError: dbError }));
  await assert.rejects(() => requireCompanyMembership("co_1", "MEMBER"), (err: unknown) => err === dbError);
  await assert.rejects(() => requireInvestorMembership("inv_1", "MEMBER"), (err: unknown) => err === dbError);
  await assert.rejects(() => requireFalakRole("FALAK_ADMIN"), (err: unknown) => err === dbError);
});
