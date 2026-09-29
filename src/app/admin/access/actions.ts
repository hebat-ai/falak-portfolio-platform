"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";

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
