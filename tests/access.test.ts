import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub, REAL_USER } from "./support/stubs.ts";

// Real modules via tests/support/mock-loader.mjs: the /admin/access query
// and its four revoke actions. Only @/lib/db, current-user and
// next/navigation are stubbed.
const { getAccessData } = await import("../src/lib/access/queries.ts");
const actions = await import("../src/app/admin/access/actions.ts");
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");
const { MockRedirectError } = (await import("next/navigation")) as unknown as {
  MockRedirectError: new (url: string) => Error & { url: string };
};

const ADMIN = [{ role: "FALAK_ADMIN" }];
const OPERATIONS = [{ role: "FALAK_OPERATIONS" }];

// ============================================================
// getAccessData
// ============================================================

type FindManyArgs = {
  where: Record<string, unknown>;
  select: { memberships: { where: Record<string, unknown> }; invites: { where: Record<string, unknown> } };
};

function orgRow(id: string) {
  return {
    id,
    nameEn: id,
    nameAr: id,
    memberships: [{ id: `${id}_m1`, role: "MEMBER", joinedAt: new Date("2026-09-01T10:00:00Z"), user: { email: "a@x.com" } }],
    invites: [{ id: `${id}_i1`, email: "b@x.com", createdAt: new Date("2026-09-20T10:00:00Z"), expiresAt: new Date("2026-09-27T10:00:00Z") }],
  };
}

function makeQueryStub(falakRoles: { role: string }[]) {
  const calls: { company?: FindManyArgs; investor?: FindManyArgs } = {};
  const db = makeAdminActionDbStub({
    falakRoles,
    models: {
      company: { findMany: async (args: FindManyArgs) => ((calls.company = args), [orgRow("co_1")]) },
      investor: { findMany: async (args: FindManyArgs) => ((calls.investor = args), [orgRow("inv_1")]) },
      accessRequest: { findMany: async () => [] },
    },
  });
  return { db, calls };
}

test("query: unauthenticated is denied; a non-Falak user is forbidden", async () => {
  setCurrentUser(null);
  setDbStub(makeQueryStub([]).db);
  await assert.rejects(() => getAccessData(), UnauthenticatedError);

  setCurrentUser(REAL_USER);
  setDbStub(makeQueryStub([]).db);
  await assert.rejects(() => getAccessData(), ForbiddenError);
});

test("query: only non-archived orgs, only active members, only pending (unaccepted, unrevoked, unexpired) invites", async () => {
  setCurrentUser(REAL_USER);
  const { db, calls } = makeQueryStub(ADMIN);
  setDbStub(db);
  const before = Date.now();
  await getAccessData();

  for (const args of [calls.company!, calls.investor!]) {
    assert.deepEqual(args.where, { archivedAt: null });
    assert.deepEqual(args.select.memberships.where, { revokedAt: null });
    const inviteWhere = args.select.invites.where as { acceptedAt: null; revokedAt: null; expiresAt: { gt: Date } };
    assert.equal(inviteWhere.acceptedAt, null);
    assert.equal(inviteWhere.revokedAt, null);
    assert.ok(inviteWhere.expiresAt.gt.getTime() >= before);
  }
});

test("query: maps rows to plain DTOs with date-only strings", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeQueryStub(ADMIN).db);
  const data = await getAccessData();
  assert.deepEqual(data.companies[0].members, [{ id: "co_1_m1", email: "a@x.com", role: "MEMBER", joinedAt: "2026-09-01" }]);
  assert.deepEqual(data.investors[0].invites, [
    { id: "inv_1_i1", email: "b@x.com", createdAt: "2026-09-20", expiresAt: "2026-09-27" },
  ]);
});

test("query: canRevoke is true for FALAK_ADMIN only; FALAK_OPERATIONS may view", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeQueryStub(ADMIN).db);
  assert.equal((await getAccessData()).canRevoke, true);

  setDbStub(makeQueryStub(OPERATIONS).db);
  assert.equal((await getAccessData()).canRevoke, false);
});

// ============================================================
// Revoke actions
// ============================================================

const CASES = [
  { name: "revokeCompanyMembershipAction", model: "companyMembership", field: "membershipId", action: "company_membership.revoked", targetType: "CompanyMembership", invite: false },
  { name: "revokeInvestorMembershipAction", model: "investorMembership", field: "membershipId", action: "investor_membership.revoked", targetType: "InvestorMembership", invite: false },
  { name: "revokeCompanyInviteAction", model: "companyInvite", field: "inviteId", action: "invite.revoked", targetType: "CompanyInvite", invite: true },
  { name: "revokeInvestorInviteAction", model: "investorInvite", field: "inviteId", action: "investor_invite.revoked", targetType: "InvestorInvite", invite: true },
] as const;

function makeActionStub(falakRoles: { role: string }[], model: string, count: number) {
  const updates: { where: Record<string, unknown>; data: Record<string, unknown> }[] = [];
  const db = makeAdminActionDbStub({
    falakRoles,
    models: {
      [model]: {
        updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          updates.push(args);
          return { count };
        },
      },
    },
  });
  return { db, updates };
}

function formWith(field: string, value: string) {
  const fd = new FormData();
  fd.set(field, value);
  return fd;
}

for (const c of CASES) {
  const invoke = actions[c.name];

  test(`${c.name}: an admin revokes via a conditional update pinned to not-yet-revoked, and it's audited`, async () => {
    setCurrentUser(REAL_USER);
    const { db, updates } = makeActionStub(ADMIN, c.model, 1);
    setDbStub(db);
    await invoke(formWith(c.field, "row_1"));

    assert.equal(updates.length, 1);
    const expectedWhere = c.invite ? { id: "row_1", revokedAt: null, acceptedAt: null } : { id: "row_1", revokedAt: null };
    assert.deepEqual(updates[0].where, expectedWhere);
    assert.ok(updates[0].data.revokedAt instanceof Date);

    const events = db.getAuditEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].action, c.action);
    assert.equal(events[0].targetType, c.targetType);
    assert.equal(events[0].targetId, "row_1");
    assert.equal(events[0].actorId, REAL_USER.id);
  });

  test(`${c.name}: already revoked${c.invite ? " or accepted" : ""} (no row changed) writes no audit event`, async () => {
    setCurrentUser(REAL_USER);
    const { db } = makeActionStub(ADMIN, c.model, 0);
    setDbStub(db);
    await invoke(formWith(c.field, "row_1"));
    assert.equal(db.getAuditEvents().length, 0);
  });

  test(`${c.name}: FALAK_OPERATIONS is a silent no-op`, async () => {
    setCurrentUser(REAL_USER);
    const { db, updates } = makeActionStub(OPERATIONS, c.model, 1);
    setDbStub(db);
    await assert.doesNotReject(() => invoke(formWith(c.field, "row_1")));
    assert.equal(updates.length, 0);
    assert.equal(db.getAuditEvents().length, 0);
  });

  test(`${c.name}: unauthenticated is redirected to /sign-in`, async () => {
    setCurrentUser(null);
    const { db, updates } = makeActionStub(ADMIN, c.model, 1);
    setDbStub(db);
    await assert.rejects(
      () => invoke(formWith(c.field, "row_1")),
      (err: unknown) => err instanceof MockRedirectError && (err as InstanceType<typeof MockRedirectError>).url === "/sign-in"
    );
    assert.equal(updates.length, 0);
  });
}
