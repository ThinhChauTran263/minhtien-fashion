-- ============================================================
-- Inventory Reservation + QC Returns + Stock Movement Ledger
-- ============================================================

-- ProductVariant: soft allocation + buffer + outlet
ALTER TABLE "ProductVariant" ADD COLUMN "reserved"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductVariant" ADD COLUMN "safetyStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductVariant" ADD COLUMN "outletStock" INTEGER NOT NULL DEFAULT 0;

-- Order: idempotency flags + reservation expiry
ALTER TABLE "Order" ADD COLUMN "stockDeducted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "stockRestored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "reservedUntil" TIMESTAMP(3);

-- Backfill: đơn cũ đã PAID hoặc đã giao coi như đã trừ kho
UPDATE "Order" SET "stockDeducted" = true
  WHERE "paymentStatus" = 'PAID' OR "status" IN ('CONFIRMED','PROCESSING','SHIPPING','DELIVERED');
-- Đơn cũ đã huỷ/trả coi như đã hoàn kho
UPDATE "Order" SET "stockRestored" = true
  WHERE "status" IN ('CANCELLED','RETURNED');

-- ReturnRequest: QC + idempotency
ALTER TABLE "ReturnRequest" ADD COLUMN "qcResults"       JSONB;
ALTER TABLE "ReturnRequest" ADD COLUMN "stockProcessed"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReturnRequest" ADD COLUMN "refundProcessed" BOOLEAN NOT NULL DEFAULT false;

-- ReturnStatus: thêm bước INSPECTING
ALTER TYPE "ReturnStatus" ADD VALUE IF NOT EXISTS 'INSPECTING' BEFORE 'REFUNDED';

-- StockMovementType enum
CREATE TYPE "StockMovementType" AS ENUM (
  'RESERVE', 'RELEASE', 'COMMIT_SALE', 'DEDUCT_DIRECT',
  'RESTOCK_CANCEL', 'RESTOCK_RETURN_A', 'RETURN_B_OUTLET',
  'WRITE_OFF', 'MANUAL_ADJUST', 'RESTOCK_INBOUND'
);

-- StockMovement ledger
CREATE TABLE "StockMovement" (
  "id"            TEXT NOT NULL,
  "variantId"     TEXT NOT NULL,
  "type"          "StockMovementType" NOT NULL,
  "quantity"      INTEGER NOT NULL,
  "stockAfter"    INTEGER NOT NULL,
  "reservedAfter" INTEGER NOT NULL,
  "refType"       TEXT,
  "refId"         TEXT,
  "note"          TEXT,
  "createdBy"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockMovement_variantId_idx"     ON "StockMovement"("variantId");
CREATE INDEX "StockMovement_refType_refId_idx" ON "StockMovement"("refType", "refId");
CREATE INDEX "StockMovement_type_idx"          ON "StockMovement"("type");

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
