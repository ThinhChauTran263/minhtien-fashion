import { Router } from "express";
import { prisma } from "../config/database";
import { orderService } from "../services/order.service";
import {
  createVnpayUrl,
  verifyVnpayReturn,
  createMomoPayment,
  verifyMomoCallback,
} from "../services/payment.service";
import { vietqrService } from "../services/vietqr.service";
import { AppError } from "../middlewares/error.middleware";
import { env } from "../config/env";
import { paymentLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? req.ip ?? "127.0.0.1";
}

// ============ VNPAY ============

// POST /api/payment/vnpay/create
router.post("/vnpay/create", paymentLimiter, async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) throw new AppError("Thiáº¿u orderCode", 400);

    const order = await prisma.order.findUnique({ where: { code: orderCode } });
    if (!order) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);
    if (order.paymentStatus === "PAID") {
      throw new AppError("ÄÆ¡n hÃ ng Ä‘Ã£ thanh toÃ¡n", 400);
    }

    // Láº¥y sá»‘ tiá»n tá»« DB - KHÃ”NG tin sá»‘ tiá»n tá»« client
    const url = createVnpayUrl({
      code: order.code,
      total: Number(order.total),
      ipAddr: getClientIp(req),
    });

    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
});

// GET /api/payment/vnpay/callback - VNPay redirect user vá» sau khi thanh toÃ¡n
router.get("/vnpay/callback", async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const result = verifyVnpayReturn(query);

    let status: "success" | "failed" = "failed";
    let orderCode = result.txnRef;

    if (result.valid && result.responseCode === "00" && result.transactionStatus === "00") {
      // Verify sá»‘ tiá»n tá»« DB
      const order = await prisma.order.findUnique({ where: { code: orderCode } });
      if (order && Number(order.total) === result.amount) {
        await orderService.markOrderPaid(orderCode, `VNPAY-${query.vnp_TransactionNo ?? ""}`);
        status = "success";
      }
    } else if (result.valid) {
      // Signature Ä‘Ãºng nhÆ°ng giao dá»‹ch lá»—i
      await orderService.markOrderPaymentFailed(orderCode, `VNPAY-${query.vnp_TransactionNo ?? ""}`).catch(() => {});
    }

    // Redirect vá» frontend
    const redirectUrl = `${env.frontendUrl}/thanh-toan/ket-qua?status=${status}&code=${orderCode}&method=vnpay`;
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});

// GET /api/payment/vnpay/ipn - VNPay server-to-server (chá»‰ cáº­p nháº­t DB, khÃ´ng redirect)
router.get("/vnpay/ipn", async (req, res) => {
  try {
    const query = req.query as Record<string, string>;
    const result = verifyVnpayReturn(query);

    if (!result.valid) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const order = await prisma.order.findUnique({ where: { code: result.txnRef } });
    if (!order) {
      return res.json({ RspCode: "01", Message: "Order not found" });
    }
    if (Number(order.total) !== result.amount) {
      return res.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (order.paymentStatus === "PAID") {
      return res.json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (result.responseCode === "00" && result.transactionStatus === "00") {
      await orderService.markOrderPaid(order.code, `VNPAY-${query.vnp_TransactionNo ?? ""}`);
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    await orderService.markOrderPaymentFailed(order.code, `VNPAY-${query.vnp_TransactionNo ?? ""}`);
    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (err) {
    console.error("[VNPay IPN]", err);
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

// ============ MOMO ============

// POST /api/payment/momo/create
router.post("/momo/create", paymentLimiter, async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) throw new AppError("Thiáº¿u orderCode", 400);

    const order = await prisma.order.findUnique({ where: { code: orderCode } });
    if (!order) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);
    if (order.paymentStatus === "PAID") {
      throw new AppError("ÄÆ¡n hÃ ng Ä‘Ã£ thanh toÃ¡n", 400);
    }

    const payUrl = await createMomoPayment({
      code: order.code,
      total: Number(order.total),
    });

    res.json({ success: true, data: { url: payUrl } });
  } catch (err) {
    next(err);
  }
});

// POST /api/payment/momo/callback - Momo IPN
router.post("/momo/callback", async (req, res) => {
  try {
    const result = verifyMomoCallback(req.body);

    if (!result.valid) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // orderId cá»§a Momo lÃ  `${orderCode}-${timestamp}`, tÃ¡ch láº¥y orderCode
    const orderCode = result.orderId.split("-")[0];
    const order = await prisma.order.findUnique({ where: { code: orderCode } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (Number(order.total) !== result.amount) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (result.resultCode === 0) {
      await orderService.markOrderPaid(orderCode, `MOMO-${req.body.transId ?? ""}`);
    } else {
      await orderService.markOrderPaymentFailed(orderCode, `MOMO-${req.body.transId ?? ""}`);
    }

    res.json({ message: "OK" });
  } catch (err) {
    console.error("[Momo IPN]", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/payment/momo/return - Momo redirect user vá» (browser)
router.get("/momo/return", async (req, res) => {
  try {
    const query = req.query as Record<string, string>;
    const orderCode = (query.orderId ?? "").split("-")[0];
    const success = query.resultCode === "0";

    // Verify chá»¯ kÃ½ redirect (cÃ¹ng format vá»›i IPN)
    const result = verifyMomoCallback(query);
    let status: "success" | "failed" = "failed";

    if (result.valid && success) {
      const order = await prisma.order.findUnique({ where: { code: orderCode } });
      if (order && Number(order.total) === result.amount) {
        await orderService.markOrderPaid(orderCode, `MOMO-${query.transId ?? ""}`);
        status = "success";
      }
    }

    const redirectUrl = `${env.frontendUrl}/thanh-toan/ket-qua?status=${status}&code=${orderCode}&method=momo`;
    res.redirect(redirectUrl);
  } catch {
    res.redirect(`${env.frontendUrl}/thanh-toan/ket-qua?status=failed`);
  }
});

// ============ VIETQR (Bank Transfer QR) ============

// POST /api/payment/vietqr/create
router.post("/vietqr/create", paymentLimiter, async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) throw new AppError("Thiáº¿u orderCode", 400);

    if (!vietqrService.isEnabled()) {
      throw new AppError("VietQR chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh", 503);
    }

    const order = await prisma.order.findUnique({ where: { code: orderCode } });
    if (!order) throw new AppError("ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i", 404);
    if (order.paymentStatus === "PAID") {
      throw new AppError("ÄÆ¡n hÃ ng Ä‘Ã£ thanh toÃ¡n", 400);
    }

    const result = vietqrService.generateQR(orderCode, Number(order.total));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export { router as paymentRoutes };


