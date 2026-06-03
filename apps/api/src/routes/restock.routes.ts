import { Router } from "express";
import { z } from "zod";
import { stockNotifyService } from "../services/stock-notify.service";
import { optionalAuth, AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const subscribeSchema = z.object({
  variantId: z.string().min(1),
  email: z.string().email(),
});

// POST /api/products/restock-notify
router.post("/restock-notify", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { variantId, email } = subscribeSchema.parse(req.body);
    await stockNotifyService.subscribe(variantId, email, req.user?.id);
    res.json({ success: true, message: "Đã đăng ký nhận thông báo" });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

export { router as restockRoutes };
