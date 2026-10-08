import type {
  Currency,
  CustomerModel,
  RevenueModel,
  FundingStage,
  VehicleType,
  InvestorType,
  SubmissionStatus,
} from "@/generated/prisma/client";

export interface VehicleDirectoryEntryDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: VehicleType;
  currency: Currency;
  descriptionEn: string | null;
  descriptionAr: string | null;
  companyCount: number;
  investorCount: number;
}

// Scoped to periods where at least one of THIS vehicle's linked companies
// has a real ReportingCycle -- not the portfolio-wide list, which could
// offer periods where none of this vehicle's companies reported at all.
export interface VehicleDashboardPeriodOption {
  key: string;
  label: string;
  periodStart: string;
  periodEnd: string;
}

// A linked company with no cycle for a given vehicle period gets a
// synthesized draft/null entry (same as AdminCompanyPeriodData), so every
// linked company always has an entry for every vehicle period and the
// completion rate's denominator stays "all linked companies."
export interface VehicleCompanyPeriodData {
  status: SubmissionStatus;
  revenue: number | null;
  lastUpdated: string | null;
  currentDeadline: string | null;
}

export interface VehicleCompanyDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  sectorEn: string;
  sectorAr: string;
  customerModel: CustomerModel;
  revenueModels: RevenueModel[];
  currency: Currency;
  entryStage: FundingStage;
  currentStage: FundingStage;
  periods: Record<string, VehicleCompanyPeriodData>;
}

export interface VehicleInvestorDTO {
  id: string;
  nameEn: string;
  nameAr: string;
  type: InvestorType;
}

export interface VehicleDashboardData {
  vehicle: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    type: VehicleType;
    currency: Currency;
    descriptionEn: string | null;
    descriptionAr: string | null;
  };
  periods: VehicleDashboardPeriodOption[];
  companies: VehicleCompanyDTO[];
  investors: VehicleInvestorDTO[];
}
