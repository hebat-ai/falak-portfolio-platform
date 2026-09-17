import { notFound } from "next/navigation";
import { CompanyReportView } from "../_components/CompanyReportView";
import { companies, REPORTING_PERIODS_ORDER, isReportingPeriod } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import type { ReportingPeriod } from "@/lib/mock/types";

export default async function CompanyReportPage({
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

  const linkedVehicles = vehicleCompanyLinks
    .filter((link) => link.companyId === company.id)
    .map((link) => vehicles.find((v) => v.id === link.vehicleId))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const requestedPeriod = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const initialPeriod: ReportingPeriod = isReportingPeriod(requestedPeriod)
    ? requestedPeriod
    : REPORTING_PERIODS_ORDER[REPORTING_PERIODS_ORDER.length - 1];

  return (
    <CompanyReportView
      key={`${company.id}-${initialPeriod}`}
      company={company}
      linkedVehicles={linkedVehicles}
      initialPeriod={initialPeriod}
    />
  );
}
