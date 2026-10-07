import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getReportingRequestDetail } from "@/lib/admin/reporting-request-detail";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../../../../_components/ManageSubsectionShell";
import { RequestDetailClient } from "../../../../_components/RequestDetailClient";

export default async function ReportingRequestPage({
  params,
}: {
  params: Promise<{ templateId: string; periodStart: string; periodEnd: string }>;
}) {
  const { templateId, periodStart, periodEnd } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let detail;
  try {
    detail = await getReportingRequestDetail(templateId, periodStart, periodEnd);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }
  if (!detail) {
    notFound();
  }

  return (
    <ManageSubsectionShell titleKey="requestDetailTitle">
      <RequestDetailClient detail={detail} />
    </ManageSubsectionShell>
  );
}
