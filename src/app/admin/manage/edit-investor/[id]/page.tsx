import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestorForEdit } from "@/lib/admin/entity-edit";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../_components/ManageSubsectionShell";
import { CreateInvestorForm } from "../../_components/CreateInvestorForm";

export default async function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let record;
  try {
    record = await getInvestorForEdit(id);
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
      <CreateInvestorForm investor={record} />
    </ManageSubsectionShell>
  );
}
