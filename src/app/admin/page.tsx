import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { getPortfolioValuationData } from "@/lib/admin/valuations";
import { getPortfolioAlerts } from "@/lib/admin/alerts";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { PortfolioDashboardClient } from "./PortfolioDashboardClient";

export default async function PortfolioDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  let valuationData;
  let alerts;
  try {
    [data, valuationData, alerts] = await Promise.all([
      getAdminPortfolioData(),
      getPortfolioValuationData(),
      getPortfolioAlerts(),
    ]);
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

  return <PortfolioDashboardClient {...data} valuationData={valuationData} alerts={alerts} />;
}
