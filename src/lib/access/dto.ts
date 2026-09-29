import type { CompanyMembershipRole, InvestorMembershipRole } from "@/generated/prisma/client";

export interface AccessMemberDTO {
  id: string;
  email: string;
  role: CompanyMembershipRole | InvestorMembershipRole;
  joinedAt: string;
}

// Pending = not accepted, not revoked, not yet expired -- the only invites
// whose link still works, and so the only ones worth cancelling.
export interface AccessInviteDTO {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface AccessOrgDTO {
  id: string;
  nameEn: string;
  nameAr: string;
  members: AccessMemberDTO[];
  invites: AccessInviteDTO[];
}

export interface AccessData {
  companies: AccessOrgDTO[];
  investors: AccessOrgDTO[];
  // FALAK_OPERATIONS may view; only FALAK_ADMIN may revoke. A UI hint
  // only -- each revoke action re-checks FALAK_ADMIN itself.
  canRevoke: boolean;
}
