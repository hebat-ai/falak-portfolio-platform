-- CreateTable
CREATE TABLE "investor_invites" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investor_invites_tokenHash_key" ON "investor_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "investor_invites_investorId_idx" ON "investor_invites"("investorId");

-- AddForeignKey
ALTER TABLE "investor_invites" ADD CONSTRAINT "investor_invites_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_invites" ADD CONSTRAINT "investor_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

