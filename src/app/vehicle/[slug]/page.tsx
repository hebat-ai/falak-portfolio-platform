import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVehicleDashboardData } from "@/lib/vehicle/queries";
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
  try {
    data = await getVehicleDashboardData(slug);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  if (!data) {
    notFound();
  }

  return <VehicleDashboardView {...data} />;
}
