import "server-only";
import { db } from "@/lib/db";

/**
 * Non-throwing counterpart to authorization.ts's require*() functions --
 * used only to pick where a signed-in visitor lands on "/", never as an
 * authorization decision itself (every destination page re-derives its
 * own access with the real require*() checks regardless of how the
 * visitor arrived there). Checked in the same precedence
 * requireFalakRole's own ADMIN-over-OPERATIONS resolution implies: Falak
 * staff first, then investor, then company membership, since a person
 * could in principle hold more than one -- Falak staff access is the
 * "most privileged" landing and takes priority. Falls back to "/account"
 * (the pending-approval landing) when none apply.
 */
export async function resolveLandingPath(userId: string): Promise<string> {
  const falakRoles = await db.userRoleAssignment.findMany({
    where: { userId, role: { in: ["FALAK_ADMIN", "FALAK_MANAGEMENT", "FALAK_OPERATIONS"] }, revokedAt: null },
    select: { role: true },
  });
  if (falakRoles.some((r) => r.role === "FALAK_ADMIN" || r.role === "FALAK_MANAGEMENT")) {
    return "/admin";
  }
  // The Portfolio Dashboard is Admin/Management-only; an Investment
  // Professional starts on Company Reports instead.
  if (falakRoles.length > 0) {
    return "/company";
  }

  const investorMembership = await db.investorMembership.findFirst({
    where: { userId, revokedAt: null, investor: { archivedAt: null } },
    select: { id: true },
  });
  if (investorMembership) {
    return "/investor";
  }

  const companyMembership = await db.companyMembership.findFirst({
    where: { userId, revokedAt: null, company: { archivedAt: null } },
    select: { id: true },
  });
  if (companyMembership) {
    return "/submit";
  }

  return "/account";
}
