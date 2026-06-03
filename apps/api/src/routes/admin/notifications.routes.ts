import { Router } from "express";
import { z } from "zod";
import { notificationService } from "../../services/notification.service";
import { loyaltyService } from "../../services/loyalty.service";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

const broadcastSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  icon: z.string().optional(),
});

// POST /api/admin/notifications/send - broadcast tá»›i táº¥t cáº£ subscribers
router.post("/send", async (req, res, next) => {
  try {
    const payload = broadcastSchema.parse(req.body);
    const result = await notificationService.broadcast(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// POST /api/admin/notifications/grant-points - táº·ng Ä‘iá»ƒm cho user
router.post("/grant-points", async (req, res, next) => {
  try {
    const { userId, points, description } = req.body;
    if (!userId || !points) {
      throw new AppError("Thiáº¿u userId hoáº·c points", 400);
    }
    const result = await loyaltyService.grantBonus(
      userId,
      Number(points),
      description || "QuÃ  táº·ng tá»« shop"
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export { router as adminNotificationRoutes };