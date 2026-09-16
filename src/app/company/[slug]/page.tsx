import { notFound } from "next/navigation";
import { CompanyReportView } from "../_components/CompanyReportView";
import { companies } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";

export default async function CompanyReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = companies.find((c) => c.slug === slug);

  if (!company) {
    notFound();
  }

  const linkedVehicles = vehicleCompanyLinks
    .filter((link) => link.companyId === company.id)
    .map((link) => vehicles.find((v) => v.id === link.vehicleId))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return <CompanyReportView company={company} linkedVehicles={linkedVehicles} />;
}
