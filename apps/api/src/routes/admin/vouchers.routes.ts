import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

// GET /api/admin/vouchers
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);

    const [items, total] = await Promise.all([
      prisma.voucher.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.voucher.count(),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

const voucherSchema = z.object({
  code: z.string().min(3).max(30),
  description: z.string().optional(),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).default(1),
  startsAt: z.string().transform((s) => new Date(s)),
  expiresAt: z.string().transform((s) => new Date(s)),
  isActive: z.boolean().default(true),
});

// POST /api/admin/vouchers
router.post("/", async (req, res, next) => {
  try {
    const data = voucherSchema.parse(req.body);

    // Check code unique
    const existing = await prisma.voucher.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new AppError("MÃ£ voucher Ä‘Ã£ tá»“n táº¡i", 400);
    }

    const voucher = await prisma.voucher.create({ data });
    res.status(201).json({ success: true, data: voucher });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// PATCH /api/admin/vouchers/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Transform date strings if present
    if (data.startsAt) data.startsAt = new Date(data.startsAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

    const voucher = await prisma.voucher.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/vouchers/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.voucher.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ voucher" });
  } catch (err) {
    next(err);
  }
});

export { router as adminVoucherRoutes };