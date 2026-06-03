import { prisma } from "../config/database";
import type { Voucher } from "@prisma/client";
import { AppError } from "../middlewares/error.middleware";
import { generateOrderCode } from "../utils/slug";
import { toVND, percentOf, prorate } from "../utils/money";
import { loyaltyService } from "./loyalty.service";
import { shippingService } from "./shipping.service";
import { stockService } from "./stock.service";
import { bundleService } from "./bundle.service";
import { giftCardService } from "./giftcard.service";
import { cacheQueue, emailQueue } from "../config/queue";
import { eventBus } from "../events/event-bus";

interface CheckoutInput {
  userId?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: "COD" | "VNPAY" | "MOMO" | "STRIPE" | "BANK_TRANSFER";
  note?: string;
  voucherCode?: string;
  giftCardCode?: string;
  pointsToUse?: number;
  addressId?: string;
  addressType?: "HOME" | "OFFICE";
  toDistrictId?: number;
  toWardCode?: string;
  items: { variantId: string; quantity: number }[];
}

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 500000;

function getMemberTier(points: number): string {
  if (points >= 50000) return "GOLD";
  if (points >= 20000) return "SILVER";
  return "BRONZE";
}

export const orderService = {
  /**
   * createOrder Ã¢â‚¬â€ split into 2 phases:
   *
   * PHASE 1 (NO LOCK): pre-load all read-only data in parallel
   *   - variants + products
   *   - voucher (validation only, lock happens later)
   *   - gift card
   *   - user points
   *   - bundle detection
   *   - flash sale items
   *   - shipping fee calculation (calls external GHN API!)
   *
   * PHASE 2 (TRANSACTION + ROW LOCKS): only atomic writes
   *   - SELECT FOR UPDATE on variants, voucher, gift card, flash sale items
   *   - re-validate stock (in case it changed between phase 1 and 2)
   *   - deduct stock / reserve / increment counters
   *   - create order + items
   *   - clear cart
   *
   * Why: GHN API call inside a transaction holds row locks for 500-2000ms.
   * Under concurrent checkout this guarantees lock timeouts. Moving it out
   * cuts transaction duration to 50-100ms (DB writes only).
   */
  async createOrder(input: CheckoutInput) {
    if (!input.items.length) {
      throw new AppError("GiÃ¡Â»Â hÃƒÂ ng trÃ¡Â»â€˜ng", 400);
    }

    const variantIds = input.items.map((i) => i.variantId);

    // === PHASE 1: Pre-load all data in parallel (no locks) ===
    const now = new Date();
    const [variants, voucherCandidate, giftCardCandidate, userPoints, flashSaleItems] =
      await Promise.all([
        prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: true },
        }),
        input.voucherCode
          ? prisma.voucher.findUnique({ where: { code: input.voucherCode } })
          : Promise.resolve(null),
        input.giftCardCode
          ? prisma.giftCard.findUnique({ where: { code: input.giftCardCode } })
          : Promise.resolve(null),
        input.userId && input.pointsToUse
          ? prisma.user.findUnique({
              where: { id: input.userId },
              select: { points: true },
            })
          : Promise.resolve(null),
        // Pre-load flash sale items for all products in cart in ONE query
        prisma.flashSaleItem.findMany({
          where: {
            productId: { in: [] }, // filled below after variants resolved
            flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
          },
          select: { id: true, productId: true, salePrice: true, sold: true, quantity: true },
        }),
      ]);

    if (variants.length !== variantIds.length) {
      throw new AppError("MÃ¡Â»â„¢t sÃ¡Â»â€˜ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 400);
    }

    // Re-fetch flash sale items now that we know productIds
    const productIds = Array.from(new Set(variants.map((v) => v.productId)));
    const flashItems = await prisma.flashSaleItem.findMany({
      where: {
        productId: { in: productIds },
        flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      },
      select: { id: true, productId: true, salePrice: true, sold: true, quantity: true },
    });
    const flashByProduct = new Map(flashItems.map((f) => [f.productId, f]));

    // === PHASE 1.5: Compute pricing (no DB writes) ===
    let subtotal = 0;
    const orderItemsData: Array<{
      variantId: string;
      productId: string;
      productName: string;
      productSlug: string;
      variantName: string;
      image: string;
      price: number;
      quantity: number;
      subtotal: number;
      flashItemId: string | null;
    }> = [];

    for (const item of input.items) {
      const variant = variants.find((v) => v.id === item.variantId)!;

      // Block discontinued / soft-deleted products from being purchased.
      if (!variant.product.isActive || variant.product.deletedAt !== null) {
        throw new AppError("SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜ÃƒÂ£ ngÃ¡Â»Â«ng kinh doanh", 400);
      }

      // Fast pre-check (final check happens inside transaction with FOR UPDATE)
      const available = variant.stock - variant.reserved - variant.safetyStock;
      if (available < item.quantity) {
        throw new AppError(
          `SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m ${variant.product.name} (${variant.color}/${variant.size}) khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§ hÃƒÂ ng`,
          400
        );
      }

      const flashItem = flashByProduct.get(variant.productId);
      let price: number;
      let flashItemId: string | null = null;
      if (flashItem && flashItem.sold + item.quantity <= flashItem.quantity) {
        price = toVND(flashItem.salePrice);
        flashItemId = flashItem.id;
      } else {
        price = toVND(variant.price ?? variant.product.salePrice ?? variant.product.basePrice);
      }

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantName: `${variant.color} / ${variant.size}`,
        image: variant.images[0] ?? variant.product.thumbnail,
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        flashItemId,
      });
    }

    // Bundle detection (read-only)
    const cartProductItems = orderItemsData.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));
    const matchedBundles = await bundleService.detectInCart(cartProductItems);
    const completeBundles = matchedBundles.filter((b) => b.complete);
    const bundleDiscount =
      completeBundles.length > 0
        ? Math.min(
            Math.max(...completeBundles.map((b) => b.savings)),
            subtotal
          )
        : 0;

    // === Voucher validation (NO write yet Ã¢â‚¬â€ usage increment happens in tx) ===
    let voucherDiscount = bundleDiscount;
    let voucherId: string | undefined;
    let isFreeShipVoucher = false;
    if (voucherCandidate && input.voucherCode) {
      const v = voucherCandidate;
      if (
        v.isActive &&
        v.startsAt <= now &&
        v.expiresAt >= now &&
        (!v.usageLimit || v.usageCount < v.usageLimit) &&
        (!v.minOrder || subtotal >= toVND(v.minOrder))
      ) {
        const categoryIds = variants.map((vv) => vv.product.categoryId);
        if (
          v.applicableCategoryIds.length > 0 &&
          !categoryIds.some((cid) => v.applicableCategoryIds.includes(cid))
        ) {
          throw new AppError("MÃƒÂ£ giÃ¡ÂºÂ£m giÃƒÂ¡ khÃƒÂ´ng ÃƒÂ¡p dÃ¡Â»Â¥ng cho danh mÃ¡Â»Â¥c sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m nÃƒÂ y", 400);
        }
        const productIdList = variants.map((vv) => vv.productId);
        if (
          v.applicableProductIds.length > 0 &&
          !productIdList.some((pid) => v.applicableProductIds.includes(pid))
        ) {
          throw new AppError("MÃƒÂ£ giÃ¡ÂºÂ£m giÃƒÂ¡ khÃƒÂ´ng ÃƒÂ¡p dÃ¡Â»Â¥ng cho sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m nÃƒÂ y", 400);
        }
        if (v.requiredMemberTier && input.userId) {
          const userTier = getMemberTier(userPoints?.points ?? 0);
          const requiredTiers = v.requiredMemberTier.split(",");
          if (!requiredTiers.includes(userTier)) {
            throw new AppError(
              `MÃƒÂ£ giÃ¡ÂºÂ£m giÃƒÂ¡ chÃ¡Â»â€° dÃƒÂ nh cho thÃƒÂ nh viÃƒÂªn hÃ¡ÂºÂ¡ng ${v.requiredMemberTier}`,
              400
            );
          }
        }

        const subtotalAfterBundle = Math.max(0, subtotal - bundleDiscount);
        if (v.type === "PERCENT") {
          let d = percentOf(subtotalAfterBundle, toVND(v.value));
          if (v.maxDiscount) d = Math.min(d, toVND(v.maxDiscount));
          voucherDiscount = bundleDiscount + Math.min(d, subtotalAfterBundle);
        } else if (v.type === "FIXED") {
          voucherDiscount = bundleDiscount + Math.min(toVND(v.value), subtotalAfterBundle);
        } else if (v.type === "FREE_SHIPPING") {
          isFreeShipVoucher = true;
        }
        voucherId = v.id;
      }
    }

    // === Gift card validation ===
    let giftCardDiscount = 0;
    if (input.giftCardCode && !input.userId) {
      throw new AppError("Vui lòng đăng nhập để sử dụng thẻ quà tặng", 401);
    }
    if (input.giftCardCode && !giftCardCandidate) {
      throw new AppError("Mã thẻ quà tặng không tồn tại", 404);
    }
    if (giftCardCandidate && input.giftCardCode) {
      const gc = giftCardCandidate;
      if (gc.beneficiaryUserId && gc.beneficiaryUserId !== input.userId) {
        throw new AppError("Thẻ quà tặng không thuộc tài khoản này", 403);
      }
      if (gc.redeemedById && gc.redeemedById !== input.userId) {
        throw new AppError("Thẻ quà tặng đã được liên kết với tài khoản khác", 403);
      }
      if (gc.isActive && gc.status === "ACTIVE" && gc.expiresAt >= now && (!gc.startsAt || gc.startsAt <= now) && Number(gc.balance) > 0) {
        const remaining = subtotal - voucherDiscount;
        giftCardDiscount = Math.min(toVND(gc.balance), Math.max(0, remaining));
      } else {
        throw new AppError("ThÃ¡ÂºÂ» quÃƒÂ  tÃ¡ÂºÂ·ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡ hoÃ¡ÂºÂ·c Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n", 400);
      }
    }

    // === Loyalty points ===
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    if (input.userId && input.pointsToUse && input.pointsToUse > 0) {
      const afterVoucher = subtotal - voucherDiscount - giftCardDiscount;
      const maxDiscount = loyaltyService.maxRedeemable(userPoints?.points ?? 0, afterVoucher);
      const requestedDiscount = loyaltyService.pointsToDiscount(input.pointsToUse);
      pointsDiscount = Math.min(requestedDiscount, maxDiscount);
      pointsRedeemed = Math.ceil(pointsDiscount / 10);
    }

    // === Shipping fee (EXTERNAL API CALL Ã¢â‚¬â€ must be outside transaction!) ===
    const totalDiscount = voucherDiscount + giftCardDiscount + pointsDiscount;
    const afterDiscount = Math.max(0, subtotal - totalDiscount);
    let shippingFee: number;
    if (input.toDistrictId && input.toWardCode) {
      const ghnResult = await shippingService.calculateFee({
        toDistrictId: input.toDistrictId,
        toWardCode: input.toWardCode,
        weight: input.items.reduce((s, i) => s + i.quantity * 200, 200),
        orderValue: afterDiscount,
      });
      shippingFee = ghnResult.fee;
    } else {
      shippingFee = afterDiscount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
    }

    let finalDiscount = totalDiscount;
    if (isFreeShipVoucher && shippingFee > 0) {
      finalDiscount += shippingFee;
      shippingFee = 0;
    }

    const total = Math.max(0, subtotal + shippingFee - finalDiscount);

    // Prorate discount across items (for accurate refunds)
    const itemWeights = orderItemsData.map((i) => i.subtotal);
    const proratedDiscounts = prorate(finalDiscount, itemWeights);

    // === PHASE 2: Atomic transaction (locks held only briefly) ===
    const isInstantPayment =
      input.paymentMethod === "COD" || input.paymentMethod === "BANK_TRANSFER";
    const RESERVATION_MINUTES = 15;

    const order = await prisma.$transaction(async (tx) => {
      // Lock variants Ã¢â‚¬â€ re-validate stock
      const lockedVariants = await tx.$queryRaw<
        Array<{ id: string; stock: number; reserved: number; safetyStock: number }>
      >`SELECT id, stock, reserved, "safetyStock" FROM "ProductVariant" WHERE id = ANY(${variantIds}::text[]) FOR UPDATE`;
      const stockMap = new Map(lockedVariants.map((v) => [v.id, v]));

      for (const item of input.items) {
        const locked = stockMap.get(item.variantId);
        if (!locked) throw new AppError("SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 400);
        const available = locked.stock - locked.reserved - locked.safetyStock;
        if (available < item.quantity) {
          const variant = variants.find((v) => v.id === item.variantId)!;
          throw new AppError(
            `SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m ${variant.product.name} (${variant.color}/${variant.size}) vÃ¡Â»Â«a hÃ¡ÂºÂ¿t hÃƒÂ ng`,
            400
          );
        }
      }

      // Lock + decrement flash sale items (only those used)
      const usedFlashIds = orderItemsData
        .filter((i) => i.flashItemId)
        .map((i) => i.flashItemId as string);
      if (usedFlashIds.length > 0) {
        const lockedFlash = await tx.$queryRaw<
          Array<{ id: string; sold: number; quantity: number }>
        >`SELECT id, sold, quantity FROM "FlashSaleItem" WHERE id = ANY(${usedFlashIds}::text[]) FOR UPDATE`;
        const flashMap = new Map(lockedFlash.map((f) => [f.id, f]));

        for (const item of orderItemsData) {
          if (!item.flashItemId) continue;
          const locked = flashMap.get(item.flashItemId);
          if (!locked) continue;
          if (locked.sold + item.quantity > locked.quantity) {
            // Flash sale ran out between phase 1 and 2 Ã¢â‚¬â€ fall back to regular price
            const variant = variants.find((v) => v.id === item.variantId)!;
            const fallbackPrice = toVND(
              variant.price ?? variant.product.salePrice ?? variant.product.basePrice
            );
            const newSubtotal = fallbackPrice * item.quantity;
            // Adjust totals
            subtotal = subtotal - item.subtotal + newSubtotal;
            item.price = fallbackPrice;
            item.subtotal = newSubtotal;
            item.flashItemId = null;
          } else {
            await tx.flashSaleItem.update({
              where: { id: item.flashItemId },
              data: { sold: { increment: item.quantity } },
            });
          }
        }
      }

      // Lock + increment voucher usage (idempotent guard)
      if (voucherId) {
        const [lockedVoucher] = await tx.$queryRaw<Voucher[]>`
          SELECT * FROM "Voucher" WHERE id = ${voucherId} FOR UPDATE
        `;
        if (
          lockedVoucher &&
          (!lockedVoucher.usageLimit || lockedVoucher.usageCount < lockedVoucher.usageLimit)
        ) {
          await tx.voucher.update({
            where: { id: voucherId },
            data: { usageCount: { increment: 1 } },
          });
        } else {
          throw new AppError("MÃƒÂ£ giÃ¡ÂºÂ£m giÃƒÂ¡ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t lÃ†Â°Ã¡Â»Â£t sÃ¡Â»Â­ dÃ¡Â»Â¥ng", 400);
        }
      }

      // Redeem loyalty points
      if (pointsRedeemed > 0 && input.userId) {
        await loyaltyService.redeemPoints(tx, input.userId, pointsRedeemed);
      }

      // Stock: reserve (online) or deduct (COD/bank)
      if (isInstantPayment) {
        for (const item of input.items) {
          await stockService.deductDirect(tx, item.variantId, item.quantity, "pending-order");
        }
        // Batch increment soldCount per product
        const soldByProduct = new Map<string, number>();
        for (const item of orderItemsData) {
          soldByProduct.set(
            item.productId,
            (soldByProduct.get(item.productId) ?? 0) + item.quantity
          );
        }
        for (const [productId, qty] of soldByProduct) {
          await tx.product.update({
            where: { id: productId },
            data: { soldCount: { increment: qty } },
          });
        }
      } else {
        for (const item of input.items) {
          await stockService.reserve(tx, item.variantId, item.quantity, "pending-order");
        }
      }

      const reservedUntil = isInstantPayment
        ? null
        : new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: input.userId,
          addressId: input.addressId,
          shippingName: input.shippingName,
          shippingPhone: input.shippingPhone,
          shippingAddress: input.shippingAddress,
          subtotal,
          shippingFee,
          discount: finalDiscount,
          total,
          pointsUsed: pointsRedeemed,
          voucherId,
          voucherCode: input.voucherCode,
          paymentMethod: input.paymentMethod,
          note: input.addressType === "OFFICE" 
            ? (input.note ? `${input.note} - Chỉ giao trong giờ hành chính` : "Chỉ giao trong giờ hành chính")
            : input.note,
          toDistrictId: input.toDistrictId,
          toWardCode: input.toWardCode,
          stockDeducted: isInstantPayment,
          reservedUntil,
          items: {
            create: orderItemsData.map((it, idx) => ({
              variantId: it.variantId,
              productName: it.productName,
              productSlug: it.productSlug,
              variantName: it.variantName,
              image: it.image,
              price: it.price,
              quantity: it.quantity,
              subtotal: it.subtotal,
              discountAllocated: proratedDiscounts[idx],
            })),
          },
        },
        include: { items: true },
      });

      if (input.giftCardCode && giftCardDiscount > 0 && input.userId) {
        const usedGiftCardAmount = await giftCardService.useForOrder(tx, {
          code: input.giftCardCode,
          userId: input.userId,
          requestedAmount: giftCardDiscount,
          orderId: created.id,
        });
        if (usedGiftCardAmount !== giftCardDiscount) {
          throw new AppError("Số dư thẻ quà tặng vừa thay đổi, vui lòng thử lại", 409);
        }
      }

      // Clear user cart
      if (input.userId) {
        await tx.cartItem.deleteMany({
          where: { cart: { userId: input.userId } },
        });
      }

      return created;
    }, {
      // Tighter timeouts since transaction is now lean
      maxWait: 5000,
      timeout: 10000,
    });

    // === PHASE 3: Post-commit side effects (no DB locks held) ===
    await cacheQueue.add(
      "invalidate_order_products",
      {
        type: "invalidate_order_products",
        productSlugs: order.items.map((item) => item.productSlug),
      },
      { jobId: `cache-order-products-${order.id}` }
    );

    if (input.paymentMethod === "COD" || input.paymentMethod === "BANK_TRANSFER") {
      await emailQueue.add(
        "checkLowStock",
        {
          type: "low_stock_for_variants",
          variantIds: input.items.map((item) => item.variantId),
        },
        { jobId: `email-low-stock-${order.id}` }
      );
    }
    if (order.userId) {
      await emailQueue.add(
        "sendOrderConfirm",
        {
          type: "order_confirmation_for_user",
          userId: order.userId,
          payload: {
            id: order.id,
            code: order.code,
            userId: order.userId,
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
            items: order.items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              productSlug: item.productSlug,
              variantName: item.variantName,
              image: item.image,
              price: Number(item.price),
              quantity: item.quantity,
              subtotal: Number(item.subtotal),
            })),
          },
        },
        { jobId: `email-order-confirmation-${order.id}` }
      );
    }
    return order;
  },
  async getOrderByCode(code: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { code },
      include: { items: true },
    });
    if (!order) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }
    if (!userId || order.userId !== userId) {
      throw new AppError("Không có quyền xem đơn này", 403);
    }
    return order;
  },

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  },

  async cancelOrder(code: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { code } });
    if (!order) throw new AppError("Ã„ÂÃ†Â¡n hÃƒÂ ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);
    if (order.userId !== userId) throw new AppError("KhÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân", 403);
    if (order.status !== "PENDING") {
      throw new AppError("ChÃ¡Â»â€° huÃ¡Â»Â· Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã†Â¡n Ã„â€˜ang chÃ¡Â»Â xÃƒÂ¡c nhÃ¡ÂºÂ­n", 400);
    }

    return prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<
        Array<{ id: string; stockDeducted: boolean; stockRestored: boolean; status: string }>
      >`SELECT id, "stockDeducted", "stockRestored", status FROM "Order" WHERE id = ${order.id} FOR UPDATE`;

      if (locked.status === "CANCELLED") return tx.order.findUnique({ where: { id: order.id } });

      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });

      if (locked.stockDeducted && !locked.stockRestored) {
        for (const item of items) {
          await stockService.restockCancel(tx, item.variantId, item.quantity, order.id);
        }
      } else if (!locked.stockDeducted && !locked.stockRestored) {
        for (const item of items) {
          await stockService.release(tx, item.variantId, item.quantity, order.id);
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          stockRestored: true,
          reservedUntil: null,
        },
      });
    });
  },

  /**
   * Mark order as paid (called from payment callback).
   * Commit reservation -> deduct real stock + soldCount.
   * Uses SELECT FOR UPDATE + stockDeducted flag for idempotency.
   */
  async markOrderPaid(code: string, paymentRef: string) {
    const result = await prisma.$transaction(async (tx) => {
      const [order] = await tx.$queryRaw<
        Array<{ id: string; paymentStatus: string; stockDeducted: boolean }>
      >`SELECT id, "paymentStatus", "stockDeducted" FROM "Order" WHERE code = ${code} FOR UPDATE`;

      if (!order) throw new AppError("Ã„ÂÃ†Â¡n hÃƒÂ ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);

      if (order.paymentStatus === "PAID") {
        return tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: order.id },
        include: { variant: { select: { productId: true } } },
      });

      if (!order.stockDeducted) {
        for (const item of items) {
          await stockService.commitSale(tx, item.variantId, item.quantity, order.id);
        }
      }

      // Batch increment soldCount per product
      const productCounts = new Map<string, number>();
      for (const item of items) {
        if (item.variant) {
          productCounts.set(
            item.variant.productId,
            (productCounts.get(item.variant.productId) ?? 0) + item.quantity
          );
        }
      }
      for (const [productId, qty] of productCounts) {
        await tx.product.update({
          where: { id: productId },
          data: { soldCount: { increment: qty } },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentRef,
          paidAt: new Date(),
          status: "CONFIRMED",
          stockDeducted: true,
          reservedUntil: null,
        },
        include: { items: true, user: { select: { id: true } } },
      });
      return updatedOrder;
    });

    if (result?.userId) {
      await eventBus.publish({
        type: "payment.succeeded",
        aggregateId: result.id,
        idempotencyKey: paymentRef ?? result.id,
        occurredAt: new Date().toISOString(),
        payload: {
          orderId: result.id,
          userId: result.userId,
          total: Number(result.total),
          paymentRef,
        },
      });
    }

    return result;
  },

  async markOrderPaymentFailed(code: string, paymentRef?: string) {
    const order = await prisma.order.findUnique({ where: { code } });
    if (!order) throw new AppError("Ã„ÂÃ†Â¡n hÃƒÂ ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);

    return prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        paymentRef,
      },
    });
  },
};




