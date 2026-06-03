import { Router } from "express";
import { loyaltyService } from "../services/loyalty.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Tất cả routes cần đăng nhập
router.use(authMiddleware);

// GET /api/loyalty/balance
router.get("/balance", async (req: AuthRequest, res, next) => {
  try {
    const points = await loyaltyService.getBalance(req.user!.id);
    res.json({
      success: true,
      data: {
        points,
        discountValue: loyaltyService.pointsToDiscount(points),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/loyalty/history
router.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 20;
    const data = await loyaltyService.getHistory(req.user!.id, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as loyaltyRoutes };
