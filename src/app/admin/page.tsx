import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminPortfolioData } from "@/lib/admin/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { AdminOverviewClient } from "./AdminOverviewClient";

export default async function AdminOverviewPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  try {
    data = await getAdminPortfolioData();
  } catch (error) {
    // ForbiddenError: authenticated, but not FALAK_ADMIN/FALAK_OPERATIONS.
    // UnauthenticatedError: defensive only (the getCurrentUser() check
    // above already redirects this case) -- handled the same way in case
    // the session changes between the two calls.
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return <AdminOverviewClient {...data} />;
}
