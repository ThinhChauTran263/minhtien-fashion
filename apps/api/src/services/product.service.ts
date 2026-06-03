import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { cacheService } from "./cache.service";
import { productSearchService } from "../search/product-search.service";

interface ProductFilter {
  ids?: string[];
  collarType?: "CO_CO" | "CO_TRON";
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "best_seller";
  page?: number;
  limit?: number;
  search?: string;
}

export const productService = {
  async getProducts(filter: ProductFilter) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (filter.ids?.length) {
      where.id = { in: filter.ids };
    }

    if (filter.collarType) {
      where.collarType = filter.collarType;
    }

    if (filter.category) {
      where.category = { slug: filter.category };
    }

    if (filter.minPrice || filter.maxPrice) {
      where.basePrice = {};
      if (filter.minPrice) where.basePrice.gte = filter.minPrice;
      if (filter.maxPrice) where.basePrice.lte = filter.maxPrice;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
        { tags: { hasSome: [filter.search.toLowerCase()] } },
      ];
    }

    // Filter by size/color qua variants
    if (filter.sizes?.length || filter.colors?.length) {
      where.variants = {
        some: {
          isActive: true,
          stock: { gt: 0 },
          ...(filter.sizes?.length && { size: { in: filter.sizes as any } }),
          ...(filter.colors?.length && { color: { in: filter.colors } }),
        },
      };
    }

    // Sort
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (filter.sort) {
      case "price_asc":
        orderBy = { basePrice: "asc" };
        break;
      case "price_desc":
        orderBy = { basePrice: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "best_seller":
        orderBy = { soldCount: "desc" };
        break;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              size: true,
              color: true,
              colorHex: true,
              stock: true,
              price: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getBySlug(slug: string) {
    const cacheKey = cacheService.keys.productBySlug(slug);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: [{ color: "asc" }, { size: "asc" }],
        },
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new AppError("Sáº£n pháº©m khÃ´ng tá»“n táº¡i", 404);
    }

    // TÄƒng view count (fire-and-forget)
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => undefined);

    await cacheService.set(cacheKey, product, 600);
    return product;
  },

  async getFeatured(limit = 8) {
    const cached = await cacheService.get(cacheService.keys.featuredProducts);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true, deletedAt: null },
      take: limit,
      orderBy: { soldCount: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
      },
    });

    await cacheService.set(cacheService.keys.featuredProducts, products, 300);
    return products;
  },

  async getNewArrivals(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
      },
    });
  },

  async search(query: string, limit = 10) {
    const meiliResult = await productSearchService.searchProducts(query, { limit });
    if (meiliResult) return meiliResult.items;

    return prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortDesc: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query.toLowerCase()] } },
        ],
      },
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        thumbnail: true,
        basePrice: true,
        salePrice: true,
      },
    });
  },
  async getRelatedProducts(productId: string, limit = 8) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, collarType: true },
    });
    if (!product) return [];

    return prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        deletedAt: null,
        OR: [{ categoryId: product.categoryId }, { collarType: product.collarType }],
      },
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: {
          where: { isActive: true },
          select: { size: true, color: true, stock: true },
        },
      },
    });
  },

  async getPopularInCategory(categoryId: string, excludeId: string, limit = 4) {
    return prisma.product.findMany({
      where: { categoryId, id: { not: excludeId }, isActive: true, deletedAt: null },
      orderBy: { soldCount: "desc" },
      take: limit,
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
  },

  async getCrossSellProducts(productId: string, limit = 4) {
    const orderItems = await prisma.orderItem.findMany({
      where: { variant: { productId } },
      select: { orderId: true },
      take: 100,
    });
    const orderIds = orderItems.map((item) => item.orderId);
    if (orderIds.length === 0) return [];

    const otherItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        variant: { productId: { not: productId } },
      },
      select: { variant: { select: { productId: true } } },
    });

    const freq = new Map<string, number>();
    otherItems.forEach((item) => {
      const id = item.variant.productId;
      freq.set(id, (freq.get(id) ?? 0) + 1);
    });
    const topIds = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    if (topIds.length === 0) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: topIds }, isActive: true, deletedAt: null },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });

    return topIds
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
  },
};


