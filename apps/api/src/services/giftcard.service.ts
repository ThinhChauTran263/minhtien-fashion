import crypto from "crypto";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { emailService } from "./email.service";

export const GIFT_CARD_AMOUNTS = [100000, 200000, 500000, 1000000];

type GiftCardStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
type GiftCardSource =
  | "ADMIN_GRANT"
  | "COMPENSATION"
  | "CUSTOMER_SERVICE"
  | "PURCHASE"
  | "REFUND"
  | "PROMOTION";

type LockedGiftCard = {
  id: string;
  code: string;
  amount: unknown;
  balance: unknown;
  status: GiftCardStatus;
  source: GiftCardSource;
  beneficiaryUserId: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  isActive: boolean;
  redeemedById: string | null;
  startsAt: Date | null;
  expiresAt: Date;
};

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generateCode(): string {
  const seg = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GC-${seg()}-${seg()}-${seg()}`;
}

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function getUsableStatus(card: {
  status?: GiftCardStatus;
  isActive: boolean;
  expiresAt: Date;
  startsAt?: Date | null;
  balance: unknown;
}): GiftCardStatus {
  const now = new Date();
  if (!card.isActive || card.status === "CANCELLED") return "CANCELLED";
  if (card.expiresAt < now) return "EXPIRED";
  if (card.startsAt && card.startsAt > now) return "ACTIVE";
  if (toNumber(card.balance) <= 0 || card.status === "USED") return "USED";
  return "ACTIVE";
}

function assertUsable(card: LockedGiftCard, userId?: string) {
  const now = new Date();
  if (!card.isActive || card.status === "CANCELLED") {
    throw new AppError("Thẻ quà tặng đã bị hủy", 400);
  }
  if (card.startsAt && card.startsAt > now) {
    throw new AppError("Thẻ quà tặng chưa đến thời gian sử dụng", 400);
  }
  if (card.expiresAt < now) {
    throw new AppError("Thẻ quà tặng đã hết hạn", 400);
  }
  if (card.status === "USED" || toNumber(card.balance) <= 0) {
    throw new AppError("Thẻ quà tặng đã hết số dư", 400);
  }
  if (userId && card.beneficiaryUserId && card.beneficiaryUserId !== userId) {
    throw new AppError("Thẻ quà tặng không thuộc tài khoản này", 403);
  }
  if (userId && card.redeemedById && card.redeemedById !== userId) {
    throw new AppError("Thẻ quà tặng đã được liên kết với tài khoản khác", 403);
  }
}

async function lockByCode(tx: any, code: string): Promise<LockedGiftCard> {
  const rows = await tx.$queryRaw<LockedGiftCard[]>`
    SELECT id, code, amount, balance, status, source, "beneficiaryUserId",
      "recipientEmail", "recipientName", message, "isActive", "redeemedById",
      "startsAt", "expiresAt"
    FROM "GiftCard"
    WHERE code = ${code}
    FOR UPDATE
  `;
  const card = rows[0];
  if (!card) throw new AppError("Mã thẻ quà tặng không tồn tại", 404);
  return card;
}

export const giftCardService = {
  getAmounts: () => GIFT_CARD_AMOUNTS,

  async createAdmin(data: {
    amount: number;
    beneficiaryUserId?: string;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    startsAt?: Date | null;
    expiresAt?: Date;
    source?: GiftCardSource;
    internalNote?: string;
    createdByAdminId?: string;
    sendEmail?: boolean;
  }) {
    if (!Number.isInteger(data.amount) || data.amount <= 0) {
      throw new AppError("Mệnh giá thẻ không hợp lệ", 400);
    }

    const beneficiary = data.beneficiaryUserId
      ? await prisma.user.findUnique({
          where: { id: data.beneficiaryUserId },
          select: { id: true, email: true, name: true, role: true },
        })
      : null;
    if (data.beneficiaryUserId && !beneficiary) {
      throw new AppError("Không tìm thấy tài khoản thụ hưởng", 404);
    }
    if (beneficiary && beneficiary.role !== "CUSTOMER") {
      throw new AppError("Chỉ có thể tặng gift card cho tài khoản customer", 400);
    }

    const expiresAt = data.expiresAt ?? addMonths(new Date(), 12);
    const recipientEmail = beneficiary?.email ?? data.recipientEmail;
    const recipientName = beneficiary?.name ?? data.recipientName;

    const card = await prisma.$transaction(async (tx) => {
      const created = await tx.giftCard.create({
        data: {
          code: generateCode(),
          amount: data.amount,
          balance: data.amount,
          status: "ACTIVE",
          source: data.source ?? "ADMIN_GRANT",
          beneficiaryUserId: beneficiary?.id,
          recipientEmail,
          recipientName,
          message: data.message,
          startsAt: data.startsAt ?? null,
          expiresAt,
          redeemedById: beneficiary?.id,
          redeemedAt: beneficiary ? new Date() : null,
          createdByAdminId: data.createdByAdminId,
          internalNote: data.internalNote,
        },
        include: { beneficiary: { select: { id: true, name: true, email: true } } },
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: created.id,
          type: "ISSUE",
          amount: data.amount,
          balanceBefore: 0,
          balanceAfter: data.amount,
          userId: beneficiary?.id,
          adminId: data.createdByAdminId,
          note: data.internalNote,
        },
      });

      if (beneficiary) {
        await tx.giftCardTransaction.create({
          data: {
            giftCardId: created.id,
            type: "REDEEM",
            amount: 0,
            balanceBefore: data.amount,
            balanceAfter: data.amount,
            userId: beneficiary.id,
            adminId: data.createdByAdminId,
            note: "Gift card assigned directly by admin",
          },
        });
      }

      return created;
    });

    if (data.sendEmail && recipientEmail) {
      emailService
        .sendGiftCardEmail({
          code: card.code,
          amount: Number(card.amount),
          recipientName: card.recipientName,
          recipientEmail,
          message: card.message,
          expiresAt: card.expiresAt,
        })
        .catch((err) => console.error("[GiftCard email]", err));
    }

    return card;
  },

  async check(code: string) {
    const card = await prisma.giftCard.findUnique({ where: { code } });
    if (!card) throw new AppError("Mã thẻ quà tặng không tồn tại", 404);
    return {
      code: card.code,
      status: getUsableStatus(card),
      expired: card.expiresAt < new Date(),
      expiresAt: card.expiresAt,
    };
  },

  async redeem(code: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const card = await lockByCode(tx, code);
      assertUsable(card, userId);

      if (card.redeemedById === userId) {
        return {
          id: card.id,
          code: card.code,
          balance: card.balance,
          expiresAt: card.expiresAt,
        };
      }

      const updated = await tx.giftCard.update({
        where: { id: card.id },
        data: {
          redeemedById: userId,
          redeemedAt: new Date(),
          beneficiaryUserId: card.beneficiaryUserId ?? userId,
        },
        select: { id: true, code: true, balance: true, expiresAt: true },
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          type: "REDEEM",
          amount: 0,
          balanceBefore: toNumber(card.balance),
          balanceAfter: toNumber(card.balance),
          userId,
          note: "Redeemed by customer",
        },
      });

      return updated;
    });
  },

  async myCards(userId: string) {
    const cards = await prisma.giftCard.findMany({
      where: {
        OR: [{ beneficiaryUserId: userId }, { redeemedById: userId }],
      },
      orderBy: { createdAt: "desc" },
    });
    return cards.map((c) => ({
      id: c.id,
      code: c.code,
      balance: Number(c.balance),
      amount: Number(c.amount),
      expiresAt: c.expiresAt,
      status: getUsableStatus(c),
      isActive: getUsableStatus(c) === "ACTIVE",
    }));
  },

  async useForOrder(
    tx: any,
    input: { code: string; userId: string; requestedAmount: number; orderId: string }
  ): Promise<number> {
    const card = await lockByCode(tx, input.code);
    assertUsable(card, input.userId);

    const balanceBefore = toNumber(card.balance);
    const used = Math.min(balanceBefore, Math.max(0, input.requestedAmount));
    if (used <= 0) return 0;

    const balanceAfter = balanceBefore - used;
    await tx.giftCard.update({
      where: { id: card.id },
      data: {
        balance: { decrement: used },
        status: balanceAfter <= 0 ? "USED" : "ACTIVE",
        isActive: balanceAfter > 0,
        usedAt: new Date(),
        redeemedById: card.redeemedById ?? input.userId,
        redeemedAt: card.redeemedById ? undefined : new Date(),
        beneficiaryUserId: card.beneficiaryUserId ?? input.userId,
      },
    });

    await tx.giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        type: "USE",
        amount: used,
        balanceBefore,
        balanceAfter,
        orderId: input.orderId,
        userId: input.userId,
        note: "Applied to checkout",
      },
    });

    return used;
  },

  async listAll(filter: { status?: string; q?: string; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const now = new Date();
    const where: any = {};
    if (filter.status === "active") {
      where.AND = [{ balance: { gt: 0 } }, { status: "ACTIVE" }, { expiresAt: { gt: now } }];
    }
    if (filter.status === "used") where.OR = [{ balance: 0 }, { status: "USED" }];
    if (filter.status === "expired") where.OR = [{ expiresAt: { lt: now } }, { status: "EXPIRED" }];
    if (filter.status === "cancelled") where.status = "CANCELLED";
    if (filter.q) {
      where.OR = [
        ...(where.OR ?? []),
        { code: { contains: filter.q, mode: "insensitive" } },
        { recipientEmail: { contains: filter.q, mode: "insensitive" } },
        { beneficiary: { email: { contains: filter.q, mode: "insensitive" } } },
        { beneficiary: { name: { contains: filter.q, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.giftCard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { beneficiary: { select: { id: true, name: true, email: true, phone: true } } },
      }),
      prisma.giftCard.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getTransactions(id: string) {
    const card = await prisma.giftCard.findUnique({ where: { id }, select: { id: true } });
    if (!card) throw new AppError("Không tìm thấy gift card", 404);
    return prisma.giftCardTransaction.findMany({
      where: { giftCardId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, code: true, total: true } },
      },
    });
  },

  async cancel(id: string, data: { adminId?: string; reason?: string }) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.findUnique({ where: { id } });
      if (!card) throw new AppError("Không tìm thấy gift card", 404);
      if (card.status === "CANCELLED") return card;

      const balanceBefore = Number(card.balance);
      const updated = await tx.giftCard.update({
        where: { id },
        data: {
          status: "CANCELLED",
          isActive: false,
          cancelledAt: new Date(),
          cancelReason: data.reason,
        },
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: id,
          type: "CANCEL",
          amount: 0,
          balanceBefore,
          balanceAfter: balanceBefore,
          adminId: data.adminId,
          note: data.reason,
        },
      });

      return updated;
    });
  },
};
