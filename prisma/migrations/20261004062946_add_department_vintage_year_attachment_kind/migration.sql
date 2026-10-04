-- CreateEnum
CREATE TYPE "Department" AS ENUM ('VentureBuilder', 'InvestmentDepartment');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('General', 'AuditedFinancials');

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "kind" "AttachmentKind" NOT NULL DEFAULT 'General';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "department" "Department" NOT NULL DEFAULT 'InvestmentDepartment';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "vintageYear" INTEGER;
