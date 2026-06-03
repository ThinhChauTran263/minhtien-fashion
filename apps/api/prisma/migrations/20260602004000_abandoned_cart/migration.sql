-- Abandoned Cart Recovery: tracking fields
ALTER TABLE "Cart" ADD COLUMN "lastReminderSentAt" TIMESTAMP(3);
ALTER TABLE "Cart" ADD COLUMN "reminderCount" INTEGER NOT NULL DEFAULT 0;
