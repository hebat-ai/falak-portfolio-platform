import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVehicleForEdit } from "@/lib/admin/entity-edit";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../_components/ManageSubsectionShell";
import { CreateVehicleForm } from "../../_components/CreateVehicleForm";
import { DeleteEntityForm } from "../../_components/DeleteEntityForm";
import { requireFalakRoleWithDepartmentScope } from "@/lib/auth/department-scope";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let record;
  let isAdmin = false;
  try {
    record = await getVehicleForEdit(id);
    // Only Admin may delete a vehicle.
    isAdmin = (await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS")).role === "FALAK_ADMIN";
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }
  if (!record) {
    notFound();
  }

  return (
    <ManageSubsectionShell titleKey="editVehicleTitle">
      <div className="flex flex-col gap-8">
        <CreateVehicleForm vehicle={record} />
        {isAdmin ? <DeleteEntityForm kind="vehicle" id={record.id} nameEn={record.nameEn} /> : null}
      </div>
    </ManageSubsectionShell>
  );
}
