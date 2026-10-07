import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { CreateReportingTemplateForm } from "../_components/CreateReportingTemplateForm";
import { NewEntityWithList } from "../_components/NewEntityWithList";
import { TemplateList } from "../_components/TemplateList";

export default async function NewReportingTemplatePage() {
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
    <ManageSubsectionShell titleKey="createTemplateTitle">
      <NewEntityWithList listTitleKey="templatesListTitle">
        <CreateReportingTemplateForm />
        <TemplateList templates={data.templates} />
      </NewEntityWithList>
    </ManageSubsectionShell>
  );
}
