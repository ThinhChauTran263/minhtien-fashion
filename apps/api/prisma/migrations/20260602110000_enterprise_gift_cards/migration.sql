DO $$ BEGIN
  CREATE TYPE "GiftCardStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GiftCardSource" AS ENUM ('ADMIN_GRANT', 'COMPENSATION', 'CUSTOMER_SERVICE', 'PURCHASE', 'REFUND', 'PROMOTION');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GiftCardTransactionType" AS ENUM ('ISSUE', 'REDEEM', 'USE', 'REFUND', 'CANCEL', 'ADJUST', 'EXPIRE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "GiftCard"
  ADD COLUMN IF NOT EXISTS "status" "GiftCardStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "source" "GiftCardSource" NOT NULL DEFAULT 'ADMIN_GRANT',
  ADD COLUMN IF NOT EXISTS "beneficiaryUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "redeemedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "internalNote" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "GiftCard" ALTER COLUMN "recipientEmail" DROP NOT NULL;

UPDATE "GiftCard"
SET "status" = CASE
  WHEN "isActive" = false THEN 'CANCELLED'::"GiftCardStatus"
  WHEN "balance" <= 0 THEN 'USED'::"GiftCardStatus"
  WHEN "expiresAt" < CURRENT_TIMESTAMP THEN 'EXPIRED'::"GiftCardStatus"
  ELSE 'ACTIVE'::"GiftCardStatus"
END;

DO $$ BEGIN
  ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_beneficiaryUserId_fkey"
  FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "GiftCardTransaction" (
  "id" TEXT NOT NULL,
  "giftCardId" TEXT NOT NULL,
  "type" "GiftCardTransactionType" NOT NULL,
  "amount" DECIMAL(12,0) NOT NULL,
  "balanceBefore" DECIMAL(12,0),
  "balanceAfter" DECIMAL(12,0),
  "orderId" TEXT,
  "userId" TEXT,
  "adminId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GiftCardTransaction_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_giftCardId_fkey"
  FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "GiftCard_beneficiaryUserId_idx" ON "GiftCard"("beneficiaryUserId");
CREATE INDEX IF NOT EXISTS "GiftCard_redeemedById_idx" ON "GiftCard"("redeemedById");
CREATE INDEX IF NOT EXISTS "GiftCard_status_idx" ON "GiftCard"("status");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_orderId_idx" ON "GiftCardTransaction"("orderId");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_userId_idx" ON "GiftCardTransaction"("userId");
