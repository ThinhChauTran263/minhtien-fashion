import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { emailService } from "./email.service";

export const stockNotifyService = {
  async subscribe(variantId: string, email: string, userId?: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new AppError("Không tìm thấy sản phẩm", 404);
    if (variant.stock > 0) throw new AppError("Sản phẩm vẫn còn hàng", 400);

    return prisma.stockNotification.upsert({
      where: { variantId_email: { variantId, email } },
      create: { variantId, email, userId },
      update: { notified: false, notifiedAt: null },
    });
  },

  /**
   * Gọi khi variant restock (stock 0 → > 0). Gửi email cho mọi người đăng ký chưa thông báo.
   */
  async notifyRestocked(variantId: string): Promise<number> {
    const subs = await prisma.stockNotification.findMany({
      where: { variantId, notified: false },
      include: { variant: { include: { product: true } } },
    });

    for (const sub of subs) {
      await emailService
        .sendRestockEmail(sub.email, {
          name: sub.variant.product.name,
          slug: sub.variant.product.slug,
          thumbnail: sub.variant.product.thumbnail,
          price: Number(sub.variant.product.salePrice ?? sub.variant.product.basePrice),
        })
        .catch((err) => console.error("[Restock email]", err));

      await prisma.stockNotification.update({
        where: { id: sub.id },
        data: { notified: true, notifiedAt: new Date() },
      });
    }
    return subs.length;
  },

  async getSubscribers(variantId: string) {
    return prisma.stockNotification.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
    });
  },
};
