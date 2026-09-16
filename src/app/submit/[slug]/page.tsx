import { notFound } from "next/navigation";
import { StartupReportForm } from "../_components/StartupReportForm";
import { companies, REPORTING_PERIODS_ORDER } from "@/lib/mock/companies";
import type { ReportingPeriod } from "@/lib/mock/types";

function isReportingPeriod(value: string | undefined): value is ReportingPeriod {
  return value !== undefined && (REPORTING_PERIODS_ORDER as readonly string[]).includes(value);
}

// Prototype only: any valid company slug resolves here with no authentication
// or authorization check at all. A real implementation would validate a
// scoped, expiring submission token (per the original access-control plan),
// not a publicly-guessable company slug.
export default async function SubmitReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const company = companies.find((c) => c.slug === slug);

  if (!company) {
    notFound();
  }

  const requestedPeriod = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const initialPeriod: ReportingPeriod = isReportingPeriod(requestedPeriod)
    ? requestedPeriod
    : REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1];

  return <StartupReportForm company={company} initialPeriod={initialPeriod} />;
}
