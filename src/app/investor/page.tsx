import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestorPortfolioData } from "@/lib/investor/queries";
import { InvestorPortfolioClient } from "./InvestorPortfolioClient";

export default async function InvestorDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  // getInvestorPortfolioData() re-derives the user itself
  // (requireCurrentUser) and never throws ForbiddenError -- zero investor
  // memberships is a valid empty state the client component renders,
  // not a denial.
  const data = await getInvestorPortfolioData();

  return <InvestorPortfolioClient {...data} />;
}
