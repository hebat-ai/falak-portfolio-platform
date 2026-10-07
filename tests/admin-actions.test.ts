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
  { name: "createInvestorInviteAction", invoke: () => actions.createInvestorInviteAction({ error: null }, new FormData()) },
  { name: "createCompanyValuationAction", invoke: () => actions.createCompanyValuationAction({ error: null }, new FormData()) },
  { name: "createVehicleNavAction", invoke: () => actions.createVehicleNavAction({ error: null }, new FormData()) },
  { name: "setCompanyDepartmentAction", invoke: () => actions.setCompanyDepartmentAction({ error: null }, new FormData()) },
  { name: "setVehicleVintageYearAction", invoke: () => actions.setVehicleVintageYearAction({ error: null }, new FormData()) },
  { name: "linkInvestorToVehicleAction", invoke: () => actions.linkInvestorToVehicleAction({ error: null }, new FormData()) },
];

for (const { name, invoke } of STATE_ACTIONS) {
  test(`${name} resolves with the generic access-denied message for a caller with no Falak role`, async () => {
    setCurrentUser(REAL_USER);
    setDbStub(NO_ROLE_STUB);
    const result = await invoke();
    assert.equal(result.error, GENERIC_ACCESS_DENIED);
  });

  // Reporting templates are shared across departments, so they stay
  // Admin-only; every other action here is open to department-scoped
  // staff (see the department tests below).
  if (name === "createReportingTemplateAction") {
    test(`${name} resolves with the generic access-denied message for a FALAK_OPERATIONS-only caller (ADMIN-only gate)`, async () => {
      setCurrentUser(REAL_USER);
      setDbStub(OPERATIONS_ONLY_STUB);
      const result = await invoke();
      assert.equal(result.error, GENERIC_ACCESS_DENIED);
    });
  }
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

test("createInvestorInviteAction returns an /accept-investor-invite link whose token hashes to what's stored, and audits it", async () => {
  setCurrentUser(REAL_USER);
  let stored: { investorId: string; email: string; tokenHash: string } | undefined;
  const db = makeAdminActionDbStub({
    falakRoles: [{ role: "FALAK_ADMIN" }],
    models: {
      investor: { findUnique: async () => ({ id: "inv_1", archivedAt: null }) },
      investorMembership: { findFirst: async () => null },
      investorInvite: {
        findFirst: async () => null,
        create: async ({ data }: { data: { investorId: string; email: string; tokenHash: string } }) => {
          stored = data;
          return { id: "iinv_1", ...data };
        },
      },
    },
  });
  setDbStub(db);

  const formData = new FormData();
  formData.set("investorId", "inv_1");
  formData.set("email", "  LP@Example.com ");
  const result = await actions.createInvestorInviteAction({ error: null }, formData);

  assert.equal(result.error, null);
  assert.ok(result.inviteUrl?.startsWith("/accept-investor-invite?token="));
  const rawToken = new URL(result.inviteUrl!, "http://localhost").searchParams.get("token")!;
  assert.equal(hashInviteToken(rawToken), stored!.tokenHash);
  assert.equal(stored!.email, "lp@example.com");
  assert.equal(stored!.investorId, "inv_1");

  const events = db.getAuditEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].action, "investor_invite.created");
  assert.equal(events[0].targetType, "InvestorInvite");
  assert.equal(events[0].targetId, "iinv_1");
});

test("createInvestorInviteAction refuses an archived investor without creating an invite", async () => {
  setCurrentUser(REAL_USER);
  let createCalled = false;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        investor: { findUnique: async () => ({ id: "inv_1", archivedAt: new Date() }) },
        investorInvite: { create: async () => { createCalled = true; } },
      },
    })
  );

  const formData = new FormData();
  formData.set("investorId", "inv_1");
  formData.set("email", "lp@example.com");
  const result = await actions.createInvestorInviteAction({ error: null }, formData);

  assert.ok(result.error);
  assert.equal(result.inviteUrl, undefined);
  assert.equal(createCalled, false);
});

test("createInvestorInviteAction refuses a second invite while the investor already has an active member", async () => {
  setCurrentUser(REAL_USER);
  let createCalled = false;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        investor: { findUnique: async () => ({ id: "inv_1", archivedAt: null }) },
        investorMembership: { findFirst: async () => ({ id: "mem_1" }) },
        investorInvite: {
          findFirst: async () => null,
          create: async () => {
            createCalled = true;
          },
        },
      },
    })
  );

  const formData = new FormData();
  formData.set("investorId", "inv_1");
  formData.set("email", "second@example.com");
  const result = await actions.createInvestorInviteAction({ error: null }, formData);

  assert.ok(result.error);
  assert.equal(result.inviteUrl, undefined);
  assert.equal(createCalled, false);
});

test("createInvestorInviteAction refuses a second invite while an earlier one is still pending", async () => {
  setCurrentUser(REAL_USER);
  let createCalled = false;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        investor: { findUnique: async () => ({ id: "inv_1", archivedAt: null }) },
        investorMembership: { findFirst: async () => null },
        investorInvite: {
          findFirst: async () => ({ id: "iinv_pending" }),
          create: async () => {
            createCalled = true;
          },
        },
      },
    })
  );

  const formData = new FormData();
  formData.set("investorId", "inv_1");
  formData.set("email", "second@example.com");
  const result = await actions.createInvestorInviteAction({ error: null }, formData);

  assert.ok(result.error);
  assert.equal(createCalled, false);
});

// ============================================================
// createCompanyValuationAction / createVehicleNavAction
// ============================================================

function valuationFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    companyId: "co_1",
    asOfDate: "2026-09-30",
    valuationAmount: "1000000",
    currency: "SAR",
    valuationType: "InternalMark",
  };
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) fd.set(k, v);
  return fd;
}

function navFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    vehicleId: "veh_1",
    asOfDate: "2026-09-30",
    navAmount: "5000000",
    currency: "SAR",
  };
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) fd.set(k, v);
  return fd;
}

test("createCompanyValuationAction: success writes the row and one audit event", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  const db = makeAdminActionDbStub({
    falakRoles: [{ role: "FALAK_ADMIN" }],
    models: {
      companyValuationSnapshot: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: "cv_1", ...data };
          created.push(row);
          return row;
        },
      },
    },
  });
  setDbStub(db);

  const result = await actions.createCompanyValuationAction({ error: null }, valuationFormData());

  assert.deepEqual(result, { error: null, success: true });
  assert.equal(created.length, 1);
  assert.equal(created[0].companyId, "co_1");
  assert.equal(created[0].valuationAmount, "1000000");
  assert.equal(created[0].currency, "SAR");
  assert.equal(created[0].valuationType, "InternalMark");
  assert.equal(created[0].createdById, REAL_USER.id);
  const events = db.getAuditEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].action, "company_valuation.recorded");
  assert.equal(events[0].targetType, "CompanyValuationSnapshot");
});

test("createCompanyValuationAction: a unique-constraint collision (same company/date/type) gets a friendly error, not a raw throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        companyValuationSnapshot: {
          create: async () => {
            throw new Error("Unique constraint failed on the fields: (`companyId`,`asOfDate`,`valuationType`)");
          },
        },
      },
    })
  );

  const result = await actions.createCompanyValuationAction({ error: null }, valuationFormData());
  assert.match(result.error ?? "", /already exists/);
});

test("createCompanyValuationAction: invalid amount/currency/type is rejected before any write", async () => {
  setCurrentUser(REAL_USER);
  let createCalled = false;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: { companyValuationSnapshot: { create: async () => { createCalled = true; } } },
    })
  );

  for (const overrides of [{ valuationAmount: "not-a-number" }, { currency: "EUR" }, { valuationType: "Bogus" }]) {
    const result = await actions.createCompanyValuationAction({ error: null }, valuationFormData(overrides));
    assert.ok(result.error);
  }
  assert.equal(createCalled, false);
});

test("createCompanyValuationAction: a thousands-separator-formatted amount (e.g. 5,000,000) is accepted, commas stripped before storing", async () => {
  setCurrentUser(REAL_USER);
  let stored: Record<string, unknown> | undefined;
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        companyValuationSnapshot: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            stored = data;
            return { id: "val_1", ...data };
          },
        },
      },
    })
  );

  const result = await actions.createCompanyValuationAction({ error: null }, valuationFormData({ valuationAmount: "5,000,000" }));
  assert.equal(result.error, null);
  assert.equal(stored?.valuationAmount, "5000000");
});

test("createVehicleNavAction: success writes the row and one audit event", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  const db = makeAdminActionDbStub({
    falakRoles: [{ role: "FALAK_ADMIN" }],
    models: {
      vehicleNavSnapshot: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: "nav_1", ...data };
          created.push(row);
          return row;
        },
      },
    },
  });
  setDbStub(db);

  const result = await actions.createVehicleNavAction({ error: null }, navFormData());

  assert.deepEqual(result, { error: null, success: true });
  assert.equal(created.length, 1);
  assert.equal(created[0].vehicleId, "veh_1");
  assert.equal(created[0].navAmount, "5000000");
  const events = db.getAuditEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].action, "vehicle_nav.recorded");
  assert.equal(events[0].targetType, "VehicleNavSnapshot");
});

test("createVehicleNavAction: a unique-constraint collision (same vehicle/date) gets a friendly error, not a raw throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      models: {
        vehicleNavSnapshot: {
          create: async () => {
            throw new Error("Unique constraint failed on the fields: (`vehicleId`,`asOfDate`)");
          },
        },
      },
    })
  );

  const result = await actions.createVehicleNavAction({ error: null }, navFormData());
  assert.match(result.error ?? "", /already exists/);
});

// ============================================================
// Department scoping for Investment Professionals / Management
// (the stub user's department defaults to InvestmentDepartment)
// ============================================================

const OPS = [{ role: "FALAK_OPERATIONS" }];

function companyForm(department: string) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({
    slug: "acme",
    nameEn: "Acme",
    nameAr: "أكمي",
    sectorEn: "Fintech",
    sectorAr: "تقنية مالية",
    customerModel: "B2B",
    currency: "SAR",
    entryStage: "Seed",
    currentStage: "Seed",
    department,
  })) {
    fd.set(k, v);
  }
  return fd;
}

function companyCreateStub(created: Record<string, unknown>[]) {
  return makeAdminActionDbStub({
    falakRoles: OPS,
    models: {
      company: {
        findUnique: async () => null,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          created.push(data);
          return { id: "co_new", ...data };
        },
      },
    },
  });
}

test("department scope: an Investment Professional can create a company in their own department", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  setDbStub(companyCreateStub(created));
  const result = await actions.createCompanyAction({ error: null }, companyForm("InvestmentDepartment"));
  assert.equal(result.error, null);
  assert.equal(created[0].department, "InvestmentDepartment");
});

test("department scope: ...but not in another department", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  setDbStub(companyCreateStub(created));
  const result = await actions.createCompanyAction({ error: null }, companyForm("VentureBuilder"));
  assert.match(result.error ?? "", /own department/);
  assert.equal(created.length, 0);
});

test("department scope: archiving another department's company does nothing", async () => {
  setCurrentUser(REAL_USER);
  const updates: unknown[] = [];
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        company: {
          findUnique: async () => ({ department: "VentureBuilder" }),
          update: async (args: unknown) => {
            updates.push(args);
            return {};
          },
        },
      },
    })
  );
  const fd = new FormData();
  fd.set("companyId", "co_vb");
  await actions.archiveCompanyAction(fd);
  assert.equal(updates.length, 0);
});

test("department scope: a new vehicle from an Investment Professional is placed in their department", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        vehicle: {
          findUnique: async () => null,
          create: async ({ data }: { data: Record<string, unknown> }) => {
            created.push(data);
            return { id: "veh_new", ...data };
          },
        },
      },
    })
  );
  const fd = new FormData();
  for (const [k, v] of Object.entries({ slug: "fund-x", nameEn: "Fund X", nameAr: "صندوق", type: "Fund", currency: "SAR" })) fd.set(k, v);
  const result = await actions.createVehicleAction({ error: null }, fd);
  assert.equal(result.error, null);
  assert.equal(created[0].department, "InvestmentDepartment");
});

test("department scope: a staff user with no department assigned cannot create anything", async () => {
  setCurrentUser(REAL_USER);
  const created: Record<string, unknown>[] = [];
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        user: { findUnique: async () => ({ department: null }) },
        investor: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            created.push(data);
            return { id: "inv_new", ...data };
          },
        },
      },
    })
  );
  const fd = new FormData();
  for (const [k, v] of Object.entries({ nameEn: "LP", nameAr: "LP", type: "Institutional" })) fd.set(k, v);
  const result = await actions.createInvestorAction({ error: null }, fd);
  assert.match(result.error ?? "", /own department/);
  assert.equal(created.length, 0);
});
