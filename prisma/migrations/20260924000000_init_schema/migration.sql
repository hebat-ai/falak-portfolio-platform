-- ============================================================
-- Falak Portfolio Platform -- initial schema migration
--
-- Generated offline via `prisma migrate diff --from-empty --to-schema
-- prisma/schema.prisma --script` (no database connection, no shadow
-- database). The base CreateEnum/CreateTable/CreateIndex/AddForeignKey
-- section below is Prisma's own unmodified output for the current
-- schema.prisma. Everything after "-- ===== Custom SQL " is
-- hand-written: CHECK constraints, partial unique indexes, and trigger
-- functions that Prisma's schema language cannot express.
--
-- Ordering guarantee: every custom statement below references only
-- tables/columns created in the base section above it, so this file
-- applies top-to-bottom with no forward references. See the
-- accompanying review notes for the section-by-section dependency check.
--
-- Role creation and privilege grants for the app_runtime role are
-- deliberately NOT in this file -- see prisma/setup/app_runtime_grants.sql.
-- This file contains no credentials, roles, or GRANT/REVOKE statements.
-- ============================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('FALAK_ADMIN', 'FALAK_OPERATIONS', 'INVESTOR');

-- CreateEnum
CREATE TYPE "ReportingFrequency" AS ENUM ('Quarterly', 'Semiannual');

-- CreateEnum
CREATE TYPE "CustomerModel" AS ENUM ('B2B', 'B2C', 'B2B_B2C');

-- CreateEnum
CREATE TYPE "RevenueModel" AS ENUM ('SaaS', 'Marketplace', 'ECommerce', 'TransactionBased', 'Subscription', 'Other');

-- CreateEnum
CREATE TYPE "FundingStage" AS ENUM ('PreSeed', 'Seed', 'SeriesA', 'SeriesB', 'Later');

-- CreateEnum
CREATE TYPE "CompanyMembershipRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('SAR', 'USD');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('Fund', 'SPV');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('Institutional', 'FamilyOffice', 'Individual');

-- CreateEnum
CREATE TYPE "InvestorMembershipRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('Active', 'Exited', 'WrittenOff');

-- CreateEnum
CREATE TYPE "OwnershipHolderType" AS ENUM ('VEHICLE', 'DIRECT_INVESTOR', 'DIRECT_FALAK');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('Draft', 'Active', 'Superseded', 'Terminated');

-- CreateEnum
CREATE TYPE "MetricDataType" AS ENUM ('Currency', 'Percent', 'Number', 'Text', 'Boolean');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('Open', 'Due', 'Closed', 'Cancelled', 'Extended');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('draft', 'submitted', 'under_review', 'changes_requested', 'approved');

-- CreateEnum
CREATE TYPE "ReviewCommentTargetType" AS ENUM ('SUBMISSION', 'METRIC_VALUE', 'NARRATIVE_SECTION', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "ReviewCommentStatus" AS ENUM ('Open', 'Resolved');

-- CreateEnum
CREATE TYPE "ReportScope" AS ENUM ('COMPANY', 'VEHICLE', 'INVESTOR_PORTFOLIO', 'FALAK_PORTFOLIO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'published', 'distributed');

-- CreateEnum
CREATE TYPE "NarrativeKind" AS ENUM ('operational_update', 'quarter_highlights', 'investment_review_notes', 'management_commentary');

-- CreateEnum
CREATE TYPE "DistributionChannel" AS ENUM ('Email', 'Platform', 'Manual');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('Pending', 'Sent', 'Delivered', 'Failed', 'Bounced');

-- CreateEnum
CREATE TYPE "AttachmentOwnerType" AS ENUM ('SUBMISSION', 'REPORT_VERSION');

-- CreateEnum
CREATE TYPE "AgreementCashFlowType" AS ENUM ('Drawdown', 'Distribution');

-- CreateEnum
CREATE TYPE "InvestorCapitalTransactionType" AS ENUM ('CapitalCall', 'Contribution', 'Distribution', 'ManagementFee');

-- CreateEnum
CREATE TYPE "CompanyValuationType" AS ENUM ('LastRound', 'InternalMark', 'ThirdPartyMark', 'Exit', 'WrittenOff');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "sectorEn" TEXT NOT NULL,
    "sectorAr" TEXT NOT NULL,
    "customerModel" "CustomerModel" NOT NULL,
    "revenueModels" "RevenueModel"[],
    "currency" "Currency" NOT NULL,
    "entryStage" "FundingStage" NOT NULL,
    "currentStage" "FundingStage" NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_invites" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" "InvestorType" NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_memberships" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "InvestorMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "investor_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_vehicle_positions" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "commitmentAmount" DECIMAL(18,4),
    "calledAmount" DECIMAL(18,4),
    "ownershipPct" DECIMAL(7,4),
    "currency" "Currency" NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "status" "PositionStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_vehicle_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_positions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "holderType" "OwnershipHolderType" NOT NULL,
    "vehicleId" TEXT,
    "investorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ownership_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_agreements" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "ownershipPositionId" TEXT NOT NULL,
    "roundLabel" TEXT,
    "signedDate" DATE NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "investedAmount" DECIMAL(18,4),
    "currency" "Currency",
    "ownershipPct" DECIMAL(7,4),
    "informationRightsNotes" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'Draft',
    "supersedesAgreementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_snapshots" (
    "id" TEXT NOT NULL,
    "ownershipPositionId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "ownershipPct" DECIMAL(7,4) NOT NULL,
    "isFullyDiluted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ownership_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_templates" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporting_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_definitions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "dataType" "MetricDataType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_obligations" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "frequency" "ReportingFrequency" NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_cycles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "originalDeadline" DATE NOT NULL,
    "currentDeadline" DATE NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'Open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_cycle_deadline_extensions" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "previousDeadline" DATE NOT NULL,
    "newDeadline" DATE NOT NULL,
    "reason" TEXT,
    "extendedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_cycle_deadline_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_cycle_obligations" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,

    CONSTRAINT "reporting_cycle_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_submissions" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'draft',
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_metric_values" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "numericValue" DECIMAL(18,4),
    "currencyCode" "Currency",
    "textValue" TEXT,
    "isNa" BOOLEAN NOT NULL DEFAULT false,
    "naReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_metric_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_workflow_events" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "actorId" TEXT,
    "fromStatus" "SubmissionStatus",
    "toStatus" "SubmissionStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_workflow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_version_metric_values" (
    "id" TEXT NOT NULL,
    "workflowEventId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "numericValue" DECIMAL(18,4),
    "currencyCode" "Currency",
    "textValue" TEXT,
    "isNa" BOOLEAN NOT NULL DEFAULT false,
    "naReason" TEXT,

    CONSTRAINT "submission_version_metric_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comments" (
    "id" TEXT NOT NULL,
    "targetType" "ReviewCommentTargetType" NOT NULL,
    "submissionId" TEXT,
    "submissionMetricValueId" TEXT,
    "narrativeSectionId" TEXT,
    "attachmentId" TEXT,
    "body" TEXT NOT NULL,
    "status" "ReviewCommentStatus" NOT NULL DEFAULT 'Open',
    "authorId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "scope" "ReportScope" NOT NULL,
    "companyId" TEXT,
    "vehicleId" TEXT,
    "investorId" TEXT,
    "periodLabel" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "asOfDate" DATE NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_version_submissions" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "report_version_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_sections" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "kind" "NarrativeKind" NOT NULL,
    "textEn" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_access_grants" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "report_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_distributions" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientEmail" TEXT,
    "channel" "DistributionChannel" NOT NULL,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3),
    "status" "DistributionStatus" NOT NULL DEFAULT 'Pending',
    "failureReason" TEXT,
    "openedAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "ownerType" "AttachmentOwnerType" NOT NULL,
    "submissionId" TEXT,
    "reportVersionId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_cash_flows" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "type" "AgreementCashFlowType" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "transactionDate" DATE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "agreement_cash_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_capital_transactions" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "agreementId" TEXT,
    "type" "InvestorCapitalTransactionType" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "transactionDate" DATE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "investor_capital_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_valuation_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "valuationAmount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "valuationType" "CompanyValuationType" NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "company_valuation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_nav_snapshots" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "navAmount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "vehicle_nav_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_rates" (
    "id" TEXT NOT NULL,
    "rateDate" DATE NOT NULL,
    "sourceCurrency" "Currency" NOT NULL,
    "targetCurrency" "Currency" NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_roles_userId_role_idx" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_invites_tokenHash_key" ON "company_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "company_invites_companyId_idx" ON "company_invites"("companyId");

-- CreateIndex
CREATE INDEX "company_memberships_companyId_idx" ON "company_memberships"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_userId_companyId_key" ON "company_memberships"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_slug_key" ON "vehicles"("slug");

-- CreateIndex
CREATE INDEX "investor_memberships_investorId_idx" ON "investor_memberships"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "investor_memberships_investorId_userId_key" ON "investor_memberships"("investorId", "userId");

-- CreateIndex
CREATE INDEX "investor_vehicle_positions_investorId_idx" ON "investor_vehicle_positions"("investorId");

-- CreateIndex
CREATE INDEX "investor_vehicle_positions_vehicleId_idx" ON "investor_vehicle_positions"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "investor_vehicle_positions_investorId_vehicleId_effectiveFr_key" ON "investor_vehicle_positions"("investorId", "vehicleId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "investment_agreements_agreementNumber_key" ON "investment_agreements"("agreementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "investment_agreements_supersedesAgreementId_key" ON "investment_agreements"("supersedesAgreementId");

-- CreateIndex
CREATE INDEX "investment_agreements_ownershipPositionId_idx" ON "investment_agreements"("ownershipPositionId");

-- CreateIndex
CREATE INDEX "ownership_snapshots_ownershipPositionId_asOfDate_idx" ON "ownership_snapshots"("ownershipPositionId", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_snapshots_ownershipPositionId_asOfDate_key" ON "ownership_snapshots"("ownershipPositionId", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "metric_definitions_templateId_key_key" ON "metric_definitions"("templateId", "key");

-- CreateIndex
CREATE INDEX "reporting_obligations_agreementId_idx" ON "reporting_obligations"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_cycles_companyId_templateId_periodStart_periodEnd_key" ON "reporting_cycles"("companyId", "templateId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "reporting_cycle_deadline_extensions_cycleId_idx" ON "reporting_cycle_deadline_extensions"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_cycle_obligations_cycleId_obligationId_key" ON "reporting_cycle_obligations"("cycleId", "obligationId");

-- CreateIndex
CREATE UNIQUE INDEX "company_submissions_cycleId_key" ON "company_submissions"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_metric_values_submissionId_metricDefinitionId_key" ON "submission_metric_values"("submissionId", "metricDefinitionId");

-- CreateIndex
CREATE INDEX "submission_workflow_events_submissionId_idx" ON "submission_workflow_events"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_workflow_events_submissionId_versionNo_key" ON "submission_workflow_events"("submissionId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "submission_version_metric_values_workflowEventId_metricDefi_key" ON "submission_version_metric_values"("workflowEventId", "metricDefinitionId");

-- CreateIndex
CREATE INDEX "review_comments_submissionId_idx" ON "review_comments"("submissionId");

-- CreateIndex
CREATE INDEX "reports_scope_periodStart_periodEnd_idx" ON "reports"("scope", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "report_versions_reportId_versionNo_key" ON "report_versions"("reportId", "versionNo");

-- CreateIndex
CREATE INDEX "report_version_submissions_submissionId_idx" ON "report_version_submissions"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "report_version_submissions_reportVersionId_submissionId_key" ON "report_version_submissions"("reportVersionId", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "narrative_sections_reportVersionId_kind_key" ON "narrative_sections"("reportVersionId", "kind");

-- CreateIndex
CREATE INDEX "report_access_grants_investorId_revokedAt_idx" ON "report_access_grants"("investorId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_access_grants_reportVersionId_investorId_key" ON "report_access_grants"("reportVersionId", "investorId");

-- CreateIndex
CREATE INDEX "report_distributions_reportVersionId_idx" ON "report_distributions"("reportVersionId");

-- CreateIndex
CREATE INDEX "report_distributions_investorId_idx" ON "report_distributions"("investorId");

-- CreateIndex
CREATE INDEX "attachments_submissionId_idx" ON "attachments"("submissionId");

-- CreateIndex
CREATE INDEX "attachments_reportVersionId_idx" ON "attachments"("reportVersionId");

-- CreateIndex
CREATE INDEX "agreement_cash_flows_agreementId_transactionDate_idx" ON "agreement_cash_flows"("agreementId", "transactionDate");

-- CreateIndex
CREATE INDEX "investor_capital_transactions_investorId_transactionDate_idx" ON "investor_capital_transactions"("investorId", "transactionDate");

-- CreateIndex
CREATE INDEX "investor_capital_transactions_vehicleId_transactionDate_idx" ON "investor_capital_transactions"("vehicleId", "transactionDate");

-- CreateIndex
CREATE INDEX "company_valuation_snapshots_companyId_asOfDate_idx" ON "company_valuation_snapshots"("companyId", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "company_valuation_snapshots_companyId_asOfDate_valuationTyp_key" ON "company_valuation_snapshots"("companyId", "asOfDate", "valuationType");

-- CreateIndex
CREATE INDEX "vehicle_nav_snapshots_vehicleId_asOfDate_idx" ON "vehicle_nav_snapshots"("vehicleId", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_nav_snapshots_vehicleId_asOfDate_key" ON "vehicle_nav_snapshots"("vehicleId", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_rateDate_sourceCurrency_targetCurrency_key" ON "fx_rates"("rateDate", "sourceCurrency", "targetCurrency");

-- CreateIndex
CREATE INDEX "audit_events_targetType_targetId_idx" ON "audit_events"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invites" ADD CONSTRAINT "company_invites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invites" ADD CONSTRAINT "company_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_memberships" ADD CONSTRAINT "investor_memberships_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_memberships" ADD CONSTRAINT "investor_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_vehicle_positions" ADD CONSTRAINT "investor_vehicle_positions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_vehicle_positions" ADD CONSTRAINT "investor_vehicle_positions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_positions" ADD CONSTRAINT "ownership_positions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_positions" ADD CONSTRAINT "ownership_positions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_positions" ADD CONSTRAINT "ownership_positions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_agreements" ADD CONSTRAINT "investment_agreements_ownershipPositionId_fkey" FOREIGN KEY ("ownershipPositionId") REFERENCES "ownership_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_agreements" ADD CONSTRAINT "investment_agreements_supersedesAgreementId_fkey" FOREIGN KEY ("supersedesAgreementId") REFERENCES "investment_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_snapshots" ADD CONSTRAINT "ownership_snapshots_ownershipPositionId_fkey" FOREIGN KEY ("ownershipPositionId") REFERENCES "ownership_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_snapshots" ADD CONSTRAINT "ownership_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "reporting_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_obligations" ADD CONSTRAINT "reporting_obligations_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "investment_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_obligations" ADD CONSTRAINT "reporting_obligations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "reporting_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycles" ADD CONSTRAINT "reporting_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycles" ADD CONSTRAINT "reporting_cycles_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "reporting_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycle_deadline_extensions" ADD CONSTRAINT "reporting_cycle_deadline_extensions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "reporting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycle_deadline_extensions" ADD CONSTRAINT "reporting_cycle_deadline_extensions_extendedById_fkey" FOREIGN KEY ("extendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycle_obligations" ADD CONSTRAINT "reporting_cycle_obligations_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "reporting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_cycle_obligations" ADD CONSTRAINT "reporting_cycle_obligations_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "reporting_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_submissions" ADD CONSTRAINT "company_submissions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "reporting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_submissions" ADD CONSTRAINT "company_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_metric_values" ADD CONSTRAINT "submission_metric_values_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "company_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_metric_values" ADD CONSTRAINT "submission_metric_values_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "metric_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_workflow_events" ADD CONSTRAINT "submission_workflow_events_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "company_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_workflow_events" ADD CONSTRAINT "submission_workflow_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_version_metric_values" ADD CONSTRAINT "submission_version_metric_values_workflowEventId_fkey" FOREIGN KEY ("workflowEventId") REFERENCES "submission_workflow_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_version_metric_values" ADD CONSTRAINT "submission_version_metric_values_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "metric_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "company_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_submissionMetricValueId_fkey" FOREIGN KEY ("submissionMetricValueId") REFERENCES "submission_metric_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_narrativeSectionId_fkey" FOREIGN KEY ("narrativeSectionId") REFERENCES "narrative_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_version_submissions" ADD CONSTRAINT "report_version_submissions_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_version_submissions" ADD CONSTRAINT "report_version_submissions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "company_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrative_sections" ADD CONSTRAINT "narrative_sections_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrative_sections" ADD CONSTRAINT "narrative_sections_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_access_grants" ADD CONSTRAINT "report_access_grants_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_access_grants" ADD CONSTRAINT "report_access_grants_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_distributions" ADD CONSTRAINT "report_distributions_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_distributions" ADD CONSTRAINT "report_distributions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_distributions" ADD CONSTRAINT "report_distributions_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_distributions" ADD CONSTRAINT "report_distributions_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "company_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_cash_flows" ADD CONSTRAINT "agreement_cash_flows_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "investment_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_cash_flows" ADD CONSTRAINT "agreement_cash_flows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_capital_transactions" ADD CONSTRAINT "investor_capital_transactions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_capital_transactions" ADD CONSTRAINT "investor_capital_transactions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_capital_transactions" ADD CONSTRAINT "investor_capital_transactions_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "investment_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_capital_transactions" ADD CONSTRAINT "investor_capital_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_valuation_snapshots" ADD CONSTRAINT "company_valuation_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_valuation_snapshots" ADD CONSTRAINT "company_valuation_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_nav_snapshots" ADD CONSTRAINT "vehicle_nav_snapshots_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_nav_snapshots" ADD CONSTRAINT "vehicle_nav_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- ===== Custom SQL below this line is hand-written, not Prisma-generated =====
-- Every statement below references only tables/columns created above.
-- ============================================================

-- ------------------------------------------------------------
-- CHECK constraints
-- ------------------------------------------------------------

ALTER TABLE "reports" ADD CONSTRAINT "reports_scope_check" CHECK (
  ("scope" = 'COMPANY'            AND "companyId" IS NOT NULL AND "vehicleId" IS NULL AND "investorId" IS NULL)
  OR ("scope" = 'VEHICLE'            AND "vehicleId" IS NOT NULL AND "companyId" IS NULL AND "investorId" IS NULL)
  OR ("scope" = 'INVESTOR_PORTFOLIO' AND "investorId" IS NOT NULL AND "companyId" IS NULL AND "vehicleId" IS NULL)
  OR ("scope" = 'FALAK_PORTFOLIO'    AND "companyId" IS NULL AND "vehicleId" IS NULL AND "investorId" IS NULL)
);

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_check" CHECK (
  ("ownerType" = 'SUBMISSION'      AND "submissionId" IS NOT NULL AND "reportVersionId" IS NULL)
  OR ("ownerType" = 'REPORT_VERSION' AND "reportVersionId" IS NOT NULL AND "submissionId" IS NULL)
);

ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_target_check" CHECK (
  ("targetType" = 'SUBMISSION'         AND "submissionId" IS NOT NULL AND "submissionMetricValueId" IS NULL AND "narrativeSectionId" IS NULL AND "attachmentId" IS NULL)
  OR ("targetType" = 'METRIC_VALUE'      AND "submissionMetricValueId" IS NOT NULL AND "submissionId" IS NULL AND "narrativeSectionId" IS NULL AND "attachmentId" IS NULL)
  OR ("targetType" = 'NARRATIVE_SECTION' AND "narrativeSectionId" IS NOT NULL AND "submissionId" IS NULL AND "submissionMetricValueId" IS NULL AND "attachmentId" IS NULL)
  OR ("targetType" = 'ATTACHMENT'        AND "attachmentId" IS NOT NULL AND "submissionId" IS NULL AND "submissionMetricValueId" IS NULL AND "narrativeSectionId" IS NULL)
);

ALTER TABLE "investor_capital_transactions" ADD CONSTRAINT "investor_capital_tx_vehicle_xor_agreement_check" CHECK (
  ("vehicleId" IS NOT NULL AND "agreementId" IS NULL)
  OR ("vehicleId" IS NULL AND "agreementId" IS NOT NULL)
);

ALTER TABLE "ownership_positions" ADD CONSTRAINT "ownership_positions_holder_check" CHECK (
  ("holderType" = 'VEHICLE'          AND "vehicleId" IS NOT NULL AND "investorId" IS NULL)
  OR ("holderType" = 'DIRECT_INVESTOR' AND "investorId" IS NOT NULL AND "vehicleId" IS NULL)
  OR ("holderType" = 'DIRECT_FALAK'    AND "vehicleId" IS NULL AND "investorId" IS NULL)
);

ALTER TABLE "investment_agreements"      ADD CONSTRAINT "agreements_date_range_check"        CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "reporting_obligations"      ADD CONSTRAINT "obligations_date_range_check"       CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "investor_vehicle_positions" ADD CONSTRAINT "positions_date_range_check"         CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "reports"                    ADD CONSTRAINT "reports_period_range_check"          CHECK ("periodEnd" >= "periodStart");
ALTER TABLE "reporting_cycles"           ADD CONSTRAINT "reporting_cycles_period_range_check" CHECK ("periodEnd" >= "periodStart");

ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_positive_rate_check"        CHECK ("rate" > 0);
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_different_currencies_check" CHECK ("sourceCurrency" <> "targetCurrency");

-- ------------------------------------------------------------
-- Partial unique indexes
-- (Postgres treats NULL as distinct from NULL, so a flat unique across
-- these nullable scope/holder columns would not catch every duplicate --
-- see the schema's own comments on Report and OwnershipPosition.)
-- ------------------------------------------------------------

CREATE UNIQUE INDEX "reports_company_period_unique"  ON "reports" ("companyId", "periodStart", "periodEnd")  WHERE "scope" = 'COMPANY';
CREATE UNIQUE INDEX "reports_vehicle_period_unique"  ON "reports" ("vehicleId", "periodStart", "periodEnd")  WHERE "scope" = 'VEHICLE';
CREATE UNIQUE INDEX "reports_investor_period_unique" ON "reports" ("investorId", "periodStart", "periodEnd") WHERE "scope" = 'INVESTOR_PORTFOLIO';
CREATE UNIQUE INDEX "reports_falak_period_unique"    ON "reports" ("periodStart", "periodEnd")               WHERE "scope" = 'FALAK_PORTFOLIO';

-- At most one ACTIVE role assignment per (userId, role); a revoked one no
-- longer blocks re-granting the same role.
CREATE UNIQUE INDEX "user_roles_one_active_assignment"
  ON "user_roles" ("userId", "role")
  WHERE "revokedAt" IS NULL;

-- At most one OwnershipPosition per (company, holder).
CREATE UNIQUE INDEX "ownership_positions_vehicle_unique"
  ON "ownership_positions" ("companyId", "vehicleId") WHERE "holderType" = 'VEHICLE';
CREATE UNIQUE INDEX "ownership_positions_direct_investor_unique"
  ON "ownership_positions" ("companyId", "investorId") WHERE "holderType" = 'DIRECT_INVESTOR';
CREATE UNIQUE INDEX "ownership_positions_direct_falak_unique"
  ON "ownership_positions" ("companyId") WHERE "holderType" = 'DIRECT_FALAK';

-- ------------------------------------------------------------
-- Trigger: cycle/obligation compatibility
-- Enforces that an obligation attached to a cycle actually matches that
-- cycle's company, template, frequency-vs-period-length, and effective
-- window, that its underlying agreement is Active and effective for the
-- period, and that it is compatible with any obligation already sharing
-- the cycle.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_cycle_obligation_compatibility()
RETURNS TRIGGER AS $$
DECLARE
  cycle_company_id   TEXT;
  cycle_template_id  TEXT;
  cycle_period_start TIMESTAMP;
  cycle_period_end   TIMESTAMP;
  ob_template_id     TEXT;
  ob_frequency       "ReportingFrequency";
  ob_effective_from  TIMESTAMP;
  ob_effective_to    TIMESTAMP;
  ob_agreement_id    TEXT;
  ag_company_id      TEXT;
  ag_status          "AgreementStatus";
  ag_effective_from  TIMESTAMP;
  ag_effective_to    TIMESTAMP;
  period_months      NUMERIC;
  sibling_incompatible_count INTEGER;
BEGIN
  SELECT "companyId", "templateId", "periodStart", "periodEnd"
  INTO cycle_company_id, cycle_template_id, cycle_period_start, cycle_period_end
  FROM "reporting_cycles"
  WHERE "id" = NEW."cycleId";

  SELECT "templateId", "frequency", "effectiveFrom", "effectiveTo", "agreementId"
  INTO ob_template_id, ob_frequency, ob_effective_from, ob_effective_to, ob_agreement_id
  FROM "reporting_obligations"
  WHERE "id" = NEW."obligationId";

  SELECT op."companyId", ia."status", ia."effectiveFrom", ia."effectiveTo"
  INTO ag_company_id, ag_status, ag_effective_from, ag_effective_to
  FROM "investment_agreements" ia
  JOIN "ownership_positions" op ON op."id" = ia."ownershipPositionId"
  WHERE ia."id" = ob_agreement_id;

  IF ag_company_id IS DISTINCT FROM cycle_company_id THEN
    RAISE EXCEPTION 'Obligation % is for company %, but cycle % is for company %',
      NEW."obligationId", ag_company_id, NEW."cycleId", cycle_company_id;
  END IF;

  IF ob_template_id IS DISTINCT FROM cycle_template_id THEN
    RAISE EXCEPTION 'Obligation % uses template %, but cycle % requires template %',
      NEW."obligationId", ob_template_id, NEW."cycleId", cycle_template_id;
  END IF;

  period_months := EXTRACT(EPOCH FROM (cycle_period_end - cycle_period_start)) / (86400 * 30.44);
  IF ob_frequency = 'Quarterly' AND (period_months < 2.5 OR period_months > 3.5) THEN
    RAISE EXCEPTION 'Obligation % is Quarterly but cycle % spans % months',
      NEW."obligationId", NEW."cycleId", period_months;
  ELSIF ob_frequency = 'Semiannual' AND (period_months < 5.5 OR period_months > 6.5) THEN
    RAISE EXCEPTION 'Obligation % is Semiannual but cycle % spans % months',
      NEW."obligationId", NEW."cycleId", period_months;
  END IF;

  IF ob_effective_from > cycle_period_start OR (ob_effective_to IS NOT NULL AND ob_effective_to < cycle_period_end) THEN
    RAISE EXCEPTION 'Obligation % is not effective for cycle % period (% to %)',
      NEW."obligationId", NEW."cycleId", cycle_period_start, cycle_period_end;
  END IF;

  IF ag_status != 'Active' THEN
    RAISE EXCEPTION 'Agreement behind obligation % is not Active (status=%)',
      NEW."obligationId", ag_status;
  END IF;

  IF ag_effective_from > cycle_period_start OR (ag_effective_to IS NOT NULL AND ag_effective_to < cycle_period_end) THEN
    RAISE EXCEPTION 'Agreement behind obligation % is not effective for cycle % period (% to %)',
      NEW."obligationId", NEW."cycleId", cycle_period_start, cycle_period_end;
  END IF;

  SELECT COUNT(*) INTO sibling_incompatible_count
  FROM "reporting_cycle_obligations" rco
  JOIN "reporting_obligations" ro ON ro."id" = rco."obligationId"
  WHERE rco."cycleId" = NEW."cycleId"
    AND rco."id" != NEW."id"
    AND (ro."templateId" != ob_template_id OR ro."frequency" != ob_frequency);

  IF sibling_incompatible_count > 0 THEN
    RAISE EXCEPTION 'Obligation % is incompatible with an obligation already on cycle %',
      NEW."obligationId", NEW."cycleId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_cycle_obligation_compatibility
  BEFORE INSERT OR UPDATE ON "reporting_cycle_obligations"
  FOR EACH ROW EXECUTE FUNCTION check_cycle_obligation_compatibility();

-- ------------------------------------------------------------
-- Trigger: investor capital-transaction consistency
-- Enforces that an agreement-linked transaction actually targets a
-- DIRECT_INVESTOR position matching the transaction's own investorId, and
-- that a vehicle-linked transaction has a currently-active
-- InvestorVehiclePosition covering its transaction date.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_investor_capital_transaction_consistency()
RETURNS TRIGGER AS $$
DECLARE
  ag_holder_type "OwnershipHolderType";
  ag_investor_id TEXT;
  active_position_count INTEGER;
BEGIN
  IF NEW."agreementId" IS NOT NULL THEN
    SELECT op."holderType", op."investorId"
    INTO ag_holder_type, ag_investor_id
    FROM "investment_agreements" ia
    JOIN "ownership_positions" op ON op."id" = ia."ownershipPositionId"
    WHERE ia."id" = NEW."agreementId";

    IF ag_holder_type != 'DIRECT_INVESTOR' THEN
      RAISE EXCEPTION 'Transaction % references agreement % which is not DIRECT_INVESTOR (holderType=%)',
        NEW."id", NEW."agreementId", ag_holder_type;
    END IF;

    IF ag_investor_id IS DISTINCT FROM NEW."investorId" THEN
      RAISE EXCEPTION 'Transaction % investorId (%) does not match agreement % investorId (%)',
        NEW."id", NEW."investorId", NEW."agreementId", ag_investor_id;
    END IF;
  END IF;

  IF NEW."vehicleId" IS NOT NULL THEN
    SELECT COUNT(*) INTO active_position_count
    FROM "investor_vehicle_positions"
    WHERE "investorId" = NEW."investorId"
      AND "vehicleId" = NEW."vehicleId"
      AND "status" = 'Active'
      AND "effectiveFrom" <= NEW."transactionDate"
      AND ("effectiveTo" IS NULL OR "effectiveTo" >= NEW."transactionDate");

    IF active_position_count = 0 THEN
      RAISE EXCEPTION 'Transaction % has no active InvestorVehiclePosition for investor % / vehicle % as of %',
        NEW."id", NEW."investorId", NEW."vehicleId", NEW."transactionDate";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_investor_capital_transaction_consistency
  BEFORE INSERT OR UPDATE ON "investor_capital_transactions"
  FOR EACH ROW EXECUTE FUNCTION check_investor_capital_transaction_consistency();

-- ------------------------------------------------------------
-- Triggers: immutability after first use
--
-- Chosen rule (stated explicitly, not left ambiguous): once a
-- ReportingCycle/ReportingObligation/ReportingTemplate is actually in
-- use, its identity/semantic fields are frozen -- a real change is
-- always a NEW row, never an in-place edit. This matches the rest of the
-- schema's own design language (agreement amendments supersede rather
-- than edit; ReportVersion is never edited in place).
-- ------------------------------------------------------------

-- ReportingCycle: companyId, templateId, periodStart, periodEnd freeze
-- once any obligation is attached via reporting_cycle_obligations.
CREATE OR REPLACE FUNCTION check_reporting_cycle_immutable_after_use()
RETURNS TRIGGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  IF (NEW."companyId" IS DISTINCT FROM OLD."companyId")
     OR (NEW."templateId" IS DISTINCT FROM OLD."templateId")
     OR (NEW."periodStart" IS DISTINCT FROM OLD."periodStart")
     OR (NEW."periodEnd" IS DISTINCT FROM OLD."periodEnd") THEN
    SELECT COUNT(*) INTO usage_count FROM "reporting_cycle_obligations" WHERE "cycleId" = OLD."id";
    IF usage_count > 0 THEN
      RAISE EXCEPTION 'ReportingCycle % cannot change companyId/templateId/periodStart/periodEnd once an obligation is attached; close it and open a new cycle instead',
        OLD."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reporting_cycle_immutable_after_use
  BEFORE UPDATE ON "reporting_cycles"
  FOR EACH ROW EXECUTE FUNCTION check_reporting_cycle_immutable_after_use();

-- ReportingObligation: agreementId, templateId, frequency, and effective
-- dates freeze once attached to any cycle.
CREATE OR REPLACE FUNCTION check_reporting_obligation_immutable_after_use()
RETURNS TRIGGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  IF (NEW."agreementId" IS DISTINCT FROM OLD."agreementId")
     OR (NEW."templateId" IS DISTINCT FROM OLD."templateId")
     OR (NEW."frequency" IS DISTINCT FROM OLD."frequency")
     OR (NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom")
     OR (NEW."effectiveTo" IS DISTINCT FROM OLD."effectiveTo") THEN
    SELECT COUNT(*) INTO usage_count FROM "reporting_cycle_obligations" WHERE "obligationId" = OLD."id";
    IF usage_count > 0 THEN
      RAISE EXCEPTION 'ReportingObligation % cannot change agreementId/templateId/frequency/effective dates once attached to a cycle; create a new obligation instead',
        OLD."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reporting_obligation_immutable_after_use
  BEFORE UPDATE ON "reporting_obligations"
  FOR EACH ROW EXECUTE FUNCTION check_reporting_obligation_immutable_after_use();

-- ReportingTemplate: nameEn, nameAr, version freeze once any obligation
-- references the template. isActive stays mutable (retiring a template
-- from future use is not a semantic content change).
CREATE OR REPLACE FUNCTION check_reporting_template_immutable_after_use()
RETURNS TRIGGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  IF (NEW."nameEn" IS DISTINCT FROM OLD."nameEn")
     OR (NEW."nameAr" IS DISTINCT FROM OLD."nameAr")
     OR (NEW."version" IS DISTINCT FROM OLD."version") THEN
    SELECT COUNT(*) INTO usage_count FROM "reporting_obligations" WHERE "templateId" = OLD."id";
    IF usage_count > 0 THEN
      RAISE EXCEPTION 'ReportingTemplate % semantic fields (nameEn/nameAr/version) cannot change once referenced by an obligation; create a new template row instead -- isActive may still change',
        OLD."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reporting_template_immutable_after_use
  BEFORE UPDATE ON "reporting_templates"
  FOR EACH ROW EXECUTE FUNCTION check_reporting_template_immutable_after_use();

-- MetricDefinition: insert, update, and delete are all blocked once the
-- owning ReportingTemplate is referenced by an obligation. Checks both
-- the OLD and NEW templateId on UPDATE, covering an attempt to move a
-- definition onto a different, already-in-use template.
CREATE OR REPLACE FUNCTION check_metric_definition_immutable_after_template_use()
RETURNS TRIGGER AS $$
DECLARE
  old_usage_count INTEGER := 0;
  new_usage_count INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT COUNT(*) INTO new_usage_count FROM "reporting_obligations" WHERE "templateId" = NEW."templateId";
  END IF;
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO old_usage_count FROM "reporting_obligations" WHERE "templateId" = OLD."templateId";
  END IF;

  IF TG_OP = 'INSERT' AND new_usage_count > 0 THEN
    RAISE EXCEPTION 'Cannot add a MetricDefinition to template % once it is referenced by an obligation; create a new template row instead',
      NEW."templateId";
  END IF;

  IF TG_OP = 'UPDATE' AND (old_usage_count > 0 OR new_usage_count > 0) THEN
    RAISE EXCEPTION 'Cannot modify MetricDefinition % once its template is referenced by an obligation; create a new template row instead',
      OLD."id";
  END IF;

  IF TG_OP = 'DELETE' AND old_usage_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete MetricDefinition % once its template is referenced by an obligation; create a new template row instead',
      OLD."id";
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_metric_definition_immutable_after_template_use
  BEFORE INSERT OR UPDATE OR DELETE ON "metric_definitions"
  FOR EACH ROW EXECUTE FUNCTION check_metric_definition_immutable_after_template_use();
