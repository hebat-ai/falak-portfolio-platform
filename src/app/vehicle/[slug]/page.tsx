import { notFound } from "next/navigation";
import { VehicleDashboardView } from "../_components/VehicleDashboardView";
import { companies } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import { investors, investorVehicleExposures } from "@/lib/mock/investors";

export default async function VehicleDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = vehicles.find((v) => v.slug === slug);

  if (!vehicle) {
    notFound();
  }

  const linkedCompanies = vehicleCompanyLinks
    .filter((link) => link.vehicleId === vehicle.id)
    .map((link) => companies.find((c) => c.id === link.companyId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const linkedInvestors = investorVehicleExposures
    .filter((exposure) => exposure.vehicleId === vehicle.id)
    .map((exposure) => investors.find((inv) => inv.id === exposure.investorId))
    .filter((inv): inv is NonNullable<typeof inv> => Boolean(inv));

  return (
    <VehicleDashboardView vehicle={vehicle} linkedCompanies={linkedCompanies} linkedInvestors={linkedInvestors} />
  );
}
