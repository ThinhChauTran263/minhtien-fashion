-- Voucher conditions mở rộng
ALTER TABLE "Voucher" ADD COLUMN "applicableCategoryIds" TEXT[] DEFAULT '{}';
ALTER TABLE "Voucher" ADD COLUMN "applicableProductIds" TEXT[] DEFAULT '{}';
ALTER TABLE "Voucher" ADD COLUMN "requiredMemberTier" TEXT;
