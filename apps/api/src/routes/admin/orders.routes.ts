import { Router } from "express";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import { emailService } from "../../services/email.service";
import { loyaltyService } from "../../services/loyalty.service";
import { notificationService } from "../../services/notification.service";
import { shippingService } from "../../services/shipping.service";
import { einvoiceService } from "../../services/einvoice.service";
import { referralService } from "../../services/referral.service";
import { stockService } from "../../services/stock.service";

const router = Router();

// GET /api/admin/orders
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const status = req.query.status as string;

    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new AppError("Tráº¡ng thÃ¡i khÃ´ng há»£p lá»‡", 400);
    }

    const order = await prisma.$transaction(async (tx) => {
      // Lock order row Ä‘á»ƒ idempotent
      const [locked] = await tx.$queryRaw<
        Array<{ id: string; stockDeducted: boolean; stockRestored: boolean; status: string }>
      >`SELECT id, "stockDeducted", "stockRestored", status FROM "Order" WHERE id = ${req.params.id} FOR UPDATE`;

      if (!locked) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);

      const updateData: any = { status };
      if (status === "SHIPPING") updateData.shippedAt = new Date();
      if (status === "DELIVERED") {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = "PAID";
        updateData.paidAt = new Date();
      }
      if (status === "CANCELLED") updateData.cancelledAt = new Date();

      const updated = await tx.order.update({
        where: { id: locked.id },
        data: updateData,
        include: { items: true },
      });

      // HoÃ n kho idempotent náº¿u huá»·
      if (status === "CANCELLED" && !locked.stockRestored) {
        if (locked.stockDeducted) {
          // ÄÆ¡n Ä‘Ã£ trá»« kho tháº­t â†’ hoÃ n kho
          for (const item of updated.items) {
            await stockService.restockCancel(tx, item.variantId, item.quantity, locked.id);
          }
        } else {
          // ÄÆ¡n online chÆ°a thanh toÃ¡n â†’ release reservation
          for (const item of updated.items) {
            await stockService.release(tx, item.variantId, item.quantity, locked.id);
          }
        }
        await tx.order.update({
          where: { id: locked.id },
          data: { stockRestored: true, reservedUntil: null },
        });
      }

      return updated;
    });

    // Huá»· Ä‘Æ¡n GHN náº¿u cÃ³
    if (status === "CANCELLED" && order.ghnOrderCode) {
      shippingService.cancelOrder(order.ghnOrderCode).catch((err) =>
        console.error("[GHN cancel]", err)
      );
    }

    // Khi chuyá»ƒn sang SHIPPING: táº¡o Ä‘Æ¡n GHN náº¿u chÆ°a cÃ³
    if (status === "SHIPPING" && !order.ghnOrderCode && order.toDistrictId && order.toWardCode) {
      try {
        const ghnResult = await shippingService.createShippingOrder({
          code: order.code,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddress: order.shippingAddress,
          toDistrictId: order.toDistrictId,
          toWardCode: order.toWardCode,
          codAmount: order.paymentMethod === "COD" ? Number(order.total) : 0,
          weight: order.items.reduce((s, it) => s + it.quantity * 200, 200),
          items: order.items.map((it) => ({
            name: it.productName,
            quantity: it.quantity,
            price: Number(it.price),
          })),
        });
        if (ghnResult) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              ghnOrderCode: ghnResult.ghnOrderCode,
              estimatedDelivery: ghnResult.expectedDeliveryTime
                ? new Date(ghnResult.expectedDeliveryTime)
                : null,
            },
          });
        }
      } catch (err) {
        console.error("[GHN create on ship]", err);
      }
    }

    // Cá»™ng Ä‘iá»ƒm loyalty khi Ä‘Æ¡n DELIVERED (idempotent)
    if (status === "DELIVERED" && order.userId) {
      const earned = await loyaltyService
        .earnFromOrder(order.userId, order.id, Number(order.total))
        .catch((err) => {
          console.error("[Loyalty earn]", err);
          return null;
        });
      if (earned && earned.points > 0 && order.pointsEarned === 0) {
        await prisma.order.update({
          where: { id: order.id },
          data: { pointsEarned: earned.points },
        });
      }

      // Xá»­ lÃ½ thÆ°á»Ÿng giá»›i thiá»‡u (referral)
      referralService
        .processReward(order.id, order.userId, Number(order.total))
        .catch((err) => console.error("[Referral reward]", err));

      // Xuáº¥t hoÃ¡ Ä‘Æ¡n Ä‘iá»‡n tá»­ (async)
      setImmediate(() => {
        einvoiceService
          .issueForOrder({
            id: order.id,
            shippingName: order.shippingName,
            shippingAddress: order.shippingAddress,
            total: Number(order.total),
            paymentMethod: order.paymentMethod,
            items: order.items.map((it) => ({
              productName: it.productName,
              price: Number(it.price),
              quantity: it.quantity,
            })),
          })
          .catch((err) => console.error("[E-Invoice]", err));
      });
    }

    // Push notification cho khÃ¡ch (async)
    if (order.userId) {
      const statusText: Record<string, string> = {
        CONFIRMED: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n",
        PROCESSING: "ÄÆ¡n hÃ ng Ä‘ang Ä‘Æ°á»£c xá»­ lÃ½",
        SHIPPING: "ÄÆ¡n hÃ ng Ä‘ang Ä‘Æ°á»£c giao",
        DELIVERED: "ÄÆ¡n hÃ ng Ä‘Ã£ giao thÃ nh cÃ´ng",
        CANCELLED: "ÄÆ¡n hÃ ng Ä‘Ã£ bá»‹ huá»·",
      };
      if (statusText[status]) {
        setImmediate(() => {
          notificationService
            .sendToUser(order.userId!, {
              title: statusText[status],
              body: `ÄÆ¡n hÃ ng #${order.code}`,
              url: `/don-hang/${order.code}`,
            })
            .catch((err) => console.error("[Push order]", err));
        });
      }
    }

    // Gá»­i email thÃ´ng bÃ¡o tráº¡ng thÃ¡i má»›i (async, khÃ´ng block response)
    if (order.userId) {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true },
      });
      if (user?.email) {
        setImmediate(() => {
          emailService
            .sendOrderStatusUpdate(
              {
                code: order.code,
                shippingName: order.shippingName,
                shippingPhone: order.shippingPhone,
                shippingAddress: order.shippingAddress,
                subtotal: Number(order.subtotal),
                shippingFee: Number(order.shippingFee),
                discount: Number(order.discount),
                total: Number(order.total),
                status: order.status,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                items: order.items.map((it) => ({
                  productName: it.productName,
                  variantName: it.variantName,
                  image: it.image,
                  price: Number(it.price),
                  quantity: it.quantity,
                  subtotal: Number(it.subtotal),
                })),
              },
              user.email
            )
            .catch((err) => console.error("[Status Email]", err));
        });
      }
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

export { router as adminOrderRoutes };