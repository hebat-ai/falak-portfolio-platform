import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAuthorizationDbStub, makeAdminActionDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/app/admin/actions.ts -- and
// (transitively, unmodified) src/lib/auth/authorization.ts,
// authorization-errors.ts, invite-token.ts, action-error.ts -- via
// tests/support/mock-loader.mjs. next/navigation resolves to that same
// loader's MockRedirectError-throwing stub (see mock-loader.mjs), since
// the real package isn't resolvable outside Next's own bundler.
const actions = await import("../src/app/admin/actions.ts");
const { hashInviteToken } = await import("../src/lib/auth/invite-token.ts");
const { GENERIC_ACCESS_DENIED } = await import("../src/lib/auth/action-error.ts");
// Cast through unknown: MockRedirectError only exists on mock-loader.mjs's
// runtime stub for this specifier, not on the real next/navigation
// package's own type declarations that `tsc` resolves against.
const { MockRedirectError } = (await import("next/navigation")) as unknown as { MockRedirectError: new (url: string) => Error & { url: string } };

const NO_ROLE_STUB = makeAuthorizationDbStub({ falakRoles: [] });
const OPERATIONS_ONLY_STUB = makeAuthorizationDbStub({ falakRoles: [{ role: "FALAK_OPERATIONS" }] });

// Every mutation in this file requires FALAK_ADMIN specifically -- an
// active FALAK_OPERATIONS-only role must NOT satisfy it (unlike
// requireFalakRole("FALAK_OPERATIONS"), which admits FALAK_ADMIN too).
// requireFalakRole() runs as the very first line of every action below,
// before any form field is even read, so an empty FormData is enough to
// exercise the denial path. These 7 actions all have an {error} state
// channel, so an auth failure resolves with GENERIC_ACCESS_DENIED instead
// of throwing -- see src/lib/auth/action-error.ts.
const STATE_ACTIONS: { name: string; invoke: () => Promise<{ error: string | null }> }[] = [
  { name: "createCompanyAction", invoke: () => actions.createCompanyAction({ error: null }, new FormData()) },
  { name: "createVehicleAction", invoke: () => actions.createVehicleAction({ error: null }, new FormData()) },
  { name: "createInvestorAction", invoke: () => actions.createInvestorAction({ error: null }, new FormData()) },
  { name: "linkVehicleToCompanyAction", invoke: () => actions.linkVehicleToCompanyAction({ error: null }, new FormData()) },
  { name: "createReportingTemplateAction", invoke: () => actions.createReportingTemplateAction({ error: null }, new FormData()) },
  { name: "createReportingCycleAction", invoke: () => actions.createReportingCycleAction({ error: null }, new FormData()) },
  { name: "createCompanyInviteAction", invoke: () => actions.createCompanyInviteAction({ error: null }, new FormData()) },
];

for (const { name, invoke } of STATE_ACTIONS) {
  test(`${name} resolves with the generic access-denied message for a caller with no Falak role`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(NO_ROLE_STUB);
    const result = await invoke();
    assert.equal(result.error, GENERIC_ACCESS_DENIED);
  });

  test(`${name} resolves with the generic access-denied message for a FALAK_OPERATIONS-only caller (ADMIN-only gate)`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(OPERATIONS_ONLY_STUB);
    const result = await invoke();
    assert.equal(result.error, GENERIC_ACCESS_DENIED);
  });
}

// The three archive actions have no {error} state channel (plain <form
// action={fn}> with no useActionState) -- a Forbidden caller (authenticated,
// wrong/missing role) resolves silently (nothing to show inline), while an
// Unauthenticated caller (no session at all) redirects to /sign-in, same
// as every protected page already does. See src/app/admin/actions.ts.
const ARCHIVE_ACTIONS: { name: string; invoke: (formData: FormData) => Promise<void>; field: string }[] = [
  { name: "archiveCompanyAction", invoke: actions.archiveCompanyAction, field: "companyId" },
  { name: "archiveVehicleAction", invoke: actions.archiveVehicleAction, field: "vehicleId" },
  { name: "archiveInvestorAction", invoke: actions.archiveInvestorAction, field: "investorId" },
];

for (const { name, invoke, field } of ARCHIVE_ACTIONS) {
  test(`${name} silently resolves (no throw) for a caller with no Falak role`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(NO_ROLE_STUB);
    const formData = new FormData();
    formData.set(field, "irrelevant_id");
    await assert.doesNotReject(() => invoke(formData));
  });

  test(`${name} redirects to /sign-in for an unauthenticated caller`, async () => {
    setCurrentUser(null);
    setDbStub(NO_ROLE_STUB);
    const formData = new FormData();
    formData.set(field, "irrelevant_id");
    await assert.rejects(() => invoke(formData), (err: unknown) => {
      assert.ok(err instanceof MockRedirectError);
      assert.equal((err as InstanceType<typeof MockRedirectError>).url, "/sign-in");
      return true;
    });
  });
}

test("createCompanyInviteAction returns a URL whose token hashes to what's stored, and never the same token twice", async () => {
  setCurrentUser(REAL_USER);

  let storedTokenHash: string | undefined;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
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
      },
    })
  );

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
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        company: { findUnique: async () => ({ id: "co_1", slug: "test-co" }) },
        companyInvite: { create: async () => { createCalled = true; } },
      },
    })
  );

  const formData = new FormData();
  formData.set("companyId", "co_1");
  formData.set("email", "   ");
  const result = await actions.createCompanyInviteAction({ error: null }, formData);

  assert.ok(result.error);
  assert.equal(result.inviteUrl, undefined);
  assert.equal(createCalled, false);
});
