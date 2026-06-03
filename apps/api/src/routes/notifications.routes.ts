import { Router } from "express";
import { z } from "zod";
import { notificationService } from "../services/notification.service";
import { optionalAuth, AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// GET /api/notifications/public-key - lấy VAPID public key cho client
router.get("/public-key", (_req, res) => {
  res.json({ success: true, data: { publicKey: notificationService.getPublicKey() } });
});

// POST /api/notifications/subscribe
router.post("/subscribe", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const sub = subscribeSchema.parse(req.body);
    const result = await notificationService.subscribe({
      ...sub,
      userId: req.user?.id,
    });
    res.status(201).json({ success: true, data: { id: result.id } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// POST /api/notifications/unsubscribe
router.post("/unsubscribe", async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) throw new AppError("Thiếu endpoint", 400);
    await notificationService.unsubscribe(endpoint);
    res.json({ success: true, message: "Đã huỷ đăng ký" });
  } catch (err) {
    next(err);
  }
});

export { router as notificationRoutes };
