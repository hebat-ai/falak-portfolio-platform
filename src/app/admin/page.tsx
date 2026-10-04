import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPortfolioOverviewData } from "@/lib/admin/portfolio-overview";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { PortfolioOverviewClient } from "./PortfolioOverviewClient";

export default async function PortfolioDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let raw;
  try {
    raw = await getPortfolioOverviewData();
  } catch (error) {
    // ForbiddenError: authenticated, but not FALAK_ADMIN/FALAK_OPERATIONS.
    // UnauthenticatedError: defensive only (the getCurrentUser() check
    // above already redirects this case) -- handled the same way in case
    // the session changes between the two calls.
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return <PortfolioOverviewClient raw={raw} />;
}
