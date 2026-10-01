"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import { sendAccessApprovedEmail } from "@/lib/email/send-email";
import type { PlatformRole } from "@/generated/prisma/client";

// Plain (formData) => void actions posted by per-row <form>s, same shape as
// the archive actions in ../actions.ts: an unauthenticated caller is sent
// to /sign-in, a non-admin is a silent no-op (there's no inline error
// channel), and Next refreshes /admin/access afterwards so the row goes.
async function requireAdminForForm(): Promise<{ id: string } | null> {
  try {
    const { user } = await requireFalakRole("FALAK_ADMIN");
    return user;
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return null;
    }
    throw error;
  }
}

function readId(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" && value ? value : null;
}

// Every revoke is one conditional updateMany pinning "not already revoked"
// (and, for invites, "not already accepted"), so a double-click or two
// admins acting at once revoke exactly once -- and the audit event is
// written only when a row actually changed.

export async function revokeCompanyMembershipAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "membershipId");
  if (!admin || !id) return;

  await db.$transaction(async (tx) => {
    const result = await tx.companyMembership.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) return;
    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "company_membership.revoked",
      targetType: "CompanyMembership",
      targetId: id,
    });
  });
}

export async function revokeInvestorMembershipAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "membershipId");
  if (!admin || !id) return;

  await db.$transaction(async (tx) => {
    const result = await tx.investorMembership.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) return;
    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "investor_membership.revoked",
      targetType: "InvestorMembership",
      targetId: id,
    });
  });
}

export async function revokeCompanyInviteAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "inviteId");
  if (!admin || !id) return;

  await db.$transaction(async (tx) => {
    const result = await tx.companyInvite.updateMany({
      where: { id, revokedAt: null, acceptedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) return;
    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "invite.revoked",
      targetType: "CompanyInvite",
      targetId: id,
    });
  });
}

export async function revokeInvestorInviteAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "inviteId");
  if (!admin || !id) return;

  await db.$transaction(async (tx) => {
    const result = await tx.investorInvite.updateMany({
      where: { id, revokedAt: null, acceptedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) return;
    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "investor_invite.revoked",
      targetType: "InvestorInvite",
      targetId: id,
    });
  });
}

const GRANTABLE_ROLES: PlatformRole[] = ["FALAK_ADMIN", "FALAK_OPERATIONS"];

function isGrantableFalakRole(value: string): value is "FALAK_ADMIN" | "FALAK_OPERATIONS" {
  return (GRANTABLE_ROLES as string[]).includes(value);
}

/**
 * Approving means choosing the real grant, not just acknowledging the
 * request -- the admin picks a Falak role or types/confirms an investor
 * organization name right there in the form (see AccessClient.tsx), which
 * can differ from what was merely requested. Same atomic-conditional-
 * updateMany-first discipline as every other state transition in this
 * codebase: the AccessRequest's own claim (Pending -> Approved) is what
 * actually authorizes everything that follows in the transaction, exactly
 * like claimInvite's role in acceptInviteAction.
 */
export async function approveAccessRequestAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "requestId");
  if (!admin || !id) return;

  const grantInput = formData.get("grant");
  const grant = typeof grantInput === "string" ? grantInput : null;
  if (grant !== "FALAK_ADMIN" && grant !== "FALAK_OPERATIONS" && grant !== "INVESTOR") return;

  const orgNameInput = formData.get("organizationName");
  const organizationName = typeof orgNameInput === "string" ? orgNameInput.trim() : "";
  if (grant === "INVESTOR" && !organizationName) return;

  let approvedEmail: string | null = null;

  await db.$transaction(async (tx) => {
    const claimed = await tx.accessRequest.updateMany({
      where: { id, status: "Pending" },
      data: { status: "Approved", decidedAt: new Date(), decidedById: admin.id },
    });
    // Someone else already decided this request (another admin, or a
    // double-submit) -- the real authorization for everything below, same
    // reasoning as every other conditional updateMany in this codebase.
    if (claimed.count !== 1) return;

    const request = await tx.accessRequest.findUniqueOrThrow({ where: { id }, select: { email: true } });

    let user = await tx.user.findUnique({ where: { email: request.email } });
    if (!user) {
      user = await tx.user.create({ data: { email: request.email } });
    }

    if (isGrantableFalakRole(grant)) {
      // No flat @@unique(userId, role) exists on UserRoleAssignment (see
      // its schema comment: a re-grant after revocation would collide
      // with the old revoked row) -- check-then-create is the correct
      // shape here, not upsert.
      const existingActive = await tx.userRoleAssignment.findFirst({
        where: { userId: user.id, role: grant, revokedAt: null },
        select: { id: true },
      });
      if (!existingActive) {
        await tx.userRoleAssignment.create({ data: { userId: user.id, role: grant } });
      }
    } else {
      // INVESTOR: match an existing org case-insensitively, or create one.
      // nameAr defaults equal to nameEn and type defaults to Institutional,
      // both pending manual correction by an admin -- the same bootstrap
      // shortcut this project already takes for other admin-entered
      // fields, since a public sign-up form has no reliable way to collect
      // the Arabic name or the precise investor type itself.
      let investor = await tx.investor.findFirst({
        where: { nameEn: { equals: organizationName, mode: "insensitive" }, archivedAt: null },
      });
      if (!investor) {
        investor = await tx.investor.create({
          data: { nameEn: organizationName, nameAr: organizationName, type: "Institutional" },
        });
      }
      await tx.investorMembership.upsert({
        where: { investorId_userId: { investorId: investor.id, userId: user.id } },
        update: { revokedAt: null },
        create: { investorId: investor.id, userId: user.id, role: "MEMBER" },
      });
    }

    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "access_request.approved",
      targetType: "AccessRequest",
      targetId: id,
      meta: { grant, organizationName: grant === "INVESTOR" ? organizationName : undefined },
    });

    approvedEmail = request.email;
  });

  if (approvedEmail) {
    try {
      await sendAccessApprovedEmail(approvedEmail);
    } catch {
      // The grant already succeeded and committed -- a failed notification
      // email is a real but separate failure, never rolled back into the
      // approval itself (same reasoning as every other best-effort
      // notification in this codebase).
    }
  }
}

export async function rejectAccessRequestAction(formData: FormData): Promise<void> {
  const admin = await requireAdminForForm();
  const id = readId(formData, "requestId");
  if (!admin || !id) return;

  await db.$transaction(async (tx) => {
    const result = await tx.accessRequest.updateMany({
      where: { id, status: "Pending" },
      data: { status: "Rejected", decidedAt: new Date(), decidedById: admin.id },
    });
    if (result.count !== 1) return;
    await writeAuditEvent(tx, {
      actorId: admin.id,
      action: "access_request.rejected",
      targetType: "AccessRequest",
      targetId: id,
    });
  });
}
