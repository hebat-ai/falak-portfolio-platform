import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export interface ViewerNavFlags {
  isFalakStaff: boolean;
  isCompanyMember: boolean;
  isInvestorMember: boolean;
}

const NONE: ViewerNavFlags = { isFalakStaff: false, isCompanyMember: false, isInvestorMember: false };

/**
 * Cheap, existence-only checks ("does this user hold ANY active
 * membership of this kind at all, for ANY company/investor") -- used
 * ONLY to decide which Sidebar links to even show. This is never a
 * substitute for the real, resource-scoped requireFalakRole/
 * requireCompanyMembership/requireInvestorMembership checks every page
 * itself still runs independently: a false positive here only shows a
 * link that the page's own real check would still correctly reject, and
 * a false negative only hides a link, never a page.
 */
export async function getViewerNavFlags(): Promise<ViewerNavFlags> {
  const user = await getCurrentUser();
  if (!user) return NONE;

  const [falakRole, companyMembership, investorMembership] = await Promise.all([
    db.userRoleAssignment.findFirst({
      where: { userId: user.id, role: { in: ["FALAK_ADMIN", "FALAK_OPERATIONS"] }, revokedAt: null },
      select: { id: true },
    }),
    db.companyMembership.findFirst({
      where: { userId: user.id, revokedAt: null, company: { archivedAt: null } },
      select: { id: true },
    }),
    db.investorMembership.findFirst({
      where: { userId: user.id, revokedAt: null, investor: { archivedAt: null } },
      select: { id: true },
    }),
  ]);

  return {
    isFalakStaff: falakRole !== null,
    isCompanyMember: companyMembership !== null,
    isInvestorMember: investorMembership !== null,
  };
}
