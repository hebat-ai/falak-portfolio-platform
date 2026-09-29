import "server-only";
import { db } from "@/lib/db";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { normalizeEmail } from "@/lib/auth/utils";

export interface ValidInvestorInvite {
  id: string;
  investorId: string;
  investorName: string;
  /** Already normalized -- reuse this exact value downstream, never
   * re-normalize invite.email separately (same rule as ValidInvite). */
  email: string;
}

/**
 * Investor-invite counterpart to getValidInvite (invite-lookup.ts): the
 * invite only if it is currently acceptable -- not revoked, not already
 * accepted, not expired, and its investor org not archived. Returns null
 * for every invalid case alike, so callers show one generic message.
 */
export async function getValidInvestorInvite(rawToken: string): Promise<ValidInvestorInvite | null> {
  if (!rawToken) return null;

  const invite = await db.investorInvite.findUnique({
    where: { tokenHash: hashInviteToken(rawToken) },
    include: { investor: { select: { id: true, nameEn: true, archivedAt: true } } },
  });

  if (!invite) return null;
  if (invite.revokedAt) return null;
  if (invite.acceptedAt) return null;
  if (invite.expiresAt <= new Date()) return null;
  if (invite.investor.archivedAt) return null;

  return {
    id: invite.id,
    investorId: invite.investor.id,
    investorName: invite.investor.nameEn,
    email: normalizeEmail(invite.email),
  };
}
