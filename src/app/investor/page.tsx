import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestorPortfolioData } from "@/lib/investor/queries";
import { getInvestorDocuments } from "@/lib/investor/documents";
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

  return <InvestorPortfolioClient {...data} documents={documents} />;
}
