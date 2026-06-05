import { prisma } from "../config/database";
import { StockMovementType } from "@prisma/client";

export class ManufacturingService {
  // ============ MATERIALS ============
  async getMaterials() {
    return prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async createMaterial(data: { code: string; name: string; unit?: string }) {
    return prisma.material.create({
      data,
    });
  }

  // ============ RECEIPTS (Nhập nguyên liệu) ============
  async getReceipts() {
    return prisma.materialReceipt.findMany({
      include: {
        rolls: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createReceipt(
    data: {
      code: string;
      supplierName?: string;
      totalAmount: number;
      note?: string;
    },
    rolls: {
      materialId: string;
      rollCode: string;
      color?: string;
      length: number;
      costPrice: number;
    }[],
    adminId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.materialReceipt.create({
        data: {
          code: data.code,
          supplierName: data.supplierName,
          totalAmount: data.totalAmount,
          note: data.note,
          adminId,
          rolls: {
            create: rolls.map((r) => ({
              materialId: r.materialId,
              rollCode: r.rollCode,
              color: r.color,
              originalLength: r.length,
              currentLength: r.length,
              costPrice: r.costPrice,
            })),
          },
        },
        include: { rolls: true },
      });

      return receipt;
    });
  }

  // ============ ROLLS (Kho vải) ============
  async getRolls() {
    return prisma.materialRoll.findMany({
      include: {
        material: true,
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ============ PRODUCTIONS (Sản xuất) ============
  async getProductions() {
    return prisma.productionBatch.findMany({
      include: {
        roll: {
          include: { material: true },
        },
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createProductionBatch(
    data: {
      code: string;
      rollId: string;
      usedLength: number;
      wastedLength?: number;
      additionalCostPerItem?: number;
      additionalCostNote?: string;
      note?: string;
    },
    items: { variantId: string; yieldQuantity: number }[],
    adminId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Get the roll
      const roll = await tx.materialRoll.findUnique({
        where: { id: data.rollId },
      });
      if (!roll) throw new Error("Material roll not found");

      const totalExport = data.usedLength + (data.wastedLength || 0);

      if (Number(roll.currentLength) < totalExport) {
        throw new Error(
          `Not enough length in roll. Current: ${roll.currentLength}, Exporting: ${totalExport}`
        );
      }

      // 2. Calculate Costs
      const totalYield = items.reduce((sum, item) => sum + item.yieldQuantity, 0);
      if (totalYield === 0) throw new Error("Total yield cannot be 0");

      const fabricCostRatio = totalExport / Number(roll.originalLength);
      const totalFabricCostForBatch = fabricCostRatio * Number(roll.costPrice);
      const fabricCostPerItem = totalFabricCostForBatch / totalYield;
      const finalCostPerItem = fabricCostPerItem + (data.additionalCostPerItem || 0);

      // 3. Create Production Batch
      const batch = await tx.productionBatch.create({
        data: {
          code: data.code,
          rollId: data.rollId,
          usedLength: data.usedLength,
          wastedLength: data.wastedLength || 0,
          additionalCostPerItem: data.additionalCostPerItem || 0,
          additionalCostNote: data.additionalCostNote,
          note: data.note,
          adminId,
          items: {
            create: items.map((i) => ({
              variantId: i.variantId,
              yieldQuantity: i.yieldQuantity,
              costPerItem: finalCostPerItem,
            })),
          },
        },
        include: { items: true },
      });

      // 4. Deduct length from Roll
      await tx.materialRoll.update({
        where: { id: roll.id },
        data: {
          currentLength: {
            decrement: totalExport,
          },
        },
      });

      // 5. Add stock to variants and create StockMovements
      for (const item of items) {
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.yieldQuantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: StockMovementType.MANUFACTURE_INBOUND,
            quantity: item.yieldQuantity,
            stockAfter: variant.stock,
            reservedAfter: variant.reserved,
            refType: "PRODUCTION_BATCH",
            refId: batch.id,
            note: `Manufactured from roll ${roll.rollCode}`,
            createdBy: adminId,
          },
        });
      }

      return batch;
    });
  }
}

export const manufacturingService = new ManufacturingService();
