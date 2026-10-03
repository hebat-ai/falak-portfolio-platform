import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVehicleDashboardData } from "@/lib/vehicle/queries";
import { getVehicleNavSummary } from "@/lib/vehicle/nav";
import { getVehicleCapitalSummary } from "@/lib/vehicle/capital";
import { getPortfolioAlerts } from "@/lib/admin/alerts";
import { getCompanyPerformanceTrends } from "@/lib/admin/company-trends";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { VehicleDashboardView } from "../_components/VehicleDashboardView";

export default async function VehicleDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  // Falak-staff-only, same as /admin: a non-staff visitor is redirected
  // rather than 404'd, since there is no member-vs-stranger slug-leak
  // concern when no non-staff user can see any vehicle at all.
  let data;
  let nav;
  let capital;
  let alerts;
  let companyTrends;
  try {
    data = await getVehicleDashboardData(slug);
    if (data) {
      const companyIds = data.companies.map((c) => c.id);
      [nav, capital, alerts, companyTrends] = await Promise.all([
        getVehicleNavSummary(data.vehicle.id),
        getVehicleCapitalSummary(data.vehicle.id),
        getPortfolioAlerts(companyIds),
        getCompanyPerformanceTrends(companyIds),
      ]);
    }
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  if (!data || !nav || !capital || !alerts || !companyTrends) {
    notFound();
  }

  return <VehicleDashboardView {...data} nav={nav} capital={capital} alerts={alerts} companyTrends={companyTrends} />;
}
