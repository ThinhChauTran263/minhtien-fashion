import { Router } from "express";
import { giftCardService } from "../services/giftcard.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

// GET /api/gift-cards/amounts
router.get("/amounts", (_req, res) => {
  res.json({ success: true, data: giftCardService.getAmounts() });
});

// POST /api/gift-cards/purchase
router.post("/purchase", (_req, _res, next) => {
  next(new AppError("Gift card công khai đã được tắt. Vui lòng liên hệ cửa hàng.", 410));
});

// GET /api/gift-cards/check/:code
router.get("/check/:code", async (req, res, next) => {
  try {
    const data = await giftCardService.check(req.params.code);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/gift-cards/redeem
router.post("/redeem", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body;
    if (!code) throw new AppError("Thiếu mã thẻ", 400);
    const card = await giftCardService.redeem(code, req.user!.id);
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
});

// GET /api/gift-cards/my-cards
router.get("/my-cards", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = await giftCardService.myCards(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as giftCardRoutes };
