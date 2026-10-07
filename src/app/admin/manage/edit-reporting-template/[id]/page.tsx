import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getReportingTemplateForEdit } from "@/lib/admin/template-edit";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../_components/ManageSubsectionShell";
import { EditReportingTemplateForm } from "../../_components/EditReportingTemplateForm";

export default async function EditReportingTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let template;
  try {
    template = await getReportingTemplateForEdit(id);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }
  if (!template) {
    notFound();
  }

  return (
    <ManageSubsectionShell titleKey="editTemplateTitle">
      <EditReportingTemplateForm template={template} />
    </ManageSubsectionShell>
  );
}
