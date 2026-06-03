import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";

// Quy tắc điểm:
// - Mua hàng: 1% giá trị đơn = điểm (100K = 1000 điểm)
// - Đổi điểm: 1000 điểm = 10K giảm giá
// - Điểm hết hạn sau 12 tháng
const EARN_RATE = 0.01; // 1% giá trị đơn
const REDEEM_RATE = 10; // 1 điểm = 10 VNĐ (1000 điểm = 10.000đ)
const POINT_EXPIRY_MONTHS = 12;

export const loyaltyService = {
  /** Số điểm kiếm được từ 1 đơn hàng (1% giá trị). */
  calcEarnedPoints(orderTotal: number): number {
    return Math.floor(orderTotal * EARN_RATE);
  },

  /** Quy đổi điểm sang số tiền giảm giá (VNĐ). */
  pointsToDiscount(points: number): number {
    return points * REDEEM_RATE;
  },

  /** Số tiền giảm tối đa cho phép dựa trên điểm hiện có + tổng đơn. */
  maxRedeemable(userPoints: number, orderSubtotal: number): number {
    const maxByPoints = this.pointsToDiscount(userPoints);
    // Không cho dùng điểm vượt quá 50% giá trị đơn
    const maxByOrder = Math.floor(orderSubtotal * 0.5);
    return Math.min(maxByPoints, maxByOrder);
  },

  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    return user?.points ?? 0;
  },

  async getHistory(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.pointHistory.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.pointHistory.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Cộng điểm khi đơn DELIVERED. Idempotent theo orderId + type.
   */
  async earnFromOrder(userId: string, orderId: string, orderTotal: number) {
    const points = this.calcEarnedPoints(orderTotal);
    if (points <= 0) return null;

    return prisma.$transaction(async (tx) => {
      // Idempotency: nếu đã cộng cho order này thì bỏ qua
      const existing = await tx.pointHistory.findFirst({
        where: { orderId, type: "EARN_ORDER" },
      });
      if (existing) return existing;

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + POINT_EXPIRY_MONTHS);

      const history = await tx.pointHistory.create({
        data: {
          userId,
          points,
          type: "EARN_ORDER",
          description: `Tích điểm từ đơn hàng`,
          orderId,
          expiresAt,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      });

      return history;
    });
  },

  /**
   * Trừ điểm khi đổi điểm lúc checkout. Trả về số điểm đã dùng.
   */
  async redeemPoints(
    tx: any,
    userId: string,
    pointsToUse: number,
    orderId?: string
  ): Promise<number> {
    if (pointsToUse <= 0) return 0;

    const [user] = await tx.$queryRaw<Array<{ points: number }>>`SELECT points FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (!user || user.points < pointsToUse) {
      throw new AppError("Không đủ điểm để đổi", 400);
    }

    await tx.pointHistory.create({
      data: {
        userId,
        points: -pointsToUse,
        type: "REDEEM",
        description: "Đổi điểm giảm giá đơn hàng",
        orderId,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: pointsToUse } },
    });

    return pointsToUse;
  },

  /**
   * Admin tặng điểm.
   */
  async grantBonus(userId: string, points: number, description: string) {
    return prisma.$transaction(async (tx) => {
      const history = await tx.pointHistory.create({
        data: {
          userId,
          points,
          type: "BONUS",
          description,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      return history;
    });
  },
};
