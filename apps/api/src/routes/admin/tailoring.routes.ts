import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

// GET /api/admin/tailoring — danh sách yêu cầu đặt may (phân trang + lọc status)
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const status = req.query.status as string | undefined;
    const requestType = req.query.requestType as string | undefined;

    const where: { status?: string; requestType?: string } = {};
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    const [items, total, newCount] = await Promise.all([
      prisma.tailoringRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tailoringRequest.count({ where }),
      prisma.tailoringRequest.count({ where: { status: "NEW" } }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit), newCount },
    });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "DONE", "CANCELLED"]).optional(),
  adminNote: z.string().max(2000).optional(),
});

// PATCH /api/admin/tailoring/:id — cập nhật trạng thái / ghi chú
router.patch("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const request = await prisma.tailoringRequest.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: request });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// DELETE /api/admin/tailoring/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.tailoringRequest.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as adminTailoringRoutes };
