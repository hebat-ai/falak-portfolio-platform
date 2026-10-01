import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import type { AccessData, AccessOrgDTO, AccessRequestDTO } from "./dto";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface OrgRow {
  id: string;
  nameEn: string;
  nameAr: string;
  memberships: { id: string; role: AccessOrgDTO["members"][number]["role"]; joinedAt: Date; user: { email: string } }[];
  invites: { id: string; email: string; createdAt: Date; expiresAt: Date }[];
}

function toOrgDTO(org: OrgRow): AccessOrgDTO {
  return {
    id: org.id,
    nameEn: org.nameEn,
    nameAr: org.nameAr,
    members: org.memberships.map((m) => ({
      id: m.id,
      email: m.user.email,
      role: m.role,
      joinedAt: toDateOnly(m.joinedAt),
    })),
    invites: org.invites.map((i) => ({
      id: i.id,
      email: i.email,
      createdAt: toDateOnly(i.createdAt),
      expiresAt: toDateOnly(i.expiresAt),
    })),
  };
}

/**
 * Every non-archived company and investor org with its active members and
 * pending invites, for /admin/access. Falak staff only (OPERATIONS may
 * view); canRevoke is true only for FALAK_ADMIN.
 */
export async function getAccessData(): Promise<AccessData> {
  const { role } = await requireFalakRole("FALAK_OPERATIONS");
  const now = new Date();

  const orgSelect = {
    id: true,
    nameEn: true,
    nameAr: true,
    memberships: {
      where: { revokedAt: null },
      orderBy: { joinedAt: "asc" as const },
      select: { id: true, role: true, joinedAt: true, user: { select: { email: true } } },
    },
    invites: {
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" as const },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
    },
  };

  const [companies, investors, pendingRequests] = await Promise.all([
    db.company.findMany({ where: { archivedAt: null }, orderBy: { nameEn: "asc" }, select: orgSelect }),
    db.investor.findMany({ where: { archivedAt: null }, orderBy: { nameEn: "asc" }, select: orgSelect }),
    db.accessRequest.findMany({
      where: { status: "Pending" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, requestedRole: true, organizationName: true, message: true, createdAt: true },
    }),
  ]);

  return {
    companies: companies.map(toOrgDTO),
    investors: investors.map(toOrgDTO),
    pendingRequests: pendingRequests.map(
      (r): AccessRequestDTO => ({
        id: r.id,
        email: r.email,
        requestedRole: r.requestedRole,
        organizationName: r.organizationName,
        message: r.message,
        createdAt: toDateOnly(r.createdAt),
      })
    ),
    canRevoke: role === "FALAK_ADMIN",
  };
}
