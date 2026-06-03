import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { slugify } from "../utils/slug";

function priceOf(product: { basePrice: any; salePrice: any }): number {
  return Number(product.salePrice ?? product.basePrice);
}

export const bundleService = {
  async getActiveBundles() {
    const now = new Date();
    const bundles = await prisma.bundle.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      include: { items: { include: { product: true } } },
    });
    return bundles.map((b) => this.withPricing(b));
  },

  async getBundleBySlug(slug: string) {
    const bundle = await prisma.bundle.findUnique({
      where: { slug },
      include: { items: { include: { product: { include: { variants: true } } } } },
    });
    if (!bundle) throw new AppError("Combo không tồn tại", 404);
    return this.withPricing(bundle);
  },

  withPricing(bundle: any) {
    const originalPrice = bundle.items.reduce(
      (sum: number, item: any) => sum + priceOf(item.product) * item.quantity,
      0
    );
    let discount = 0;
    if (bundle.discountType === "PERCENT") {
      discount = (originalPrice * Number(bundle.discountValue)) / 100;
    } else {
      discount = Number(bundle.discountValue);
    }
    discount = Math.min(discount, originalPrice);
    return {
      ...bundle,
      discountValue: Number(bundle.discountValue),
      pricing: {
        originalPrice,
        discount,
        finalPrice: originalPrice - discount,
        savedPercent: originalPrice > 0 ? Math.round((discount / originalPrice) * 100) : 0,
      },
    };
  },

  /**
   * Phát hiện combo có thể áp dụng cho cart hiện tại.
   */
  async detectInCart(cartItems: { productId: string; quantity: number }[]) {
    const bundles = await this.getActiveBundles();
    const matched = [];
    for (const bundle of bundles) {
      const allIn = bundle.items.every((bi: any) =>
        cartItems.some((ci) => ci.productId === bi.productId && ci.quantity >= bi.quantity)
      );
      const partialIn = bundle.items.some((bi: any) =>
        cartItems.some((ci) => ci.productId === bi.productId)
      );
      if (partialIn) {
        matched.push({
          id: bundle.id,
          name: bundle.name,
          slug: bundle.slug,
          complete: allIn,
          savings: bundle.pricing.discount,
        });
      }
    }
    return matched;
  },

  // Admin
  async listAll() {
    return prisma.bundle.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
  },

  async create(data: any) {
    let slug = data.slug || slugify(data.name);
    const existing = await prisma.bundle.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    return prisma.bundle.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        thumbnail: data.thumbnail,
        discountType: data.discountType,
        discountValue: data.discountValue,
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        items: {
          create: (data.items ?? []).map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity ?? 1,
          })),
        },
      },
      include: { items: true },
    });
  },

  async update(id: string, data: any) {
    // Nếu có items mới → replace
    if (data.items) {
      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    }
    return prisma.bundle.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        discountType: data.discountType,
        discountValue: data.discountValue,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        ...(data.items && {
          items: {
            create: data.items.map((it: any) => ({
              productId: it.productId,
              quantity: it.quantity ?? 1,
            })),
          },
        }),
      },
      include: { items: true },
    });
  },

  async remove(id: string) {
    await prisma.bundle.delete({ where: { id } });
    return { success: true };
  },
};
