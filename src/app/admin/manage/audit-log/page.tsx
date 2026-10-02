import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuditEvents } from "@/lib/admin/audit";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { ManageSubsectionShell } from "../_components/ManageSubsectionShell";
import { AuditLogClient } from "../_components/AuditLogClient";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; action?: string | string[] }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const actionParam = Array.isArray(sp.action) ? sp.action[0] : sp.action;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  let data;
  try {
    data = await getAuditEvents(page, actionParam || undefined);
  } catch (error) {
    // FALAK_ADMIN-only -- a FALAK_OPERATIONS caller (who can reach every
    // other /admin/manage subsection) is denied here same as anyone else
    // without the role, collapsed into the same redirect.
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return (
    <ManageSubsectionShell titleKey="auditLogTitle">
      <AuditLogClient data={data} page={page} selectedAction={actionParam ?? ""} />
    </ManageSubsectionShell>
  );
}
