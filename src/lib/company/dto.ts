import type {
  Currency,
  CustomerModel,
  RevenueModel,
  FundingStage,
  VehicleType,
  SubmissionStatus,
  NarrativeKind,
} from "@/generated/prisma/client";

export interface CompanyReportNarrativeDTO {
  kind: NarrativeKind;
  textEn: string;
  textAr: string;
}

// cycleId/currentDeadline are non-nullable here, unlike AdminCompanyPeriodData
// -- every entry in a company-scoped periods record originates from a real
// ReportingCycle row for THIS company; there is no cross-company
// synthesized-draft case to leave room for. narratives is [] both when the
// period was never published and when it was published with zero sections
// written -- deliberately not distinguished, see CompanyReportView.
export interface CompanyReportPeriodData {
  status: SubmissionStatus;
  revenue: number | null;
  lastUpdated: string | null;
  cycleId: string;
  submissionId: string | null;
  currentDeadline: string;
  narratives: CompanyReportNarrativeDTO[];
}

export interface CompanyReportPeriodOption {
  key: string;
  label: string;
  periodStart: string;
  periodEnd: string;
}

export interface CompanyReportVehicleDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: VehicleType;
  currency: Currency;
}

// FALAK_STAFF can view any company's report; COMPANY_MEMBER can view only
// their own. Nothing else is authorized -- see requireCompanyReportViewer
// in queries.ts. Threaded through to the client so it can adjust the
// back-link destination and whether the "Open Reporting Form" link shows.
export type CompanyReportViewerRole = "FALAK_STAFF" | "COMPANY_MEMBER";

export interface CompanyReportDTO {
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
  periods: Record<string, CompanyReportPeriodData>;
}

export interface CompanyReportData {
  company: CompanyReportDTO;
  periods: CompanyReportPeriodOption[];
  linkedVehicles: CompanyReportVehicleDTO[];
  viewerRole: CompanyReportViewerRole;
}
