import { Router } from "express";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { cacheService } from "../services/cache.service";

const router = Router();

// GET /api/categories - Tree danh mục (cached 1h)
router.get("/", async (_req, res, next) => {
  try {
    const cached = await cacheService.get(cacheService.keys.categories);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: {
        children: { orderBy: { order: "asc" } },
      },
    });

    await cacheService.set(cacheService.keys.categories, categories, 3600);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { children: true, parent: true },
    });
    if (!category) {
      throw new AppError("Danh mục không tồn tại", 404);
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

export { router as categoryRoutes };
