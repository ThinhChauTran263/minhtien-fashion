import crypto from "crypto";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";

export const REFERRAL_CONFIG = {
  referrerReward: 50000,
  refereeReward: 30000,
  minOrderAmount: 200000,
  maxReferrals: 50,
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (user?.referralCode) return user.referralCode;

  const code = `MT${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

async function createReferralVoucher(opts: {
  code: string;
  value: number;
  minOrder: number;
}) {
  const now = new Date();
  return prisma.voucher.create({
    data: {
      code: opts.code,
      description: "Voucher từ chương trình giới thiệu",
      type: "FIXED",
      value: opts.value,
      minOrder: opts.minOrder,
      usageLimit: 1,
      perUserLimit: 1,
      startsAt: now,
      expiresAt: addDays(now, 30),
      isActive: true,
    },
  });
}

export const referralService = {
  getMyCode: ensureReferralCode,

  async applyCode(userId: string, referralCode: string) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer) throw new AppError("Mã giới thiệu không hợp lệ", 400);
    if (referrer.id === userId) throw new AppError("Không thể tự giới thiệu", 400);

    const existing = await prisma.referral.findUnique({ where: { refereeId: userId } });
    if (existing) throw new AppError("Bạn đã sử dụng mã giới thiệu rồi", 400);

    await prisma.referral.create({
      data: { referrerId: referrer.id, refereeId: userId },
    });

    // Tặng voucher cho referee ngay
    await createReferralVoucher({
      code: `REF-${userId.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      value: REFERRAL_CONFIG.refereeReward,
      minOrder: REFERRAL_CONFIG.minOrderAmount,
    });

    return { success: true, reward: REFERRAL_CONFIG.refereeReward };
  },

  /**
   * Gọi sau khi referee đặt đơn đầu tiên DELIVERED. Tặng voucher cho referrer.
   */
  async processReward(orderId: string, userId: string, orderTotal: number) {
    const referral = await prisma.referral.findFirst({
      where: { refereeId: userId, rewardGiven: false },
    });
    if (!referral) return null;
    if (orderTotal < REFERRAL_CONFIG.minOrderAmount) return null;

    await createReferralVoucher({
      code: `REFR-${referral.referrerId.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      value: REFERRAL_CONFIG.referrerReward,
      minOrder: REFERRAL_CONFIG.minOrderAmount,
    });

    await prisma.referral.update({
      where: { id: referral.id },
      data: { rewardGiven: true, refereeOrderId: orderId },
    });

    return { rewarded: true };
  },

  async getStats(userId: string) {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referee: { select: { name: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: referrals.length,
      rewarded: referrals.filter((r) => r.rewardGiven).length,
      pending: referrals.filter((r) => !r.rewardGiven).length,
      items: referrals.map((r) => ({
        refereeName: r.referee.name,
        joinedAt: r.referee.createdAt,
        rewardGiven: r.rewardGiven,
      })),
    };
  },
};
