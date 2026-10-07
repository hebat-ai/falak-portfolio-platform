import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStaffEntryCycle } from "@/lib/reporting/staff-entry";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../../../_components/ManageSubsectionShell";
import { StaffEntryClient } from "../../_components/StaffEntryClient";

export default async function StaffEntryPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let entry;
  try {
    entry = await getStaffEntryCycle(cycleId);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }
  if (!entry) {
    notFound();
  }

  return (
    <ManageSubsectionShell titleKey="requestEntryTitle">
      <StaffEntryClient entry={entry} />
    </ManageSubsectionShell>
  );
}
