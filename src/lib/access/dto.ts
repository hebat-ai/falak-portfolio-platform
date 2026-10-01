import type { CompanyMembershipRole, InvestorMembershipRole, AccessRequestedRole } from "@/generated/prisma/client";

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

export interface AccessRequestDTO {
  id: string;
  email: string;
  requestedRole: AccessRequestedRole;
  organizationName: string | null;
  message: string | null;
  createdAt: string;
}

export interface AccessData {
  companies: AccessOrgDTO[];
  investors: AccessOrgDTO[];
  pendingRequests: AccessRequestDTO[];
  // FALAK_OPERATIONS may view; only FALAK_ADMIN may revoke/approve/reject.
  // A UI hint only -- each action re-checks FALAK_ADMIN itself.
  canRevoke: boolean;
}
