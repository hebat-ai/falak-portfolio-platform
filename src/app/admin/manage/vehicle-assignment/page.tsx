import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { LinkVehicleToCompanyForm } from "../_components/LinkVehicleToCompanyForm";

export default async function VehicleAssignmentPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  try {
    data = await getAdminPortfolioData();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return (
    <ManageSubsectionShell titleKey="vehicleAssignmentTitle">
      <LinkVehicleToCompanyForm companies={data.companies} vehicles={data.vehicles} />
    </ManageSubsectionShell>
  );
}
