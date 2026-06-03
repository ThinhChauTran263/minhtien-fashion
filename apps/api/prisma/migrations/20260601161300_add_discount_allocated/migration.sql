-- AlterTable: Thêm trường discountAllocated để lưu phần chiết khấu prorate cho từng item
-- Phục vụ tính refund chính xác khi hoàn hàng
ALTER TABLE "OrderItem" ADD COLUMN "discountAllocated" DECIMAL(12,0) NOT NULL DEFAULT 0;
