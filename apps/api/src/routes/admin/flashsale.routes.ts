import { Router } from "express";
import { z } from "zod";
import { flashSaleService } from "../../services/flashsale.service";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        salePrice: z.number().int().min(0),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Cáº§n Ã­t nháº¥t 1 sáº£n pháº©m"),
});

// GET /api/admin/flash-sales
router.get("/", async (_req, res, next) => {
  try {
    const data = await flashSaleService.listAll();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/flash-sales/:id
router.get("/:id", async (req, res, next) => {
  try {
    const data = await flashSaleService.getFlashSaleProducts(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/flash-sales
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const flashSale = await flashSaleService.create(data);
    res.status(201).json({ success: true, data: flashSale });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// PATCH /api/admin/flash-sales/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const flashSale = await flashSaleService.update(req.params.id, req.body);
    res.json({ success: true, data: flashSale });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/flash-sales/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await flashSaleService.remove(req.params.id);
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ flash sale" });
  } catch (err) {
    next(err);
  }
});

export { router as adminFlashSaleRoutes };