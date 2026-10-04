import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { getInvestorVehicleAssignments } from "@/lib/admin/investor-vehicle-assignments";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { LinkInvestorToVehicleForm } from "../_components/LinkInvestorToVehicleForm";
import { InvestorVehicleAssignmentsTable } from "../_components/InvestorVehicleAssignmentsTable";

export default async function InvestorVehicleAssignmentPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  let assignments;
  try {
    [data, assignments] = await Promise.all([getAdminPortfolioData(), getInvestorVehicleAssignments()]);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return (
    <ManageSubsectionShell titleKey="investorVehicleAssignmentTitle">
      <div className="space-y-6">
        <LinkInvestorToVehicleForm investors={data.investors} vehicles={data.vehicles} />
        <InvestorVehicleAssignmentsTable rows={assignments} />
      </div>
    </ManageSubsectionShell>
  );
}
