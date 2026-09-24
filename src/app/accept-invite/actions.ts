"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getValidInvite } from "@/lib/auth/invite-lookup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { claimInvite } from "@/lib/auth/invite-claim";
import {
  normalizePassword,
  validatePassword,
  BCRYPT_COST_FACTOR,
  MAX_RAW_PASSWORD_LENGTH,
  MAX_RAW_INVITE_TOKEN_LENGTH,
} from "@/lib/auth/utils";

export interface AcceptInviteState {
  error: string | null;
}

const GENERIC_INVALID_INVITE = "This invitation link is invalid or has expired.";
const EXISTING_ACCOUNT_MESSAGE = "An account already exists for this email. Sign in with that account, then reopen this invitation link.";

/**
 * New-user path: the invite's email has no existing User row. Atomically
 * claims the invite FIRST, inside the transaction, then creates the User
 * (with the password the invitee just chose) and the CompanyMembership.
 * Re-validates the invite and the "no existing user" precondition itself;
 * never trusts the page's own rendering decision, since that's a UI
 * convenience, not the security boundary. The claim's own WHERE clause
 * (see claimInvite) is what actually prevents two concurrent acceptances
 * of the same invite -- this function's earlier getValidInvite() call is
 * only what decides which UI/path to take, never what authorizes the
 * write.
 */
export async function acceptInviteAction(
  rawToken: string,
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  // Reject an oversized raw token before getValidInvite()/hashInviteToken()
  // touch it at all -- token is untrusted, client-originated input (the
  // invitation URL's query string, threaded through as this action's
  // bound first argument).
  if (rawToken.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const passwordInput = formData.get("password");
  const confirmInput = formData.get("confirmPassword");
  if (typeof passwordInput !== "string" || typeof confirmInput !== "string") {
    return { error: "Enter and confirm a password." };
  }
  // Reject oversized raw password/confirmation input before the equality
  // comparison, normalization, validation, or bcrypt -- never truncate to
  // make it fit. Reuses validatePassword's own "too long" wording: any
  // input over this raw cap will always exceed the normalized 72-byte
  // bcrypt limit too, so the two messages describe the same real
  // condition, just rejected at the cheaper, earlier point.
  if (passwordInput.length > MAX_RAW_PASSWORD_LENGTH || confirmInput.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: "Password is too long." };
  }
  if (passwordInput !== confirmInput) {
    return { error: "Passwords do not match." };
  }
  const passwordError = validatePassword(passwordInput);
  if (passwordError) {
    return { error: passwordError };
  }

  const invite = await getValidInvite(rawToken);
  if (!invite) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    // Never create a second account, and never touch this user's existing
    // password from this code path.
    return { error: EXISTING_ACCOUNT_MESSAGE };
  }

  const passwordHash = await bcrypt.hash(normalizePassword(passwordInput), BCRYPT_COST_FACTOR);
  // rawToken is untrusted, client-originated input (see the length-check
  // comment above). The only trusted property is that tokenHash is
  // derived server-side, right here, from that raw value -- never
  // accepted as a hash directly from FormData or any other client-
  // supplied field.
  const tokenHash = hashInviteToken(rawToken);

  try {
    await db.$transaction(async (tx) => {
      // Must run first: the atomic conditional claim is the real
      // authorization for everything that follows in this transaction.
      await claimInvite(tx, {
        id: invite.id,
        tokenHash,
        companyId: invite.companyId,
        email: invite.email,
      });

      // Reuses the exact email/companyId the successful claim was bound
      // to -- never re-derived from a separate post-claim read.
      const user = await tx.user.create({
        data: { email: invite.email, passwordHash },
      });
      await tx.companyMembership.create({
        data: { userId: user.id, companyId: invite.companyId, role: "MEMBER" },
      });
    });
  } catch {
    // Covers a failed claim (InviteClaimFailedError) and any other race
    // (e.g. a duplicate email created between the check above and the
    // write) alike -- one uniform generic message for every case, so
    // there is no branch that could ever be made to differ and leak
    // which one occurred.
    return { error: GENERIC_INVALID_INVITE };
  }

  redirect("/sign-in?accepted=1");
}

/**
 * Existing-user path: the invite's email already belongs to a User row,
 * and the visitor is currently authenticated AS that exact user (checked
 * again here, not just by the page). No password is set or touched here
 * at all. Atomically claims the invite first, then upserts the
 * CompanyMembership -- a pre-existing membership is treated as
 * already-satisfied rather than an error.
 */
export async function completeExistingMemberAction(rawToken: string): Promise<AcceptInviteState> {
  // Same reasoning as acceptInviteAction above: reject an oversized raw
  // token before it's hashed or looked up.
  if (rawToken.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return { error: GENERIC_INVALID_INVITE };
  }

  const invite = await getValidInvite(rawToken);
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

  // rawToken is untrusted, client-originated input (the invitation URL's
  // query string, threaded through as this action's bound first
  // argument). The only trusted property is that tokenHash is derived
  // server-side, right here, from that raw value -- never accepted as a
  // hash directly from FormData or any other client-supplied field.
  const tokenHash = hashInviteToken(rawToken);

  try {
    await db.$transaction(async (tx) => {
      await claimInvite(tx, {
        id: invite.id,
        tokenHash,
        companyId: invite.companyId,
        email: invite.email,
      });

      await tx.companyMembership.upsert({
        where: { userId_companyId: { userId: existingUser.id, companyId: invite.companyId } },
        update: {},
        create: { userId: existingUser.id, companyId: invite.companyId, role: "MEMBER" },
      });
    });
  } catch {
    return { error: GENERIC_INVALID_INVITE };
  }

  redirect("/account");
}
