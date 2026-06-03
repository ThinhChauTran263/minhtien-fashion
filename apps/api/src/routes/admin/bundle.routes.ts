import { Router } from "express";
import { z } from "zod";
import { bundleService } from "../../services/bundle.service";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

const bundleSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.number().int().min(0),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).optional() }))
    .min(1),
});

// GET /api/admin/bundles
router.get("/", async (_req, res, next) => {
  try {
    const data = await bundleService.listAll();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/bundles
router.post("/", async (req, res, next) => {
  try {
    const data = bundleSchema.parse(req.body);
    const bundle = await bundleService.create(data);
    res.status(201).json({ success: true, data: bundle });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// PATCH /api/admin/bundles/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const bundle = await bundleService.update(req.params.id, req.body);
    res.json({ success: true, data: bundle });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bundles/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await bundleService.remove(req.params.id);
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ combo" });
  } catch (err) {
    next(err);
  }
});

export { router as adminBundleRoutes };