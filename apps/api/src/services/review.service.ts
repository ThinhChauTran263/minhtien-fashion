import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { AppError } from "../middlewares/error.middleware";

type Tx = Prisma.TransactionClient;

interface CreateReviewInput {
  rating: number;
  title?: string;
  content: string;
  images?: string[];
}

export const reviewService = {
  /**
   * Tạo review mới. Chỉ user đã có đơn DELIVERED chứa product này mới được review.
   */
  async createReview(userId: string, productId: string, data: CreateReviewInput) {
    // Verify đã mua
    const purchasedOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        items: {
          some: {
            variant: { productId },
          },
        },
      },
      select: { id: true },
    });

    if (!purchasedOrder) {
      throw new AppError(
        "Bạn cần mua và nhận sản phẩm mới có thể đánh giá",
        403
      );
    }

    // Một user chỉ review 1 product 1 lần
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new AppError("Bạn đã đánh giá sản phẩm này", 400);
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new AppError("Đánh giá từ 1 đến 5 sao", 400);
    }

    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images ?? [],
        isVerified: true, // đã mua xác thực
        isApproved: true, // tự động duyệt; admin có thể tắt
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

      await this.updateProductRating(productId, tx);
      return review;
    });
  },

  async updateReview(
    userId: string,
    reviewId: string,
    data: Partial<CreateReviewInput>
  ) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("Review không tồn tại", 404);
    if (review.userId !== userId) throw new AppError("Không có quyền", 403);

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new AppError("Đánh giá từ 1 đến 5 sao", 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: data.rating,
          title: data.title,
          content: data.content,
          images: data.images,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });

      await this.updateProductRating(review.productId, tx);
      return updated;
    });
  },

  async deleteReview(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("Review không tồn tại", 404);
    if (review.userId !== userId) throw new AppError("Không có quyền", 403);

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await this.updateProductRating(review.productId, tx);
    });
    return { success: true };
  },

  async adminDeleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("Review không tồn tại", 404);
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await this.updateProductRating(review.productId, tx);
    });
    return { success: true };
  },

  async toggleApproval(reviewId: string, isApproved: boolean) {
    return prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: { isApproved },
      });
      await this.updateProductRating(review.productId, tx);
      return review;
    });
  },

  async getProductReviews(productSlug: string, page = 1, limit = 10) {
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) throw new AppError("Sản phẩm không tồn tại", 404);

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.review.count({
        where: { productId: product.id, isApproved: true },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getAllReviews(filter: { isApproved?: boolean; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const where = filter.isApproved !== undefined ? { isApproved: filter.isApproved } : {};

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, slug: true, name: true, thumbnail: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Đã user đã mua product chưa? + đã review chưa?
   */
  async getReviewEligibility(userId: string, productSlug: string) {
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) return { canReview: false, hasReviewed: false, hasPurchased: false };

    const [hasPurchased, existingReview] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId,
          status: "DELIVERED",
          items: { some: { variant: { productId: product.id } } },
        },
        select: { id: true },
      }),
      prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId } },
      }),
    ]);

    return {
      canReview: Boolean(hasPurchased) && !existingReview,
      hasReviewed: Boolean(existingReview),
      hasPurchased: Boolean(hasPurchased),
    };
  },

  /**
   * Tính lại rating trung bình + reviewCount cho product.
   */
  async updateProductRating(productId: string, tx: Tx = prisma) {
    const result = await tx.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        rating: result._avg.rating ?? 0,
        reviewCount: result._count.id,
      },
    });
  },
};
