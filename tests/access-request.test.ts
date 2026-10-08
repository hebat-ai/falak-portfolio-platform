import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub, setSendAccessApprovedEmailSpy, REAL_USER } from "./support/stubs.ts";

// Real modules via tests/support/mock-loader.mjs: submitAccessRequest and
// the two admin actions. Only @/lib/db, current-user, email and
// next/navigation are stubbed.
const { submitAccessRequest } = await import("../src/lib/auth/access-request.ts");
const { approveAccessRequestAction, rejectAccessRequestAction } = await import("../src/app/admin/access/actions.ts");

const ADMIN = [{ role: "FALAK_ADMIN" }];

// ============================================================
// submitAccessRequest
// ============================================================

function makeSubmitStub(options: { existingUser?: { id: string; email: string } | null; pending?: boolean }) {
  const created: Record<string, unknown>[] = [];
  const db = {
    user: {
      findUnique: async () => options.existingUser ?? null,
    },
    accessRequest: {
      findFirst: async () => (options.pending ? { id: "req_existing" } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: "req_new", ...data };
      },
    },
  };
  return { db, created };
}

test("submitAccessRequest: an email with an existing account is refused, nothing created", async () => {
  const { db, created } = makeSubmitStub({ existingUser: { id: "user_1", email: "a@b.com" } });
  setDbStub(db);
  const result = await submitAccessRequest({ email: "a@b.com", requestedRole: "MANAGEMENT" });
  assert.deepEqual(result, { ok: false, reason: "existing_account" });
  assert.equal(created.length, 0);
});

test("submitAccessRequest: a second request for an already-pending email is refused, nothing created", async () => {
  const { db, created } = makeSubmitStub({ pending: true });
  setDbStub(db);
  const result = await submitAccessRequest({ email: "a@b.com", requestedRole: "INVESTOR" });
  assert.deepEqual(result, { ok: false, reason: "already_pending" });
  assert.equal(created.length, 0);
});

test("submitAccessRequest: a genuinely new email creates the request, normalized and trimmed", async () => {
  const { db, created } = makeSubmitStub({});
  setDbStub(db);
  const result = await submitAccessRequest({
    email: "  Alice@Example.com ",
    requestedRole: "INVESTOR",
    organizationName: "  Acme Capital  ",
    message: "  hello  ",
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(created.length, 1);
  assert.equal(created[0].email, "alice@example.com");
  assert.equal(created[0].organizationName, "Acme Capital");
  assert.equal(created[0].message, "hello");
});

// ============================================================
// approveAccessRequestAction / rejectAccessRequestAction
// ============================================================

function formWith(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function makeApproveStub(options: {
  claimCount?: number;
  existingUser?: { id: string; email: string } | null;
  existingInvestor?: { id: string; nameEn: string } | null;
  existingActiveRole?: boolean;
}) {
  const state = {
    created: { users: [] as Record<string, unknown>[], roles: [] as Record<string, unknown>[], investors: [] as Record<string, unknown>[] },
    upserts: [] as Record<string, unknown>[],
    updates: [] as { where: Record<string, unknown>; data: Record<string, unknown> }[],
    userUpdates: [] as Record<string, unknown>[],
  };
  const db = makeAdminActionDbStub({
    falakRoles: ADMIN,
    models: {
      accessRequest: {
        updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          state.updates.push(args);
          return { count: options.claimCount ?? 1 };
        },
        findUniqueOrThrow: async () => ({ email: "req@example.com" }),
        findUnique: async () => ({ email: "req@example.com", status: options.claimCount === 0 ? "Approved" : "Approved" }),
      },
      user: {
        findUnique: async () => options.existingUser ?? null,
        update: async ({ data }: { data: Record<string, unknown> }) => {
          state.userUpdates.push(data);
          return data;
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: "user_new", ...data };
          state.created.users.push(row);
          return row;
        },
      },
      userRoleAssignment: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          const roleFilter = where.role as { in: string[] };
          return ADMIN.filter((r) => roleFilter.in.includes(r.role));
        },
        findFirst: async () => (options.existingActiveRole ? { id: "role_existing" } : null),
        create: async ({ data }: { data: Record<string, unknown> }) => {
          state.created.roles.push(data);
          return data;
        },
      },
      investor: {
        findFirst: async () => options.existingInvestor ?? null,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: "inv_new", ...data };
          state.created.investors.push(row);
          return row;
        },
      },
      investorMembership: {
        upsert: async (args: Record<string, unknown>) => {
          state.upserts.push(args);
          return {};
        },
      },
    },
  });
  return { db, state };
}

test("approve: a staff grant creates the role, sets the department, and audits it", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({});
  setDbStub(db);
  const emails = setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(
    formWith({ requestId: "req_1", grant: "FALAK_MANAGEMENT", department: "VentureBuilder" })
  );

  assert.equal(state.created.users.length, 1);
  assert.deepEqual(state.created.roles, [{ userId: "user_new", role: "FALAK_MANAGEMENT" }]);
  assert.deepEqual(state.userUpdates, [{ department: "VentureBuilder", allDepartments: false }]);
  assert.equal(db.getAuditEvents()[0].action, "access_request.approved");
  assert.equal(emails.length, 1);
  assert.equal(emails[0], "req@example.com");
});

test("approve: Management can be given both departments", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({});
  setDbStub(db);
  setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(formWith({ requestId: "req_1", grant: "FALAK_MANAGEMENT", department: "all" }));

  assert.deepEqual(state.userUpdates, [{ department: null, allDepartments: true }]);
  assert.deepEqual(state.created.roles, [{ userId: "user_new", role: "FALAK_MANAGEMENT" }]);
});

test("approve: an already-active role for that user is not duplicated", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({ existingActiveRole: true });
  setDbStub(db);
  setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(
    formWith({ requestId: "req_1", grant: "FALAK_OPERATIONS", department: "InvestmentDepartment" })
  );

  assert.equal(state.created.roles.length, 0);
});

test("approve: a staff grant without a department, or an Admin grant, is refused before anything changes", async () => {
  setCurrentUser(REAL_USER);
  for (const fields of [
    { requestId: "req_1", grant: "FALAK_OPERATIONS" },
    { requestId: "req_1", grant: "FALAK_ADMIN", department: "VentureBuilder" },
    { requestId: "req_1", grant: "FALAK_OPERATIONS", department: "all" },
  ]) {
    const { db, state } = makeApproveStub({});
    setDbStub(db);
    setSendAccessApprovedEmailSpy();
    await approveAccessRequestAction(formWith(fields));
    assert.equal(state.updates.length, 0, fields.grant);
    assert.equal(state.created.roles.length, 0, fields.grant);
  }
});

test("approve: INVESTOR grant matches an existing org case-insensitively instead of creating a duplicate", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({ existingInvestor: { id: "inv_1", nameEn: "Acme Capital" } });
  setDbStub(db);
  setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(formWith({ requestId: "req_1", grant: "INVESTOR", organizationName: "acme capital" }));

  assert.equal(state.created.investors.length, 0);
  assert.equal(state.upserts.length, 1);
  assert.deepEqual((state.upserts[0] as { where: unknown }).where, { investorId_userId: { investorId: "inv_1", userId: "user_new" } });
});

test("approve: INVESTOR grant with no matching org creates one", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({ existingInvestor: null });
  setDbStub(db);
  setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(formWith({ requestId: "req_1", grant: "INVESTOR", organizationName: "New Fund" }));

  assert.equal(state.created.investors.length, 1);
  assert.equal(state.created.investors[0].nameEn, "New Fund");
  assert.equal(state.created.investors[0].nameAr, "New Fund");
});

test("approve: a lost claim race (already decided) creates nothing", async () => {
  setCurrentUser(REAL_USER);
  const { db, state } = makeApproveStub({ claimCount: 0 });
  setDbStub(db);
  setSendAccessApprovedEmailSpy();

  await approveAccessRequestAction(formWith({ requestId: "req_1", grant: "FALAK_MANAGEMENT", department: "VentureBuilder" }));

  assert.equal(state.created.users.length, 0);
  assert.equal(state.created.roles.length, 0);
  assert.equal(db.getAuditEvents().length, 0);
});

test("approve: FALAK_OPERATIONS caller is a silent no-op", async () => {
  setCurrentUser(REAL_USER);
  const updates: Record<string, unknown>[] = [];
  const db = makeAdminActionDbStub({
    falakRoles: [{ role: "FALAK_OPERATIONS" }],
    models: {
      accessRequest: {
        updateMany: async (args: Record<string, unknown>) => {
          updates.push(args);
          return { count: 1 };
        },
      },
    },
  });
  setDbStub(db);
  await assert.doesNotReject(() => approveAccessRequestAction(formWith({ requestId: "req_1", grant: "FALAK_MANAGEMENT", department: "VentureBuilder" })));
  assert.equal(updates.length, 0);
});

function makeRejectStub(claimCount: number) {
  const updates: { where: Record<string, unknown>; data: Record<string, unknown> }[] = [];
  const db = makeAdminActionDbStub({
    falakRoles: ADMIN,
    models: {
      accessRequest: {
        updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          updates.push(args);
          return { count: claimCount };
        },
      },
    },
  });
  return { db, updates };
}

test("reject: a pending request is marked Rejected and audited, never creates a User", async () => {
  setCurrentUser(REAL_USER);
  const { db, updates } = makeRejectStub(1);
  setDbStub(db);

  await rejectAccessRequestAction(formWith({ requestId: "req_1" }));

  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].where, { id: "req_1", status: "Pending" });
  assert.equal(updates[0].data.status, "Rejected");
  assert.equal(db.getAuditEvents().length, 1);
  assert.equal(db.getAuditEvents()[0].action, "access_request.rejected");
});

test("reject: already-decided (count 0) writes no audit event", async () => {
  setCurrentUser(REAL_USER);
  const { db } = makeRejectStub(0);
  setDbStub(db);
  await rejectAccessRequestAction(formWith({ requestId: "req_1" }));
  assert.equal(db.getAuditEvents().length, 0);
});
