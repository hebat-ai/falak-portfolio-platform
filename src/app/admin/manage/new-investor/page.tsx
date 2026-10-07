import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { CreateInvestorForm } from "../_components/CreateInvestorForm";
import { ArchivableList } from "../_components/ArchivableList";
import { archiveInvestorAction } from "../../actions";
import { NewEntityWithList } from "../_components/NewEntityWithList";

export default async function NewInvestorPage() {
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
    <ManageSubsectionShell titleKey="createInvestorTitle">
      <NewEntityWithList listTitleKey="investorsListTitle">
        <CreateInvestorForm />
        <ArchivableList items={data.investors} action={archiveInvestorAction} fieldName="investorId" editBasePath="/admin/manage/edit-investor" />
      </NewEntityWithList>
    </ManageSubsectionShell>
  );
}
