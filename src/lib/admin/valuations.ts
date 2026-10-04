import "server-only";
import { db } from "@/lib/db";
import { requireFalakRoleWithDepartmentScope } from "@/lib/auth/department-scope";
import type {
  PortfolioValuationData,
  AdminCompanyValuationDTO,
  AdminVehicleValuationDTO,
} from "./dto";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Falak-staff-only (same gate as getAdminPortfolioData). "Latest row per
 * group" is done with Prisma's distinct + orderBy together -- distinct
 * keeps the first row it sees per key, and orderBy desc makes that first
 * row the most recent one, so this is one query per table, no JS
 * reduction needed.
 */
export async function getPortfolioValuationData(): Promise<PortfolioValuationData> {
  const scope = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS");
  const deptWhere = scope.departments ? { department: { in: scope.departments } } : {};

  const [companies, latestCompanyValuations, vehicles, latestVehicleNavs] = await Promise.all([
    db.company.findMany({
      where: { archivedAt: null, ...deptWhere },
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, nameAr: true },
    }),
    db.companyValuationSnapshot.findMany({
      where: { company: { archivedAt: null, ...deptWhere } },
      orderBy: { asOfDate: "desc" },
      distinct: ["companyId"],
      select: { companyId: true, asOfDate: true, valuationAmount: true, currency: true, valuationType: true },
    }),
    db.vehicle.findMany({
      where: { archivedAt: null, ...deptWhere },
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, nameAr: true },
    }),
    db.vehicleNavSnapshot.findMany({
      where: { vehicle: { archivedAt: null, ...deptWhere } },
      orderBy: { asOfDate: "desc" },
      distinct: ["vehicleId"],
      select: { vehicleId: true, asOfDate: true, navAmount: true, currency: true },
    }),
  ]);

  const companyValuationByCompanyId = new Map(latestCompanyValuations.map((v) => [v.companyId, v]));
  const navByVehicleId = new Map(latestVehicleNavs.map((v) => [v.vehicleId, v]));

  const companyDTOs: AdminCompanyValuationDTO[] = companies.map((c) => {
    const latest = companyValuationByCompanyId.get(c.id);
    return {
      id: c.id,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      latest: latest
        ? {
            asOfDate: toDateOnly(latest.asOfDate),
            amount: latest.valuationAmount.toNumber(),
            currency: latest.currency,
            valuationType: latest.valuationType,
          }
        : null,
    };
  });

  const vehicleDTOs: AdminVehicleValuationDTO[] = vehicles.map((v) => {
    const latest = navByVehicleId.get(v.id);
    return {
      id: v.id,
      nameEn: v.nameEn,
      nameAr: v.nameAr,
      latest: latest ? { asOfDate: toDateOnly(latest.asOfDate), amount: latest.navAmount.toNumber(), currency: latest.currency } : null,
    };
  });

  return { companies: companyDTOs, vehicles: vehicleDTOs };
}

// computeValuationTotalsByCurrency lives in ./valuation-totals.ts, not
// here -- this file is server-only (imports @/lib/db); that one is a
// pure function client components can import directly without pulling
// the database client into the browser bundle. Re-exported here too for
// convenience on the server side.
export { computeValuationTotalsByCurrency, type ValuationTotalByCurrency } from "./valuation-totals";
