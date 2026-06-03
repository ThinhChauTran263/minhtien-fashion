import { Router } from "express";
import { bundleService } from "../services/bundle.service";

const router = Router();

// GET /api/bundles
router.get("/", async (_req, res, next) => {
  try {
    const data = await bundleService.getActiveBundles();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/bundles/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const data = await bundleService.getBundleBySlug(req.params.slug);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as bundleRoutes };
