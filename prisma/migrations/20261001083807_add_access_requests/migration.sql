-- CreateEnum
CREATE TYPE "AccessRequestedRole" AS ENUM ('MANAGEMENT', 'INVESTMENT_PROFESSIONAL', 'INVESTOR');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestedRole" "AccessRequestedRole" NOT NULL,
    "organizationName" TEXT,
    "message" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_requests_status_idx" ON "access_requests"("status");

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
