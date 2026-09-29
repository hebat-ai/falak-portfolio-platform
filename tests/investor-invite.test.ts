import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub } from "./support/stubs.ts";

// Real modules via tests/support/mock-loader.mjs: the claim, the lookup
// (transitively), and both accept actions. Only @/lib/db, current-user,
// and next/navigation are stubbed.
const { claimInvestorInvite, InvestorInviteClaimFailedError } = await import("../src/lib/auth/investor-invite-claim.ts");
const { acceptInvestorInviteAction, completeExistingInvestorMemberAction } = await import(
  "../src/app/accept-investor-invite/actions.ts"
);
const { hashInviteToken } = await import("../src/lib/auth/invite-token.ts");
const { MockRedirectError } = (await import("next/navigation")) as unknown as {
  MockRedirectError: new (url: string) => Error & { url: string };
};

const RAW_TOKEN = "raw-investor-invite-token";
const EXPECTED = { id: "iinv_1", tokenHash: "hash_abc", investorId: "inv_1", email: "lp@example.com" };

// ============================================================
// claimInvestorInvite
// ============================================================

function makeTx(count: number, capture?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => void) {
  return {
    investorInvite: {
      updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        capture?.(args);
        return { count };
      },
    },
  };
}

test("claim: count 0 throws, count 1 succeeds, count 2 is also a failure", async () => {
  await assert.rejects(() => claimInvestorInvite(makeTx(0) as never, EXPECTED), InvestorInviteClaimFailedError);
  await assert.doesNotReject(() => claimInvestorInvite(makeTx(1) as never, EXPECTED));
  await assert.rejects(() => claimInvestorInvite(makeTx(2) as never, EXPECTED), InvestorInviteClaimFailedError);
});

test("claim: WHERE binds the full identity plus every acceptability condition", async () => {
  let captured: { where: Record<string, unknown>; data: Record<string, unknown> } | undefined;
  await claimInvestorInvite(makeTx(1, (a) => (captured = a)) as never, EXPECTED);
  const where = captured!.where;
  assert.equal(where.id, EXPECTED.id);
  assert.equal(where.tokenHash, EXPECTED.tokenHash);
  assert.equal(where.investorId, EXPECTED.investorId);
  assert.equal(where.email, EXPECTED.email);
  assert.equal(where.acceptedAt, null);
  assert.equal(where.revokedAt, null);
  assert.deepEqual(where.investor, { archivedAt: null });
  // The expiry comparison instant is the same value written to acceptedAt.
  assert.equal((where.expiresAt as { gt: Date }).gt, captured!.data.acceptedAt);
});

// ============================================================
// Accept actions
// ============================================================

interface InviteRow {
  revokedAt?: Date | null;
  acceptedAt?: Date | null;
  expiresAt?: Date;
  investorArchived?: boolean;
  email?: string;
}

function makeAcceptStub(options: {
  invite?: InviteRow | null;
  existingUser?: { id: string; email: string } | null;
  claimCount?: number;
}) {
  const created = { users: [] as Record<string, unknown>[], memberships: [] as Record<string, unknown>[], upserts: [] as Record<string, unknown>[] };
  const inv = options.invite === undefined ? {} : options.invite;
  const db = makeAdminActionDbStub({
    models: {
      investorInvite: {
        findUnique: async ({ where }: { where: { tokenHash: string } }) =>
          inv && where.tokenHash === hashInviteToken(RAW_TOKEN)
            ? {
                id: "iinv_1",
                email: inv.email ?? "lp@example.com",
                tokenHash: where.tokenHash,
                revokedAt: inv.revokedAt ?? null,
                acceptedAt: inv.acceptedAt ?? null,
                expiresAt: inv.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
                investor: { id: "inv_1", nameEn: "Demo Family Office", archivedAt: inv.investorArchived ? new Date() : null },
              }
            : null,
        updateMany: async () => ({ count: options.claimCount ?? 1 }),
      },
      user: {
        findUnique: async () => options.existingUser ?? null,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: "user_new", ...data };
          created.users.push(row);
          return row;
        },
      },
      investorMembership: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          created.memberships.push(data);
          return data;
        },
        upsert: async (args: Record<string, unknown>) => {
          created.upserts.push(args);
          return {};
        },
      },
    },
  });
  return { db, created };
}

async function expectRedirect(fn: () => Promise<unknown>, url: string) {
  await assert.rejects(fn, (err: unknown) => {
    assert.ok(err instanceof MockRedirectError);
    assert.equal((err as InstanceType<typeof MockRedirectError>).url, url);
    return true;
  });
}

test("new user: creates the user, a MEMBER investor membership, and one audit event, then goes to sign-in", async () => {
  setCurrentUser(null);
  const { db, created } = makeAcceptStub({});
  setDbStub(db);

  await expectRedirect(() => acceptInvestorInviteAction(RAW_TOKEN, { error: null }, new FormData()), "/sign-in?accepted=1");

  assert.equal(created.users.length, 1);
  assert.equal(created.users[0].email, "lp@example.com");
  assert.deepEqual(created.memberships, [{ userId: "user_new", investorId: "inv_1", role: "MEMBER" }]);
  const events = db.getAuditEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].action, "investor_invite.accepted");
  assert.equal(events[0].targetType, "InvestorInvite");
  assert.equal(events[0].targetId, "iinv_1");
  assert.equal(events[0].actorId, "user_new");
});

test("new user: revoked, already accepted, expired, or archived-investor invites are rejected", async () => {
  const past = new Date(Date.now() - 1000);
  for (const invite of [{ revokedAt: past }, { acceptedAt: past }, { expiresAt: past }, { investorArchived: true }, null]) {
    setCurrentUser(null);
    const { db, created } = makeAcceptStub({ invite });
    setDbStub(db);
    const result = await acceptInvestorInviteAction(RAW_TOKEN, { error: null }, new FormData());
    assert.ok(result.error);
    assert.equal(created.users.length, 0);
  }
});

test("new user: an oversized token is rejected before any lookup", async () => {
  setCurrentUser(null);
  const { db, created } = makeAcceptStub({});
  setDbStub(db);
  const result = await acceptInvestorInviteAction("x".repeat(513), { error: null }, new FormData());
  assert.ok(result.error);
  assert.equal(created.users.length, 0);
});

test("new user: an email that already has an account is never given a second one", async () => {
  setCurrentUser(null);
  const { db, created } = makeAcceptStub({ existingUser: { id: "user_1", email: "lp@example.com" } });
  setDbStub(db);
  const result = await acceptInvestorInviteAction(RAW_TOKEN, { error: null }, new FormData());
  assert.match(result.error ?? "", /already exists/);
  assert.equal(created.users.length, 0);
});

test("new user: a lost claim race writes nothing and returns the generic error", async () => {
  setCurrentUser(null);
  const { db, created } = makeAcceptStub({ claimCount: 0 });
  setDbStub(db);
  const result = await acceptInvestorInviteAction(RAW_TOKEN, { error: null }, new FormData());
  assert.match(result.error ?? "", /invalid or has expired/);
  assert.equal(created.users.length, 0);
  assert.equal(db.getAuditEvents().length, 0);
});

test("existing user signed in as the invitee: membership upserted (reactivating a revoked one), audited, goes to /investor", async () => {
  const invitee = { id: "user_1", email: "lp@example.com" };
  setCurrentUser(invitee);
  const { db, created } = makeAcceptStub({ existingUser: invitee });
  setDbStub(db);

  await expectRedirect(() => completeExistingInvestorMemberAction(RAW_TOKEN), "/investor");

  assert.equal(created.upserts.length, 1);
  const upsert = created.upserts[0] as { where: unknown; update: unknown; create: unknown };
  assert.deepEqual(upsert.where, { investorId_userId: { investorId: "inv_1", userId: "user_1" } });
  assert.deepEqual(upsert.update, { revokedAt: null });
  assert.deepEqual(upsert.create, { userId: "user_1", investorId: "inv_1", role: "MEMBER" });
  assert.equal(db.getAuditEvents()[0].actorId, "user_1");
});

test("existing user: signed in as someone else, or not signed in, is rejected", async () => {
  for (const current of [{ id: "someone_else", email: "x@example.com" }, null]) {
    setCurrentUser(current);
    const { db, created } = makeAcceptStub({ existingUser: { id: "user_1", email: "lp@example.com" } });
    setDbStub(db);
    const result = await completeExistingInvestorMemberAction(RAW_TOKEN);
    assert.ok(result.error);
    assert.equal(created.upserts.length, 0);
  }
});
