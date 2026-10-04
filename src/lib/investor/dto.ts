import type {
  Currency,
  CustomerModel,
  RevenueModel,
  FundingStage,
  VehicleType,
} from "@/generated/prisma/client";

// The signed-in user's own investor organizations only (their non-revoked
// InvestorMembership rows on non-archived investors) -- never every
// investor in the system. Replaces the mock page's global investor
// dropdown, which was a real access-control gap.
export interface InvestorOrgOption {
  id: string;
  nameEn: string;
  nameAr: string;
}

// One entry per distinct Report.periodLabel the signed-in user has at
// least one visible (granted, non-revoked, COMPANY-scope) report for --
// scoped to their own orgs only, never the platform-wide period list.
export interface InvestorPeriodOption {
  key: string;
  label: string;
  periodStart: string;
  periodEnd: string;
}

// One row per (investor org, report) the org currently holds a valid
// grant for -- already resolved to that org's own highest-versionNo
// grant, so there is no "status" to show (every row here is, by
// construction, a published version the org was actually granted).
export interface InvestorVisibleCompanyDTO {
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
  revenue: number | null;
  lastUpdated: string;
  periodKey: string;
  investorOrgId: string;
}

// A vehicle the org has an Active InvestorVehiclePosition in.
// linkedCompanyIds is every company OwnershipPosition-linked to this
// vehicle, independent of period or report-visibility -- the client
// intersects this with the selected period's visible-company set to get
// a per-period "visible companies" count, same as the mock page already
// does.
export interface InvestorVehicleExposureCompanyDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface InvestorVehicleExposureDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: VehicleType;
  currency: Currency;
  investorOrgId: string;
  linkedCompanies: InvestorVehicleExposureCompanyDTO[];
}

export interface InvestorPortfolioData {
  orgs: InvestorOrgOption[];
  periods: InvestorPeriodOption[];
  companies: InvestorVisibleCompanyDTO[];
  vehicleExposures: InvestorVehicleExposureDTO[];
}
