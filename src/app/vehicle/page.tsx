import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVehicleDirectoryData } from "@/lib/vehicle/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { VehicleDirectoryClient } from "./_components/VehicleDirectoryClient";

export default async function VehicleDirectoryPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let vehicles;
  try {
    vehicles = await getVehicleDirectoryData();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return <VehicleDirectoryClient vehicles={vehicles} />;
}
