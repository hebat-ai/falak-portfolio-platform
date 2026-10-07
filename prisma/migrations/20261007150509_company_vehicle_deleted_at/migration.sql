-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "deletedAt" TIMESTAMP(3);
