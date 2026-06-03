import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

// GET /api/admin/banners
router.get("/", async (req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ position: "asc" }, { order: "asc" }],
    });
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
});

const bannerSchema = z.object({
  title: z.string().min(1),
  image: z.string().url(),
  imageMobile: z.string().url().optional(),
  link: z.string().optional(),
  position: z.string().min(1),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().transform((s) => new Date(s)).optional(),
  expiresAt: z.string().transform((s) => new Date(s)).optional(),
});

// POST /api/admin/banners
router.post("/", async (req, res, next) => {
  try {
    const data = bannerSchema.parse(req.body);
    const banner = await prisma.banner.create({ data });
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// PATCH /api/admin/banners/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const data = req.body;
    if (data.startsAt) data.startsAt = new Date(data.startsAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: banner });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/banners/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ banner" });
  } catch (err) {
    next(err);
  }
});

export { router as adminBannerRoutes };