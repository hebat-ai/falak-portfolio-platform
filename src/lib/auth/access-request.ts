import "server-only";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/utils";
import type { AccessRequestedRole } from "@/generated/prisma/client";

export interface SubmitAccessRequestInput {
  email: string;
  requestedRole: AccessRequestedRole;
  organizationName?: string;
  message?: string;
}

export type SubmitAccessRequestResult =
  | { ok: true }
  | { ok: false; reason: "existing_account" | "already_pending" };

/**
 * Creates an AccessRequest for a brand-new email, or returns a generic
 * "can't submit" result for the two cases that must never be granted a
 * second request: an email that already has a User row (sign in instead,
 * never create a duplicate account), or an email with an already-Pending
 * request (the partial unique index in the migration SQL is the real
 * enforcement; this check exists purely to return a friendly result
 * instead of a thrown DB constraint error). Both cases return the SAME
 * shape of information to the caller -- which one occurred is not secret
 * (unlike sign-in's enumeration-safety rule, this form's own success
 * message already implies "no account exists yet"), but collapsing them
 * keeps the Server Action's error handling simple and matches this
 * codebase's existing preference for one generic outcome per failure
 * class.
 */
export async function submitAccessRequest(input: SubmitAccessRequestInput): Promise<SubmitAccessRequestResult> {
  const email = normalizeEmail(input.email);

  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return { ok: false, reason: "existing_account" };
  }

  const existingPending = await db.accessRequest.findFirst({
    where: { email, status: "Pending" },
    select: { id: true },
  });
  if (existingPending) {
    return { ok: false, reason: "already_pending" };
  }

  const organizationName = input.organizationName?.trim();
  const message = input.message?.trim();

  await db.accessRequest.create({
    data: {
      email,
      requestedRole: input.requestedRole,
      organizationName: organizationName ? organizationName : null,
      message: message ? message : null,
    },
  });

  return { ok: true };
}
