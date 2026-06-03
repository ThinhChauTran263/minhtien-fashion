import { Router } from "express";
import { ReturnStatus } from "@prisma/client";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { returnService } from "../services/return.service";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const createReturnValidator = z.object({
  body: z.object({
    orderId: z.string().min(1),
    type: z.enum(["RETURN", "EXCHANGE"]),
    reason: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),
    images: z.array(z.string().url()).max(5).optional(),
    items: z.array(z.object({
      orderItemId: z.string().min(1),
      quantity: z.coerce.number().int().min(1).max(99),
      newSize: z.string().optional(),
      newColor: z.string().optional(),
    })).min(1),
  }),
});

router.use(authMiddleware);

router.post("/", validate(createReturnValidator), async (req: AuthRequest, res, next) => {
  try {
    const request = await returnService.createReturnRequest(req.user!.id, req.body);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req: AuthRequest, res, next) => {
  try {
    const requests = await returnService.getMyReturns(req.user!.id);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.get("/:code", async (req: AuthRequest, res, next) => {
  try {
    const request = await returnService.getReturnByCode(
      req.params.code,
      req.user!.id,
      req.user!.role === "ADMIN" || req.user!.role === "STAFF"
    );
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

export { router as returnRoutes };

export const adminReturnRoutes = Router();

adminReturnRoutes.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as ReturnStatus | undefined;
    const requests = await returnService.getAllReturns(status);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

adminReturnRoutes.patch("/:id", async (req, res, next) => {
  try {
    const status = req.body.status as ReturnStatus;
    const adminNote = req.body.adminNote as string | undefined;
    const qcGrades = req.body.qcGrades as any[] | undefined;
    const request = status === "REFUNDED"
      ? await returnService.processRefund(req.params.id, qcGrades)
      : await returnService.updateReturnStatus(req.params.id, status, adminNote);
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/returns/:id/qc
 * Body: { grades: [{ orderItemId, variantId, quantity, grade: "A"|"B"|"C", note? }] }
 * Idempotent: gọi nhiều lần chỉ xử lý 1 lần.
 */
adminReturnRoutes.post("/:id/qc", async (req, res, next) => {
  try {
    const { grades } = req.body;
    if (!Array.isArray(grades) || grades.length === 0) {
      throw new AppError("Cần ít nhất 1 item QC", 400);
    }
    for (const g of grades) {
      if (!["A", "B", "C"].includes(g.grade)) {
        throw new AppError(`Grade không hợp lệ: ${g.grade}. Chỉ chấp nhận A/B/C`, 400);
      }
    }
    const result = await returnService.processQcInspection(req.params.id, grades);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
