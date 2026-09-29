import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Thrown when an investor invite could not be atomically claimed --
 * already accepted, revoked, expired, its investor org archived, or its
 * identity no longer matching the snapshot validated before the
 * transaction. Callers map it to the same generic "invalid or expired"
 * message as every other invalid-invite reason.
 */
export class InvestorInviteClaimFailedError extends Error {}

export interface ExpectedInvestorInviteClaim {
  id: string;
  /** Derived server-side from the submitted raw token -- never client-supplied. */
  tokenHash: string;
  investorId: string;
  /** Normalized (normalizeEmail). */
  email: string;
}

/**
 * Investor-invite counterpart to claimInvite (invite-claim.ts): one
 * conditional updateMany that re-enforces every acceptability condition
 * and the full expected identity AT WRITE TIME, inside the caller's
 * transaction, requiring exactly one affected row -- so at most one
 * concurrent caller can ever win. Must run BEFORE the transaction creates
 * any user/membership rows.
 */
export async function claimInvestorInvite(
  tx: Prisma.TransactionClient,
  expected: ExpectedInvestorInviteClaim
): Promise<void> {
  const claimedAt = new Date();

  const result = await tx.investorInvite.updateMany({
    where: {
      id: expected.id,
      tokenHash: expected.tokenHash,
      investorId: expected.investorId,
      email: expected.email,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: claimedAt },
      investor: { archivedAt: null },
    },
    data: { acceptedAt: claimedAt },
  });

  if (result.count !== 1) {
    throw new InvestorInviteClaimFailedError();
  }
}
