import type { Investor, InvestorVehicleExposure } from "./types";

/**
 * Fictional, privacy-safe, aggregate-only demo investor records --
 * unmistakably synthetic, no real persons or firms.
 */
export const investors: Investor[] = [
  { id: "i1", nameEn: "Demo Institutional Investor", nameAr: "مستثمر مؤسسي تجريبي", type: "Institutional" },
  { id: "i2", nameEn: "Demo Family Office", nameAr: "مكتب عائلي تجريبي", type: "FamilyOffice" },
  { id: "i3", nameEn: "Demo Angel Investor", nameAr: "مستثمر ملائكي تجريبي", type: "Individual" },
];

export const investorVehicleExposures: InvestorVehicleExposure[] = [
  { investorId: "i1", vehicleId: "v1" }, // Demo Institutional Investor -> Growth Fund I
  { investorId: "i1", vehicleId: "v2" }, // Demo Institutional Investor -> SPV Nebula
  { investorId: "i2", vehicleId: "v3" }, // Demo Family Office -> Seed Fund II
  { investorId: "i3", vehicleId: "v1" }, // Demo Angel Investor -> Growth Fund I
];
