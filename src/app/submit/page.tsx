import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyCompaniesData } from "@/lib/submit/queries";
import { UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { MyCompaniesClient } from "./_components/MyCompaniesClient";

export default async function MyCompaniesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  // Never throws ForbiddenError: an authenticated user with no company
  // memberships is a valid empty state the client renders.
  let companies;
  try {
    companies = await getMyCompaniesData();
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    throw error;
  }

  return <MyCompaniesClient companies={companies} />;
}
