import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCompanyListData } from "@/lib/admin/company-list";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { CompanyListClient } from "./CompanyListClient";

export default async function CompanyListPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let companies;
  try {
    companies = await getCompanyListData();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return <CompanyListClient companies={companies} />;
}
