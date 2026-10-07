import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { CreateVehicleForm } from "../_components/CreateVehicleForm";
import { ArchivableList } from "../_components/ArchivableList";
import { archiveVehicleAction } from "../../actions";
import { NewEntityWithList } from "../_components/NewEntityWithList";

export default async function NewVehiclePage() {
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
    <ManageSubsectionShell titleKey="createVehicleTitle">
      <NewEntityWithList listTitleKey="vehiclesListTitle">
        <CreateVehicleForm />
        <ArchivableList items={data.vehicles} action={archiveVehicleAction} fieldName="vehicleId" editBasePath="/admin/manage/edit-vehicle" />
      </NewEntityWithList>
    </ManageSubsectionShell>
  );
}
