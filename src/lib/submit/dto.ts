import type { CompanyMembershipRole, SubmissionStatus } from "@/generated/prisma/client";

// The company's current reporting period -- its most recent cycle by
// periodStart, the same rule /submit/[slug] uses
// (getCurrentSubmissionForCompanyMember). null when the company has no
// cycles yet. A cycle with no submission row reads as "draft".
export interface MyCompanyCurrentPeriod {
  label: string;
  status: SubmissionStatus;
  currentDeadline: string;
}

export interface MyCompanyDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  role: CompanyMembershipRole;
  currentPeriod: MyCompanyCurrentPeriod | null;
}
