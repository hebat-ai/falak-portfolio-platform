import type { Vehicle, VehicleCompanyLink } from "./types";

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    slug: "growth-fund-i",
    nameEn: "Falak Growth Fund I",
    nameAr: "صندوق فلك للنمو الأول",
    type: "Fund",
    currency: "SAR",
  },
  {
    id: "v2",
    slug: "spv-project-nebula",
    nameEn: "SPV — Project Nebula",
    nameAr: "كيان استثماري خاص — مشروع نيبولا",
    type: "SPV",
    currency: "USD",
  },
  {
    id: "v3",
    slug: "seed-fund-ii",
    nameEn: "Falak Seed Fund II",
    nameAr: "صندوق فلك التأسيسي الثاني",
    type: "Fund",
    currency: "SAR",
  },
];

/**
 * Many-to-many company <-> vehicle links. Tadween SaaS (c3) deliberately
 * appears under two vehicles to exercise the multi-vehicle case -- it must
 * still be counted exactly once in every portfolio-level total, which is
 * why totals are always derived from the `companies` array directly and
 * never by iterating this join list.
 */
export const vehicleCompanyLinks: VehicleCompanyLink[] = [
  { vehicleId: "v1", companyId: "c1" }, // Waslah Logistics -> Growth Fund I
  { vehicleId: "v1", companyId: "c2" }, // Nawras Fintech -> Growth Fund I
  { vehicleId: "v1", companyId: "c3" }, // Tadween SaaS -> Growth Fund I
  { vehicleId: "v3", companyId: "c3" }, // Tadween SaaS -> Seed Fund II (2nd vehicle)
  { vehicleId: "v2", companyId: "c4" }, // Marasi Marketplace -> SPV Nebula
  { vehicleId: "v3", companyId: "c5" }, // Suhail Retail -> Seed Fund II
  { vehicleId: "v3", companyId: "c6" }, // Zahra Health -> Seed Fund II
];
