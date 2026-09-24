import "server-only";
import { db } from "@/lib/db";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { normalizeEmail } from "@/lib/auth/utils";

export interface ValidInvite {
  id: string;
  companyId: string;
  companyName: string;
  /**
   * Already normalized (normalizeEmail) -- this is the single source of
   * truth for "the invite's email" from here on. Every caller must reuse
   * this exact value (existing-user lookup, the expected invite claim,
   * user creation, membership-related logic) rather than re-normalizing
   * invite.email separately anywhere, which could otherwise silently
   * diverge from this value.
   */
  email: string;
}

/**
 * Looks up a CompanyInvite by its token hash and returns it only if it is
 * currently acceptable: not revoked, not already accepted, not expired,
 * and its company is not archived. Used identically by the accept-invite
 * page (to decide which UI to render) and by the accept-invite actions
 * (to re-validate before writing anything) -- one shared implementation
 * so the two can never drift out of agreement on what counts as valid.
 *
 * Returns null for every invalid case alike (not found, revoked, expired,
 * already accepted, archived company) -- callers must show one generic
 * message and never branch their user-facing wording on which case it was.
 */
export async function getValidInvite(rawToken: string): Promise<ValidInvite | null> {
  if (!rawToken) return null;

  const tokenHash = hashInviteToken(rawToken);
  const invite = await db.companyInvite.findUnique({
    where: { tokenHash },
    include: { company: { select: { id: true, nameEn: true, archivedAt: true } } },
  });

  if (!invite) return null;
  if (invite.revokedAt) return null;
  if (invite.acceptedAt) return null;
  if (invite.expiresAt <= new Date()) return null;
  if (invite.company.archivedAt) return null;

  return {
    id: invite.id,
    companyId: invite.company.id,
    companyName: invite.company.nameEn,
    email: normalizeEmail(invite.email),
  };
}
