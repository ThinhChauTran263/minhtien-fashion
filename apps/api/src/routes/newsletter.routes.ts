import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

// POST /api/newsletter/subscribe
router.post("/subscribe", async (req, res, next) => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    const sub = await prisma.newsletter.upsert({
      where: { email },
      create: { email },
      update: { isActive: true },
    });
    res.json({ success: true, data: { id: sub.id, email: sub.email } });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// POST /api/newsletter/unsubscribe
router.post("/unsubscribe", async (req, res, next) => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    await prisma.newsletter.update({ where: { email }, data: { isActive: false } }).catch(() => {});
    res.json({ success: true, message: "Đã huỷ đăng ký" });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

export { router as newsletterRoutes };
