import { Router } from "express";
import { prisma } from "../../config/database";

const router = Router();

// GET /api/admin/newsletter
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const [items, total] = await Promise.all([
      prisma.newsletter.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletter.count(),
    ]);
    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/newsletter/export - CSV
router.get("/export", async (_req, res, next) => {
  try {
    const items = await prisma.newsletter.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    const csv = ["email,subscribed_at"]
      .concat(items.map((i) => `${i.email},${i.createdAt.toISOString()}`))
      .join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="newsletter-subscribers.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export { router as adminNewsletterRoutes };