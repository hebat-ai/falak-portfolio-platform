import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStaffUsers } from "@/lib/admin/staff";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { InviteStaffUserForm } from "../_components/InviteStaffUserForm";
import { StaffUsersTable } from "../_components/StaffUsersTable";

export default async function ManageStaffPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let rows;
  try {
    rows = await getStaffUsers();
  } catch (error) {
    // FALAK_ADMIN-only -- same collapse-to-/account pattern as
    // audit-log/page.tsx for a caller without the role.
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return (
    <ManageSubsectionShell titleKey="manageStaffTitle">
      <div className="flex flex-col gap-6">
        <InviteStaffUserForm />
        <StaffUsersTable rows={rows} />
      </div>
    </ManageSubsectionShell>
  );
}
