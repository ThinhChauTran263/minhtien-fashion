import { Router } from "express";
import { prisma } from "../../config/database";
import { pdfService } from "../../services/pdf.service";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

async function getOrderForPdf(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);
  return {
    code: order.code,
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt,
    items: order.items.map((it) => ({
      productName: it.productName,
      variantName: it.variantName,
      price: Number(it.price),
      quantity: it.quantity,
    })),
  };
}

// GET /api/admin/orders/:id/shipping-label
router.get("/:id/shipping-label", async (req, res, next) => {
  try {
    const order = await getOrderForPdf(req.params.id);
    const pdf = await pdfService.generateShippingLabel(order);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="tem-${order.code}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id/invoice-pdf
router.get("/:id/invoice-pdf", async (req, res, next) => {
  try {
    const order = await getOrderForPdf(req.params.id);
    const pdf = await pdfService.generateInvoicePDF(order);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${order.code}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/print-batch
router.post("/print-batch", async (req, res, next) => {
  try {
    const { orderIds } = req.body as { orderIds: string[] };
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new AppError("Cáº§n Ã­t nháº¥t 1 Ä‘Æ¡n hÃ ng", 400);
    }
    const orders = await Promise.all(orderIds.map((id) => getOrderForPdf(id)));
    const pdf = await pdfService.generateBatchLabels(orders);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="tem-batch.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export { router as adminPdfRoutes };