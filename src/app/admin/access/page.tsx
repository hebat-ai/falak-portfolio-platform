import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAccessData } from "@/lib/access/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { AccessClient } from "./_components/AccessClient";

export default async function AccessManagementPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  try {
    data = await getAccessData();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      redirect("/account");
    }
    throw error;
  }

  return <AccessClient {...data} />;
}
