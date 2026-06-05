-- Sync remaining schema changes that were present in schema.prisma but missing from migrations.
ALTER TYPE "StockMovementType" ADD VALUE 'DISPOSE_DEFECTIVE';

ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_authorId_fkey";
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_categoryId_fkey";
ALTER TABLE "BundleItem" DROP CONSTRAINT "BundleItem_productId_fkey";
ALTER TABLE "FlashSaleItem" DROP CONSTRAINT "FlashSaleItem_productId_fkey";
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_refereeId_fkey";
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

DROP INDEX "BlogPost_isPublished_publishedAt_idx";
DROP INDEX "BundleItem_bundleId_idx";
DROP INDEX "FlashSale_isActive_startsAt_endsAt_idx";
DROP INDEX "FlashSaleItem_flashSaleId_productId_key";
DROP INDEX "Invoice_invoiceNumber_key";
DROP INDEX "Product_name_trgm_idx";
DROP INDEX "User_role_deletedAt_isLocked_idx";

ALTER TABLE "Address" ALTER COLUMN "district" DROP NOT NULL;

ALTER TABLE "Banner"
  DROP COLUMN "imageMobile",
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "position" SET DEFAULT 'home_hero';

ALTER TABLE "BlogPost"
  ALTER COLUMN "excerpt" DROP NOT NULL,
  ALTER COLUMN "thumbnail" DROP NOT NULL,
  ALTER COLUMN "authorId" DROP NOT NULL,
  ALTER COLUMN "categoryId" DROP NOT NULL;

ALTER TABLE "Bundle" DROP COLUMN "updatedAt";
ALTER TABLE "GiftCard" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Invoice" DROP COLUMN "updatedAt", ALTER COLUMN "vatAmount" DROP DEFAULT;
ALTER TABLE "PointHistory" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "ProductVariant" ADD COLUMN "defectiveStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PushSubscription" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Referral"
  ADD COLUMN "orderId" TEXT,
  ADD COLUMN "rewardAmount" DECIMAL(12,0),
  ADD COLUMN "rewarded" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Review"
  ADD COLUMN "comment" TEXT,
  ALTER COLUMN "content" DROP NOT NULL;

ALTER TABLE "Voucher"
  ALTER COLUMN "applicableCategoryIds" DROP DEFAULT,
  ALTER COLUMN "applicableProductIds" DROP DEFAULT;

CREATE TABLE "Province" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "District" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "provinceId" INTEGER NOT NULL,
  CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ward" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "districtId" INTEGER NOT NULL,
  CONSTRAINT "Ward_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "TailoringRequest" (
  "id" TEXT NOT NULL,
  "requestType" TEXT NOT NULL DEFAULT 'CUSTOM',
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "company" TEXT,
  "quantity" INTEGER,
  "requirements" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TailoringRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "District_provinceId_idx" ON "District"("provinceId");
CREATE INDEX "Ward_districtId_idx" ON "Ward"("districtId");
CREATE INDEX "TailoringRequest_status_idx" ON "TailoringRequest"("status");
CREATE INDEX "TailoringRequest_requestType_idx" ON "TailoringRequest"("requestType");
CREATE INDEX "TailoringRequest_createdAt_idx" ON "TailoringRequest"("createdAt");
CREATE UNIQUE INDEX "BundleItem_bundleId_productId_key" ON "BundleItem"("bundleId", "productId");

ALTER TABLE "District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashSaleItem" ADD CONSTRAINT "FlashSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
