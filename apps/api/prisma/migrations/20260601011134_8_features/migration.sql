-- Product low stock threshold
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- Order shipping fields (GHN integration)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ghnOrderCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "toDistrictId" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "toWardCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "estimatedDelivery" TIMESTAMP(3);

-- Newsletter
CREATE TABLE IF NOT EXISTS "Newsletter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Newsletter_email_key" ON "Newsletter"("email");
