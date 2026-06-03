import { Router } from "express";
import { referralService } from "../services/referral.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/referral/my-code
router.get("/my-code", async (req: AuthRequest, res, next) => {
  try {
    const code = await referralService.getMyCode(req.user!.id);
    res.json({ success: true, data: { code } });
  } catch (err) {
    next(err);
  }
});

// POST /api/referral/apply
router.post("/apply", async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body;
    if (!code) throw new AppError("Thiếu mã giới thiệu", 400);
    const result = await referralService.applyCode(req.user!.id, code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/referral/stats
router.get("/stats", async (req: AuthRequest, res, next) => {
  try {
    const data = await referralService.getStats(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as referralRoutes };
