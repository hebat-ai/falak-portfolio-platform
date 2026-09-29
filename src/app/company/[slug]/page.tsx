import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCompanyReportData } from "@/lib/company/queries";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { CompanyReportView } from "../_components/CompanyReportView";

export default async function CompanyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  let data;
  try {
    data = await getCompanyReportData(slug);
  } catch (error) {
    // ForbiddenError collapses into the same notFound() as an unknown
    // slug -- this page must never reveal which real company slugs exist
    // to a visitor who isn't authorized to see them (same discipline as
    // /submit/[slug]). UnauthenticatedError is defensive only, since the
    // getCurrentUser() check above already redirected that case.
    if (error instanceof ForbiddenError) {
      notFound();
    }
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    throw error;
  }

  if (!data) {
    notFound();
  }

  const requestedPeriod = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const initialPeriodKey =
    requestedPeriod && data.company.periods[requestedPeriod]
      ? requestedPeriod
      : (data.periods[data.periods.length - 1]?.key ?? "");

  return <CompanyReportView key={`${data.company.id}-${initialPeriodKey}`} data={data} initialPeriodKey={initialPeriodKey} />;
}
