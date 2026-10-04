import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import type { Department } from "@/generated/prisma/client";

export type StaffRole = "FALAK_ADMIN" | "FALAK_MANAGEMENT" | "FALAK_OPERATIONS";

export interface StaffUserRow {
  id: string;
  email: string;
  role: StaffRole;
  department: Department | null;
  hasPassword: boolean;
  deactivatedAt: string | null;
}

const STAFF_ROLES: StaffRole[] = ["FALAK_ADMIN", "FALAK_MANAGEMENT", "FALAK_OPERATIONS"];

/**
 * Admin-only. One row per user holding an active Falak-staff role --
 * the "Manage Staff" page's own listing, for editing department,
 * resetting a password, or revoking access. A user with no Falak role
 * at all (a company member or investor) never appears here.
 */
export async function getStaffUsers(): Promise<StaffUserRow[]> {
  await requireFalakRole("FALAK_ADMIN");

  const rows = await db.userRoleAssignment.findMany({
    where: { revokedAt: null, role: { in: STAFF_ROLES } },
    select: {
      role: true,
      user: { select: { id: true, email: true, department: true, passwordHash: true, deactivatedAt: true } },
    },
    orderBy: { user: { email: "asc" } },
  });

  return rows.map((r) => ({
    id: r.user.id,
    email: r.user.email,
    role: r.role as StaffRole,
    department: r.user.department,
    hasPassword: Boolean(r.user.passwordHash),
    deactivatedAt: r.user.deactivatedAt?.toISOString() ?? null,
  }));
}
