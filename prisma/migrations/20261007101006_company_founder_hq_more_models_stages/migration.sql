-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CustomerModel" ADD VALUE 'B2B2C';
ALTER TYPE "CustomerModel" ADD VALUE 'B2G';
ALTER TYPE "CustomerModel" ADD VALUE 'C2C';
ALTER TYPE "CustomerModel" ADD VALUE 'D2C';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FundingStage" ADD VALUE 'BridgeToSeed' BEFORE 'Seed';
ALTER TYPE "FundingStage" ADD VALUE 'PreSeriesA' BEFORE 'SeriesA';
ALTER TYPE "FundingStage" ADD VALUE 'BridgeToSeriesA' BEFORE 'SeriesA';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "founderEmail" TEXT,
ADD COLUMN     "founderName" TEXT,
ADD COLUMN     "founderPhone" TEXT,
ADD COLUMN     "hqCity" TEXT,
ADD COLUMN     "hqCountry" TEXT;
