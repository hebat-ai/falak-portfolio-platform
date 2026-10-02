import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestorPortfolioData } from "@/lib/investor/queries";
import { getInvestorDocuments } from "@/lib/investor/documents";
import { getInvestorReturns, type InvestorReturnSummary } from "@/lib/investor/returns";
import { InvestorPortfolioClient } from "./InvestorPortfolioClient";

export default async function InvestorDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  // Both re-derive the user themselves (requireCurrentUser) and never
  // throw ForbiddenError -- zero investor memberships is a valid empty
  // state the client component renders, not a denial.
  const [data, documents] = await Promise.all([getInvestorPortfolioData(), getInvestorDocuments()]);

  // One getInvestorReturns call per org this user belongs to (each
  // re-verifies its own InvestorMembership) -- the client picks which
  // org's returns to show by the same orgId selector everything else on
  // this page already uses.
  const returnsByOrgId: Record<string, InvestorReturnSummary[]> = {};
  await Promise.all(
    data.orgs.map(async (org) => {
      returnsByOrgId[org.id] = await getInvestorReturns(org.id);
    })
  );

  return <InvestorPortfolioClient {...data} documents={documents} returnsByOrgId={returnsByOrgId} />;
}
