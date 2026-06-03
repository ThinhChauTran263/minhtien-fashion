import { Router } from "express";
import { prisma } from "../config/database";

const router = Router();

// GET /api/banners?position=home-hero
router.get("/", async (req, res, next) => {
  try {
    const position = req.query.position as string;
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        ...(position && { position }),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
});

export { router as bannerRoutes };
