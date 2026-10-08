import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestorForEdit } from "@/lib/admin/entity-edit";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../_components/ManageSubsectionShell";
import { CreateInvestorForm } from "../../_components/CreateInvestorForm";
import { DeleteEntityForm } from "../../_components/DeleteEntityForm";
import { requireFalakRoleWithDepartmentScope } from "@/lib/auth/department-scope";

export default async function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let record;
  let isAdmin = false;
  try {
    record = await getInvestorForEdit(id);
    // Only Admin may delete an investor.
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
    <ManageSubsectionShell titleKey="editInvestorTitle">
      <div className="flex flex-col gap-8">
        <CreateInvestorForm investor={record} />
        {isAdmin ? <DeleteEntityForm kind="investor" id={record.id} nameEn={record.nameEn} /> : null}
      </div>
    </ManageSubsectionShell>
  );
}
