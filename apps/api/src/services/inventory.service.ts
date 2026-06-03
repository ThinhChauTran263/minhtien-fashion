import { prisma } from "../config/database";
import { stockService } from "./stock.service";

const DEFAULT_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

export const inventoryService = {
  async getLowStockVariants(threshold = DEFAULT_THRESHOLD) {
    return prisma.productVariant.findMany({
      where: {
        stock: { lte: threshold, gt: 0 },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            lowStockThreshold: true,
          },
        },
      },
      orderBy: { stock: "asc" },
    });
  },

  async getMovements(variantId: string) {
    return prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getDefectiveVariants() {
    return prisma.productVariant.findMany({
      where: { defectiveStock: { gt: 0 } },
      include: {
        product: { select: { name: true, thumbnail: true } }
      }
    });
  },

  async getDisposalHistory(page = 1, limit = 50) {
    return prisma.stockMovement.findMany({
      where: { type: "DISPOSE_DEFECTIVE" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        variant: {
          include: {
            product: { select: { name: true, thumbnail: true } }
          }
        }
      }
    });
  },

  async getOutOfStockVariants() {
    return prisma.productVariant.findMany({
      where: {
        stock: 0,
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, thumbnail: true },
        },
      },
    });
  },

  async getCounts() {
    const [low, out] = await Promise.all([
      prisma.productVariant.count({
        where: {
          stock: { lte: DEFAULT_THRESHOLD, gt: 0 },
          isActive: true,
          product: { isActive: true },
        },
      }),
      prisma.productVariant.count({
        where: { stock: 0, isActive: true, product: { isActive: true } },
      }),
    ]);
    return { lowStock: low, outOfStock: out };
  },

  /**
   * Admin chỉnh tay stock — ghi ledger MANUAL_ADJUST.
   */
  async updateVariantStock(variantId: string, stock: number, adminId?: string) {
    // Lấy stock cũ TRƯỚC khi transaction thay đổi
    const before = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      await stockService.manualAdjust(tx, variantId, stock, adminId ?? "system");
      return tx.productVariant.findUnique({ where: { id: variantId } });
    });

    // Restock notification: chỉ gửi khi stock từ 0 → > 0
    if (before && before.stock === 0 && stock > 0) {
      const { stockNotifyService } = await import("./stock-notify.service");
      stockNotifyService
        .notifyRestocked(variantId)
        .catch((err) => console.error("[Restock notify]", err));
    }

    return result;
  },

  async bulkUpdateStock(updates: { variantId: string; stock: number }[], adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const u of updates) {
        await stockService.manualAdjust(tx, u.variantId, u.stock, adminId ?? "system");
        const variant = await tx.productVariant.findUnique({ where: { id: u.variantId } });
        results.push(variant);
      }
      return results;
    });
  },

  /**
   * Lấy variants vừa xuống dưới ngưỡng (gọi sau khi tạo đơn).
   */
  async getCriticalVariants(variantIds: string[], threshold = DEFAULT_THRESHOLD) {
    return prisma.productVariant.findMany({
      where: { id: { in: variantIds }, stock: { lte: threshold } },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
  },

  /**
   * Tính available stock cho frontend.
   */
  getAvailableStock(variant: { stock: number; reserved: number; safetyStock: number }): number {
    return stockService.availableStock(variant.stock, variant.reserved, variant.safetyStock);
  },
};
