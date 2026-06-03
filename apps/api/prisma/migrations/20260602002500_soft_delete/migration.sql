-- Soft delete: thêm deletedAt cho Product, User, Order
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Index để filter nhanh (partial index chỉ gồm row chưa xóa)
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt") WHERE "deletedAt" IS NULL;
