import { Router } from "express";
import { orderService } from "../services/order.service";
import { shippingService } from "../services/shipping.service";
import { optionalAuth, authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware";
import { checkoutValidator, orderCodeParamsValidator } from "../validators/order.validator";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { orderLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// POST /api/orders - TÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n (guest hoÃ¡ÂºÂ·c user) Ã¢â‚¬â€ idempotency protected
router.post("/", orderLimiter, optionalAuth, idempotencyMiddleware, validate(checkoutValidator), async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      userId: req.user?.id,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders - LÃ¡Â»â€¹ch sÃ¡Â»Â­ Ã„â€˜Ã†Â¡n (cÃ¡ÂºÂ§n login)
router.get("/", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user!.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/track/:code - Tra cÃ¡Â»Â©u (guest)


// GET /api/orders/track/:code - Public limited tracking data
router.get("/track/:code", validate(orderCodeParamsValidator), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { code: req.params.code },
      select: { code: true, status: true, paymentStatus: true, createdAt: true, updatedAt: true },
    });
    if (!order) throw new AppError("Đơn hàng không tồn tại", 404);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});
// GET /api/orders/:code - Chi tiết
router.get("/:code", authMiddleware, validate(orderCodeParamsValidator), async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.getOrderByCode(req.params.code, req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:code/cancel
router.post("/:code/cancel", authMiddleware, validate(orderCodeParamsValidator), async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.code, req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:code/tracking - Tra cÃ¡Â»Â©u hÃƒÂ nh trÃƒÂ¬nh GHN
router.get("/:code/tracking", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { code: req.params.code },
      select: { ghnOrderCode: true, userId: true, status: true },
    });
    if (!order) throw new AppError("Ã„ÂÃ†Â¡n hÃƒÂ ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);

    if (!order.ghnOrderCode) {
      return res.json({
        success: true,
        data: { status: order.status, tracking: null, message: "Ã„ÂÃ†Â¡n hÃƒÂ ng chÃ†Â°a Ã„â€˜Ã†Â°Ã¡Â»Â£c giao cho Ã„â€˜Ã†Â¡n vÃ¡Â»â€¹ vÃ¡ÂºÂ­n chuyÃ¡Â»Æ’n" },
      });
    }

    const tracking = await shippingService.trackOrder(order.ghnOrderCode);
    res.json({ success: true, data: { status: order.status, tracking } });
  } catch (err) {
    next(err);
  }
});

export { router as orderRoutes };

