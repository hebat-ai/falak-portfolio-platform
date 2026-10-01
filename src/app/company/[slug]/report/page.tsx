import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getQuarterlyReportData } from "@/lib/company/quarterly-report";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { QuarterlyReportDocument } from "../../_components/QuarterlyReportDocument";

export default async function QuarterlyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const period = Array.isArray(sp.period) ? sp.period[0] : sp.period;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  if (!period) {
    notFound();
  }

  let data;
  try {
    data = await getQuarterlyReportData(slug, period);
  } catch (error) {
    // Same collapse-to-notFound discipline as /company/[slug]: a
    // ForbiddenError here must never read any differently from an
    // unknown slug/period/unpublished-version null, or this page would
    // leak which companies/periods exist to an unauthorized visitor.
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

  return <QuarterlyReportDocument data={data} />;
}
