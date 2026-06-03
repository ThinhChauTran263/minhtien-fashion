import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";

export const flashSaleService = {
  /**
   * Lấy flash sale đang diễn ra (isActive + trong khoảng thời gian).
   */
  async getActiveFlashSale() {
    const now = new Date();
    return prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                thumbnail: true,
                basePrice: true,
                salePrice: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Sản phẩm trong 1 flash sale + % đã bán.
   */
  async getFlashSaleProducts(flashSaleId: string) {
    const flashSale = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                thumbnail: true,
                basePrice: true,
                salePrice: true,
              },
            },
          },
        },
      },
    });

    if (!flashSale) throw new AppError("Flash sale không tồn tại", 404);

    const items = flashSale.items.map((item) => ({
      ...item,
      salePrice: Number(item.salePrice),
      soldPercent: item.quantity > 0 ? Math.round((item.sold / item.quantity) * 100) : 0,
      remaining: Math.max(0, item.quantity - item.sold),
    }));

    return { ...flashSale, items };
  },

  /**
   * Mua 1 item flash sale: dùng SELECT FOR UPDATE để lock row,
   * ngăn race condition khi nhiều user mua cùng lúc.
   */
  async purchaseFlashSaleItem(itemId: string, quantity: number) {
    return prisma.$transaction(async (tx) => {
      // Pessimistic lock: SELECT FOR UPDATE ngăn concurrent reads
      const [item] = await tx.$queryRaw<
        Array<{
          id: string;
          sold: number;
          quantity: number;
          flashSaleId: string;
        }>
      >`SELECT id, sold, quantity, "flashSaleId" FROM "FlashSaleItem" WHERE id = ${itemId} FOR UPDATE`;

      if (!item) throw new AppError("Sản phẩm flash sale không tồn tại", 404);

      const flashSale = await tx.flashSale.findUnique({
        where: { id: item.flashSaleId },
      });

      if (!flashSale) throw new AppError("Flash sale không tồn tại", 404);

      const now = new Date();
      if (
        !flashSale.isActive ||
        flashSale.startsAt > now ||
        flashSale.endsAt < now
      ) {
        throw new AppError("Flash sale đã kết thúc", 400);
      }

      if (item.sold + quantity > item.quantity) {
        throw new AppError("Sản phẩm flash sale đã hết suất", 400);
      }

      return tx.flashSaleItem.update({
        where: { id: itemId },
        data: { sold: { increment: quantity } },
      });
    });
  },

  /**
   * Lấy giá flash sale của 1 product nếu đang trong sale. Null nếu không.
   */
  async getFlashPriceForProduct(productId: string): Promise<number | null> {
    const now = new Date();
    const item = await prisma.flashSaleItem.findFirst({
      where: {
        productId,
        flashSale: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      },
      select: { salePrice: true, sold: true, quantity: true },
    });
    if (!item || item.sold >= item.quantity) return null;
    return Number(item.salePrice);
  },

  // ===== Admin CRUD =====
  async listAll() {
    return prisma.flashSale.findMany({
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
  },

  async create(data: {
    name: string;
    startsAt: string | Date;
    endsAt: string | Date;
    isActive?: boolean;
    items: { productId: string; salePrice: number; quantity: number }[];
  }) {
    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      throw new AppError("Thời gian kết thúc phải sau thời gian bắt đầu", 400);
    }
    return prisma.flashSale.create({
      data: {
        name: data.name,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        isActive: data.isActive ?? true,
        items: {
          create: data.items.map((it) => ({
            productId: it.productId,
            salePrice: it.salePrice,
            quantity: it.quantity,
          })),
        },
      },
      include: { items: true },
    });
  },

  async update(
    id: string,
    data: {
      name?: string;
      startsAt?: string | Date;
      endsAt?: string | Date;
      isActive?: boolean;
    }
  ) {
    return prisma.flashSale.update({
      where: { id },
      data: {
        name: data.name,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        isActive: data.isActive,
      },
    });
  },

  async remove(id: string) {
    await prisma.flashSale.delete({ where: { id } });
    return { success: true };
  },
};
