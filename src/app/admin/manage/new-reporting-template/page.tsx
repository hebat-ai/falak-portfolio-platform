import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireFalakRole } from "@/lib/auth/authorization";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { CreateReportingTemplateForm } from "../_components/CreateReportingTemplateForm";

export default async function NewReportingTemplatePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  try {
    await requireFalakRole("FALAK_OPERATIONS");
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return (
    <ManageSubsectionShell titleKey="createTemplateTitle">
      <CreateReportingTemplateForm />
    </ManageSubsectionShell>
  );
}
