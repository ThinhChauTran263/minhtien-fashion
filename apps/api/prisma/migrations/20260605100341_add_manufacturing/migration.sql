-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'MANUFACTURE_INBOUND';

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mét',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialReceipt" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierName" TEXT,
    "totalAmount" DECIMAL(12,0) NOT NULL,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRoll" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "rollCode" TEXT NOT NULL,
    "originalLength" DECIMAL(10,2) NOT NULL,
    "currentLength" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(12,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "usedLength" DECIMAL(10,2) NOT NULL,
    "wastedLength" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "additionalCostPerItem" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "additionalCostNote" TEXT,
    "adminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "yieldQuantity" INTEGER NOT NULL,
    "costPerItem" DECIMAL(12,0),

    CONSTRAINT "ProductionBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialReceipt_code_key" ON "MaterialReceipt"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRoll_rollCode_key" ON "MaterialRoll"("rollCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBatch_code_key" ON "ProductionBatch"("code");

-- AddForeignKey
ALTER TABLE "MaterialRoll" ADD CONSTRAINT "MaterialRoll_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "MaterialReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRoll" ADD CONSTRAINT "MaterialRoll_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "MaterialRoll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatchItem" ADD CONSTRAINT "ProductionBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatchItem" ADD CONSTRAINT "ProductionBatchItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
