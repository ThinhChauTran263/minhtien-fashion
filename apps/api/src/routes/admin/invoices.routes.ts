import { Router } from "express";
import { prisma } from "../../config/database";
import { einvoiceService } from "../../services/einvoice.service";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

// GET /api/admin/invoices
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const status = req.query.status as string;
    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { code: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/invoices/:id/reissue
router.post("/:id/reissue", async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError("HoÃ¡ Ä‘Æ¡n khÃ´ng tá»“n táº¡i", 404);

    const order = await prisma.order.findUnique({
      where: { id: invoice.orderId },
      include: { items: true },
    });
    if (!order) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);

    const result = await einvoiceService.issueForOrder({
      id: order.id,
      shippingName: order.shippingName,
      shippingAddress: order.shippingAddress,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      buyerTaxCode: invoice.buyerTaxCode,
      items: order.items.map((it) => ({
        productName: it.productName,
        price: Number(it.price),
        quantity: it.quantity,
      })),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/invoices/:id/cancel
router.post("/:id/cancel", async (req, res, next) => {
  try {
    const reason = req.body.reason || "Huá»· theo yÃªu cáº§u";
    const result = await einvoiceService.cancelInvoice(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export { router as adminInvoiceRoutes };