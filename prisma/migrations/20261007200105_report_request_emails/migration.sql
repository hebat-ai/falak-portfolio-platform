-- CreateTable
CREATE TABLE "report_request_emails" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failureReason" TEXT,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_request_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_request_emails_cycleId_idx" ON "report_request_emails"("cycleId");

-- AddForeignKey
ALTER TABLE "report_request_emails" ADD CONSTRAINT "report_request_emails_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "reporting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_request_emails" ADD CONSTRAINT "report_request_emails_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
