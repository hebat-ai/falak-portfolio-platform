import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { getPortfolioValuationData } from "@/lib/admin/valuations";
import { getPortfolioAlerts } from "@/lib/admin/alerts";
import { getPortfolioBenchmarks, type CompanyBenchmark } from "@/lib/admin/benchmarking";
import { getPortfolioTrend } from "@/lib/admin/portfolio-trend";
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
  let trend;
  let benchmarksByPeriod: Record<string, CompanyBenchmark[]> = {};
  try {
    [data, valuationData, alerts, trend] = await Promise.all([
      getAdminPortfolioData(),
      getPortfolioValuationData(),
      getPortfolioAlerts(),
      getPortfolioTrend(),
    ]);
    const benchmarkEntries = await Promise.all(
      data.periods.map(async (p) => [p.key, await getPortfolioBenchmarks(p.key)] as const)
    );
    benchmarksByPeriod = Object.fromEntries(benchmarkEntries);
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

  return (
    <PortfolioDashboardClient
      {...data}
      valuationData={valuationData}
      alerts={alerts}
      trend={trend}
      benchmarksByPeriod={benchmarksByPeriod}
    />
  );
}
