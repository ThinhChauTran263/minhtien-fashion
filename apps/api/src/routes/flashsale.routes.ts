import { Router } from "express";
import { flashSaleService } from "../services/flashsale.service";

const router = Router();

// GET /api/flash-sale/active
router.get("/active", async (_req, res, next) => {
  try {
    const flashSale = await flashSaleService.getActiveFlashSale();
    res.json({ success: true, data: flashSale });
  } catch (err) {
    next(err);
  }
});

// GET /api/flash-sale/:id/products
router.get("/:id/products", async (req, res, next) => {
  try {
    const data = await flashSaleService.getFlashSaleProducts(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as flashSaleRoutes };
