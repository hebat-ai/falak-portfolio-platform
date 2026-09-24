import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Thrown when an invite could not be atomically claimed -- already
 * accepted, revoked, expired, its company archived, or its identity
 * (tokenHash/companyId/email) no longer matches what was validated before
 * the transaction, by the time of the write. Callers must map this to the
 * same generic "invalid or expired" message used for every other
 * invalid-invite reason; never surface that the cause was concurrency or
 * a stale-data mismatch.
 */
export class InviteClaimFailedError extends Error {}

/**
 * The exact invite snapshot the caller validated (via getValidInvite)
 * before opening the transaction. Every field here becomes part of the
 * claim's WHERE clause, so the write only succeeds if the row still
 * matches this snapshot in full -- not just by id.
 */
export interface ExpectedInviteClaim {
  id: string;
  /** Derived server-side from the submitted raw token at the call site
   * (hashInviteToken(rawToken)) -- never read from FormData or any other
   * client-supplied value. */
  tokenHash: string;
  companyId: string;
  /** Normalized (normalizeEmail). */
  email: string;
}

/**
 * Atomically claims one CompanyInvite. The `where` clause re-enforces
 * every acceptability condition, AND the full expected identity
 * (id + tokenHash + companyId + email), AT WRITE TIME inside the same
 * transaction -- not just at an earlier, separate read (getValidInvite,
 * or the page's own render branch, neither of which is authorization on
 * its own). Binding to tokenHash/companyId/email (not just id) also
 * guards the subsequent user/membership writes against using stale
 * pre-transaction invite data: if the row no longer matches the exact
 * snapshot that was validated, the claim fails and nothing downstream is
 * written from outdated values.
 *
 * `updateMany`'s `where` accepts the same relational filter shape as
 * `findMany` (confirmed against the installed Prisma-generated types in
 * src/generated/prisma/models/CompanyInvite.ts: CompanyInviteUpdateManyArgs.where
 * is typed as the full Prisma.CompanyInviteWhereInput -- the same type
 * findMany uses, which includes id/companyId/email/tokenHash/expiresAt/
 * acceptedAt/revokedAt as direct scalar filters and a `company` relation
 * filter) -- so the company-not-archived condition is expressed in the
 * same single atomic write, no separate query needed.
 *
 * Requiring exactly one affected row means at most one concurrent caller
 * can ever win this claim: a second, simultaneous attempt against the
 * same invite will see `count === 0` (the first writer's `acceptedAt`
 * already fails the `acceptedAt: null` predicate) and must throw,
 * rolling back everything else in its own transaction.
 *
 * Must be called INSIDE the same transaction that creates the resulting
 * user/membership rows, and BEFORE those writes. The transaction's
 * subsequent writes must reuse `expected.email`/`expected.companyId` --
 * never re-derive them from a separate post-claim read.
 */
export async function claimInvite(tx: Prisma.TransactionClient, expected: ExpectedInviteClaim): Promise<void> {
  const claimedAt = new Date();

  const result = await tx.companyInvite.updateMany({
    where: {
      id: expected.id,
      tokenHash: expected.tokenHash,
      companyId: expected.companyId,
      email: expected.email,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: claimedAt },
      company: { archivedAt: null },
    },
    data: { acceptedAt: claimedAt },
  });

  if (result.count !== 1) {
    throw new InviteClaimFailedError();
  }
}
