import { test } from "node:test";
import assert from "node:assert/strict";

// Imports the REAL production module -- src/lib/auth/invite-claim.ts --
// via tests/support/mock-loader.mjs. This module has no I/O dependency
// of its own beyond the `tx` object passed in by its caller, so no mock
// loader interception is even needed for it specifically; the loader
// still resolves its own "@/generated/prisma/client" type-only import
// (fully erased at runtime).
const { claimInvite, InviteClaimFailedError } = await import("../src/lib/auth/invite-claim.ts");

interface FakeTx {
  companyInvite: {
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
}

function makeTx(count: number, captureArgs?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => void): FakeTx {
  return {
    companyInvite: {
      updateMany: async (args) => {
        captureArgs?.(args as { where: Record<string, unknown>; data: Record<string, unknown> });
        return { count };
      },
    },
  };
}

const EXPECTED = { id: "inv_1", tokenHash: "hash_abc", companyId: "co_1", email: "a@b.com" };

test("count === 0 throws InviteClaimFailedError", async () => {
  await assert.rejects(() => claimInvite(makeTx(0) as never, EXPECTED), InviteClaimFailedError);
});

test("count === 1 succeeds (no throw)", async () => {
  await assert.doesNotReject(() => claimInvite(makeTx(1) as never, EXPECTED));
});

test("count === 2 is also treated as failure (strict === 1 required)", async () => {
  await assert.rejects(() => claimInvite(makeTx(2) as never, EXPECTED), InviteClaimFailedError);
});

test("the where clause binds all four identity fields plus every state predicate and the company relation filter", async () => {
  let captured: { where: Record<string, unknown>; data: Record<string, unknown> } | undefined;
  await claimInvite(makeTx(1, (args) => (captured = args)) as never, EXPECTED);
  assert.ok(captured);
  assert.equal(captured.where.id, EXPECTED.id);
  assert.equal(captured.where.tokenHash, EXPECTED.tokenHash);
  assert.equal(captured.where.companyId, EXPECTED.companyId);
  assert.equal(captured.where.email, EXPECTED.email);
  assert.equal(captured.where.acceptedAt, null);
  assert.equal(captured.where.revokedAt, null);
  assert.ok("gt" in (captured.where.expiresAt as object));
  assert.equal((captured.where.company as { archivedAt: null }).archivedAt, null);
});

test("expiresAt's gt-comparison instant equals the acceptedAt value being written (one shared claimedAt)", async () => {
  let captured: { where: Record<string, unknown>; data: Record<string, unknown> } | undefined;
  await claimInvite(makeTx(1, (args) => (captured = args)) as never, EXPECTED);
  assert.ok(captured);
  const whereExpiresAtGt = (captured.where.expiresAt as { gt: Date }).gt;
  const dataAcceptedAt = captured.data.acceptedAt as Date;
  assert.equal(whereExpiresAtGt.getTime(), dataAcceptedAt.getTime());
});
