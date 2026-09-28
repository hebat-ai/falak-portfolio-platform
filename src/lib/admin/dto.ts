import type {
  Currency,
  CustomerModel,
  RevenueModel,
  FundingStage,
  VehicleType,
  InvestorType,
  SubmissionStatus,
} from "@/generated/prisma/client";

// One entry per distinct ReportingCycle.periodLabel that exists anywhere in
// the database -- an open, DB-derived replacement for the mock UI's
// hardcoded two-item ReportingPeriod union. periodLabel is treated as the
// stable key: creating a cycle with the same label for a different company
// is how two companies end up "in the same period" (see
// createReportingCycleAction).
export interface AdminPeriodOption {
  key: string;
  label: string;
  periodStart: string;
  periodEnd: string;
}

// Mirrors the mock CyclePeriodData shape closely enough for the existing
// presentational components to keep working unchanged, but sourced from a
// real ReportingCycle/CompanySubmission/SubmissionMetricValue chain instead
// of a fixture. A company with no cycle for a given period key gets a
// synthesized entry here (status "draft", every other field null) so
// `company.periods[periodKey]` is always defined, exactly like the mock
// data's guarantee.
export interface AdminCompanyPeriodData {
  status: SubmissionStatus;
  revenue: number | null;
  lastUpdated: string | null;
  cycleId: string | null;
  submissionId: string | null;
  currentDeadline: string | null;
}

export interface AdminCompanyDTO {
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
  archivedAt: string | null;
  periods: Record<string, AdminCompanyPeriodData>;
}

export interface AdminVehicleDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: VehicleType;
  currency: Currency;
  archivedAt: string | null;
}

export interface AdminInvestorDTO {
  id: string;
  nameEn: string;
  nameAr: string;
  type: InvestorType;
  archivedAt: string | null;
}

export interface AdminOwnershipLinkDTO {
  vehicleId: string;
  companyId: string;
}

export interface AdminReportingTemplateDTO {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

export interface AdminPortfolioData {
  companies: AdminCompanyDTO[];
  vehicles: AdminVehicleDTO[];
  investors: AdminInvestorDTO[];
  ownershipLinks: AdminOwnershipLinkDTO[];
  periods: AdminPeriodOption[];
  templates: AdminReportingTemplateDTO[];
}
