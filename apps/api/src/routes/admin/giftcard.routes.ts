import { Router } from "express";
import { z } from "zod";
import { giftCardService } from "../../services/giftcard.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

const sourceSchema = z.enum([
  "ADMIN_GRANT",
  "COMPENSATION",
  "CUSTOMER_SERVICE",
  "PURCHASE",
  "REFUND",
  "PROMOTION",
]);

const createSchema = z.object({
  amount: z.number().int().positive(),
  beneficiaryUserId: z.string().min(1).optional(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  recipientName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional(),
  source: sourceSchema.default("ADMIN_GRANT"),
  internalNote: z.string().max(500).optional(),
  sendEmail: z.boolean().default(false),
});

// GET /api/admin/gift-cards
router.get("/", async (req, res, next) => {
  try {
    const data = await giftCardService.listAll({
      status: req.query.status as string,
      q: req.query.q as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/gift-cards
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const card = await giftCardService.createAdmin({
      amount: data.amount,
      beneficiaryUserId: data.beneficiaryUserId || undefined,
      recipientEmail: data.recipientEmail || undefined,
      recipientName: data.recipientName,
      message: data.message,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      source: data.source,
      internalNote: data.internalNote,
      sendEmail: data.sendEmail,
      createdByAdminId: req.user?.id,
    });
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// GET /api/admin/gift-cards/:id/transactions
router.get("/:id/transactions", async (req, res, next) => {
  try {
    const data = await giftCardService.getTransactions(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/gift-cards/:id/deactivate
router.patch("/:id/deactivate", async (req: AuthRequest, res, next) => {
  try {
    const card = await giftCardService.cancel(req.params.id, {
      adminId: req.user?.id,
      reason: req.body?.reason,
    });
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
});

export { router as adminGiftCardRoutes };
