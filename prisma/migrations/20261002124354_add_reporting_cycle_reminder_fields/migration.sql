-- AlterTable
ALTER TABLE "reporting_cycles" ADD COLUMN     "lastReminderKind" TEXT,
ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3);
