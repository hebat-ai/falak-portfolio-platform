export type Currency = "SAR" | "USD";

export type CustomerModel = "B2B" | "B2C" | "B2B_B2C";

export type RevenueModel =
  | "SaaS"
  | "Marketplace"
  | "ECommerce"
  | "TransactionBased"
  | "Subscription"
  | "Other";

export type ReportingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "published";

export type ReportingPeriod = "Q1_2026" | "Q2_2026";

export type FundingStage = "PreSeed" | "Seed" | "SeriesA" | "SeriesB" | "Later";

/**
 * revenue: null means no data has been submitted for this period yet --
 * never coerced to 0. lastUpdated: null for the same reason.
 */
export interface CyclePeriodData {
  status: ReportingStatus;
  revenue: number | null;
  lastUpdated: string | null;
}

export interface Company {
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
  periods: Record<ReportingPeriod, CyclePeriodData>;
}

export type VehicleType = "Fund" | "SPV";

export interface Vehicle {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: VehicleType;
  currency: Currency;
}

export interface VehicleCompanyLink {
  vehicleId: string;
  companyId: string;
}

export type InvestorType = "Institutional" | "FamilyOffice" | "Individual";

export interface Investor {
  id: string;
  nameEn: string;
  nameAr: string;
  type: InvestorType;
}

export interface InvestorVehicleExposure {
  investorId: string;
  vehicleId: string;
}

export interface ReportingCycleInfo {
  periodStart: string;
  periodEnd: string;
  deadline: string;
  labelEn: string;
  labelAr: string;
}
