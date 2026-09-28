import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAuthorizationDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/app/admin/actions.ts -- and
// (transitively, unmodified) src/lib/auth/authorization.ts,
// authorization-errors.ts, invite-token.ts -- via tests/support/mock-loader.mjs.
const actions = await import("../src/app/admin/actions.ts");
const { hashInviteToken } = await import("../src/lib/auth/invite-token.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const NO_ROLE_STUB = makeAuthorizationDbStub({ falakRoles: [] });
const OPERATIONS_ONLY_STUB = makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_OPERATIONS" }] });
const ADMIN_STUB = makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_ADMIN" }] });

// Every mutation in this file requires FALAK_ADMIN specifically -- an
// active FALAK_OPERATIONS-only role must NOT satisfy it (unlike
// requireFalakRole("FALAK_OPERATIONS"), which admits FALAK_ADMIN too).
// requireFalakRole() runs as the very first line of every action below,
// before any form field is even read, so an empty FormData is enough to
// exercise the denial path.
const GATED_ACTIONS: { name: string; invoke: () => Promise<unknown> }[] = [
  { name: "createCompanyAction", invoke: () => actions.createCompanyAction({ error: null }, new FormData()) },
  { name: "archiveCompanyAction", invoke: () => actions.archiveCompanyAction(new FormData()) },
  { name: "createVehicleAction", invoke: () => actions.createVehicleAction({ error: null }, new FormData()) },
  { name: "archiveVehicleAction", invoke: () => actions.archiveVehicleAction(new FormData()) },
  { name: "createInvestorAction", invoke: () => actions.createInvestorAction({ error: null }, new FormData()) },
  { name: "archiveInvestorAction", invoke: () => actions.archiveInvestorAction(new FormData()) },
  { name: "linkVehicleToCompanyAction", invoke: () => actions.linkVehicleToCompanyAction({ error: null }, new FormData()) },
  { name: "createReportingTemplateAction", invoke: () => actions.createReportingTemplateAction({ error: null }, new FormData()) },
  { name: "createReportingCycleAction", invoke: () => actions.createReportingCycleAction({ error: null }, new FormData()) },
  { name: "createCompanyInviteAction", invoke: () => actions.createCompanyInviteAction({ error: null }, new FormData()) },
];

for (const { name, invoke } of GATED_ACTIONS) {
  test(`${name} denies a caller with no Falak role`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(NO_ROLE_STUB);
    await assert.rejects(invoke, ForbiddenError);
  });

  test(`${name} denies a FALAK_OPERATIONS-only caller (ADMIN-only gate)`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(OPERATIONS_ONLY_STUB);
    await assert.rejects(invoke, ForbiddenError);
  });
}

test("createCompanyInviteAction returns a URL whose token hashes to what's stored, and never the same token twice", async () => {
  setCurrentUser(REAL_USER);

  let storedTokenHash: string | undefined;
  setDbStub({
    ...ADMIN_STUB,
    company: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === "co_1" ? { id: "co_1", slug: "test-co" } : null,
    },
    companyInvite: {
      create: async ({ data }: { data: { tokenHash: string } }) => {
        storedTokenHash = data.tokenHash;
        return { id: "invite_1", ...data };
      },
    },
  });

  const formData1 = new FormData();
  formData1.set("companyId", "co_1");
  formData1.set("email", "founder@example.com");
  const result1 = await actions.createCompanyInviteAction({ error: null }, formData1);

  assert.equal(result1.error, null);
  assert.ok(result1.inviteUrl?.startsWith("/accept-invite?token="));
  const rawToken1 = new URL(result1.inviteUrl!, "http://localhost").searchParams.get("token");
  assert.ok(rawToken1 && rawToken1.length > 0);
  assert.equal(hashInviteToken(rawToken1), storedTokenHash);

  const formData2 = new FormData();
  formData2.set("companyId", "co_1");
  formData2.set("email", "founder@example.com");
  const result2 = await actions.createCompanyInviteAction({ error: null }, formData2);
  const rawToken2 = new URL(result2.inviteUrl!, "http://localhost").searchParams.get("token");

  // Each invite gets its own fresh, unpredictable token -- never the same
  // raw value returned twice, and the raw value from the first call is
  // never retrievable again (only its hash was ever stored).
  assert.notEqual(rawToken1, rawToken2);
});

test("createCompanyInviteAction rejects an invalid email without creating an invite", async () => {
  setCurrentUser(REAL_USER);
  let createCalled = false;
  setDbStub({
    ...ADMIN_STUB,
    company: { findUnique: async () => ({ id: "co_1", slug: "test-co" }) },
    companyInvite: { create: async () => { createCalled = true; } },
  });

  const formData = new FormData();
  formData.set("companyId", "co_1");
  formData.set("email", "   ");
  const result = await actions.createCompanyInviteAction({ error: null }, formData);

  assert.ok(result.error);
  assert.equal(result.inviteUrl, undefined);
  assert.equal(createCalled, false);
});
