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
  searchParams: Promise<{ period?: string | string[]; fromVehicle?: string | string[]; from?: string | string[] }>;
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

  const fromVehicle = Array.isArray(sp.fromVehicle) ? sp.fromVehicle[0] : sp.fromVehicle;
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  // Not a security-relevant value (unlike fromVehicle, never used to
  // decide what data to show) -- just which back-link label/href to
  // render, so an unrecognized value simply falls through to the
  // existing default ("/company" register) rather than needing its own
  // validation.
  const from = fromRaw === "admin" || fromRaw === "companies" ? fromRaw : null;

  return (
    <CompanyReportView
      key={`${data.company.id}-${initialPeriodKey}`}
      data={data}
      initialPeriodKey={initialPeriodKey}
      fromVehicleSlug={fromVehicle ?? null}
      from={from}
    />
  );
}
