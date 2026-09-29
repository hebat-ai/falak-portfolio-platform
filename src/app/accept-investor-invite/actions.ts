"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getValidInvestorInvite } from "@/lib/auth/investor-invite-lookup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { claimInvestorInvite } from "@/lib/auth/investor-invite-claim";
import { MAX_RAW_INVITE_TOKEN_LENGTH } from "@/lib/auth/utils";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";

export interface AcceptInvestorInviteState {
  error: string | null;
}

const GENERIC_INVALID_INVITE = "This invitation link is invalid or has expired.";
const EXISTING_ACCOUNT_MESSAGE = "An account already exists for this email. Sign in with that account, then reopen this invitation link.";

/**
 * New-user path, mirroring acceptInviteAction (src/app/accept-invite):
 * re-validates the invite and the "no existing user" precondition itself,
 * then -- in one transaction -- claims the invite FIRST (the real
 * authorization), creates the User and the InvestorMembership, and writes
 * the audit event. No password anywhere; sign-in is an emailed link.
 */
export async function acceptInvestorInviteAction(
  rawToken: string,
  _prevState: AcceptInvestorInviteState,
  _formData: FormData
): Promise<AcceptInvestorInviteState> {
  if (rawToken.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const invite = await getValidInvestorInvite(rawToken);
  if (!invite) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return { error: EXISTING_ACCOUNT_MESSAGE };
  }

  const tokenHash = hashInviteToken(rawToken);

  try {
    await db.$transaction(async (tx) => {
      await claimInvestorInvite(tx, {
        id: invite.id,
        tokenHash,
        investorId: invite.investorId,
        email: invite.email,
      });

      const user = await tx.user.create({ data: { email: invite.email } });
      await tx.investorMembership.create({
        data: { userId: user.id, investorId: invite.investorId, role: "MEMBER" },
      });

      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "investor_invite.accepted",
        targetType: "InvestorInvite",
        targetId: invite.id,
      });
    });
  } catch {
    // One uniform message for a failed claim and any other race alike.
    return { error: GENERIC_INVALID_INVITE };
  }

  redirect("/sign-in?accepted=1");
}

/**
 * Existing-user path: the visitor must be signed in AS the invited user
 * (checked here, not just by the page). A pre-existing membership (e.g. a
 * previously revoked one being re-granted) is reactivated rather than
 * treated as an error.
 */
export async function completeExistingInvestorMemberAction(rawToken: string): Promise<AcceptInvestorInviteState> {
  if (rawToken.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const invite = await getValidInvestorInvite(rawToken);
  if (!invite) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });
  if (!existingUser) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== existingUser.id) {
    return { error: EXISTING_ACCOUNT_MESSAGE };
  }

  const tokenHash = hashInviteToken(rawToken);

  try {
    await db.$transaction(async (tx) => {
      await claimInvestorInvite(tx, {
        id: invite.id,
        tokenHash,
        investorId: invite.investorId,
        email: invite.email,
      });

      await tx.investorMembership.upsert({
        where: { investorId_userId: { investorId: invite.investorId, userId: existingUser.id } },
        update: { revokedAt: null },
        create: { userId: existingUser.id, investorId: invite.investorId, role: "MEMBER" },
      });

      await writeAuditEvent(tx, {
        actorId: existingUser.id,
        action: "investor_invite.accepted",
        targetType: "InvestorInvite",
        targetId: invite.id,
      });
    });
  } catch {
    return { error: GENERIC_INVALID_INVITE };
  }

  redirect("/investor");
}
